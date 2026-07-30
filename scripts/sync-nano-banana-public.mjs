import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "app", "data", "nano-banana-public.json");
const repositoryUrl = "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts";
const readmeUrl = "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/main/README_zh.md";
const readmeApiUrl = "https://api.github.com/repos/YouMind-OpenLab/awesome-nano-banana-pro-prompts/contents/README_zh.md";
const licenseUrl = repositoryUrl + "/blob/main/LICENSE";
const syncedAt = new Date().toISOString();

const compact = (value, length = 280) => value.replace(/\s+/g, " ").trim().slice(0, length);
const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

const categoryFor = (input) => {
  if (/ppt|slide|presentation|infographic|diagram|chart|timeline|map|education|course|知识|信息图|教育|课程|图表|地图/i.test(input)) return "PPT / 信息图";
  if (/poster|flyer|typography|magazine|cover|海报|传单|封面|卡片|排版/i.test(input)) return "海报设计";
  if (/ui|interface|website|app|dashboard|网页|界面|仪表盘/i.test(input)) return "UI / 产品";
  if (/portrait|photo|selfie|photography|人像|摄影|自拍/i.test(input)) return "人像摄影";
  if (/comic|illustration|anime|character|storyboard|漫画|插画|动漫|角色/i.test(input)) return "插画 / 漫画";
  if (/brand|social media|logo|packaging|品牌|社交媒体|包装/i.test(input)) return "社媒 / 品牌";
  return "创意发现";
};

const inferRatio = (input) => input.match(/\b(16\s*:\s*9|9\s*:\s*16|4\s*:\s*3|3\s*:\s*4|1\s*:\s*1|2\s*:\s*3|3\s*:\s*2)\b/i)?.[1]?.replace(/\s/g, "") ?? "自适应";

const tagsFor = (input, category) => {
  const tags = new Set([category === "PPT / 信息图" ? "PPT 可用" : "Nano Banana"]);
  const rules = [
    [/infographic|diagram|chart|timeline|map|信息图|图表|地图/i, "信息图"],
    [/presentation|slide|ppt|演示|课件/i, "演示设计"],
    [/3d|isometric|render|等距|渲染/i, "3D"],
    [/minimal|clean|negative space|极简|留白/i, "极简"],
    [/typography|editorial|magazine|排版|杂志/i, "文字排版"],
    [/photography|photo|cinematic|摄影|电影感/i, "摄影感"],
    [/chinese|中国|中文|ink|水墨/i, "东方美学"],
  ];
  for (const [pattern, tag] of rules) if (pattern.test(input)) tags.add(tag);
  return [...tags].slice(0, 5);
};

async function fetchReadme() {
  const localPath = process.env.NANO_BANANA_README_PATH;
  if (localPath) return readFile(resolve(localPath), "utf8");
  const attempts = [
    [readmeUrl, { "user-agent": "Prompt-Atlas-JJ/3.0" }],
    [readmeApiUrl, { "user-agent": "Prompt-Atlas-JJ/3.0", accept: "application/vnd.github.raw+json" }],
  ];
  let lastError;
  for (const [url, headers] of attempts) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error("GitHub returned " + response.status);
      return response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function parseReadme(markdown) {
  const declaredTotal = Number(markdown.match(/提示词总数\s*\|\s*\*\*(\d+)\*\*/)?.[1] ?? 0);
  const sourceUpdatedAt = markdown.match(/最后更新\s*\|\s*\*\*(.+?)\*\*/)?.[1] ?? "";
  const starts = [...markdown.matchAll(/^### No\.\s*(\d+):\s*(.+)$/gm)];
  const seen = new Set();
  const items = [];

  for (const [index, match] of starts.entries()) {
    const section = markdown.slice(match.index, starts[index + 1]?.index ?? markdown.length);
    const sourceNumber = Number(match[1]);
    const title = compact(match[2], 180);
    const description = compact(section.match(/^#### 📖 描述\s*\n+([\s\S]+?)(?=^####|^###|^---)/m)?.[1] ?? "公开生图提示词案例。", 360);
    const prompt = section.match(/^#### 📝 提示词\s*\n+```[^\n]*\n([\s\S]+?)\n```/m)?.[1]?.trim() ?? "";
    const imageUrls = [...new Set([...section.matchAll(/<img\s+[^>]*src="(https?:\/\/[^\"]+)"[^>]*>/gi)].map((image) => image[1]))];
    const linkedAuthor = section.match(/- \*\*作者:\*\* \[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const plainAuthor = section.match(/- \*\*作者:\*\*\s*(.+)$/m)?.[1]?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    const sourceMatch = section.match(/- \*\*来源:\*\* \[[^\]]+\]\((https?:\/\/[^)]+)\)/);
    const landingMatch = section.match(/\*\*\[👉 立即尝试 →\]\((https?:\/\/[^)]+)\)\*\*/);
    const publishedAt = section.match(/- \*\*发布时间:\*\*\s*(.+)$/m)?.[1]?.trim() ?? "";
    const author = linkedAuthor?.[1] ?? plainAuthor ?? "YouMind OpenLab 社区";
    const authorUrl = linkedAuthor?.[2] ?? repositoryUrl;
    const sourceUrl = sourceMatch?.[1]?.replace(/#.*$/, "") ?? landingMatch?.[1] ?? repositoryUrl;
    const dedupeKey = sourceUrl.includes("/status/") ? sourceUrl : title + "|" + author;
    if (!prompt || !imageUrls.length || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const allText = title + " " + description + " " + prompt;
    const category = categoryFor(allText);

    items.push({
      id: "nano-banana-" + sourceNumber + "-" + hash(dedupeKey),
      index: 40000 + sourceNumber,
      title,
      originalTitle: title,
      description,
      category,
      categories: [category],
      sourceCategory: "youmind-nano-banana-public-github",
      ratio: inferRatio(allText),
      prompt,
      promptType: "original-public-github",
      featured: /Featured|精选/g.test(section),
      tags: tagsFor(allText, category),
      image: imageUrls[0],
      imageUrls,
      author,
      authorHandle: authorUrl.match(/x\.com\/([^/?#]+)/i)?.[1] ?? "",
      originalPostUrl: sourceUrl,
      publishedAt,
      repositoryUrl,
      collectionName: "YouMind OpenLab · Awesome Nano Banana Pro Prompts",
      promptLicense: "CC BY 4.0（公开 GitHub 集合）",
      promptLicenseUrl: licenseUrl,
      previewOwner: author,
      previewSourceUrl: sourceUrl,
      landingUrl: landingMatch?.[1] ?? "https://youmind.com/zh-CN/nano-banana-pro-prompts",
      attributionText: "提示词与效果图：" + author + "；公开整理：YouMind OpenLab。本站保留逐条原作者与原始来源。",
      modificationNote: "完整提示词未改写；本站仅增加中文分类、检索标签与来源说明。",
      rightsReviewStatus: "cc-by-4.0-public-github",
      rightsReviewedAt: syncedAt.slice(0, 10),
      assetHostingMode: "remote-source-with-fallback",
      sourcePlatform: "YouMind OpenLab / X",
      syncMethod: "github-public-nano-banana-record",
      syncedAt,
    });
  }

  return { declaredTotal, sourceUpdatedAt, publicSections: starts.length, items };
}

let previous = { sourceStats: {}, items: [] };
try {
  previous = JSON.parse(await readFile(outputPath, "utf8"));
} catch {}

let parsed;
let status = "fresh";
try {
  parsed = parseReadme(await fetchReadme());
  if (!parsed.items.length) throw new Error("No complete public records parsed");
} catch (error) {
  status = "stale-fallback";
  if (!previous.items?.length) throw error;
  parsed = {
    declaredTotal: previous.sourceStats.declaredTotal,
    sourceUpdatedAt: previous.sourceStats.sourceUpdatedAt,
    publicSections: previous.sourceStats.publicSections,
    items: previous.items,
  };
}

await writeFile(outputPath, JSON.stringify({
  generatedAt: syncedAt,
  status,
  sourceStats: {
    declaredTotal: parsed.declaredTotal,
    publicSections: parsed.publicSections,
    completeRecords: parsed.items.length,
    imageCount: parsed.items.reduce((sum, item) => sum + item.imageUrls.length, 0),
    sourceUpdatedAt: parsed.sourceUpdatedAt,
  },
  items: parsed.items,
}, null, 2) + "\n", "utf8");

console.log(JSON.stringify({
  status,
  declaredTotal: parsed.declaredTotal,
  publicSections: parsed.publicSections,
  completeRecords: parsed.items.length,
  images: parsed.items.reduce((sum, item) => sum + item.imageUrls.length, 0),
}, null, 2));
