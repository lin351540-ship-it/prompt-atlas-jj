import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Prompt Atlas library", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Prompt Atlas｜生图提示词图鉴<\/title>/i);
  assert.match(html, /PROMPT ATLAS/);
  assert.match(html, /生图提示词图鉴/);
  assert.match(html, /原创长提示词/);
  assert.match(html, />145</);
  assert.match(html, />75</);
  assert.match(html, /公开灵感来源/);
  assert.match(html, /不绕过付费墙/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("ships prompt generation, sources, filters, and no starter skeleton", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /function buildPrompt/);
  assert.match(page, /const generatedPrompts/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /prompt-atlas-favorites/);
  assert.match(page, /https:\/\/openai\.com\/academy\/image-generation\//);
  assert.match(page, /https:\/\/x\.com\/xiaoxiaodong01\/status\//);
  assert.match(page, /https:\/\/github\.com\/YouMind-OpenLab\//);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /145 条原创重构/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
