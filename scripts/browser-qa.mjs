import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleRoot = process.env.PLAYWRIGHT_MODULE_ROOT;
const playwrightSpecifier = moduleRoot
  ? pathToFileURL(path.join(moduleRoot, "playwright", "index.mjs")).href
  : "playwright";
const { chromium } = await import(playwrightSpecifier);

const baseUrl = process.env.PROMPT_ATLAS_URL || "http://127.0.0.1:4173";
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ headless: true, executablePath: chromePath });

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  });

  const response = await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForSelector(".creator-home", { state: "visible" });
  await page.waitForTimeout(1_500);

  const initial = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    creatorLoaded: document.querySelector(".creator-anime")?.complete,
    creatorNaturalWidth: document.querySelector(".creator-anime")?.naturalWidth || 0,
  }));

  await page.mouse.move(Math.floor(viewport.width * 0.5), Math.floor(viewport.height * 0.55));
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(450);
  const heroWheelY = await page.evaluate(() => window.scrollY);

  const firstCard = page.locator(".prompt-card").first();
  await firstCard.scrollIntoViewIfNeeded();
  const cardBox = await firstCard.boundingBox();
  const cardBeforeY = await page.evaluate(() => window.scrollY);
  if (cardBox) {
    await page.mouse.move(cardBox.x + Math.min(cardBox.width / 2, 160), cardBox.y + Math.min(cardBox.height / 2, 180));
    await page.mouse.wheel(0, 700);
  }
  await page.waitForTimeout(450);
  const cardWheelY = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(800);
  const stableY = await page.evaluate(() => window.scrollY);
  const toolbarState = await page.evaluate(() => {
    const toolbar = document.querySelector(".glass-toolbar");
    if (!toolbar) return { position: "", top: -1 };
    return { position: getComputedStyle(toolbar).position, top: toolbar.getBoundingClientRect().top };
  });

  await firstCard.locator(".image-button").click();
  await page.waitForSelector('[role="dialog"][aria-modal="true"]', { state: "visible" });
  const modalState = await page.evaluate(() => ({
    bodyPosition: getComputedStyle(document.body).position,
    lockedScrollY: Math.abs(Number.parseFloat(document.body.style.top || "0")),
    modalVisible: Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
  }));
  await page.locator(".modal-close").click();
  await page.waitForSelector('[role="dialog"][aria-modal="true"]', { state: "detached" });
  await page.waitForTimeout(300);
  const restoredY = await page.evaluate(() => window.scrollY);

  const imageAudit = await page.evaluate(() => {
    const images = [...document.images];
    const visible = images.filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    });
    return {
      total: images.length,
      broken: images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src).slice(0, 10),
      visibleBroken: visible.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src).slice(0, 10),
    };
  });

  results.push({
    viewport: viewport.name,
    status: response?.status(),
    title: await page.title(),
    initial,
    heroWheelY,
    cardBeforeY,
    cardWheelY,
    stableY,
    toolbarState,
    restoredY,
    modalState,
    imageAudit,
    consoleErrors,
    failedRequests: failedRequests.slice(0, 10),
    assertions: {
      pageLoaded: response?.ok() === true,
      creatorLoaded: initial.creatorLoaded && initial.creatorNaturalWidth > 0,
      wheelWorksOnHero: heroWheelY > initial.scrollY,
      wheelWorksOnCard: cardWheelY > cardBeforeY,
      noScrollBounce: stableY >= cardWheelY - 4,
      toolbarStaysSticky: toolbarState.position === "sticky" && toolbarState.top >= 80,
      modalLocksBody: modalState.bodyPosition === "fixed",
      modalRestoresScroll: Math.abs(restoredY - modalState.lockedScrollY) <= 4,
      noHorizontalOverflow: !initial.horizontalOverflow,
      noVisibleBrokenImages: imageAudit.visibleBroken.length === 0,
      noConsoleErrors: consoleErrors.length === 0,
    },
  });

  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

const failedAssertions = results.flatMap((result) =>
  Object.entries(result.assertions)
    .filter(([, passed]) => !passed)
    .map(([name]) => `${result.viewport}:${name}`),
);
if (failedAssertions.length) {
  console.error(`Browser QA failed: ${failedAssertions.join(", ")}`);
  process.exitCode = 1;
}
