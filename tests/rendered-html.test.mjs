import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
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
  assert.match(html, /把公开、可验证的灵感/);
  assert.match(html, /网站制作者/);
  assert.match(html, /小明猩制作/);
  assert.match(html, /Prompt Atlas 网站制作者/);
  assert.match(html, /先看效果/);
  assert.match(html, /站内查看完整提示词/);
  assert.match(html, /YouMind · GPT Image 2 Prompts Search/);
  assert.match(html, /X · Public Prompt Radar/);
  assert.match(html, /EvoLink · Open Prompt–Image Cases/);
  assert.match(html, /DiffusionDB · Open 3D Collection/);
  assert.match(html, /383 组经过安全筛选/);
  assert.match(html, /JCodesMore · AI Website Cloner Template/);
  assert.match(html, /og\.png/);
  assert.match(html, /不破解 VIP/);
  assert.doesNotMatch(html, /OFFICIAL X EMBEDS|platform\.twitter\.com\/widgets\.js|id="x-posts"/i);
  assert.doesNotMatch(html, /ILLUSTRATIVE PREVIEW|CSS 图形模拟.*作为预览/i);
});

test("ships the full public catalog, prompt shards, resilient images, and attribution", async () => {
  const [page, layout, localData, diffusionDbData, nanoBananaData, xOpenData, evolinkData, liveData, summaryData, catalogData, workflow, notices] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/prompt-items.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/diffusiondb-3d.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/nano-banana-public.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/x-open-prompts.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/evolink-public.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/live-index.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/full-index-summary.json", import.meta.url), "utf8"),
    readFile(new URL("../public/data/youmind/catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/sync-sources.yml", import.meta.url), "utf8"),
    readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
  ]);

  const localItems = JSON.parse(localData);
  const diffusionDbItems = JSON.parse(diffusionDbData);
  const nanoBanana = JSON.parse(nanoBananaData);
  const xOpen = JSON.parse(xOpenData);
  const evolink = JSON.parse(evolinkData);
  const live = JSON.parse(liveData);
  const summary = JSON.parse(summaryData);
  const catalog = JSON.parse(catalogData);
  const promptChunks = await Promise.all(summary.chunks.map(({ file }) => readFile(new URL(`../public/data/youmind/${file}`, import.meta.url), "utf8").then(JSON.parse)));
  const promptRecords = promptChunks.flat();

  assert.ok(localItems.length >= 165);
  assert.ok(localItems.filter((item) => item.category === "PPT / 信息图").length >= 45);
  assert.equal(diffusionDbItems.length, 383);
  assert.ok(diffusionDbItems.every((item) => item.prompt && item.image && item.imageUrls?.length === 1));
  assert.ok(diffusionDbItems.every((item) => item.promptLicense === "CC0 1.0 Universal" && item.syncMethod === "diffusiondb-cc0-curated"));
  assert.ok(diffusionDbItems.every((item) => item.sourceImageNsfwScore < 0.05 && item.sourcePromptNsfwScore < 0.02));
  const blockedOpen3d = /\b(?:nude|nsfw|blood|weapon|celebrity|portrait|artist|artwork|painting|illustration|style|movie|videogame|woman|man|person|child|disney|pixar|marvel|pokemon|mario|batman|stormtrooper|rolex|fujifilm)\b/i;
  assert.ok(diffusionDbItems.every((item) => !blockedOpen3d.test(item.prompt)));
  assert.equal(nanoBanana.items.length, 129);
  assert.ok(nanoBanana.sourceStats.imageCount >= 230);
  assert.ok(nanoBanana.items.every((item) => item.prompt && item.imageUrls?.length && item.syncMethod === "github-public-nano-banana-record"));
  assert.ok(xOpen.items.length >= 150);
  assert.ok(xOpen.sourceStats.xiaoxiaodongCount >= 25);
  assert.ok(xOpen.items.every((item) => item.prompt.length >= 90 && item.imageUrls?.length && item.syncMethod === "x-public-alt-prompt"));
  assert.ok(xOpen.items.every((item) => item.originalPostUrl.startsWith("https://x.com/") && item.rightsReviewStatus === "author-public-x-alt-with-attribution"));
  assert.ok(evolink.items.length >= 600);
  assert.ok(evolink.sourceStats.pptRecords >= 50);
  assert.ok(evolink.items.every((item) => item.prompt.length >= 40 && item.imageUrls?.length && item.syncMethod === "github-public-evolink-cc0"));
  assert.ok(evolink.items.every((item) => item.promptLicense === "CC0 1.0（公开 GitHub 集合）" && item.originalPostUrl.startsWith("https://x.com/")));
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
  assert.match(page, /item\.syncMethod === "diffusiondb-cc0-curated"/);
  assert.match(page, /item\.syncMethod === "x-public-alt-prompt"/);
  assert.match(page, /item\.syncMethod === "github-public-evolink-cc0"/);
  assert.match(page, /className={`image-fallback/);
  assert.match(page, /setVisibleLimit\(60\)/);
  assert.match(page, /loading=\{eager \? "eager" : "lazy"\}/);
  assert.match(page, /data-card-id=\{item\.id\}/);
  assert.match(page, /className="prompt-column"/);
  assert.doesNotMatch(page, /platform\.twitter\.com\/widgets\.js|x-section/);
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /font-family: "Geist Atlas"/);
  assert.doesNotMatch(styles, /(?:html|body)\s*\{[^}]*overscroll-behavior-y:\s*none/);
  assert.match(styles, /body\.modal-open \{ overflow: hidden; overscroll-behavior: none; \}/);
  assert.match(styles, /main \{[^}]*overflow-x: clip;[^}]*overflow-y: visible;/);
  assert.match(styles, /\.creator-home/);
  assert.match(styles, /\.creator-anime/);
  assert.match(styles, /\.creator-depth-field/);
  assert.match(styles, /\.depth-chip/);
  assert.match(styles, /rotateX\(var\(--tilt-x\)\)/);
  assert.match(styles, /\.prompt-grid\.stable-columns/);
  assert.match(styles, /\.library > :not\(\.glass-toolbar\)/);
  assert.match(styles, /\.image-button \{[^}]*aspect-ratio: 4 \/ 3/);
  assert.match(JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).dependencies.geist, /^\^?1\.7\.2$/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /creator: "小明猩"/);
  assert.ok((await stat(new URL("../public/og.png", import.meta.url))).size > 100_000);
  assert.match(workflow, /sync-youmind-search-index\.mjs/);
  assert.match(workflow, /sync-nano-banana-public\.mjs/);
  assert.match(workflow, /sync-evolink-public\.mjs/);
  assert.match(workflow, /cron: "17 \*\/6 \* \* \*"/);
  assert.match(notices, /提示词由 \[YouMind\.com\]/);
  assert.match(notices, /DiffusionDB CC0 3D collection/);
  assert.match(notices, /EvoLink GPT Image 2 CC0 collection/);
  assert.match(notices, /Public X ALT prompt snapshot/);
  assert.match(notices, /No PromptWall prompt text or generated image is bundled/);
  assert.match(notices, /JCodesMore AI Website Cloner Template/);
  await access(new URL("../public/creator-anime.webp", import.meta.url));
  await access(new URL("../public/gallery/tosea/03.jpg", import.meta.url));
  await Promise.all(xOpen.items.flatMap((item) => item.imageUrls).map(async (image) => {
    assert.match(image, /^\.\/gallery\/x-open\/.+\.webp$/);
    const imageUrl = new URL(`../public/${image.replace(/^\.\//, "")}`, import.meta.url);
    await access(imageUrl);
    assert.ok((await stat(imageUrl)).size > 4_096);
  }));
  await access(new URL(`../public/${localItems.find((item) => item.id.startsWith("2slides-")).image.replace(/^\.\//, "")}`, import.meta.url));
  await Promise.all(diffusionDbItems.map(async (item) => {
    const imageUrl = new URL(`../public/${item.image.replace(/^\.\//, "")}`, import.meta.url);
    await access(imageUrl);
    assert.ok((await stat(imageUrl)).size > 4_096);
  }));
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
