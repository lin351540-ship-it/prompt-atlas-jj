import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcesRoot = resolve(root, "..", "prompt-gallery-sources");
const toseaRoot = resolve(sourcesRoot, "tosea");
const apimartRoot = resolve(sourcesRoot, "apimart");
const pptSlidesRoot = resolve(sourcesRoot, "ppt-2slides");
const toseaSource = JSON.parse(await readFile(resolve(toseaRoot, "prompts.json"), "utf8"));

const toseaExcludedIndexes = new Set([26, 30, 33, 44, 52, 54]);
const highRiskPattern = /(?:\b18[- ]year[- ]old\b|\bmid[- ]?teens?\b|\bunderage\b|\bschool\s?girl\b|\bloli\b|\bnude\b|\bnaked\b|\bcleavage\b|\bseductive\b|\bsexy\b|\blingerie\b|\bbikini\b|see[- ]through|slipped off one shoulder|tiny black pleated mini|bedroom portrait)/i;
const publicFigurePattern = /(?:Elon Musk|Tim Cook|Donald Trump|Barack Obama|Taylor Swift|Dua Lipa|Mark Zuckerberg|Cristiano Ronaldo|Lionel Messi|Sam Altman|Steve Jobs|Michael Jackson|Yoko Ono|Haruki Murakami|Peter Thiel|特朗普|马斯克|奥巴马|泰勒.?斯威夫特|扎克伯格|山姆.?奥特曼|乔布斯|迈克尔.?杰克逊|村上春树|彼得.?蒂尔)/i;
const exactFranchisePattern = /(?:Persona\s?5|Saint Seiya|Pok[eé]mon|Studio Ghibli|Harry Potter|Star Wars|Black Myth|The Beatles|Disney\/Pixar)/i;

const chineseTitles = {
  1: "青春闪光纪实摄影", 2: "高级品牌邮件视觉套件", 3: "16:9 黑板教学信息图", 4: "3D 迷你概念店",
  5: "蜡笔城市旅行日记", 6: "游戏实机画面生成", 7: "人物特征复现模板", 8: "工笔重彩人物画",
  9: "春日城市宣传海报", 10: "高级棚拍时尚肖像", 11: "奶油意面步骤信息图", 12: "城市寻物大场景",
  13: "100 个像素 RPG 道具", 14: "东方奇幻角色海报", 15: "多页品牌视觉套件", 16: "手绘食谱海报",
  17: "16:9 卡通知识讲解图", 18: "上市公司研究仪表盘", 19: "虚构品牌时尚画册", 20: "数据分析平台 UI",
  21: "创作者数据分析界面", 22: "虚构动漫电影海报", 23: "模块化科普百科图", 24: "意式汽水夏季横幅",
  25: "大胆美妆品牌视觉", 27: "今日热点 3×3 情绪板", 28: "视频剪辑桌面界面", 29: "超写实人物肖像模板",
  31: "伊斯坦布尔旅行指南", 32: "圣索菲亚大教堂注释图", 34: "Magnus 效应教学信息图", 35: "多语言文字能力信息图",
  36: "极简组装说明书", 37: "科幻电影海报", 38: "幕后扩展画面", 39: "菲利普二世历史信息图",
  40: "伦敦卫星地图", 41: "字母 A 主题百物图鉴", 42: "音乐播放器屏幕摄影", 43: "虚构角色电影海报",
  45: "都市一周穿搭信息图", 46: "产品广告视觉重构", 47: "冰咖啡商业广告", 48: "2026 中文老黄历",
  49: "个人知识画像", 50: "中文科普百科图", 51: "60 年代新浪潮电影海报", 53: "GPT Image 2 能力信息图",
  55: "历史事件手机纪实图", 56: "波音 747 精细剖视图", 57: "地图式奥斯曼微缩战争", 58: "末世豪宅地产广告",
  59: "日系未来产品广告", 60: "纽约城市宣传海报",
};

const categoryMap = {
  infographic: "PPT / 信息图", poster: "海报设计", social: "社媒 / 品牌", ui: "UI / 产品", profile: "人像摄影", comic: "插画 / 漫画",
};

const inferRatio = (prompt) => {
  const explicit = prompt.match(/(?:aspect[_ ]?ratio|--ar|ratio|宽高比|比例)[^\d]{0,12}(\d{1,2})\s*[:×x／/]\s*(\d{1,2})/i);
  if (explicit) return `${explicit[1]}:${explicit[2]}`;
  if (/landscape|horizontal|幻灯片|slides?|presentation/i.test(prompt)) return "16:9";
  if (/vertical|portrait|竖版|竖向/i.test(prompt)) return "4:5";
  return "自适应";
};

const inferTags = (promptInput) => {
  const prompt = promptInput.toLowerCase();
  const tags = [];
  if (/16:9|landscape|horizontal|slide|presentation|infographic|diagram|timeline|cutaway|ppt/.test(prompt)) tags.push("PPT 可用");
  if (/text|typography|文字|标题/.test(prompt)) tags.push("文字排版");
  if (/photoreal|photo|cinematic|摄影|写实/.test(prompt)) tags.push("写实");
  if (/illustration|cartoon|comic|drawn|插画|手绘/.test(prompt)) tags.push("插画");
  if (/grid|modular|layout|dashboard|模块|网格/.test(prompt)) tags.push("结构化");
  if (/3d|miniature|render/.test(prompt)) tags.push("3D");
  return [...new Set(tags)].slice(0, 3);
};

const toseaItems = toseaSource.entries
  .filter((entry) => !toseaExcludedIndexes.has(entry.index))
  .map((entry) => ({
    id: `tosea-${String(entry.index).padStart(2, "0")}`,
    index: entry.index,
    title: chineseTitles[entry.index] ?? entry.title.zh ?? entry.title.en,
    originalTitle: entry.title.en,
    description: entry.description.zh ?? entry.description.en,
    category: categoryMap[entry.category],
    sourceCategory: entry.category,
    ratio: inferRatio(entry.prompt),
    prompt: entry.prompt,
    promptType: entry.promptType,
    featured: Boolean(entry.featured),
    tags: inferTags(entry.prompt),
    image: `./gallery/tosea/${String(entry.index).padStart(2, "0")}.jpg`,
    author: entry.author.displayName,
    authorHandle: entry.author.xHandle ?? "",
    originalPostUrl: entry.sourceUrl,
    publishedAt: entry.publishedAt,
    repositoryUrl: "https://github.com/ToseaAI/awesome-gpt-image-2-prompts",
    collectionName: "ToseaAI · Awesome GPT Image 2 Prompts",
    promptLicense: "CC BY 4.0",
    promptLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    previewOwner: entry.author.displayName,
    previewSourceUrl: entry.sourceUrl,
    attributionText: `原提示词与效果图：${entry.author.displayName}；开源整理：ToseaAI。`,
    modificationNote: "仅增加中文标题、分类与检索标签；原提示词未改写。",
    rightsReviewStatus: "source-attributed",
    rightsReviewedAt: "2026-07-29",
    assetHostingMode: "self-hosted-collection",
  }));

const apimartCategories = [
  "Portrait & Photography Cases",
  "Poster & Illustration Cases",
  "Character Design Cases",
  "UI & Social Media Mockup Cases",
  "Comparison & Community Examples",
];

const apimartHeadings = {
  "Portrait & Photography Cases": "## 📸 Portrait & Photography Cases",
  "Poster & Illustration Cases": "## 🎨 Poster & Illustration Cases",
  "Character Design Cases": "## 🧝 Character Design Cases",
  "UI & Social Media Mockup Cases": "## 📱 UI & Social Media Mockup Cases",
  "Comparison & Community Examples": "## 🔬 Comparison & Community Examples",
};

const apimartCategorySlug = {
  "Portrait & Photography Cases": "portrait",
  "Poster & Illustration Cases": "poster",
  "Character Design Cases": "character",
  "UI & Social Media Mockup Cases": "ui",
  "Comparison & Community Examples": "comparison",
};

const inferApimartCategory = (sourceCategory, prompt) => {
  if (/infographic|slides?|presentation|timeline|diagram|ppt|信息图|图鉴|课件/i.test(prompt)) return "PPT / 信息图";
  if (sourceCategory.startsWith("Portrait")) return "人像摄影";
  if (sourceCategory.startsWith("Poster")) return "海报设计";
  if (sourceCategory.startsWith("Character")) return "插画 / 漫画";
  if (sourceCategory.startsWith("UI")) return /ui|interface|website|app|dashboard|mockup/i.test(prompt) ? "UI / 产品" : "社媒 / 品牌";
  return "实验 / 对比";
};

const parseApimartReadme = (text) => {
  const results = [];
  const promptsIndex = text.indexOf("\n## Prompts");
  for (const category of apimartCategories) {
    const heading = apimartHeadings[category];
    const headingMatchIndex = text.indexOf(`\n${heading}`, promptsIndex === -1 ? 0 : promptsIndex);
    if (headingMatchIndex === -1) continue;
    const headingIndex = headingMatchIndex + 1;
    const start = headingIndex + heading.length;
    const nextHeadingIndex = text.indexOf("\n## ", start);
    const section = text.slice(start, nextHeadingIndex === -1 ? text.length : nextHeadingIndex);
    const casePattern = /^### Case (\d+): \[(.+?)\]\((https?:\/\/[^)]+)\) \(by \[@([^\]]+)\]\((https?:\/\/[^)]+)\)\)/gm;
    const matches = [...section.matchAll(casePattern)];
    matches.forEach((match, index) => {
      const body = section.slice(match.index + match[0].length, matches[index + 1]?.index ?? section.length);
      const imagePath = body.match(/<img\s+src="\.\/(images\/[^\"]+)"/i)?.[1] ?? "";
      const prompt = body.match(/```\s*\n([\s\S]+?)```/)?.[1]?.trim() ?? "";
      if (!imagePath || !prompt) return;
      const riskText = `${match[2]}\n${prompt}`;
      if (highRiskPattern.test(riskText) || publicFigurePattern.test(riskText) || exactFranchisePattern.test(riskText)) return;
      results.push({
        category,
        caseNum: match[1],
        title: match[2].trim(),
        originalPostUrl: match[3].trim(),
        author: match[4].trim(),
        authorUrl: match[5].trim(),
        imagePath,
        prompt,
      });
    });
  }
  return results;
};

const apimartReadme = await readFile(resolve(apimartRoot, "README.md"), "utf8");
const apimartParsed = parseApimartReadme(apimartReadme);
const apimartItems = apimartParsed.map((entry, position) => {
  const slug = apimartCategorySlug[entry.category];
  const fileName = `${slug}-${entry.caseNum}-${basename(entry.imagePath)}`;
  const category = inferApimartCategory(entry.category, entry.prompt);
  return {
    id: `apimart-${slug}-${entry.caseNum}`,
    index: 1000 + position,
    title: entry.title,
    originalTitle: entry.title,
    description: entry.prompt.replace(/\s+/g, " ").slice(0, 260),
    category,
    sourceCategory: slug,
    ratio: inferRatio(entry.prompt),
    prompt: entry.prompt,
    promptType: "original",
    featured: category === "PPT / 信息图",
    tags: inferTags(entry.prompt),
    image: `./gallery/apimart/${fileName}`,
    author: entry.author,
    authorHandle: entry.author,
    originalPostUrl: entry.originalPostUrl,
    publishedAt: "",
    repositoryUrl: "https://github.com/ApiMartAI/best-gpt-image-2-prompts",
    collectionName: "ApiMartAI · Best GPT Image 2 Prompts",
    promptLicense: "CC BY 4.0 collection",
    promptLicenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    previewOwner: entry.author,
    previewSourceUrl: entry.originalPostUrl,
    attributionText: `原提示词与效果图：@${entry.author}；开源整理：ApiMartAI。`,
    modificationNote: "仅增加分类与检索标签；原提示词未改写。高风险、未成年、露骨或明确真人仿制条目已排除。",
    rightsReviewStatus: "source-attributed-collection",
    rightsReviewedAt: "2026-07-29",
    assetHostingMode: "self-hosted-collection",
    sourceImagePath: resolve(apimartRoot, entry.imagePath),
  };
});

const pptSlidesItems = [];
const pptDirectories = await readdir(resolve(pptSlidesRoot, "prompts"), { withFileTypes: true });
for (const [position, directory] of pptDirectories.filter((entry) => entry.isDirectory()).entries()) {
  const promptDirectory = resolve(pptSlidesRoot, "prompts", directory.name);
  const markdown = await readFile(resolve(promptDirectory, "prompt.md"), "utf8");
  const prompt = markdown.match(/^## Prompt Text\s*\n([\s\S]+?)(?=^##\s|\Z)/m)?.[1]?.trim() ?? "";
  if (!prompt || highRiskPattern.test(prompt)) continue;
  const files = await readdir(promptDirectory);
  const preview = files.find((file) => /^preview-1\.(?:webp|png|jpe?g)$/i.test(file));
  if (!preview) continue;
  const title = markdown.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? directory.name;
  const tags = (markdown.match(/^tags:\s*(.+)$/m)?.[1] ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);
  const outputName = `${directory.name}-${preview}`;
  pptSlidesItems.push({
    id: `2slides-${directory.name}`,
    index: 2000 + position,
    title,
    originalTitle: title,
    description: prompt.replace(/\s+/g, " ").slice(0, 260),
    category: "PPT / 信息图",
    sourceCategory: "ppt",
    ratio: inferRatio(prompt),
    prompt,
    promptType: "original",
    featured: true,
    tags: [...new Set(["PPT 可用", ...tags])].slice(0, 4),
    image: `./gallery/2slides/${outputName}`,
    author: markdown.match(/^contributor:\s*(.+)$/m)?.[1]?.trim() ?? "2slides",
    authorHandle: "2slides",
    originalPostUrl: `https://github.com/2slides/awesome-nano-banana-ppt-prompts/tree/main/prompts/${directory.name}`,
    publishedAt: "",
    repositoryUrl: "https://github.com/2slides/awesome-nano-banana-ppt-prompts",
    collectionName: "2slides · Awesome Nano Banana PPT Prompts",
    promptLicense: "Apache-2.0",
    promptLicenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
    previewOwner: "2slides",
    previewSourceUrl: `https://github.com/2slides/awesome-nano-banana-ppt-prompts/tree/main/prompts/${directory.name}`,
    attributionText: `提示词与预览图：${markdown.match(/^contributor:\s*(.+)$/m)?.[1]?.trim() ?? "2slides"}；开源整理：2slides。`,
    modificationNote: "仅增加分类、排序与检索标签；原提示词未改写。",
    rightsReviewStatus: "apache-2.0-reviewed",
    rightsReviewedAt: "2026-07-29",
    assetHostingMode: "self-hosted-collection",
    sourceImagePath: resolve(promptDirectory, preview),
  });
}

const items = [...toseaItems, ...apimartItems, ...pptSlidesItems]
  .sort((a, b) => {
    const aPpt = a.category === "PPT / 信息图" ? 0 : 1;
    const bPpt = b.category === "PPT / 信息图" ? 0 : 1;
    return aPpt - bPpt || Number(b.featured) - Number(a.featured) || a.index - b.index;
  })
  .map(({ sourceImagePath, ...item }) => {
    void sourceImagePath;
    return item;
  });

const toseaImageOutput = resolve(root, "public", "gallery", "tosea");
const apimartImageOutput = resolve(root, "public", "gallery", "apimart");
const pptSlidesImageOutput = resolve(root, "public", "gallery", "2slides");
await rm(toseaImageOutput, { recursive: true, force: true });
await rm(apimartImageOutput, { recursive: true, force: true });
await rm(pptSlidesImageOutput, { recursive: true, force: true });
await mkdir(toseaImageOutput, { recursive: true });
await mkdir(apimartImageOutput, { recursive: true });
await mkdir(pptSlidesImageOutput, { recursive: true });

for (const item of toseaItems) {
  const file = `${String(item.index).padStart(2, "0")}.jpg`;
  await cp(resolve(toseaRoot, "images", file), resolve(toseaImageOutput, file));
}

for (const item of apimartItems) {
  await stat(item.sourceImagePath);
  await cp(item.sourceImagePath, resolve(apimartImageOutput, basename(item.image)));
}

for (const item of pptSlidesItems) {
  await stat(item.sourceImagePath);
  await cp(item.sourceImagePath, resolve(pptSlidesImageOutput, basename(item.image)));
}

await mkdir(resolve(root, "app", "data"), { recursive: true });
await writeFile(resolve(root, "app", "data", "prompt-items.json"), `${JSON.stringify(items, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  imported: items.length,
  tosea: toseaItems.length,
  apimart: apimartItems.length,
  ppt2slides: pptSlidesItems.length,
  excludedApimart: 107 - apimartItems.length,
  pptInfographic: items.filter((item) => item.category === "PPT / 信息图").length,
  authors: new Set(items.map((item) => item.author)).size,
}, null, 2));
