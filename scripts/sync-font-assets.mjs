import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "node_modules", "geist", "dist", "fonts");
const output = resolve(root, "app", "fonts");

await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(resolve(sourceRoot, "geist-sans", "Geist-Variable.woff2"), resolve(output, "Geist-Variable.woff2")),
  copyFile(resolve(sourceRoot, "geist-mono", "GeistMono-Variable.woff2"), resolve(output, "GeistMono-Variable.woff2")),
]);

console.log("Prepared self-hosted Geist font assets");
