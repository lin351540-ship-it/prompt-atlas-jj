import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "app", "data", "live-index.json");
const readmeUrl = "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/README.md";
const readmeApiUrl = "https://api.github.com/repos/YouMind-OpenLab/awesome-gpt-image-2/contents/README.md";
const syncedAt = new Date().toISOString();

const fetchPublicReadme = async () => {
  const attempts = [
    [readmeUrl, { "user-agent": "Prompt-Atlas-JJ/2.0" }],
    [readmeUrl, { "user-agent": "Prompt-Atlas-JJ/2.0" }],
    [readmeApiUrl, { "user-agent": "Prompt-Atlas-JJ/2.0", accept: "application/vnd.github.raw+json" }],
  ];
  let lastError;
  for (const [url, headers] of attempts) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(25_000) });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const categoryFor = (input) => {
  if (/ppt|slide|presentation|infographic|diagram|chart|map|education|course|知识|信息图|课件/i.test(input)) return "PPT / 信息图";
  if (/poster|flyer|typography|海报|卡片|magazine|cover/i.test(input)) return "海报设计";
  if (/ui|interface|website|app|dashboard/i.test(input)) return "UI / 产品";
  if (/portrait|photo|selfie|photography/i.test(input)) return "人像摄影";
  if (/comic|illustration|anime|character|storyboard/i.test(input)) return "插画 / 漫画";
  if (/brand|social media|logo|packaging/i.test(input)) return "社媒 / 品牌";
  return "创意发现";
};

const compact = (value, length = 230) => value.replace(/\s+/g, " ").trim().slice(0, length);
const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);
const inferRatio = (input) => input.match(/\b(16\s*:\s*9|9\s*:\s*16|4\s*:\s*3|3\s*:\s*4|1\s*:\s*1|2\s*:\s*3|3\s*:\s*2)\b/i)?.[1]?.replace(/\s/g, "") ?? "自适应";
const tagsFor = (input, category) => {
  const tags = new Set();
  if (category === "PPT / 信息图") tags.add("PPT 可用");
  const rules = [
    [/infographic|diagram|chart|timeline|map|信息图/i, "信息图"],
    [/presentation|slide|ppt/i, "演示设计"],
    [/3d|isometric|render/i, "3D"],
    [/minimal|clean|negative space/i, "极简"],
    [/typography|editorial|magazine/i, "文字排版"],
    [/photography|photo|cinematic/i, "摄影感"],
    [/chinese|中国|中文|ink|水墨/i, "东方美学"],
  ];
  for (const [pattern, tag] of rules) if (pattern.test(input)) tags.add(tag);
  return [...tags].slice(0, 5);
};

const xSeeds = [
  ["PPT 与小红书卡页系列 07", "将同一套视觉系统扩展到 PPT 与小红书知识卡，适合观察多页一致性。", "https://x.com/xiaoxiaodong01/status/2082347501609460125", "PPT / 信息图"],
  ["教学课件 PPT 系列 06", "面向教育课程的多页课件实验，重点是图文层级与连续页面风格。", "https://x.com/xiaoxiaodong01/status/2082083429764800903", "PPT / 信息图"],
  ["Markdown 驱动的逐页 PPT", "把每一页的 Markdown 内容转成独立视觉页，展示批量生成工作流。", "https://x.com/xiaoxiaodong01/status/2056620564048224765", "PPT / 信息图"],
  ["节气主题 PPT 批量视觉", "以统一主题生成多张节气视觉，可参考为系列海报或章节页。", "https://x.com/xiaoxiaodong01/status/2074126766952862002", "PPT / 信息图"],
  ["一条指令生成 10 页 PPT", "公开演示同一内容骨架下的十页视觉变化，适合多页一致性研究。", "https://x.com/xiaoxiaodong01/status/2074118844302643234", "PPT / 信息图"],
  ["玻璃与金属质感产品页", "玻璃、金属和高光材质结合的产品海报，可迁移到 PPT 封面。", "https://x.com/xiaoxiaodong01/status/2081994131279323627", "海报设计"],
  ["PPT 与知识卡系列 05", "把知识内容压缩成图文卡片，同时保留演示页的视觉节奏。", "https://x.com/xiaoxiaodong01/status/2081766516052447252", "PPT / 信息图"],
  ["地产营销海报与演示页", "地产场景中的大标题、空间渲染和卖点信息组合。", "https://x.com/xiaoxiaodong01/status/2076696740753977530", "海报设计"],
  ["中文节气信息图", "中文文字、时令物象与数据卡片的组合式版面。", "https://x.com/xiaoxiaodong01/status/2072714953103122560", "PPT / 信息图"],
  ["语言课程教学 PPT", "适合教师课件的课程结构、插画与重点知识呈现。", "https://x.com/xiaoxiaodong01/status/2048355959555191210", "PPT / 信息图"],
  ["企业 HR 主题系列页", "公司文化与 HR 信息的成套海报 / PPT 视觉实验。", "https://x.com/xiaoxiaodong01/status/2076320415912181957", "社媒 / 品牌"],
  ["巨型文字商业演讲页", "以超大标题和强对比版式强化演讲重点，可作为章节页参考。", "https://x.com/xiaoxiaodong01/status/2078123113427120564", "PPT / 信息图"],
  ["浅色知识图谱信息页", "轻量底色、结构线与知识节点形成清晰的信息架构。", "https://x.com/xiaoxiaodong01/status/2076322172101095912", "PPT / 信息图"],
  ["50 种 PPT 风格实验", "同一演示需求的多风格探索入口，适合快速寻找视觉方向。", "https://x.com/xiaoxiaodong01/status/2056758465180389729", "PPT / 信息图"],
].map(([title, summary, sourceUrl, category], index) => ({
  id: `x-xiaoxiaodong-${sourceUrl.split("/").pop()}`,
  title,
  summary,
  author: "小小东",
  authorUrl: "https://x.com/xiaoxiaodong01",
  sourceUrl,
  landingUrl: sourceUrl,
  sourcePlatform: "X",
  origin: "小小东公开 X 原帖",
  category,
  previewTheme: (index + 2) % 8,
  rightsMode: "official-embed-only",
  syncMethod: "editorial-link",
  syncedAt,
}));

const parseYouMind = (markdown) => {
  const total = Number(markdown.match(/Total Prompts\s*\|\s*\*\*(\d+)\*\*/)?.[1] ?? 0);
  const sourceUpdatedAt = markdown.match(/Last Updated\s*\|\s*\*\*(.+?)\*\*/)?.[1] ?? "";
  const starts = [...markdown.matchAll(/^### No\.\s*(\d+):\s*(.+)$/gm)];
  const seen = new Set();
  const items = [];

  for (const [index, match] of starts.entries()) {
    const section = markdown.slice(match.index, starts[index + 1]?.index ?? markdown.length);
    const sourceNumber = Number(match[1]);
    const title = compact(match[2], 160);
    const description = compact(section.match(/^#### 📖 Description\s*\n+([\s\S]+?)(?=^####|^###|^---)/m)?.[1] ?? "公开提示词案例。", 320);
    const prompt = section.match(/^#### 📝 Prompt\s*\n+```[^\n]*\n([\s\S]+?)\n```/m)?.[1]?.trim() ?? "";
    const imageUrls = [...section.matchAll(/<img\s+[^>]*src="(https?:\/\/[^\"]+)"[^>]*>/gi)].map((image) => image[1]);
    const authorMatch = section.match(/- \*\*Author:\*\* \[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const sourceMatch = section.match(/- \*\*Source:\*\* \[[^\]]+\]\((https?:\/\/[^)]+)\)/);
    const landingMatch = section.match(/\*\*\[👉 Try it now →\]\((https?:\/\/[^)]+)\)\*\*/);
    const publishedAt = section.match(/- \*\*Published:\*\* (.+)$/m)?.[1]?.trim() ?? "";
    const sourceUrl = sourceMatch?.[1]?.replace(/#.*$/, "") ?? landingMatch?.[1] ?? "https://github.com/YouMind-OpenLab/awesome-gpt-image-2";
    const dedupeKey = sourceUrl.includes("/status/") ? sourceUrl : `${title}|${authorMatch?.[1] ?? ""}`;
    if (!prompt || !imageUrls.length || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const allText = `${title} ${description} ${prompt}`;
    const category = categoryFor(allText);
    const author = authorMatch?.[1] ?? "YouMind OpenLab 社区";
    const authorUrl = authorMatch?.[2] ?? "https://github.com/YouMind-OpenLab/awesome-gpt-image-2";
    items.push({
      id: `youmind-${sourceNumber}-${hash(dedupeKey)}`,
      index: 20000 + sourceNumber,
      title,
      originalTitle: title,
      description,
      category,
      sourceCategory: "youmind-public-github",
      ratio: inferRatio(allText),
      prompt,
      promptType: "original",
      featured: /Featured/g.test(section),
      tags: tagsFor(allText, category),
      image: imageUrls[0],
      imageUrls,
      author,
      authorHandle: authorUrl.match(/x\.com\/([^/?#]+)/i)?.[1] ?? "",
      originalPostUrl: sourceUrl,
      publishedAt,
      repositoryUrl: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
      collectionName: "YouMind OpenLab · Awesome GPT Image 2",
      promptLicense: "CC BY 4.0（公开 GitHub 集合）",
      promptLicenseUrl: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2/blob/main/LICENSE",
      previewOwner: author,
      previewSourceUrl: sourceUrl,
      landingUrl: landingMatch?.[1] ?? "https://youmind.com/zh-CN/gpt-image-2-prompts",
      attributionText: `提示词与效果图：${author}；公开整理：YouMind OpenLab。图片从 GitHub 清单所列的来源地址远程展示。`,
      modificationNote: "完整提示词未改写；本站仅增加中文分类、检索标签与来源说明。",
      rightsReviewStatus: "source-attributed-public-github",
      rightsReviewedAt: syncedAt.slice(0, 10),
      assetHostingMode: "remote-source",
      sourcePlatform: "YouMind OpenLab / X",
      syncMethod: "github-public-full-record",
      syncedAt,
    });
  }

  return { total, sourceUpdatedAt, publicSections: starts.length, items };
};

let previous = { sourceStats: {}, items: [] };
try {
  previous = JSON.parse(await readFile(outputPath, "utf8"));
} catch {}

let youMind;
let status = "fresh";
try {
  youMind = parseYouMind(await fetchPublicReadme());
  if (!youMind.items.length) throw new Error("No complete public records parsed");
} catch (error) {
  status = "stale-fallback";
  const priorItems = previous.items?.filter((item) => item.syncMethod === "github-public-full-record") ?? [];
  if (!priorItems.length) throw error;
  youMind = {
    total: previous.sourceStats?.youMindTotal ?? priorItems.length,
    sourceUpdatedAt: previous.sourceStats?.youMindUpdatedAt ?? "",
    publicSections: previous.sourceStats?.youMindPublicSections ?? priorItems.length,
    items: priorItems,
  };
}

const items = [...xSeeds, ...youMind.items];
await writeFile(outputPath, `${JSON.stringify({
  generatedAt: syncedAt,
  status,
  sourceStats: {
    youMindTotal: youMind.total,
    youMindPublicSections: youMind.publicSections,
    youMindCompleteRecords: youMind.items.length,
    youMindImages: youMind.items.reduce((sum, item) => sum + item.imageUrls.length, 0),
    youMindUpdatedAt: youMind.sourceUpdatedAt,
    xEditorialLinks: xSeeds.length,
  },
  items,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status,
  completeRecords: youMind.items.length,
  images: youMind.items.reduce((sum, item) => sum + item.imageUrls.length, 0),
  xEmbeds: xSeeds.length,
  upstreamTotal: youMind.total,
  publicSections: youMind.publicSections,
}, null, 2));
