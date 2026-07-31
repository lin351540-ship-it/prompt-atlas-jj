import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..", "docs");
const host = process.env.PROMPT_ATLAS_PREVIEW_HOST || "127.0.0.1";
const port = Number(process.env.PROMPT_ATLAS_PREVIEW_PORT || 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", `http://${host}:${port}`).pathname);
    const relativePath = pathname === "/" || pathname === "/prompt-atlas-jj/" ? "index.html" : pathname.replace(/^\/(?:prompt-atlas-jj\/)?/, "");
    let path = resolve(root, relativePath);
    if (path !== root && !path.startsWith(`${root}${sep}`)) throw new Error("invalid path");
    try {
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    } catch {
      path = resolve(root, "404.html");
    }
    const file = await stat(path);
    response.writeHead(path.endsWith("404.html") ? 404 : 200, {
      "content-length": file.size,
      "content-type": contentTypes[extname(path).toLowerCase()] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bad request");
  }
}).listen(port, host, () => {
  console.log(`Static preview ready at http://${host}:${port}/prompt-atlas-jj/`);
});
