import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
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
  assert.match(html, /<title>Prompt Atlas｜生图与 PPT 提示词灵感库<\/title>/i);
  assert.match(html, /Prompt Atlas/);
  assert.match(html, /真实效果图/);
  assert.match(html, /所有公开图文/);
  assert.match(html, /查看[\s\S]{0,60}组真实案例/);
  assert.match(html, /YouMind 公开效果图/);
  assert.match(html, /OFFICIAL X EMBEDS/);
  assert.match(html, /PPT \/ 信息图/);
  assert.match(html, /ToseaAI/);
  assert.match(html, /ApiMartAI/);
  assert.match(html, /2slides/);
  assert.match(html, /CC BY 4\.0/);
  assert.match(html, /\.\/gallery\/2slides\//);
  assert.match(html, /不破解 VIP/);
  assert.match(html, /小小东也在这里/);
  assert.doesNotMatch(html, /ILLUSTRATIVE PREVIEW|preview-grid|preview-orbit|CSS 图形模拟.*作为预览/i);
});

test("ships complete prompts, source attribution, filtering, and real image assets", async () => {
  const [page, layout, data, liveData, workflow] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/prompt-items.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/live-index.json", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/sync-sources.yml", import.meta.url), "utf8"),
  ]);

  const items = JSON.parse(data);
  const live = JSON.parse(liveData);
  assert.ok(items.length >= 165);
  assert.ok(items.filter((item) => item.category === "PPT / 信息图").length >= 45);
  assert.ok(items.every((item) => item.prompt && item.image && item.author && item.originalPostUrl));
  assert.ok(items.every((item) => ["CC BY 4.0", "CC BY 4.0 collection", "Apache-2.0"].includes(item.promptLicense)));
  const publicFullRecords = live.items.filter((item) => item.syncMethod === "github-public-full-record");
  assert.equal(live.sourceStats.youMindCompleteRecords, 126);
  assert.ok(live.sourceStats.youMindImages >= 200);
  assert.equal(publicFullRecords.length, 126);
  assert.ok(publicFullRecords.every((item) => item.prompt && item.image && item.imageUrls.length && item.author && item.originalPostUrl));
  assert.ok(publicFullRecords.some((item) => item.author === "小小东"));
  assert.ok(live.items.filter((item) => item.syncMethod === "editorial-link").every((item) => item.rightsMode === "official-embed-only"));
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /prompt-atlas-real-favorites/);
  assert.ok(publicFullRecords.every((item) => /^https:\/\/youmind\.com\/gpt-image-2-prompts\?id=/.test(item.landingUrl)));
  assert.match(page, /https:\/\/github\.com\/ToseaAI\/awesome-gpt-image-2-prompts/);
  assert.match(page, /platform\.twitter\.com\/widgets\.js/);
  assert.match(page, /github-public-full-record/);
  assert.match(workflow, /cron: "17 \*\/6 \* \* \*"/);
  assert.match(layout, /lang="zh-CN"/);
  await access(new URL("../public/gallery/tosea/03.jpg", import.meta.url));
  await access(new URL(`../public/${items.find((item) => item.id.startsWith("2slides-")).image.replace(/^\.\//, "")}`, import.meta.url));
});

test("builds relative client chunks for GitHub Pages project hosting", async () => {
  const assetDirectory = new URL("../dist/client/assets/", import.meta.url);
  const javascriptFiles = (await readdir(assetDirectory)).filter((name) => name.endsWith(".js"));
  const contents = await Promise.all(
    javascriptFiles.map(async (name) => ({ name, source: await readFile(new URL(name, assetDirectory), "utf8") })),
  );
  const bootstrap = contents.find(({ source }) => source.includes("__vite__mapDeps"));

  assert.ok(bootstrap, "expected to find the Vite client bootstrap bundle");
  assert.match(bootstrap.source, /\["\.\/[^"]+\.js"/);
  assert.match(bootstrap.source, /new URL\(e,t\)\.href/);
  assert.doesNotMatch(bootstrap.source, /return[`"']\/[`"']\+e/);
});
