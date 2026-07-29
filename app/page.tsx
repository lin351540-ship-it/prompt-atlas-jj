"use client";

/* eslint-disable @next/next/no-img-element -- this static gallery intentionally renders source-hosted previews */

import { useEffect, useMemo, useRef, useState } from "react";
import localPromptData from "./data/prompt-items.json";
import liveIndex from "./data/live-index.json";
import fullIndexSummary from "./data/full-index-summary.json";

type Category = "全部" | "PPT / 信息图" | "海报设计" | "社媒 / 品牌" | "UI / 产品" | "人像摄影" | "插画 / 漫画" | "实验 / 对比" | "创意发现";
type SourceMode = "全部来源" | "小小东" | "YouMind 全量公开索引" | "PPT 开源集" | "其他开源集";
type SortMode = "ppt" | "source" | "title";

type CatalogItem = {
  id: string;
  index: number;
  title: string;
  originalTitle: string;
  description: string;
  category: Category;
  categories?: Category[];
  sourceCategory: string;
  ratio: string;
  prompt: string;
  promptFile?: string;
  promptRecordId?: number;
  promptType: string;
  featured: boolean;
  tags: string[];
  image: string;
  imageUrls?: string[];
  author: string;
  authorHandle: string;
  originalPostUrl: string;
  publishedAt: string;
  repositoryUrl: string;
  collectionName: string;
  promptLicense: string;
  promptLicenseUrl: string;
  previewOwner: string;
  previewSourceUrl: string;
  landingUrl?: string;
  attributionText: string;
  modificationNote: string;
  rightsReviewStatus: string;
  rightsReviewedAt: string;
  assetHostingMode: string;
  sourcePlatform?: string;
  syncMethod?: string;
  syncedAt?: string;
};

type PublicCatalogRecord = {
  id: number;
  title: string;
  description: string;
  image: string;
  imageUrls: string[];
  categorySlugs: string[];
  needReferenceImages: boolean;
  promptFile: string;
};

const categories: Category[] = ["全部", "PPT / 信息图", "海报设计", "社媒 / 品牌", "UI / 产品", "人像摄影", "插画 / 漫画", "实验 / 对比", "创意发现"];
const sourceModes: SourceMode[] = ["全部来源", "小小东", "YouMind 全量公开索引", "PPT 开源集", "其他开源集"];
const localPromptItems = localPromptData as CatalogItem[];
const curatedYouMindItems = liveIndex.items.filter((item) => item.syncMethod === "github-public-full-record") as unknown as CatalogItem[];
const initialItems = [...curatedYouMindItems, ...localPromptItems];
const curatedYouMindImages = new Set(curatedYouMindItems.flatMap((item) => item.imageUrls?.length ? item.imageUrls : [item.image]));

const categoryMap: Record<string, Category> = {
  "profile-avatar": "人像摄影",
  "social-media-post": "社媒 / 品牌",
  "infographic-edu-visual": "PPT / 信息图",
  "youtube-thumbnail": "社媒 / 品牌",
  "comic-storyboard": "插画 / 漫画",
  "product-marketing": "社媒 / 品牌",
  "ecommerce-main-image": "社媒 / 品牌",
  "game-asset": "插画 / 漫画",
  "poster-flyer": "海报设计",
  "app-web-design": "UI / 产品",
  others: "创意发现",
};

const categoryPriority: Category[] = ["PPT / 信息图", "海报设计", "UI / 产品", "社媒 / 品牌", "插画 / 漫画", "人像摄影", "创意发现"];

const sourceLinks = [
  {
    eyebrow: "OFFICIAL PUBLIC INDEX · 14K+",
    title: "YouMind · GPT Image 2 Prompts Search",
    copy: `${fullIndexSummary.uniquePromptCount.toLocaleString()} 条可验证唯一记录、${fullIndexSummary.completePromptCount.toLocaleString()} 条完整正文；本站按官方公开 JSON 分片同步。`,
    url: "https://github.com/YouMind-OpenLab/gpt-image-2-prompts-search",
  },
  {
    eyebrow: "CURATED FULL RECORDS · CC BY 4.0",
    title: "YouMind OpenLab · Awesome GPT Image 2",
    copy: `${liveIndex.sourceStats.youMindCompleteRecords} 条带原作者、原帖与多张效果图的精选完整记录。`,
    url: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
  },
  {
    eyebrow: "PPT SOURCE · APACHE-2.0",
    title: "2slides · Nano Banana PPT Prompts",
    copy: "22 组演示设计、信息图与课程视觉案例，保留完整提示词与本地效果图。",
    url: "https://github.com/2slides/awesome-nano-banana-ppt-prompts",
  },
  {
    eyebrow: "LICENSED COLLECTION · CC BY 4.0",
    title: "ToseaAI + ApiMartAI",
    copy: "两个公开集合提供真实生成效果、完整提示词、作者信息与逐条来源链接。",
    url: "https://github.com/ToseaAI/awesome-gpt-image-2-prompts",
  },
  {
    eyebrow: "TYPE SYSTEM · MIT",
    title: "JCodesMore · AI Website Cloner Template",
    copy: "采用 Geist / Geist Mono 字体骨架、清晰的字号层级与更紧凑的编辑排版节奏。",
    url: "https://github.com/JCodesMore/ai-website-cloner-template",
  },
  {
    eyebrow: "MOTION REFERENCE · LICENSED",
    title: "React Bits + Transitions.dev",
    copy: "吸收 Spotlight、分段入场和克制的视差反馈；动画仅服务于浏览与内容定位。",
    url: "https://github.com/DavidHDev/react-bits",
  },
] as const;

function mapPublicRecord(record: PublicCatalogRecord): CatalogItem {
  const mappedCategories = [...new Set(record.categorySlugs.map((slug) => categoryMap[slug]).filter(Boolean))];
  const orderedCategories = categoryPriority.filter((name) => mappedCategories.includes(name));
  const category = orderedCategories[0] ?? "创意发现";
  const tags = [...new Set([category === "PPT / 信息图" ? "PPT 可用" : "GPT Image 2", ...record.categorySlugs.map((slug) => slug.replaceAll("-", " "))])].slice(0, 4);
  const detailUrl = `https://youmind.com/gpt-image-2-prompts?id=${record.id}`;

  return {
    id: `youmind-full-${record.id}`,
    index: 30000 + record.id,
    title: record.title || `Prompt ${record.id}`,
    originalTitle: record.title || `Prompt ${record.id}`,
    description: record.description || "YouMind 公开社区提示词案例",
    category,
    categories: orderedCategories.length ? orderedCategories : [category],
    sourceCategory: record.categorySlugs.join(","),
    ratio: "自适应",
    prompt: "",
    promptFile: record.promptFile,
    promptRecordId: record.id,
    promptType: "original-public-index",
    featured: false,
    tags,
    image: record.image,
    imageUrls: record.imageUrls,
    author: "YouMind 公开社区",
    authorHandle: "",
    originalPostUrl: detailUrl,
    publishedAt: "",
    repositoryUrl: fullIndexSummary.source,
    collectionName: "YouMind · GPT Image 2 Prompts Search",
    promptLicense: "YouMind 官方公开检索数据（保留来源署名）",
    promptLicenseUrl: fullIndexSummary.source,
    previewOwner: "原始公开社区作者",
    previewSourceUrl: detailUrl,
    landingUrl: detailUrl,
    attributionText: "提示词由 YouMind.com 通过公开社区搜集 ❤️",
    modificationNote: "提示词正文未改写；本站仅增加中文分类、检索、分片加载和来源说明。",
    rightsReviewStatus: "official-public-github-index",
    rightsReviewedAt: fullIndexSummary.syncedAt.slice(0, 10),
    assetHostingMode: "remote-source-with-fallback",
    sourcePlatform: "YouMind OpenLab",
    syncMethod: "youmind-public-search-index",
    syncedAt: fullIndexSummary.syncedAt,
  };
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.6" /><path d="m16 16 4.2 4.2" /></svg>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function CopyIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
}

function SourceIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
}

function ResilientImage({ sources, alt, className }: { sources: string[]; alt: string; className?: string }) {
  const usableSources = sources.filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (!usableSources.length || sourceIndex >= usableSources.length) {
    return <span className={`image-fallback ${className ?? ""}`} role="img" aria-label={`${alt}（效果图源暂不可用）`}><i>IMAGE SOURCE</i><b>效果图暂不可用</b><small>提示词正文仍可在站内查看</small></span>;
  }

  return <img className={`${className ?? ""}${loaded ? " is-loaded" : ""}`} src={usableSources[sourceIndex]} alt={alt} decoding="async" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setSourceIndex((index) => index + 1); }} />;
}

function itemMatchesCategory(item: CatalogItem, category: Category) {
  return category === "全部" || item.category === category || item.categories?.includes(category);
}

function sourceMatches(item: CatalogItem, source: SourceMode) {
  if (source === "全部来源") return true;
  if (source === "小小东") return item.author === "小小东" || item.authorHandle.toLowerCase() === "xiaoxiaodong01";
  if (source === "YouMind 全量公开索引") return item.syncMethod === "youmind-public-search-index" || item.syncMethod === "github-public-full-record";
  if (source === "PPT 开源集") return item.collectionName.includes("2slides");
  return item.syncMethod !== "youmind-public-search-index" && item.syncMethod !== "github-public-full-record" && !item.collectionName.includes("2slides");
}

function sourceLabel(item: CatalogItem) {
  if (item.author === "小小东" || item.authorHandle.toLowerCase() === "xiaoxiaodong01") return "小小东 · YouMind";
  if (item.syncMethod === "youmind-public-search-index") return "YouMind 公开索引";
  if (item.syncMethod === "github-public-full-record") return "YouMind 精选记录";
  if (item.collectionName.includes("2slides")) return "2slides";
  if (item.collectionName.includes("Tosea")) return "ToseaAI";
  if (item.collectionName.includes("ApiMart")) return "ApiMartAI";
  return item.collectionName;
}

function moveSpotlight(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export default function Home() {
  const [fullItems, setFullItems] = useState<CatalogItem[]>([]);
  const [indexStatus, setIndexStatus] = useState<"loading" | "ready" | "error">("loading");
  const [category, setCategory] = useState<Category>("PPT / 信息图");
  const [source, setSource] = useState<SourceMode>("全部来源");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("ppt");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("prompt-atlas-real-favorites") ?? "[]"); } catch { return []; }
  });
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [promptLoading, setPromptLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(36);
  const chunkCache = useRef(new Map<string, Map<number, string>>());

  const catalogItems = useMemo(() => [...fullItems, ...initialItems], [fullItems]);

  useEffect(() => {
    let active = true;
    fetch("./data/youmind/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Public index returned ${response.status}`);
        return response.json() as Promise<PublicCatalogRecord[]>;
      })
      .then((records) => {
        if (!active) return;
        setFullItems(records.filter((record) => !record.imageUrls.some((image) => curatedYouMindImages.has(image))).map(mapPublicRecord));
        setIndexStatus("ready");
      })
      .catch(() => active && setIndexStatus("error"));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".reveal-card:not(.is-revealed)");
    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-revealed"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "240px 0px", threshold: 0.01 });
    cards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${Math.min(index % 9, 6) * 32}ms`);
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, [visibleLimit, category, query, source, onlyFavorites, sort, indexStatus]);

  const counts = useMemo(() => Object.fromEntries(categories.map((name) => [name, catalogItems.filter((item) => itemMatchesCategory(item, name)).length])), [catalogItems]);
  const sourceCounts = useMemo(() => Object.fromEntries(sourceModes.map((name) => [name, catalogItems.filter((item) => sourceMatches(item, name)).length])), [catalogItems]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = catalogItems.filter((item) => {
      if (!itemMatchesCategory(item, category)) return false;
      if (!sourceMatches(item, source)) return false;
      if (onlyFavorites && !favorites.includes(item.id)) return false;
      if (!keyword) return true;
      return [item.title, item.originalTitle, item.description, item.author, item.category, item.collectionName, ...item.tags].join(" ").toLowerCase().includes(keyword);
    });
    return [...result].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "zh-CN");
      if (sort === "source") return a.index - b.index;
      const priority = (item: CatalogItem) => item.author === "小小东" ? 4 : item.collectionName.includes("2slides") ? 3 : item.syncMethod === "youmind-public-search-index" ? 2 : item.featured ? 1 : 0;
      return Number(b.category === "PPT / 信息图") - Number(a.category === "PPT / 信息图") || priority(b) - priority(a) || b.index - a.index;
    });
  }, [catalogItems, category, favorites, onlyFavorites, query, sort, source]);

  const visibleItems = filtered.slice(0, visibleLimit);
  const heroItems = useMemo(() => [
    curatedYouMindItems.find((item) => item.author === "小小东" && item.category === "PPT / 信息图"),
    localPromptItems.find((item) => item.id.startsWith("2slides-")),
    curatedYouMindItems.find((item) => item.featured && item.category === "PPT / 信息图"),
  ].filter(Boolean) as CatalogItem[], []);

  const loadPrompt = async (item: CatalogItem) => {
    if (item.prompt || !item.promptFile || !item.promptRecordId) return item;
    let chunk = chunkCache.current.get(item.promptFile);
    if (!chunk) {
      const response = await fetch(`./data/youmind/${item.promptFile}`);
      if (!response.ok) throw new Error(`Prompt shard returned ${response.status}`);
      const records = await response.json() as { id: number; content: string }[];
      chunk = new Map(records.map((record) => [record.id, record.content]));
      chunkCache.current.set(item.promptFile, chunk);
    }
    return { ...item, prompt: chunk.get(item.promptRecordId) ?? "该公开记录暂未提供提示词正文。" };
  };

  const openItem = async (item: CatalogItem) => {
    setSelectedImage(0);
    setSelected(item);
    if (item.prompt) return;
    setPromptLoading(true);
    try {
      const resolved = await loadPrompt(item);
      setSelected((current) => current?.id === item.id ? resolved : current);
    } catch {
      setSelected((current) => current?.id === item.id ? { ...item, prompt: "提示词分片暂时加载失败，请稍后重试。" } : current);
    } finally {
      setPromptLoading(false);
    }
  };

  const handleCopy = async (item: CatalogItem) => {
    try {
      const resolved = await loadPrompt(item);
      await copyText(resolved.prompt);
      if (selected?.id === item.id) setSelected(resolved);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 1700);
    } catch {
      setCopiedId(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("prompt-atlas-real-favorites", JSON.stringify(next));
      return next;
    });
  };

  const selectedImages = selected ? (selected.imageUrls?.length ? selected.imageUrls : [selected.image]).filter(Boolean) : [];
  const totalBrowsable = fullIndexSummary.uniquePromptCount + localPromptItems.length;

  return (
    <main>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />

      <header className="glass-nav" aria-label="主导航">
        <a className="brand" href="#top" aria-label="Prompt Atlas 首页"><span className="brand-glyph">P</span><span><b>Prompt Atlas</b><small>REAL OUTPUT LIBRARY</small></span></a>
        <nav><a href="#gallery">完整图库</a><a href="#sources">来源</a><a href="#rights">透明说明</a></nav>
        <a className="nav-cta" href="#gallery">开始浏览 <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="signal"><i /> 真实效果图 · 完整提示词 · 同页直看</div>
          <h1>一万四千条公开灵感，<br /><span>排进同一座提示词美术馆。</span></h1>
          <p>小小东、YouMind OpenLab 与优质开源集合统一进入卡片瀑布流。先看真实生成效果，再在站内展开并复制完整提示词，不再另设小小东专区，也不强迫跳转外站。</p>
          <div className="hero-actions"><a className="glass-button primary" href="#gallery">查看 {totalBrowsable.toLocaleString()} 组案例 <ArrowIcon /></a><a className="quiet-link" href="#rights">数据范围与授权</a></div>
          <div className="proof-row">
            <span><b>{fullIndexSummary.uniquePromptCount.toLocaleString()}</b>YouMind 唯一公开记录</span>
            <span><b>{liveIndex.sourceStats.youMindImages}</b>精选多图实效预览</span>
            <span><b>{curatedYouMindItems.filter((item) => item.author === "小小东").length}</b>小小东完整图文</span>
          </div>
        </div>

        <div className="hero-gallery" aria-label="精选真实生成效果">
          <div className="hero-halo" />
          {heroItems.map((item, index) => <button className={`hero-shot hero-shot-${index + 1}`} type="button" key={item.id} onClick={() => openItem(item)}><ResilientImage sources={item.imageUrls?.length ? item.imageUrls : [item.image]} alt={`${item.title}真实生成效果`} /><span><small>0{index + 1} · {sourceLabel(item)}</small><b>{item.title}</b></span></button>)}
          <div className="hero-orbit-note"><i />点击作品查看原图与完整提示词</div>
        </div>
      </section>

      <section className="ticker" aria-label="站点特点"><div><span>14K+ PUBLIC PROMPTS</span><span>ACTUAL GENERATED IMAGES</span><span>FULL PROMPTS ON SITE</span><span>XIAOXIAODONG IN THE SAME GRID</span><span>14K+ PUBLIC PROMPTS</span></div></section>

      <section className="library" id="gallery">
        <div className="section-intro"><div><span className="section-index">01 / UNIFIED PROMPT GALLERY</span><h2>效果图、提示词与来源，<br />全部使用同一种卡片。</h2></div><p>全量目录加载后共显示 {totalBrowsable.toLocaleString()} 条去重记录。小小东内容已经并入主图库；点击任意效果图即可在本站查看完整提示词与全部可用预览。</p></div>

        <div className={`index-status ${indexStatus}`}><i />{indexStatus === "loading" ? "正在装入 YouMind 14K+ 公开索引…" : indexStatus === "ready" ? `公开索引已就绪：${fullIndexSummary.uniquePromptCount.toLocaleString()} 条唯一记录` : "全量索引暂时未加载，当前仍可浏览精选与开源集合"}</div>

        <div className="glass-toolbar">
          <label className="search-field"><SearchIcon /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(36); }} placeholder="搜索标题、主题、作者或风格…" aria-label="搜索提示词案例" />{query && <button type="button" onClick={() => { setQuery(""); setVisibleLimit(36); }} aria-label="清空搜索">×</button>}</label>
          <select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setVisibleLimit(36); }} aria-label="排序方式"><option value="ppt">PPT / 小小东优先</option><option value="source">按来源序号</option><option value="title">按标题排序</option></select>
          <button className={onlyFavorites ? "favorite-toggle active" : "favorite-toggle"} type="button" onClick={() => { setOnlyFavorites((value) => !value); setVisibleLimit(36); }}><span>♥</span> 收藏 {favorites.length || ""}</button>
        </div>

        <div className="category-rail" aria-label="分类筛选">{categories.map((name) => <button className={category === name ? "active" : ""} type="button" key={name} onClick={() => { setCategory(name); setVisibleLimit(36); }}><span>{name}</span><i>{Number(counts[name] ?? 0).toLocaleString()}</i></button>)}</div>
        <div className="source-rail" aria-label="来源筛选"><small>SOURCE / 来源</small>{sourceModes.map((name) => <button className={source === name ? "active" : ""} type="button" key={name} onClick={() => { setSource(name); setVisibleLimit(36); if (name === "小小东") setCategory("全部"); }}>{name}<i>{Number(sourceCounts[name] ?? 0).toLocaleString()}</i></button>)}</div>
        <div className="result-line"><span>SHOWING {visibleItems.length.toLocaleString()} / {filtered.length.toLocaleString()}</span><span>{category} · {source}{query ? ` · “${query}”` : ""}</span></div>

        {filtered.length ? <>
          <div className="prompt-grid">
            {visibleItems.map((item) => {
              const favorite = favorites.includes(item.id);
              const images = item.imageUrls?.filter(Boolean).length ?? Number(Boolean(item.image));
              return <article className="prompt-card reveal-card" key={item.id} onPointerMove={moveSpotlight}>
                <button className="image-button" type="button" onClick={() => openItem(item)} aria-label={`查看${item.title}完整提示词`}>
                  <ResilientImage sources={item.imageUrls?.length ? item.imageUrls : [item.image]} alt={`${item.title}真实生成效果`} />
                  <span className="image-sheen" /><span className="image-badge">REAL OUTPUT</span>{images > 1 && <span className="image-count">{images} 张实图</span>}<span className="image-open">站内查看完整提示词 <ArrowIcon /></span>
                </button>
                <div className="card-body">
                  <div className="card-kicker"><span>{item.category}</span><i>{item.ratio}</i></div><span className="source-pill">{sourceLabel(item)}</span>
                  <h3>{item.title}</h3><p>{item.description}</p>
                  <div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
                  <div className="card-credit"><div><small>ORIGINAL SOURCE</small><b>{item.author}</b></div><a href={item.originalPostUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.author}的原始来源`}><SourceIcon /></a></div>
                  <div className="card-actions"><button type="button" onClick={() => handleCopy(item)}><CopyIcon />{copiedId === item.id ? "已复制" : "复制完整提示词"}</button><button className={favorite ? "heart active" : "heart"} type="button" onClick={() => toggleFavorite(item.id)} aria-label={favorite ? "取消收藏" : "收藏"}>♥</button></div>
                </div>
              </article>;
            })}
          </div>
          {visibleLimit < filtered.length && <button className="load-more" type="button" onClick={() => setVisibleLimit((value) => Math.min(value + 36, filtered.length))}>继续加载同类卡片 <span>+{Math.min(36, filtered.length - visibleLimit)}</span></button>}
        </> : <div className="empty-state"><span>NO MATCH</span><h3>没有找到对应作品</h3><p>换一个关键词，或重置来源与分类。</p><button type="button" onClick={() => { setQuery(""); setOnlyFavorites(false); setCategory("全部"); setSource("全部来源"); }}>重置筛选</button></div>}
      </section>

      <section className="source-section" id="sources">
        <div className="section-intro compact"><div><span className="section-index">02 / SOURCE MAP</span><h2>内容、字体与动画，<br />分别标清来源。</h2></div><p>完整提示词、真实效果图和 UI 参考各自保留出处。“公开可浏览”不等同于放弃版权，卡片详情始终附带来源与展示依据。</p></div>
        <div className="source-grid">{sourceLinks.map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" className="source-card reveal-card" key={item.title} onPointerMove={moveSpotlight}><span>0{index + 1}</span><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.copy}</p><i><SourceIcon /></i></a>)}</div>
      </section>

      <section className="rights-section" id="rights">
        <div className="rights-glass"><span className="section-index">03 / RIGHTS & TRANSPARENCY</span><h2>能公开验证多少，就准确展示多少。</h2><div className="rights-columns"><p><b>A · 公开数据范围：</b>YouMind 官方清单宣称 {fullIndexSummary.declaredTotalPrompts.toLocaleString()} 条；当前 11 个公开分类文件按 ID 去重后实际可验证 {fullIndexSummary.uniquePromptCount.toLocaleString()} 条，且均有提示词正文。分类会重叠，因此会员数合计不等于唯一条目数。</p><p><b>B · 获取与展示方式：</b>本站不破解 VIP、不调用隐藏接口、不抓取受限页面；只同步 YouMind 官方 GitHub 公开 JSON。效果图保留上游远程地址并自动尝试同条目的其他图片，不对外宣称拥有原图版权。</p></div><p className="youmind-credit">提示词由 <a href="https://youmind.com" target="_blank" rel="noreferrer">YouMind.com</a> 通过公开社区搜集 ❤️</p><div className="license-row"><a href={fullIndexSummary.source} target="_blank" rel="noreferrer">YouMind 公开索引 <SourceIcon /></a><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 <SourceIcon /></a><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0 <SourceIcon /></a><a href="https://github.com/JCodesMore/ai-website-cloner-template/blob/main/LICENSE" target="_blank" rel="noreferrer">JCodesMore MIT <SourceIcon /></a><a href="https://github.com/lin351540-ship-it/prompt-atlas-jj" target="_blank" rel="noreferrer">本站仓库 <SourceIcon /></a></div></div>
      </section>

      <footer><div className="brand"><span className="brand-glyph">P</span><span><b>Prompt Atlas</b><small>REAL OUTPUT LIBRARY</small></span></div><p>{totalBrowsable.toLocaleString()} 组可浏览记录 · 小小东已并入统一卡片流 · 完整提示词站内读取</p><a href="#top">返回顶部 ↑</a></footer>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        <section className="prompt-modal" role="dialog" aria-modal="true" aria-label={`${selected.title}完整提示词`}>
          <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="关闭">×</button>
          <div className="modal-visual">
            <ResilientImage key={selectedImages[selectedImage] ?? selected.id} sources={selectedImages.length ? [selectedImages[selectedImage], ...selectedImages.filter((_, index) => index !== selectedImage)] : []} alt={`${selected.title}真实生成效果 ${selectedImage + 1}`} />
            <div className="modal-caption"><span>ACTUAL GENERATED OUTPUT · {selectedImages.length ? selectedImage + 1 : 0}/{selectedImages.length}</span><b>{selected.ratio}</b></div>
            {selectedImages.length > 1 && <div className="modal-thumbs" aria-label="切换真实效果图">{selectedImages.map((image, index) => <button className={selectedImage === index ? "active" : ""} type="button" key={image} onClick={() => setSelectedImage(index)}><ResilientImage sources={[image]} alt={`效果图 ${index + 1}`} /></button>)}</div>}
          </div>
          <div className="modal-content">
            <div className="modal-tags"><span>{selected.category}</span><i>{sourceLabel(selected)}</i>{selected.tags.map((tag) => <i key={tag}>{tag}</i>)}</div>
            <h2>{selected.title}</h2><p className="original-title">{selected.originalTitle}</p>
            <div className="prompt-heading"><span>完整原提示词</span><button type="button" disabled={promptLoading} onClick={() => handleCopy(selected)}><CopyIcon />{promptLoading ? "读取中…" : copiedId === selected.id ? "已复制" : "一键复制"}</button></div>
            <pre className={promptLoading ? "is-loading" : ""}>{promptLoading ? "正在从本站分片读取完整提示词…" : selected.prompt}</pre>
            <dl><div><dt>原始来源</dt><dd>{selected.author}{selected.authorHandle ? ` · @${selected.authorHandle}` : ""}</dd></div><div><dt>内容集合</dt><dd>{selected.collectionName}</dd></div><div><dt>许可 / 展示依据</dt><dd>{selected.promptLicense}</dd></div><div><dt>修改说明</dt><dd>{selected.modificationNote}</dd></div></dl>
            <div className="modal-links"><a href={selected.originalPostUrl} target="_blank" rel="noreferrer">查看来源 <SourceIcon /></a><a href={selected.repositoryUrl} target="_blank" rel="noreferrer">公开仓库 <SourceIcon /></a>{selected.landingUrl && <a href={selected.landingUrl} target="_blank" rel="noreferrer">来源详情 <SourceIcon /></a>}<a href={selected.promptLicenseUrl} target="_blank" rel="noreferrer">展示依据 <SourceIcon /></a></div>
            <p className="attribution">{selected.attributionText}</p>
          </div>
        </section>
      </div>}
    </main>
  );
}
