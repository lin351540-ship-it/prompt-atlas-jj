import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "docs");
const workerUrl = pathToFileURL(resolve(root, "dist/server/index.js"));
workerUrl.searchParams.set("static-export", Date.now().toString());
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("https://example.invalid/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) throw new Error(`Static render failed: ${response.status}`);

let html = await response.text();
html = html
  .replaceAll('="/assets/', '="./assets/')
  .replaceAll('="/favicon.svg"', '="./favicon.svg"')
  .replaceAll('src="/gallery/', 'src="./gallery/')
  .replace('"pathname":"/"', '"pathname":"/prompt-atlas-jj/"');

if (html.includes('="/assets/') || html.includes('("/assets/') || html.includes('\\"/assets/')) {
  throw new Error("Static export still contains absolute asset paths");
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "dist/client/assets"), resolve(output, "assets"), { recursive: true });
await cp(resolve(root, "dist/client/favicon.svg"), resolve(output, "favicon.svg"));
await cp(resolve(root, "public/gallery"), resolve(output, "gallery"), { recursive: true });
await writeFile(resolve(output, "index.html"), html, "utf8");
await writeFile(resolve(output, "404.html"), html, "utf8");
await writeFile(resolve(output, ".nojekyll"), "", "utf8");

console.log(`Exported static site to ${output}`);
