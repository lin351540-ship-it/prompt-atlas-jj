import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "node_modules", "geist", "dist", "fonts");
const instrumentRoot = resolve(root, "node_modules", "@fontsource", "instrument-serif", "files");
const vendorRoot = resolve(root, "vendor", "fonts");
const output = resolve(root, "app", "fonts");

await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(resolve(sourceRoot, "geist-sans", "Geist-Variable.woff2"), resolve(output, "Geist-Variable.woff2")),
  copyFile(resolve(sourceRoot, "geist-mono", "GeistMono-Variable.woff2"), resolve(output, "GeistMono-Variable.woff2")),
  copyFile(resolve(instrumentRoot, "instrument-serif-latin-400-normal.woff2"), resolve(output, "InstrumentSerif-Regular.woff2")),
  copyFile(resolve(instrumentRoot, "instrument-serif-latin-400-italic.woff2"), resolve(output, "InstrumentSerif-Italic.woff2")),
  copyFile(resolve(vendorRoot, "SmileySans-Oblique.woff2"), resolve(output, "SmileySans-Oblique.woff2")),
]);

console.log("Prepared self-hosted Geist, Instrument Serif, and Smiley Sans font assets");
