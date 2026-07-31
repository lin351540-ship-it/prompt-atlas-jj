import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const bootstrapPath = resolve(root, "app", "data", "bootstrap-feed.json");
const outputDirectory = resolve(root, "public", "gallery", "bootstrap-cache");
const bootstrap = JSON.parse(await readFile(bootstrapPath, "utf8"));
const remoteUrls = [...new Set(
  [...bootstrap.items, ...bootstrap.heroItems]
    .flatMap((item) => item.imageUrls?.length ? item.imageUrls : [item.image])
    .filter((url) => /^https?:\/\//i.test(url)),
)].sort();

await mkdir(outputDirectory, { recursive: true });

const cachePathFor = (url) => {
  const fileName = `${createHash("sha256").update(url).digest("hex").slice(0, 24)}.webp`;
  return {
    fileName,
    publicPath: `./gallery/bootstrap-cache/${fileName}`,
    absolutePath: resolve(outputDirectory, fileName),
  };
};

async function hasUsableImage(path) {
  try {
    const file = await stat(path);
    if (file.size < 2_048) return false;
    const metadata = await sharp(path).metadata();
    return Boolean(metadata.width && metadata.height);
  } catch {
    return false;
  }
}

async function fetchImage(url) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "user-agent": "PromptAtlasJJ/1.0 (bootstrap preview cache)",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) throw new Error(`unexpected content type ${contentType || "unknown"}`);
      const content = Buffer.from(await response.arrayBuffer());
      if (content.length < 2_048) throw new Error("image payload is too small");
      return content;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const imageCache = {};
const failures = [];
let cursor = 0;
const workers = Array.from({ length: Math.min(6, remoteUrls.length) }, async () => {
  while (cursor < remoteUrls.length) {
    const url = remoteUrls[cursor];
    cursor += 1;
    const target = cachePathFor(url);
    if (await hasUsableImage(target.absolutePath)) {
      imageCache[url] = target.publicPath;
      continue;
    }
    try {
      const content = await fetchImage(url);
      await sharp(content)
        .rotate()
        .resize({ width: 1_600, height: 2_000, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 })
        .toFile(target.absolutePath);
      if (!(await hasUsableImage(target.absolutePath))) throw new Error("cached image failed validation");
      imageCache[url] = target.publicPath;
    } catch (error) {
      failures.push({ url, message: error instanceof Error ? error.message : String(error) });
    }
  }
});

await Promise.all(workers);
bootstrap.imageCache = Object.fromEntries(Object.entries(imageCache).sort(([left], [right]) => left.localeCompare(right)));
bootstrap.imageCacheStats = {
  requested: remoteUrls.length,
  cached: Object.keys(imageCache).length,
  failed: failures.length,
};
await writeFile(bootstrapPath, `${JSON.stringify(bootstrap, null, 2)}\n`, "utf8");

if (failures.length) {
  console.warn(`Cached ${Object.keys(imageCache).length}/${remoteUrls.length} bootstrap previews; ${failures.length} will use resilient remote loading.`);
} else {
  console.log(`Cached all ${remoteUrls.length} remote bootstrap previews locally.`);
}
