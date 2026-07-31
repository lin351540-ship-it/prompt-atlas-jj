import { readdir, readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const publicRoot = resolve(root, "public");
const allowedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const localReferences = new Set();

function collectLocalReferences(value) {
  if (Array.isArray(value)) {
    value.forEach(collectLocalReferences);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if ((key === "image" || key === "imageUrls" || key === "imageCache") && typeof child === "string" && child.startsWith("./gallery/")) {
      localReferences.add(child);
    } else if (key === "imageUrls" && Array.isArray(child)) {
      child.filter((item) => typeof item === "string" && item.startsWith("./gallery/")).forEach((item) => localReferences.add(item));
    } else if (key === "imageCache" && child && typeof child === "object") {
      Object.values(child).filter((item) => typeof item === "string" && item.startsWith("./gallery/")).forEach((item) => localReferences.add(item));
    } else {
      collectLocalReferences(child);
    }
  }
}

async function jsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(path);
  }
  return files;
}

const dataFiles = [
  ...await jsonFiles(resolve(root, "app", "data")),
  ...await jsonFiles(resolve(publicRoot, "data", "feeds")),
];
for (const path of dataFiles) collectLocalReferences(JSON.parse(await readFile(path, "utf8")));

const failures = [];
for (const reference of [...localReferences].sort()) {
  const path = resolve(publicRoot, reference.replace(/^\.\//, ""));
  try {
    const file = await stat(path);
    if (!file.isFile() || file.size < 1_024) throw new Error("missing or too small");
    const extension = extname(path).toLowerCase();
    if (!allowedExtensions.has(extension)) throw new Error(`unsupported extension ${extension || "(none)"}`);
    if (extension !== ".svg") {
      const metadata = await sharp(path).metadata();
      if (!metadata.width || !metadata.height) throw new Error("image dimensions are unavailable");
    }
  } catch (error) {
    failures.push(`${reference}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  console.error(`Image asset audit failed for ${failures.length} referenced files:\n${failures.slice(0, 30).join("\n")}`);
  process.exit(1);
}

console.log(`Validated ${localReferences.size} referenced local preview images.`);
