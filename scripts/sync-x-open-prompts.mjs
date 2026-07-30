import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "app", "data", "x-open-prompts.json");
const imageDirectory = resolve(root, "public", "gallery", "x-open");
const repositoryUrl = "https://github.com/lin351540-ship-it/prompt-atlas-jj";
const syncedAt = new Date().toISOString();

const defaultCliCandidates = [
  process.env.OPENCLI_JS,
  resolve(homedir(), "AppData", "Roaming", "npm", "node_modules", "@jackwener", "opencli", "dist", "src", "main.js"),
].filter(Boolean);
const openCliPath = defaultCliCandidates.find((candidate) => existsSync(candidate));

const queries = [
  "from:xiaoxiaodong01 ALT",
  "from:xiaoxiaodong01 提示词",
  "\"提示词图一ALT属性中\"",
  "\"prompt in ALT\" \"GPT Image\"",
  "\"prompt in alt\" \"Nano Banana\"",
  "\"free prompt\" \"GPT Image\"",
  "\"open prompt\" \"GPT Image 2\"",
  "\"提示词\" \"GPT-image2\"",
  "\"提示词\" \"信息图\" \"GPT2\"",
  "\"提示词\" \"PPT\" \"GPT2\"",
];
const timelineAccounts = ["xiaoxiaodong01"];

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const compact = (value) => String(value ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);

async function readPrevious() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return { generatedAt: "", sourceStats: {}, items: [] };
  }
}

function runOpenCli(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [openCliPath, ...args], {
      cwd: root,
      windowsHide: true,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`OpenCLI exited ${code}: ${stderr.slice(-1200)}`));
        return;
      }
      const start = stdout.indexOf("[");
      const end = stdout.lastIndexOf("]");
      if (start < 0 || end < start) {
        reject(new Error(`OpenCLI did not return JSON: ${stdout.slice(-1200)}`));
        return;
      }
      try {
        resolvePromise(JSON.parse(stdout.slice(start, end + 1)));
      } catch (error) {
        reject(new Error(`OpenCLI JSON parse failed: ${error.message}`));
      }
    });
  });
}

function syndicationToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json,text/plain,*/*",
          "user-agent": "PromptAtlasJJ/1.0 (public X attribution sync)",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(700 * attempt);
    }
  }
  throw lastError;
}

async function fetchTweet(id) {
  const token = syndicationToken(id);
  return fetchJson(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${token}`);
}

function extractTweetId(urlOrId) {
  return String(urlOrId ?? "").match(/(?:status\/)?(\d{12,})/)?.[1] ?? "";
}

function normalizeMediaUrl(url) {
  if (!url) return "";
  if (url.includes("pbs.twimg.com/media/")) {
    return url.replace(/\?.*$/, "") + "?format=jpg&name=large";
  }
  return url;
}

function looksLikePrompt(text) {
  const value = compact(text);
  if (value.length < 90) return false;
  const signals = value.match(/生成|创建|画面|风格|构图|配色|比例|光影|镜头|排版|海报|信息图|照片|create|generate|image|photo|poster|style|lighting|composition|typography|render/gi) ?? [];
  return signals.length >= 2 && !/^https?:\/\//i.test(value);
}

function categoriesFor(text) {
  const value = text.toLowerCase();
  const categories = [];
  if (/ppt|powerpoint|slide|presentation|信息图|infographic|课件|图表|知识卡/.test(value)) categories.push("PPT / 信息图");
  if (/海报|poster|flyer|typography/.test(value)) categories.push("海报设计");
  if (/ui|ux|app|web|网页|界面|产品设计/.test(value)) categories.push("UI / 产品");
  if (/社媒|social|brand|品牌|广告|营销|小红书|instagram|youtube|电商/.test(value)) categories.push("社媒 / 品牌");
  if (/portrait|人像|摄影|photo|cinematic|镜头|相机/.test(value)) categories.push("人像摄影");
  if (/illustration|插画|漫画|anime|comic|character|角色/.test(value)) categories.push("插画 / 漫画");
  if (/对比|comparison|versus|test|测试/.test(value)) categories.push("实验 / 对比");
  return [...new Set(categories.length ? categories : ["创意发现"])];
}

function ratioFor(text, media) {
  const matched = text.match(/\b(21\s*:\s*9|16\s*:\s*10|16\s*:\s*9|4\s*:\s*5|3\s*:\s*4|2\s*:\s*3|9\s*:\s*16|1\s*:\s*1)\b/);
  if (matched) return matched[1].replace(/\s/g, "");
  const size = media?.sizes?.large;
  if (!size?.w || !size?.h) return "自适应";
  const value = size.w / size.h;
  if (value > 1.6) return "16:9";
  if (value < 0.72) return "9:16";
  if (value > 1.15) return "4:3";
  if (value < 0.9) return "3:4";
  return "1:1";
}

function dateFor(tweet) {
  const raw = tweet.created_at ?? tweet.createdAt ?? "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) return "";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" }).format(parsed);
}

function makeTitle(tweet, prompt, promptIndex, promptCount) {
  const firstLine = compact(tweet.text).split("\n").find(Boolean) ?? "";
  const fallback = compact(prompt).slice(0, 34);
  const base = (firstLine || fallback || "X 公开生图提示词").replace(/https?:\/\/\S+/g, "").replace(/\s*[x×]\s*/gi, " · ").trim().slice(0, 84);
  return promptCount > 1 ? `${base} · ${promptIndex + 1}` : base;
}

function tweetToItems(tweet) {
  const id = String(tweet.id_str ?? tweet.id ?? "");
  if (!id) return [];
  const media = (tweet.mediaDetails ?? [])
    .filter((entry) => entry.type === "photo" && entry.media_url_https)
    .map((entry) => ({ ...entry, remoteUrl: normalizeMediaUrl(entry.media_url_https), prompt: compact(entry.ext_alt_text) }));
  const promptMedia = media.filter((entry) => looksLikePrompt(entry.prompt));
  if (!media.length || !promptMedia.length) return [];

  const author = tweet.user?.name || tweet.user?.screen_name || "X 公开作者";
  const authorHandle = tweet.user?.screen_name || "";
  const originalPostUrl = `https://x.com/${authorHandle || "i"}/status/${id}`;
  const tweetText = compact(tweet.text);
  const publicSignal = /提示词|prompt|alt|开源|免费|free|open source/i.test(tweetText);
  if (!publicSignal) return [];

  return promptMedia.map((entry, promptIndex) => {
    const orderedMedia = [entry, ...media.filter((item) => item.remoteUrl !== entry.remoteUrl)];
    const categories = categoriesFor(`${tweetText}\n${entry.prompt}`);
    const primaryCategory = categories.includes("PPT / 信息图") ? "PPT / 信息图" : categories[0];
    const tags = [
      authorHandle.toLowerCase() === "xiaoxiaodong01" ? "小小东" : "X 公开分享",
      primaryCategory === "PPT / 信息图" ? "PPT 可用" : "GPT Image 2",
      /nano banana/i.test(`${tweetText} ${entry.prompt}`) ? "Nano Banana" : "",
      "ALT 完整提示词",
    ].filter(Boolean);
    const title = makeTitle(tweet, entry.prompt, promptIndex, promptMedia.length);
    return {
      id: `x-open-${id}-${promptIndex + 1}-${hash(entry.prompt)}`,
      tweetId: id,
      mediaKey: `${id}-${media.indexOf(entry) + 1}`,
      index: 50000,
      title,
      originalTitle: title,
      description: tweetText.slice(0, 240) || "作者在 X 公开分享的生成效果与完整 ALT 提示词。",
      category: primaryCategory,
      categories,
      sourceCategory: "x-public-alt-prompt",
      ratio: ratioFor(`${tweetText}\n${entry.prompt}`, entry),
      prompt: entry.prompt,
      promptType: "author-public-alt-text",
      featured: authorHandle.toLowerCase() === "xiaoxiaodong01" || primaryCategory === "PPT / 信息图",
      tags,
      image: entry.remoteUrl,
      imageUrls: orderedMedia.map((item) => item.remoteUrl),
      remoteImageUrls: orderedMedia.map((item) => item.remoteUrl),
      author,
      authorHandle,
      originalPostUrl,
      publishedAt: dateFor(tweet),
      repositoryUrl,
      collectionName: "Prompt Atlas · X 公开提示词雷达",
      promptLicense: "作者在 X 原帖公开发布的提示词；保留署名与原帖，使用前请遵循作者说明",
      promptLicenseUrl: originalPostUrl,
      previewOwner: author,
      previewSourceUrl: originalPostUrl,
      landingUrl: originalPostUrl,
      attributionText: `提示词与效果图：${author}${authorHandle ? `（@${authorHandle}）` : ""}；来源：X 公开原帖。`,
      modificationNote: "完整 ALT 提示词未改写；本站仅增加分类、检索标签与来源说明。",
      rightsReviewStatus: "author-public-x-alt-with-attribution",
      rightsReviewedAt: syncedAt.slice(0, 10),
      assetHostingMode: "local-attributed-cache",
      sourcePlatform: "X",
      syncMethod: "x-public-alt-prompt",
      syncedAt,
    };
  });
}

async function runPool(values, worker, concurrency) {
  const results = new Array(values.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = await worker(values[index], index);
      } catch (error) {
        results[index] = { error: error.message };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

async function localizeImages(items) {
  await mkdir(imageDirectory, { recursive: true });
  const unique = new Map();
  for (const item of items) {
    for (const remoteUrl of item.remoteImageUrls) {
      const mediaName = remoteUrl.match(/\/media\/([^?.]+)/)?.[1] ?? hash(remoteUrl);
      unique.set(remoteUrl, resolve(imageDirectory, `${mediaName}.webp`));
    }
  }

  const entries = [...unique.entries()];
  let downloaded = 0;
  let reused = 0;
  const localized = new Map();
  await runPool(entries, async ([remoteUrl, targetPath]) => {
    const publicPath = `./gallery/x-open/${targetPath.split(/[\\/]/).pop()}`;
    if (existsSync(targetPath)) {
      reused += 1;
      localized.set(remoteUrl, publicPath);
      return;
    }
    const response = await fetch(remoteUrl, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "PromptAtlasJJ/1.0 (public X attributed image cache)",
      },
    });
    if (!response.ok) throw new Error(`Image HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await sharp(buffer).rotate().resize({ width: 1440, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(targetPath);
    localized.set(remoteUrl, publicPath);
    downloaded += 1;
  }, 5);

  for (const item of items) {
    const localUrls = item.remoteImageUrls.map((url) => localized.get(url)).filter(Boolean);
    item.image = localUrls[0] ?? item.remoteImageUrls[0];
    item.imageUrls = localUrls.length ? localUrls : item.remoteImageUrls;
    delete item.remoteImageUrls;
    delete item.mediaKey;
    delete item.tweetId;
  }
  return { downloaded, reused, imageCount: unique.size };
}

const previous = await readPrevious();
if (!openCliPath) {
  console.warn("OpenCLI was not found; preserving the previous X snapshot.");
  process.exit(previous.items?.length ? 0 : 1);
}

const candidates = new Map();
const queryStats = [];
for (const query of queries) {
  try {
    const records = await runOpenCli([
      "twitter", "search", query,
      "--has", "images",
      "--exclude", "replies",
      "--exclude", "retweets",
      "--limit", "80",
      "-f", "json",
      "--window", "background",
    ]);
    for (const record of records) {
      const id = extractTweetId(record.id || record.url);
      if (id) candidates.set(id, { id, query });
      const quotedId = extractTweetId(record.quoted_tweet?.id || record.quoted_tweet?.url);
      if (quotedId) candidates.set(quotedId, { id: quotedId, query: `${query} · quoted` });
    }
    queryStats.push({ query, returned: records.length, ok: true });
  } catch (error) {
    queryStats.push({ query, returned: 0, ok: false, error: error.message.slice(0, 300) });
  }
  await sleep(900);
}
for (const account of timelineAccounts) {
  try {
    const records = await runOpenCli([
      "twitter", "tweets", account,
      "--limit", "240",
      "--page-delay", "2",
      "-f", "json",
      "--window", "background",
    ]);
    for (const record of records) {
      if (!record.has_media) continue;
      const id = extractTweetId(record.id || record.url);
      if (id) candidates.set(id, { id, query: `timeline:${account}` });
      const quotedId = extractTweetId(record.quoted_tweet?.id || record.quoted_tweet?.url);
      if (quotedId) candidates.set(quotedId, { id: quotedId, query: `timeline:${account} · quoted` });
    }
    queryStats.push({ query: `timeline:${account}`, returned: records.length, ok: true });
  } catch (error) {
    queryStats.push({ query: `timeline:${account}`, returned: 0, ok: false, error: error.message.slice(0, 300) });
  }
}

if (!candidates.size) {
  console.warn("X search returned no public candidates; preserving the previous snapshot.");
  process.exit(previous.items?.length ? 0 : 1);
}

const candidateIds = [...candidates.keys()];
const fetched = await runPool(candidateIds, async (id) => {
  await sleep(120);
  return fetchTweet(id);
}, 5);

const tweets = new Map();
for (const result of fetched) {
  if (!result || result.error) continue;
  const id = String(result.id_str ?? result.id ?? "");
  if (id) tweets.set(id, result);
  const quoted = result.quoted_tweet;
  const quotedId = String(quoted?.id_str ?? quoted?.id ?? "");
  if (quotedId) tweets.set(quotedId, quoted);
}

const dedupe = new Set();
const currentItems = [...tweets.values()]
  .flatMap(tweetToItems)
  .filter((item) => {
    const key = hash(item.prompt.toLowerCase());
    if (dedupe.has(key)) return false;
    dedupe.add(key);
    return true;
  })
  .sort((a, b) => Number(b.featured) - Number(a.featured) || b.tweetId.localeCompare(a.tweetId))
  .map((item, index) => ({ ...item, index: 50000 + index + 1 }));

if (!currentItems.length) {
  console.warn("No public X records passed the complete-prompt filter; preserving the previous snapshot.");
  process.exit(previous.items?.length ? 0 : 1);
}

const imageStats = await localizeImages(currentItems);
const mergedSeen = new Set();
const items = [...currentItems, ...(previous.items ?? [])]
  .filter((item) => item?.prompt?.length >= 90 && item?.imageUrls?.length && item?.originalPostUrl?.startsWith("https://x.com/"))
  .filter((item) => {
    const key = hash(item.prompt.replace(/\s+/g, " ").trim().toLowerCase());
    if (mergedSeen.has(key)) return false;
    mergedSeen.add(key);
    return true;
  })
  .sort((a, b) => Number(b.featured) - Number(a.featured) || String(b.publishedAt).localeCompare(String(a.publishedAt)))
  .map((item, index) => ({ ...item, index: 50000 + index + 1 }));
const authorCount = new Set(items.map((item) => item.authorHandle.toLowerCase()).filter(Boolean)).size;
const xiaoxiaodongCount = items.filter((item) => item.authorHandle.toLowerCase() === "xiaoxiaodong01").length;
const retainedRecords = Math.max(0, items.length - currentItems.length);
const finalImageCount = new Set(items.flatMap((item) => item.imageUrls).filter((url) => url.startsWith("./gallery/x-open/"))).size;
const payload = {
  generatedAt: syncedAt,
  sourceStats: {
    searchQueries: queries.length + timelineAccounts.length,
    successfulQueries: queryStats.filter((entry) => entry.ok).length,
    candidateTweets: candidateIds.length,
    fetchedTweets: tweets.size,
    completeRecords: items.length,
    imageCount: finalImageCount,
    downloadedImages: imageStats.downloaded,
    reusedImages: imageStats.reused,
    authorCount,
    xiaoxiaodongCount,
    retainedRecords,
    accessBoundary: "Public X search and public tweet syndication only; no login bypass, private content, deleted content, or restricted-page scraping.",
    inclusionRule: "A public post must include images, explicit prompt-sharing language, and a complete prompt-like ALT text of at least 90 characters.",
    queryStats,
  },
  items,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath,
  completeRecords: items.length,
  imageCount: imageStats.imageCount,
  authorCount,
  xiaoxiaodongCount,
  successfulQueries: payload.sourceStats.successfulQueries,
}, null, 2));
