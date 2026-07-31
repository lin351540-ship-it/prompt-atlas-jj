import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleRoot = process.env.PLAYWRIGHT_MODULE_ROOT;
const playwrightSpecifier = moduleRoot
  ? pathToFileURL(path.join(moduleRoot, "playwright", "index.mjs")).href
  : "playwright";
const { chromium } = await import(playwrightSpecifier);

const baseUrl = process.env.PROMPT_ATLAS_URL || "http://127.0.0.1:4173/prompt-atlas-jj/";
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const allSourceModes = [
  "小小东",
  "X 公开分享",
  "YouMind 全量公开索引",
  "Nano Banana 公开集",
  "EvoLink CC0",
  "开放授权 3D",
  "PPT 开源集",
  "其他开源集",
];
const requestedSources = (process.env.PROMPT_ATLAS_QA_SOURCES || "").split("|").filter(Boolean);
const sourceModes = requestedSources.length ? allSourceModes.filter((source) => requestedSources.includes(source)) : allSourceModes;

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const requestFailures = [];
const errorResponses = [];
let activeSource = "initial";
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => {
  if (request.resourceType() === "image") requestFailures.push({ source: activeSource, url: request.url(), error: request.failure()?.errorText || "" });
});
page.on("response", (response) => {
  if (response.request().resourceType() === "image" && response.status() >= 400) {
    errorResponses.push({ source: activeSource, url: response.url(), status: response.status() });
  }
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
await page.waitForSelector(".source-rail button");
await page.evaluate(() => document.fonts.ready);

const results = [];
for (const source of sourceModes) {
  activeSource = source;
  const sourceButton = page.locator(".source-rail button").filter({ hasText: source }).first();
  await sourceButton.evaluate((button) => button.click());
  await page.waitForTimeout(180);

  const cards = page.locator(".prompt-card");
  await cards.first().waitFor({ state: "visible", timeout: 30_000 });
  const sampleCount = Math.min(await cards.count(), 12);
  for (let index = 0; index < sampleCount; index += 1) {
    const card = cards.nth(index);
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (cardId) => {
        const currentCard = document.querySelector(`[data-card-id="${CSS.escape(cardId)}"]`);
        return Boolean(
          currentCard?.querySelector(".image-button img.is-loaded")
          || currentCard?.querySelector(".image-button .image-fallback:not(.is-loading)"),
        );
      },
      await card.getAttribute("data-card-id"),
      { timeout: 60_000 },
    );
  }

  let settleTimedOut = false;
  try {
    await page.waitForFunction(
      (limit) => [...document.querySelectorAll(".prompt-card")].slice(0, limit).every((card) =>
        card.querySelector(".image-button img.is-loaded")
        || card.querySelector(".image-button .image-fallback:not(.is-loading)"),
      ),
      sampleCount,
      { timeout: 60_000 },
    );
  } catch {
    settleTimedOut = true;
  }

  const audit = await page.evaluate((limit) => {
    const sampledCards = [...document.querySelectorAll(".prompt-card")].slice(0, limit);
    const cardResults = sampledCards.map((card) => {
      const image = card.querySelector(".image-button img");
      const fallback = card.querySelector(".image-button .image-fallback:not(.is-loading):not(.is-hidden)");
      return {
        id: card.getAttribute("data-card-id") || "",
        image: image?.currentSrc || image?.src || "",
        loaded: Boolean(image?.complete && image?.naturalWidth > 0),
        fallback: fallback?.getAttribute("aria-label") || "",
      };
    });
    return {
      totalCards: document.querySelectorAll(".prompt-card").length,
      sampled: cardResults.length,
      loaded: cardResults.filter((item) => item.loaded).length,
      fallbacks: cardResults.filter((item) => item.fallback),
      broken: cardResults.filter((item) => item.image && !item.loaded && !item.fallback),
      pending: cardResults.filter((item) => !item.image && !item.loaded && !item.fallback),
    };
  }, sampleCount);

  results.push({
    source,
    ...audit,
    settleTimedOut,
    requestFailures: requestFailures.filter((failure) => failure.source === source).slice(0, 24),
    errorResponses: errorResponses.filter((response) => response.source === source).slice(0, 24),
  });
}

await browser.close();
const actionableConsoleErrors = consoleErrors.filter((message) =>
  !/^Failed to load resource: net::ERR_(?:CONNECTION_CLOSED|CONNECTION_RESET|TIMED_OUT)$/.test(message),
);
const failed = results.filter((result) => result.fallbacks.length || result.broken.length || result.pending.length);
console.log(JSON.stringify({ results, actionableConsoleErrors }, null, 2));
if (failed.length || actionableConsoleErrors.length) {
  console.error(`Source image audit failed: ${failed.map(({ source }) => source).join(", ") || "console"}`);
  process.exitCode = 1;
}
