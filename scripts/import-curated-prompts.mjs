import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(root, "..", "prompt-gallery-sources", "tosea");
const source = JSON.parse(await readFile(resolve(sourceRoot, "prompts.json"), "utf8"));

// Entries that ask for exact living-artist/music styles, book-page continuation,
// or unnecessarily sexualized portrait details are omitted from the public set.
const excludedIndexes = new Set([26, 30, 33, 44, 52, 54]);

const chineseTitles = {
  1: "青春闪光纪实摄影",
  2: "高级品牌邮件视觉套件",
  3: "16:9 黑板教学信息图",
  4: "3D 迷你概念店",
  5: "蜡笔城市旅行日记",
  6: "游戏实机画面生成",
  7: "人物特征复现模板",
  8: "工笔重彩人物画",
  9: "春日城市宣传海报",
  10: "高级棚拍时尚肖像",
  11: "奶油意面步骤信息图",
  12: "城市寻物大场景",
  13: "100 个像素 RPG 道具",
  14: "东方奇幻角色海报",
  15: "多页品牌视觉套件",
  16: "手绘食谱海报",
  17: "16:9 卡通知识讲解图",
  18: "上市公司研究仪表盘",
  19: "虚构品牌时尚画册",
  20: "数据分析平台 UI",
  21: "创作者数据分析界面",
  22: "虚构动漫电影海报",
  23: "模块化科普百科图",
  24: "意式汽水夏季横幅",
  25: "大胆美妆品牌视觉",
  27: "今日热点 3×3 情绪板",
  28: "视频剪辑桌面界面",
  29: "超写实人物肖像模板",
  31: "伊斯坦布尔旅行指南",
  32: "圣索菲亚大教堂注释图",
  34: "Magnus 效应教学信息图",
  35: "多语言文字能力信息图",
  36: "极简组装说明书",
  37: "科幻电影海报",
  38: "幕后扩展画面",
  39: "菲利普二世历史信息图",
  40: "伦敦卫星地图",
  41: "字母 A 主题百物图鉴",
  42: "音乐播放器屏幕摄影",
  43: "虚构角色电影海报",
  45: "都市一周穿搭信息图",
  46: "产品广告视觉重构",
  47: "冰咖啡商业广告",
  48: "2026 中文老黄历",
  49: "个人知识画像",
  50: "中文科普百科图",
  51: "60 年代新浪潮电影海报",
  53: "GPT Image 2 能力信息图",
  55: "历史事件手机纪实图",
  56: "波音 747 精细剖视图",
  57: "地图式奥斯曼微缩战争",
  58: "末世豪宅地产广告",
  59: "日系未来产品广告",
  60: "纽约城市宣传海报",
};

const categoryMap = {
  infographic: "PPT / 信息图",
  poster: "海报设计",
  social: "社媒 / 品牌",
  ui: "UI / 产品",
  profile: "人像摄影",
  comic: "插画 / 漫画",
};

const inferRatio = (prompt) => {
  const explicit = prompt.match(/(?:aspect[_ ]?ratio|--ar|ratio|宽高比|比例)[^\d]{0,12}(\d{1,2})\s*[:×x／/]\s*(\d{1,2})/i);
  if (explicit) return `${explicit[1]}:${explicit[2]}`;
  if (/landscape|horizontal|幻灯片|slides?|presentation/i.test(prompt)) return "16:9";
  if (/vertical|portrait|竖版|竖向/i.test(prompt)) return "4:5";
  return "自适应";
};

const inferTags = (entry) => {
  const prompt = entry.prompt.toLowerCase();
  const tags = [];
  if (/16:9|landscape|horizontal|slide|presentation|infographic|diagram|timeline|cutaway/.test(prompt)) tags.push("PPT 可用");
  if (/text|typography|文字|标题/.test(prompt)) tags.push("文字排版");
  if (/photoreal|photo|cinematic|摄影|写实/.test(prompt)) tags.push("写实");
  if (/illustration|cartoon|comic|drawn|插画|手绘/.test(prompt)) tags.push("插画");
  if (/grid|modular|layout|dashboard|模块|网格/.test(prompt)) tags.push("结构化");
  if (/3d|miniature|render/.test(prompt)) tags.push("3D");
  return [...new Set(tags)].slice(0, 3);
};

const items = source.entries
  .filter((entry) => !excludedIndexes.has(entry.index))
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
    tags: inferTags(entry),
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
  }))
  .sort((a, b) => {
    const aPpt = a.category === "PPT / 信息图" ? 0 : 1;
    const bPpt = b.category === "PPT / 信息图" ? 0 : 1;
    return aPpt - bPpt || Number(b.featured) - Number(a.featured) || a.index - b.index;
  });

const imageOutput = resolve(root, "public", "gallery", "tosea");
await rm(imageOutput, { recursive: true, force: true });
await mkdir(imageOutput, { recursive: true });

for (const item of items) {
  const file = `${String(item.index).padStart(2, "0")}.jpg`;
  await cp(resolve(sourceRoot, "images", file), resolve(imageOutput, file));
}

await mkdir(resolve(root, "app", "data"), { recursive: true });
await writeFile(resolve(root, "app", "data", "prompt-items.json"), `${JSON.stringify(items, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ imported: items.length, pptInfographic: items.filter((item) => item.category === "PPT / 信息图").length, imageOutput }, null, 2));
