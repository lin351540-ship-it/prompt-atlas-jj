import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "app", "data", "evolink-public.json");
const repositoryUrl = "https://github.com/Evolink-AI/awesome-gpt-image-2-API-and-Prompts";
const licenseUrl = `${repositoryUrl}/blob/main/LICENSE`;
const rawRoot = "https://cdn.jsdelivr.net/gh/Evolink-AI/awesome-gpt-image-2-API-and-Prompts@main";
const syncedAt = new Date().toISOString();
const execFileAsync = promisify(execFile);
const sources = [
  ["poster", "海报设计", "Poster & Illustration"],
  ["portrait", "人像摄影", "Portrait & Photography"],
  ["ui", "UI / 产品", "UI & Social Media Mockup"],
  ["character", "插画 / 漫画", "Character Design"],
  ["ecommerce", "社媒 / 品牌", "E-commerce"],
  ["comparison", "实验 / 对比", "Comparison & Community"],
  ["ad-creative", "社媒 / 品牌", "Ad Creative"],
];

const compact = (value) => String(value ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

async function readPrevious() {
  const snapshots = [];
  try {
    snapshots.push(JSON.parse(await readFile(outputPath, "utf8")));
  } catch {}
  try {
    const { stdout } = await execFileAsync("git", ["show", "HEAD:app/data/evolink-public.json"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    snapshots.push(JSON.parse(stdout));
  } catch {}
  return snapshots.sort((left, right) => (right.items?.length ?? 0) - (left.items?.length ?? 0))[0]
    ?? { generatedAt: "", sourceStats: {}, items: [] };
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "text/markdown,text/plain,*/*",
          "user-agent": "PromptAtlasJJ/1.0 (CC0 source sync)",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 900));
    }
  }
  throw lastError;
}

function resolveImage(sourcePath, url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return normalizeImageUrl(url);
  const normalized = url.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
  if (normalized.startsWith("images/")) return `${rawRoot}/${normalized}`;
  return `${rawRoot}/cases/${sourcePath.replace(/[^/]+$/, "")}${normalized}`;
}

function normalizeImageUrl(url) {
  return String(url ?? "").replace(
    "https://raw.githubusercontent.com/Evolink-AI/awesome-gpt-image-2-API-and-Prompts/main/",
    `${rawRoot}/`,
  );
}

function ratioFor(prompt) {
  return prompt.match(/\b(21\s*:\s*9|16\s*:\s*10|16\s*:\s*9|4\s*:\s*5|3\s*:\s*4|2\s*:\s*3|9\s*:\s*16|1\s*:\s*1)\b/)?.[1]?.replace(/\s/g, "") ?? "自适应";
}

function extraCategories(prompt, baseCategory) {
  const value = prompt.toLowerCase();
  const categories = [baseCategory];
  if (/ppt|powerpoint|slide|presentation|信息图|infographic|课件|图表|知识卡|data visualization/.test(value)) categories.unshift("PPT / 信息图");
  if (/poster|海报|flyer|typography/.test(value)) categories.push("海报设计");
  if (/ui|ux|app|website|webpage|网页|界面/.test(value)) categories.push("UI / 产品");
  return [...new Set(categories)];
}

function parseCases(markdown, sourceSlug, baseCategory, collectionLabel) {
  const header = /^### Case\s+(\d+):\s+\[([^\]]+)\]\((https:\/\/x\.com\/[^)]+)\)\s+\(by\s+\[@([^\]]+)\]\([^)]+\)\)\s*$/gm;
  const matches = [...markdown.matchAll(header)];
  const items = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const sectionStart = match.index + match[0].length;
    const sectionEnd = matches[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(sectionStart, sectionEnd);
    const prompt = compact(section.match(/\*\*Prompt:\*\*\s*\n\s*```[^\n]*\n([\s\S]*?)```/i)?.[1]);
    if (prompt.length < 40) continue;
    const imageUrls = [...section.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
      .map((imageMatch) => resolveImage(`cases/${sourceSlug}.md`, imageMatch[1]))
      .filter(Boolean);
    if (!imageUrls.length) continue;
    const title = compact(match[2]);
    const originalPostUrl = match[3];
    const authorHandle = compact(match[4]);
    const categories = extraCategories(`${title}\n${prompt}`, baseCategory);
    const category = categories.includes("PPT / 信息图") ? "PPT / 信息图" : baseCategory;
    const firstSentence = prompt.split(/(?<=[。.!?])\s+/)[0].slice(0, 220);
    items.push({
      id: `evolink-${sourceSlug}-${match[1]}-${hash(`${originalPostUrl}\n${prompt}`)}`,
      index: 60000,
      title,
      originalTitle: title,
      description: firstSentence || `EvoLink 开放集合中的 ${collectionLabel} 生成案例。`,
      category,
      categories,
      sourceCategory: `evolink-cc0-${sourceSlug}`,
      ratio: ratioFor(prompt),
      prompt,
      promptType: "original-public-cc0-github",
      featured: category === "PPT / 信息图",
      tags: [...new Set(["GPT Image 2", collectionLabel, category === "PPT / 信息图" ? "PPT 可用" : ""])].filter(Boolean).slice(0, 4),
      image: imageUrls[0],
      imageUrls,
      author: authorHandle,
      authorHandle,
      originalPostUrl,
      publishedAt: "",
      repositoryUrl,
      collectionName: "EvoLink · Awesome GPT Image 2 API and Prompts",
      promptLicense: "CC0 1.0（公开 GitHub 集合）",
      promptLicenseUrl: licenseUrl,
      previewOwner: authorHandle,
      previewSourceUrl: originalPostUrl,
      landingUrl: `${repositoryUrl}/blob/main/cases/${sourceSlug}.md`,
      attributionText: `提示词与效果图来源：@${authorHandle}；CC0 公开整理：EvoLink AI。本站保留逐条原帖。`,
      modificationNote: "完整提示词未改写；本站仅增加中文分类、检索标签与来源说明。",
      rightsReviewStatus: "cc0-1.0-public-github",
      rightsReviewedAt: syncedAt.slice(0, 10),
      assetHostingMode: "remote-jsdelivr-source-with-fallback",
      sourcePlatform: "EvoLink / GitHub / X",
      syncMethod: "github-public-evolink-cc0",
      syncedAt,
    });
  }
  return items;
}

const previous = await readPrevious();
const parsed = [];
const sourceStats = [];
for (const [slug, category, label] of sources) {
  try {
    const markdown = await fetchText(`${rawRoot}/cases/${slug}.md`);
    const items = parseCases(markdown, slug, category, label);
    parsed.push(...items);
    sourceStats.push({ source: slug, records: items.length, ok: true });
  } catch (error) {
    sourceStats.push({ source: slug, records: 0, ok: false, error: error.message });
  }
}

const seen = new Set();
const previousItems = (previous.items ?? []).map((item) => ({
  ...item,
  image: normalizeImageUrl(item.image),
  imageUrls: (item.imageUrls ?? [item.image]).map(normalizeImageUrl).filter(Boolean),
  assetHostingMode: "remote-jsdelivr-source-with-fallback",
}));
const items = [...parsed, ...previousItems]
  .filter((item) => {
    const key = hash(`${item.originalPostUrl}\n${item.prompt}`.toLowerCase());
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
  .map((item, index) => ({ ...item, index: 60000 + index + 1 }));

if (!items.length) {
  console.warn("EvoLink source fetch produced no complete records; preserving the previous snapshot.");
  process.exit(previous.items?.length ? 0 : 1);
}

const payload = {
  generatedAt: syncedAt,
  sourceStats: {
    completeRecords: items.length,
    imageCount: new Set(items.flatMap((item) => item.imageUrls)).size,
    authorCount: new Set(items.map((item) => item.authorHandle.toLowerCase())).size,
    pptRecords: items.filter((item) => item.category === "PPT / 信息图").length,
    license: "CC0-1.0",
    repositoryUrl,
    sources: sourceStats,
  },
  items,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  completeRecords: payload.sourceStats.completeRecords,
  imageCount: payload.sourceStats.imageCount,
  authorCount: payload.sourceStats.authorCount,
  pptRecords: payload.sourceStats.pptRecords,
}, null, 2));
