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

test("server-renders the real-output Prompt Atlas gallery", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Prompt Atlas｜真实生图提示词效果库<\/title>/i);
  assert.match(html, /Prompt Atlas/);
  assert.match(html, /真实图像输出/);
  assert.match(html, /不是示意图/);
  assert.match(html, /54 组真实生成效果/);
  assert.match(html, /PPT \/ 信息图/);
  assert.match(html, /ToseaAI/);
  assert.match(html, /CC BY 4\.0/);
  assert.match(html, /\.\/gallery\/tosea\/03\.jpg/);
  assert.match(html, /不破解 VIP/);
  assert.doesNotMatch(html, /preview-grid|preview-orbit|CSS 图形模拟.*作为预览/i);
});

test("ships complete prompts, source attribution, filtering, and real image assets", async () => {
  const [page, layout, data] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/prompt-items.json", import.meta.url), "utf8"),
  ]);

  const items = JSON.parse(data);
  assert.equal(items.length, 54);
  assert.equal(items.filter((item) => item.category === "PPT / 信息图").length, 20);
  assert.ok(items.every((item) => item.prompt && item.image && item.author && item.originalPostUrl));
  assert.ok(items.every((item) => item.promptLicense === "CC BY 4.0"));
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /prompt-atlas-real-favorites/);
  assert.match(page, /https:\/\/youmind\.com\/zh-CN\/gpt-image-2-prompts/);
  assert.match(page, /https:\/\/github\.com\/ToseaAI\/awesome-gpt-image-2-prompts/);
  assert.match(layout, /lang="zh-CN"/);
  await access(new URL("../public/gallery/tosea/03.jpg", import.meta.url));
});
