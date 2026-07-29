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

test("server-renders the unified real-output Prompt Atlas gallery", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Prompt Atlas｜生图与 PPT 提示词灵感库<\/title>/i);
  assert.match(html, /一万四千条公开灵感/);
  assert.match(html, /小小东内容已经并入主图库/);
  assert.match(html, /站内查看完整提示词/);
  assert.match(html, /YouMind · GPT Image 2 Prompts Search/);
  assert.match(html, /JCodesMore · AI Website Cloner Template/);
  assert.match(html, /不破解 VIP/);
  assert.doesNotMatch(html, /OFFICIAL X EMBEDS|platform\.twitter\.com\/widgets\.js|id="x-posts"/i);
  assert.doesNotMatch(html, /ILLUSTRATIVE PREVIEW|CSS 图形模拟.*作为预览/i);
});

test("ships the full public catalog, prompt shards, resilient images, and attribution", async () => {
  const [page, layout, localData, liveData, summaryData, catalogData, workflow, notices] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/prompt-items.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/live-index.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/full-index-summary.json", import.meta.url), "utf8"),
    readFile(new URL("../public/data/youmind/catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/sync-sources.yml", import.meta.url), "utf8"),
    readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
  ]);

  const localItems = JSON.parse(localData);
  const live = JSON.parse(liveData);
  const summary = JSON.parse(summaryData);
  const catalog = JSON.parse(catalogData);
  const promptChunks = await Promise.all(summary.chunks.map(({ file }) => readFile(new URL(`../public/data/youmind/${file}`, import.meta.url), "utf8").then(JSON.parse)));
  const promptRecords = promptChunks.flat();

  assert.ok(localItems.length >= 165);
  assert.ok(localItems.filter((item) => item.category === "PPT / 信息图").length >= 45);
  assert.equal(live.sourceStats.youMindCompleteRecords, 126);
  assert.ok(summary.declaredTotalPrompts >= 14_000);
  assert.ok(summary.uniquePromptCount >= 14_000);
  assert.equal(summary.completePromptCount, summary.uniquePromptCount);
  assert.equal(summary.declaredTotalPrompts - summary.uniquePromptCount, summary.manifestDrift);
  assert.equal(catalog.length, summary.uniquePromptCount);
  assert.equal(promptRecords.length, summary.uniquePromptCount);
  assert.ok(catalog.every((item) => item.id && item.title && item.description && item.image && item.imageUrls.length && item.promptFile));
  assert.ok(promptRecords.every((item) => item.id && item.content));
  assert.match(page, /fetch\("\.\/data\/youmind\/catalog\.json"\)/);
  assert.match(page, /className={`image-fallback/);
  assert.match(page, /setVisibleLimit\(36\)/);
  assert.doesNotMatch(page, /loading="lazy"|platform\.twitter\.com\/widgets\.js|x-section/);
  assert.match(await readFile(new URL("../app/globals.css", import.meta.url), "utf8"), /font-family: "Geist Atlas"/);
  assert.match(JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).dependencies.geist, /^\^?1\.7\.2$/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(workflow, /sync-youmind-search-index\.mjs/);
  assert.match(workflow, /cron: "17 \*\/6 \* \* \*"/);
  assert.match(notices, /提示词由 \[YouMind\.com\]/);
  assert.match(notices, /JCodesMore AI Website Cloner Template/);
  await access(new URL("../public/gallery/tosea/03.jpg", import.meta.url));
  await access(new URL(`../public/${localItems.find((item) => item.id.startsWith("2slides-")).image.replace(/^\.\//, "")}`, import.meta.url));
});

test("builds relative client chunks for GitHub Pages project hosting", async () => {
  const assetDirectory = new URL("../dist/client/assets/", import.meta.url);
  const javascriptFiles = (await readdir(assetDirectory)).filter((name) => name.endsWith(".js"));
  const contents = await Promise.all(javascriptFiles.map(async (name) => ({ name, source: await readFile(new URL(name, assetDirectory), "utf8") })));
  const bootstrap = contents.find(({ source }) => source.includes("__vite__mapDeps"));
  assert.ok(bootstrap, "expected to find the Vite client bootstrap bundle");
  assert.match(bootstrap.source, /\["\.\/[^\"]+\.js"/);
  assert.match(bootstrap.source, /new URL\(e,t\)\.href/);
  assert.doesNotMatch(bootstrap.source, /return[`"']\/[[`"']\+e/);
});
