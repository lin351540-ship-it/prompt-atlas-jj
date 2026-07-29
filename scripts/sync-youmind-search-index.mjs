import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicOutput = resolve(root, "public", "data", "youmind");
const appSummaryOutput = resolve(root, "app", "data", "full-index-summary.json");
const repositoryUrl = "https://github.com/YouMind-OpenLab/gpt-image-2-prompts-search";
const rawBase = "https://raw.githubusercontent.com/YouMind-OpenLab/gpt-image-2-prompts-search/main/references";
const chunkSize = 500;
const compact = (value, length) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, length);

async function fetchJson(url, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Prompt-Atlas-JJ/3.0" },
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok) throw new Error(`${url} returned ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, 800 * attempt));
    }
  }
  throw lastError;
}

const manifest = await fetchJson(`${rawBase}/manifest.json`);
const records = new Map();
let categoryMemberships = 0;

for (const category of manifest.categories) {
  const items = await fetchJson(`${rawBase}/${category.file}`);
  categoryMemberships += items.length;

  for (const item of items) {
    const id = Number(item.id);
    if (!Number.isFinite(id)) continue;

    const existing = records.get(id);
    if (existing) {
      existing.categorySlugs.add(category.slug);
      for (const media of item.sourceMedia ?? []) existing.imageUrls.add(media);
      continue;
    }

    records.set(id, {
      id,
      title: compact(item.title, 180) || `Prompt ${id}`,
      description: compact(item.description, 360) || "YouMind 公开社区提示词案例",
      content: String(item.content ?? "").trim(),
      imageUrls: new Set((item.sourceMedia ?? []).filter(Boolean)),
      categorySlugs: new Set([category.slug]),
      needReferenceImages: Boolean(item.needReferenceImages),
    });
  }
}

const allRecords = [...records.values()].sort((a, b) => b.id - a.id);
if (!allRecords.length) throw new Error("YouMind public index returned no records");

await rm(publicOutput, { recursive: true, force: true });
await mkdir(resolve(publicOutput, "chunks"), { recursive: true });

const catalog = [];
const chunks = [];

for (let offset = 0; offset < allRecords.length; offset += chunkSize) {
  const chunkNumber = Math.floor(offset / chunkSize) + 1;
  const file = `chunks/${String(chunkNumber).padStart(3, "0")}.json`;
  const slice = allRecords.slice(offset, offset + chunkSize);

  await writeFile(
    resolve(publicOutput, file),
    JSON.stringify(slice.map((item) => ({ id: item.id, content: item.content }))),
    "utf8",
  );

  chunks.push({ file, count: slice.length, firstId: slice[0].id, lastId: slice.at(-1).id });
  for (const item of slice) {
    const imageUrls = [...item.imageUrls];
    catalog.push({
      id: item.id,
      title: item.title,
      description: item.description,
      image: imageUrls[0] ?? "",
      imageUrls,
      categorySlugs: [...item.categorySlugs],
      needReferenceImages: item.needReferenceImages,
      promptFile: file,
    });
  }
}

const outputManifest = {
  schemaVersion: 1,
  source: repositoryUrl,
  sourceUpdatedAt: manifest.updatedAt,
  syncedAt: new Date().toISOString(),
  declaredTotalPrompts: manifest.totalPrompts,
  uniquePromptCount: allRecords.length,
  manifestDrift: manifest.totalPrompts - allRecords.length,
  completePromptCount: allRecords.filter((item) => item.content).length,
  categoryMemberships,
  categories: manifest.categories,
  chunkSize,
  chunks,
  attribution: "提示词由 [YouMind.com](https://youmind.com) 通过公开社区搜集 ❤️",
};

await Promise.all([
  writeFile(resolve(publicOutput, "catalog.json"), JSON.stringify(catalog), "utf8"),
  writeFile(resolve(publicOutput, "manifest.json"), `${JSON.stringify(outputManifest, null, 2)}\n`, "utf8"),
  writeFile(appSummaryOutput, `${JSON.stringify(outputManifest, null, 2)}\n`, "utf8"),
]);

console.log(JSON.stringify({
  declaredTotalPrompts: outputManifest.declaredTotalPrompts,
  uniquePromptCount: allRecords.length,
  manifestDrift: outputManifest.manifestDrift,
  completePromptCount: outputManifest.completePromptCount,
  categoryMemberships,
  catalogBytes: Buffer.byteLength(JSON.stringify(catalog)),
  chunks: chunks.length,
  repositoryUrl,
}, null, 2));
