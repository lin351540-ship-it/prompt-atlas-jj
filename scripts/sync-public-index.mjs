import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "app", "data", "live-index.json");
const readmeUrl = "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-gpt-image-2/main/README.md";
const syncedAt = new Date().toISOString();

const categoryFor = (input) => {
  if (/ppt|slide|presentation|infographic|diagram|chart|map|education|course|知识|信息图|课件/i.test(input)) return "PPT / 信息图";
  if (/poster|flyer|typography|海报|卡片/i.test(input)) return "海报设计";
  if (/ui|interface|website|app|dashboard/i.test(input)) return "UI / 产品";
  if (/portrait|photo|selfie|photography/i.test(input)) return "人像摄影";
  if (/comic|illustration|anime|character|storyboard/i.test(input)) return "插画 / 漫画";
  return "创意发现";
};

const compact = (value, length = 230) => value.replace(/\s+/g, " ").trim().slice(0, length);
const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

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
  origin: "小小东公开 X 索引",
  category,
  previewTheme: (index + 2) % 8,
  rightsMode: "source-link-only",
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
    const title = compact(match[2], 140);
    const description = compact(section.match(/^#### 📖 Description\s*\n+([\s\S]+?)(?=^####|^###|^---)/m)?.[1] ?? "公开提示词案例，点击来源查看作者原帖与完整上下文。");
    const authorMatch = section.match(/- \*\*Author:\*\* \[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const sourceMatch = section.match(/- \*\*Source:\*\* \[[^\]]+\]\((https?:\/\/[^)]+)\)/);
    const landingMatch = section.match(/\*\*\[👉 Try it now →\]\((https?:\/\/[^)]+)\)\*\*/);
    const sourceUrl = sourceMatch?.[1]?.replace(/#.*$/, "") ?? landingMatch?.[1] ?? "https://github.com/YouMind-OpenLab/awesome-gpt-image-2";
    const dedupeKey = sourceUrl.includes("/status/") ? sourceUrl : `${title}|${authorMatch?.[1] ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const text = `${title} ${description}`;
    items.push({
      id: `youmind-${hash(dedupeKey)}`,
      title,
      summary: description,
      author: authorMatch?.[1] ?? "YouMind OpenLab 社区",
      authorUrl: authorMatch?.[2] ?? "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
      sourceUrl,
      landingUrl: landingMatch?.[1] ?? "https://youmind.com/zh-CN/gpt-image-2-prompts",
      sourcePlatform: "YouMind / X",
      origin: "YouMind OpenLab · GitHub 公开镜像",
      category: categoryFor(text),
      previewTheme: Number(match[1]) % 8,
      rightsMode: "source-link-only",
      syncMethod: "github-public-mirror",
      syncedAt,
    });
    if (items.length >= 320) break;
  }

  return { total, sourceUpdatedAt, items };
};

let previous = { sourceStats: {}, items: [] };
try {
  previous = JSON.parse(await readFile(outputPath, "utf8"));
} catch {}

let youMind;
let status = "fresh";
try {
  const response = await fetch(readmeUrl, { headers: { "user-agent": "Prompt-Atlas-JJ/1.0" } });
  if (!response.ok) throw new Error(`GitHub raw returned ${response.status}`);
  youMind = parseYouMind(await response.text());
  if (!youMind.items.length) throw new Error("No public index entries parsed");
} catch (error) {
  status = "stale-fallback";
  const priorItems = previous.items?.filter((item) => item.syncMethod === "github-public-mirror") ?? [];
  if (!priorItems.length) throw error;
  youMind = {
    total: previous.sourceStats?.youMindTotal ?? priorItems.length,
    sourceUpdatedAt: previous.sourceStats?.youMindUpdatedAt ?? "",
    items: priorItems,
  };
}

const items = [...xSeeds, ...youMind.items];
await writeFile(outputPath, `${JSON.stringify({
  generatedAt: syncedAt,
  status,
  sourceStats: {
    youMindTotal: youMind.total,
    youMindIndexed: youMind.items.length,
    youMindUpdatedAt: youMind.sourceUpdatedAt,
    xEditorialLinks: xSeeds.length,
  },
  items,
}, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ status, indexed: items.length, youMind: youMind.items.length, x: xSeeds.length, upstreamTotal: youMind.total }, null, 2));
