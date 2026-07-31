import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appData = resolve(root, "app", "data");
const publicFeeds = resolve(root, "public", "data", "feeds");

const readJson = async (name) => JSON.parse(await readFile(resolve(appData, name), "utf8"));
const [localItems, diffusionItems, nanoData, xData, evolinkData, liveIndex] = await Promise.all([
  readJson("prompt-items.json"),
  readJson("diffusiondb-3d.json"),
  readJson("nano-banana-public.json"),
  readJson("x-open-prompts.json"),
  readJson("evolink-public.json"),
  readJson("live-index.json"),
]);

const curatedYouMindItems = liveIndex.items.filter((item) => item.syncMethod === "github-public-full-record");
const dedupe = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const normalizedPrompt = String(item.prompt || "").replace(/\s+/g, " ").trim().toLowerCase();
    const key = normalizedPrompt ? `${item.originalPostUrl}|${normalizedPrompt}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const cleanBootstrapItem = (item) => ({
  ...item,
  description: typeof item.description === "string"
    ? item.description.split("\n").map((line) => line.trimEnd()).join("\n").trim()
    : item.description,
  prompt: typeof item.prompt === "string"
    ? item.prompt.split("\n").map((line) => line.trimEnd()).join("\n").trim()
    : item.prompt,
});
const pptItems = (items) => items.filter((item) => item.category === "PPT / 信息图");
const xiaoxiaodongItems = xData.items.filter(
  (item) => item.authorHandle?.toLowerCase() === "xiaoxiaodong01" && item.category === "PPT / 信息图",
);

const bootstrapItems = dedupe([
  ...xiaoxiaodongItems.slice(0, 24),
  ...pptItems(curatedYouMindItems).slice(0, 12),
  ...pptItems(nanoData.items).slice(0, 12),
  ...pptItems(evolinkData.items).slice(0, 8),
  ...pptItems(diffusionItems).slice(0, 8),
  ...localItems,
]).map(cleanBootstrapItem);
const heroItems = dedupe([
  ...xiaoxiaodongItems.slice(0, 2),
  ...pptItems(curatedYouMindItems).slice(0, 2),
  ...pptItems(nanoData.items).slice(0, 2),
  ...pptItems(evolinkData.items).slice(0, 2),
  ...localItems.filter((item) => item.id.startsWith("2slides-")).slice(0, 2),
]).slice(0, 9).map(cleanBootstrapItem);
const extraUniqueItems = dedupe([
  ...xData.items,
  ...evolinkData.items,
  ...diffusionItems,
  ...nanoData.items,
  ...localItems,
]);
const curatedImageUrls = [...new Set(curatedYouMindItems.flatMap(
  (item) => item.imageUrls?.length ? item.imageUrls : [item.image],
).filter(Boolean))];

const bootstrap = {
  items: bootstrapItems,
  heroItems,
  curatedImageUrls,
  extraUniqueCount: extraUniqueItems.length,
  stats: {
    x: xData.sourceStats,
    evolink: evolinkData.sourceStats,
    nano: nanoData.sourceStats,
    diffusionCount: diffusionItems.length,
    youMindCompleteRecords: liveIndex.sourceStats.youMindCompleteRecords,
  },
};

await writeFile(resolve(appData, "bootstrap-feed.json"), `${JSON.stringify(bootstrap, null, 2)}\n`, "utf8");
await mkdir(publicFeeds, { recursive: true });
await Promise.all([
  "diffusiondb-3d.json",
  "nano-banana-public.json",
  "x-open-prompts.json",
  "evolink-public.json",
  "live-index.json",
].map((name) => copyFile(resolve(appData, name), resolve(publicFeeds, name))));

console.log(
  `Prepared ${bootstrapItems.length} bootstrap items and ${extraUniqueItems.length} deduplicated supplemental records`,
);
