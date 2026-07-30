import { mkdir, readFile, readdir, stat, unlink } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const catalogPath = resolve(root, "app/data/diffusiondb-3d.json");
const outputDirectory = resolve(root, "public/gallery/diffusiondb-3d");
const datasetBase = "https://huggingface.co/datasets/poloclub/diffusiondb/resolve/main/images";
const rangeConcurrency = 6;
const partConcurrency = 6;

async function fetchChecked(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        ...options,
        headers: {
          "user-agent": "PromptAtlasJJ/1.0 (CC0 asset sync)",
          ...(options.headers ?? {}),
        },
      });
      if (!response.ok) {
        throw new Error(`${options.method ?? "GET"} ${url} returned ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 650));
    }
  }
  throw lastError;
}

async function fetchRange(url, start, end) {
  const response = await fetchChecked(url, {
    headers: { range: `bytes=${start}-${end}` },
  });
  if (response.status !== 206) {
    throw new Error(`Range request for ${url} returned ${response.status}, expected 206`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function fetchSuffix(url, length) {
  const response = await fetchChecked(url, {
    headers: { range: `bytes=-${length}` },
  });
  if (response.status !== 206) {
    throw new Error(`Suffix request for ${url} returned ${response.status}, expected 206`);
  }
  const contentRange = response.headers.get("content-range") ?? "";
  const match = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+)/i);
  if (!match) throw new Error(`Missing content-range for ${url}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    start: Number(match[1]),
    total: Number(match[3]),
  };
}

function findEndOfCentralDirectory(buffer) {
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) return index;
  }
  throw new Error("ZIP end-of-central-directory record was not found");
}

async function centralDirectory(url) {
  const suffix = await fetchSuffix(url, 65_557);
  const tail = suffix.buffer;
  const eocd = findEndOfCentralDirectory(tail);
  const entryCount = tail.readUInt16LE(eocd + 10);
  const directorySize = tail.readUInt32LE(eocd + 12);
  const directoryOffset = tail.readUInt32LE(eocd + 16);
  if (entryCount === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) {
    throw new Error(`ZIP64 is not supported for ${url}`);
  }
  const directoryEnd = directoryOffset + directorySize;
  const buffer = directoryOffset >= suffix.start && directoryEnd <= suffix.total
    ? tail.subarray(directoryOffset - suffix.start, directoryEnd - suffix.start)
    : await fetchRange(url, directoryOffset, directoryEnd - 1);
  const entries = new Map();
  let offset = 0;
  while (offset < buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Invalid central-directory signature at ${offset} in ${url}`);
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    entries.set(fileName, { method, compressedSize, uncompressedSize, localHeaderOffset });
    entries.set(basename(fileName), { method, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  if (entries.size < entryCount) {
    throw new Error(`Parsed ${entries.size} entry aliases but expected at least ${entryCount} for ${url}`);
  }
  return entries;
}

async function extractEntry(url, entry, outputPath) {
  const margin = 8192;
  const buffer = await fetchRange(
    url,
    entry.localHeaderOffset,
    entry.localHeaderOffset + 30 + margin + entry.compressedSize - 1,
  );
  if (buffer.readUInt32LE(0) !== 0x04034b50) {
    throw new Error(`Invalid local-file signature for ${outputPath}`);
  }
  const nameLength = buffer.readUInt16LE(26);
  const extraLength = buffer.readUInt16LE(28);
  const dataStart = 30 + nameLength + extraLength;
  if (dataStart + entry.compressedSize > buffer.length) {
    throw new Error(`Local ZIP header exceeded the ${margin}-byte margin for ${outputPath}`);
  }
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);
  const content = entry.method === 0
    ? compressed
    : entry.method === 8
      ? inflateRawSync(compressed)
      : null;
  if (!content) throw new Error(`Unsupported ZIP method ${entry.method} for ${outputPath}`);
  if (content.length !== entry.uncompressedSize) {
    throw new Error(`Size mismatch for ${outputPath}: ${content.length} != ${entry.uncompressedSize}`);
  }
  return content;
}

async function runPool(tasks, worker, limit) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor];
      cursor += 1;
      await worker(task);
    }
  });
  await Promise.all(runners);
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const grouped = Map.groupBy(catalog, (item) => Number(item.sourcePart));
await mkdir(outputDirectory, { recursive: true });

let downloaded = 0;
let reused = 0;
const partTasks = [...grouped.entries()].sort(([left], [right]) => left - right);
await runPool(partTasks, async ([part, items]) => {
  const partName = `part-${String(part).padStart(6, "0")}.zip`;
  const url = `${datasetBase}/${partName}`;
  const remoteItems = [];
  for (const item of items) {
    const outputPath = resolve(outputDirectory, basename(item.image));
    try {
      const existing = await stat(outputPath);
      if (existing.size > 256) {
        reused += 1;
        continue;
      }
    } catch {
      // Missing files are fetched below.
    }
    const legacyPngPath = resolve(outputDirectory, item.sourceImageName);
    try {
      const legacy = await stat(legacyPngPath);
      if (legacy.size > 256 && legacyPngPath !== outputPath) {
        await sharp(legacyPngPath).webp({ quality: 86, effort: 4 }).toFile(outputPath);
        if (dirname(legacyPngPath) !== outputDirectory) throw new Error(`Unsafe legacy asset path: ${legacyPngPath}`);
        await unlink(legacyPngPath);
        reused += 1;
        continue;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    remoteItems.push(item);
  }
  if (!remoteItems.length) return;
  process.stdout.write(`Indexing ${partName} for ${remoteItems.length} selected images...\n`);
  const entries = await centralDirectory(url);
  await runPool(remoteItems, async (item) => {
    const outputPath = resolve(outputDirectory, basename(item.image));
    const entry = entries.get(item.sourceImageName);
    if (!entry) throw new Error(`${item.sourceImageName} is missing from ${partName}`);
    await mkdir(dirname(outputPath), { recursive: true });
    const content = await extractEntry(url, entry, outputPath);
    await sharp(content).webp({ quality: 86, effort: 4 }).toFile(outputPath);
    downloaded += 1;
  }, rangeConcurrency);
}, partConcurrency);

const expectedImages = new Set(catalog.map((item) => basename(item.image)));
const outputRoot = resolve(outputDirectory);
for (const fileName of await readdir(outputRoot)) {
  if (!fileName.endsWith(".webp") || expectedImages.has(fileName)) continue;
  const stalePath = resolve(outputRoot, fileName);
  if (dirname(stalePath) !== outputRoot) throw new Error(`Unsafe stale asset path: ${stalePath}`);
  await unlink(stalePath);
}

process.stdout.write(`${JSON.stringify({ selected: catalog.length, downloaded, reused, outputDirectory }, null, 2)}\n`);
