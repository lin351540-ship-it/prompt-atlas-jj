"use client";

/* eslint-disable @next/next/no-img-element -- static export mixes self-hosted and source-hosted preview assets */

import { useEffect, useMemo, useState } from "react";
import localPromptData from "./data/prompt-items.json";
import liveIndex from "./data/live-index.json";

type CatalogItem = {
  id: string;
  index: number;
  title: string;
  originalTitle: string;
  description: string;
  category: string;
  sourceCategory: string;
  ratio: string;
  prompt: string;
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

type XSourceItem = {
  id: string;
  title: string;
  summary: string;
  author: string;
  sourceUrl: string;
  category: string;
  syncMethod: string;
};

type SortMode = "ppt" | "source" | "title";
type SourceMode = "全部来源" | "小小东" | "YouMind OpenLab" | "PPT 开源集" | "其他开源集";

const localPromptItems = localPromptData as CatalogItem[];
const publicPromptItems = liveIndex.items.filter((item) => item.syncMethod === "github-public-full-record") as unknown as CatalogItem[];
const catalogItems = [...publicPromptItems, ...localPromptItems];
const xSourceItems = liveIndex.items.filter((item) => item.syncMethod === "editorial-link") as unknown as XSourceItem[];
const categories = ["全部", "PPT / 信息图", "海报设计", "社媒 / 品牌", "UI / 产品", "人像摄影", "插画 / 漫画", "实验 / 对比", "创意发现"] as const;
const sourceModes: SourceMode[] = ["全部来源", "小小东", "YouMind OpenLab", "PPT 开源集", "其他开源集"];

const sourceLinks = [
  {
    eyebrow: "PUBLIC FULL RECORDS · CC BY 4.0",
    title: "YouMind OpenLab · GPT Image 2",
    copy: `${liveIndex.sourceStats.youMindCompleteRecords} 条公开完整提示词、${liveIndex.sourceStats.youMindImages} 张真实效果图，均从公开 GitHub README 自动解析。`,
    url: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
  },
  {
    eyebrow: "LICENSED CONTENT · CC BY 4.0",
    title: "ToseaAI · Awesome GPT Image 2 Prompts",
    copy: "54 组真实效果图与完整原提示词，并保留逐条原作者链接。",
    url: "https://github.com/ToseaAI/awesome-gpt-image-2-prompts",
  },
  {
    eyebrow: "LICENSED CONTENT · CC BY 4.0",
    title: "ApiMartAI · Best GPT Image 2 Prompts",
    copy: "通过风险筛选的真实生成效果与提示词，逐条保留原作者和原帖。",
    url: "https://github.com/ApiMartAI/best-gpt-image-2-prompts",
  },
  {
    eyebrow: "PPT SOURCE · APACHE-2.0",
    title: "2slides · Nano Banana PPT Prompts",
    copy: "22 组含完整提示词的 PPT / 信息图案例，强化演示设计专区。",
    url: "https://github.com/2slides/awesome-nano-banana-ppt-prompts",
  },
  {
    eyebrow: "OFFICIAL EMBED · X",
    title: "小小东 · 公开 X 原帖",
    copy: "结构化公开记录进入主图库；其他帖子只通过 X 官方组件展示真实图文，不下载媒体。",
    url: "https://x.com/xiaoxiaodong01",
  },
  {
    eyebrow: "MOTION SYSTEM · LICENSED FOR WEBSITES",
    title: "React Bits · Motion Reference",
    copy: "采用 SpotlightCard、AnimatedContent 与 Masonry 的交互语言，并保留完整许可致谢。",
    url: "https://github.com/DavidHDev/react-bits",
  },
] as const;

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

function sourceMatches(item: CatalogItem, source: SourceMode) {
  if (source === "全部来源") return true;
  if (source === "小小东") return item.author === "小小东" || item.authorHandle.toLowerCase() === "xiaoxiaodong01";
  if (source === "YouMind OpenLab") return item.syncMethod === "github-public-full-record";
  if (source === "PPT 开源集") return item.collectionName.includes("2slides");
  return item.syncMethod !== "github-public-full-record" && !item.collectionName.includes("2slides");
}

function sourceLabel(item: CatalogItem) {
  if (item.author === "小小东" || item.authorHandle.toLowerCase() === "xiaoxiaodong01") return "小小东 · YouMind";
  if (item.syncMethod === "github-public-full-record") return "YouMind OpenLab";
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
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
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
  const [category, setCategory] = useState<(typeof categories)[number]>("PPT / 信息图");
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [xLimit, setXLimit] = useState(4);

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
    }, { rootMargin: "120px 0px", threshold: 0.05 });
    cards.forEach((card, index) => {
      card.style.setProperty("--reveal-delay", `${Math.min(index % 12, 7) * 38}ms`);
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, [category, query, source, onlyFavorites, sort, xLimit]);

  useEffect(() => {
    const existing = document.getElementById("x-widgets-script") as HTMLScriptElement | null;
    if (existing) {
      window.setTimeout(() => (window as typeof window & { twttr?: { widgets?: { load: () => void } } }).twttr?.widgets?.load(), 0);
      return;
    }
    const script = document.createElement("script");
    script.id = "x-widgets-script";
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, [xLimit]);

  const counts = useMemo(
    () => Object.fromEntries(categories.map((name) => [name, name === "全部" ? catalogItems.length : catalogItems.filter((item) => item.category === name).length])),
    [],
  );

  const sourceCounts = useMemo(() => Object.fromEntries(sourceModes.map((name) => [name, catalogItems.filter((item) => sourceMatches(item, name)).length])), []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = catalogItems.filter((item) => {
      if (category !== "全部" && item.category !== category) return false;
      if (!sourceMatches(item, source)) return false;
      if (onlyFavorites && !favorites.includes(item.id)) return false;
      if (!keyword) return true;
      return [item.title, item.originalTitle, item.description, item.prompt, item.author, item.category, item.collectionName, ...item.tags]
        .join(" ").toLowerCase().includes(keyword);
    });
    return [...result].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "zh-CN");
      if (sort === "source") return a.index - b.index;
      return Number(b.category === "PPT / 信息图") - Number(a.category === "PPT / 信息图") || Number(b.author === "小小东") - Number(a.author === "小小东") || Number(b.featured) - Number(a.featured) || a.index - b.index;
    });
  }, [category, favorites, onlyFavorites, query, sort, source]);

  const heroItems = useMemo(() => [
    publicPromptItems.find((item) => item.author === "小小东" && item.category === "PPT / 信息图"),
    localPromptItems.find((item) => item.id.startsWith("2slides-")),
    publicPromptItems.find((item) => item.featured && item.category === "PPT / 信息图"),
  ].filter(Boolean) as CatalogItem[], []);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("prompt-atlas-real-favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleCopy = async (item: CatalogItem) => {
    await copyText(item.prompt);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1700);
  };

  const openItem = (item: CatalogItem) => {
    setSelectedImage(0);
    setSelected(item);
  };

  const chooseSource = (name: SourceMode) => {
    setSource(name);
    if (name === "小小东") setCategory("全部");
  };

  const selectedImages = selected ? (selected.imageUrls?.length ? selected.imageUrls : [selected.image]) : [];

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="glass-nav" aria-label="主导航">
        <a className="brand" href="#top" aria-label="Prompt Atlas 首页"><span className="brand-glyph">P</span><span><b>Prompt Atlas</b><small>REAL OUTPUT LIBRARY</small></span></a>
        <nav><a href="#gallery">真实图库</a><a href="#x-posts">小小东原帖</a><a href="#sources">来源</a><a href="#rights">授权说明</a></nav>
        <a className="nav-cta" href="#gallery">开始浏览 <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="signal"><i /> 真实效果图 · 完整提示词 · 可追溯来源</div>
          <h1>所有公开图文，<br /><span>放进同一座提示词美术馆。</span></h1>
          <p>小小东、YouMind OpenLab 与优质开源集合统一进入瀑布流：先看真实生成效果，再复制完整提示词。没有公开图文的数据，不用示意图冒充。</p>
          <div className="hero-actions"><a className="glass-button primary" href="#gallery">查看 {catalogItems.length} 组真实案例 <ArrowIcon /></a><a className="quiet-link" href="#x-posts">浏览小小东官方嵌入</a></div>
          <div className="proof-row">
            <span><b>{counts["PPT / 信息图"]}</b>PPT / 信息图</span>
            <span><b>{publicPromptItems.filter((item) => item.author === "小小东").length}</b>小小东完整图文</span>
            <span><b>{liveIndex.sourceStats.youMindImages}</b>YouMind 公开效果图</span>
          </div>
        </div>

        <div className="hero-gallery" aria-label="精选真实生成效果">
          <div className="hero-halo" />
          {heroItems.map((item, index) => (
            <button className={`hero-shot hero-shot-${index + 1}`} type="button" key={item.id} onClick={() => openItem(item)}>
              <img src={item.image} alt={`${item.title}真实生成效果`} referrerPolicy="no-referrer" />
              <span><small>0{index + 1} · {sourceLabel(item)}</small><b>{item.title}</b></span>
            </button>
          ))}
          <div className="hero-orbit-note"><i />点击作品查看全部原图与完整提示词</div>
        </div>
      </section>

      <section className="ticker" aria-label="站点特点"><div><span>ACTUAL GENERATED IMAGES</span><span>FULL ORIGINAL PROMPTS</span><span>XIAOXIAODONG COLLECTION</span><span>PUBLIC GITHUB SYNC</span><span>ACTUAL GENERATED IMAGES</span><span>FULL ORIGINAL PROMPTS</span></div></section>

      <section className="library" id="gallery">
        <div className="section-intro">
          <div><span className="section-index">01 / UNIFIED REAL GALLERY</span><h2>小小东也在这里。<br />同样的卡片，同样能复制。</h2></div>
          <p>主图库现已合并 {publicPromptItems.length} 条 YouMind GitHub 完整记录；其中小小东 {publicPromptItems.filter((item) => item.author === "小小东").length} 条。点击效果图可查看同一条提示词的全部真实输出。</p>
        </div>

        <div className="glass-toolbar">
          <label className="search-field"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索主题、作者、风格或完整提示词…" aria-label="搜索提示词" />{query && <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">×</button>}</label>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="排序方式"><option value="ppt">PPT / 小小东优先</option><option value="source">按来源序号</option><option value="title">按标题排序</option></select>
          <button className={onlyFavorites ? "favorite-toggle active" : "favorite-toggle"} type="button" onClick={() => setOnlyFavorites((value) => !value)}><span>♥</span> 收藏 {favorites.length || ""}</button>
        </div>

        <div className="category-rail" aria-label="分类筛选">
          {categories.map((name) => <button className={category === name ? "active" : ""} type="button" key={name} onClick={() => setCategory(name)}><span>{name}</span><i>{String(counts[name]).padStart(2, "0")}</i></button>)}
        </div>

        <div className="source-rail" aria-label="来源筛选">
          <small>SOURCE / 来源</small>
          {sourceModes.map((name) => <button className={source === name ? "active" : ""} type="button" key={name} onClick={() => chooseSource(name)}>{name}<i>{sourceCounts[name]}</i></button>)}
        </div>

        <div className="result-line"><span>SHOWING {String(filtered.length).padStart(2, "0")} / {catalogItems.length}</span><span>{category} · {source}{query ? ` · “${query}”` : ""}</span></div>

        {filtered.length ? (
          <div className="prompt-grid">
            {filtered.map((item) => {
              const favorite = favorites.includes(item.id);
              const images = item.imageUrls?.length ?? 1;
              return (
                <article className="prompt-card reveal-card" key={item.id} onPointerMove={moveSpotlight}>
                  <button className="image-button" type="button" onClick={() => openItem(item)} aria-label={`查看${item.title}完整提示词`}>
                    <img src={item.image} alt={`${item.title}真实生成效果`} loading="lazy" referrerPolicy="no-referrer" />
                    <span className="image-sheen" /><span className="image-badge">REAL OUTPUT</span>
                    {images > 1 && <span className="image-count">{images} 张实图</span>}
                    <span className="image-open">查看完整提示词 <ArrowIcon /></span>
                  </button>
                  <div className="card-body">
                    <div className="card-kicker"><span>{item.category}</span><i>{item.ratio}</i></div>
                    <span className="source-pill">{sourceLabel(item)}</span>
                    <h3>{item.title}</h3><p>{item.description}</p>
                    <div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
                    <div className="card-credit"><div><small>ORIGINAL AUTHOR</small><b>{item.author}</b></div><a href={item.originalPostUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.author}的原始来源`}><SourceIcon /></a></div>
                    <div className="card-actions"><button type="button" onClick={() => handleCopy(item)}><CopyIcon />{copiedId === item.id ? "已复制" : "复制完整提示词"}</button><button className={favorite ? "heart active" : "heart"} type="button" onClick={() => toggleFavorite(item.id)} aria-label={favorite ? "取消收藏" : "收藏"}>♥</button></div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="empty-state"><span>NO MATCH</span><h3>没有找到对应作品</h3><p>换一个关键词，或重置来源与分类。</p><button type="button" onClick={() => { setQuery(""); setOnlyFavorites(false); setCategory("全部"); setSource("全部来源"); }}>重置筛选</button></div>}
      </section>

      <section className="x-section" id="x-posts">
        <div className="section-intro compact">
          <div><span className="section-index">02 / OFFICIAL X EMBEDS</span><h2>其余小小东内容，<br />由 X 原样呈现。</h2></div>
          <p>这些帖子尚未出现在 YouMind 的 126 条公开完整记录中，因此不下载图片、不伪造提示词；只使用 X 官方组件展示原帖文字与真实媒体。加载 X 内容会向 X 发起网络请求。</p>
        </div>

        <div className="live-stats" aria-label="公开数据范围">
          <span><small>UPSTREAM DIRECTORY</small><b>{liveIndex.sourceStats.youMindTotal.toLocaleString()}</b><i>上游统计，不冒充本站已收录</i></span>
          <span><small>PUBLIC FULL RECORDS</small><b>{liveIndex.sourceStats.youMindCompleteRecords}</b><i>仓库当前可验证完整条目</i></span>
          <span><small>REAL OUTPUTS</small><b>{liveIndex.sourceStats.youMindImages}</b><i>GitHub 清单所列真实效果图</i></span>
          <span><small>X EMBEDS</small><b>{xSourceItems.length}</b><i>小小东公开原帖入口</i></span>
        </div>

        <div className="x-embed-grid">
          {xSourceItems.slice(0, xLimit).map((item) => (
            <article className="x-embed-shell reveal-card" key={item.id} onPointerMove={moveSpotlight}>
              <div className="x-embed-label"><span>{item.category}</span><b>{item.title}</b></div>
              <blockquote className="twitter-tweet" data-dnt="true" data-theme="light" data-conversation="none"><a href={item.sourceUrl}>查看小小东公开原帖：{item.title}</a></blockquote>
              <noscript><a href={item.sourceUrl}>在 X 查看真实图文</a></noscript>
            </article>
          ))}
        </div>
        {xLimit < xSourceItems.length && <button className="load-more" type="button" onClick={() => setXLimit((value) => Math.min(value + 4, xSourceItems.length))}>加载更多 X 官方原帖 <span>+{Math.min(4, xSourceItems.length - xLimit)}</span></button>}
      </section>

      <section className="source-section" id="sources">
        <div className="section-intro compact"><div><span className="section-index">03 / SOURCE MAP</span><h2>内容来源与动画来源，<br />分别写清楚。</h2></div><p>完整提示词、真实效果图、X 官方嵌入和 UI 动画都保留各自出处，不把“能看到”写成“可任意搬运”。</p></div>
        <div className="source-grid">{sourceLinks.map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" className="source-card reveal-card" key={item.title} onPointerMove={moveSpotlight}><span>0{index + 1}</span><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.copy}</p><i><SourceIcon /></i></a>)}</div>
      </section>

      <section className="rights-section" id="rights">
        <div className="rights-glass"><span className="section-index">04 / RIGHTS & TRANSPARENCY</span><h2>能公开验证多少，就明确展示多少。</h2><div className="rights-columns"><p><b>A · 已进入主图库：</b>本地三个许可明确的开源集合，加上 YouMind OpenLab 公开 GitHub README 中 {liveIndex.sourceStats.youMindCompleteRecords} 条完整记录。YouMind 图片保持来源远程地址，提示词不改写。</p><p><b>B · 没有伪装成全量：</b>14,106 是 YouMind 私有 CMS 的上游统计，公开仓库当前只输出 126 条；本站不破解 VIP、不调用隐藏接口，也不抓取 X 图片。小小东其余帖子使用官方 Embed。</p></div><div className="license-row"><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 <SourceIcon /></a><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0 <SourceIcon /></a><a href="https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md" target="_blank" rel="noreferrer">React Bits License <SourceIcon /></a><a href="https://github.com/lin351540-ship-it/prompt-atlas-jj" target="_blank" rel="noreferrer">本站仓库 <SourceIcon /></a></div></div>
      </section>

      <footer><div className="brand"><span className="brand-glyph">P</span><span><b>Prompt Atlas</b><small>REAL OUTPUT LIBRARY</small></span></div><p>{catalogItems.length} 组完整图文 · {liveIndex.sourceStats.youMindImages} 张 YouMind 实图 · {xSourceItems.length} 条 X 官方嵌入 · 来源可追溯</p><a href="#top">返回顶部 ↑</a></footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="prompt-modal" role="dialog" aria-modal="true" aria-label={`${selected.title}完整提示词`}>
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="关闭">×</button>
            <div className="modal-visual">
              <img src={selectedImages[selectedImage]} alt={`${selected.title}真实生成效果 ${selectedImage + 1}`} referrerPolicy="no-referrer" />
              <div className="modal-caption"><span>ACTUAL GENERATED OUTPUT · {selectedImage + 1}/{selectedImages.length}</span><b>{selected.ratio}</b></div>
              {selectedImages.length > 1 && <div className="modal-thumbs" aria-label="切换真实效果图">{selectedImages.map((image, index) => <button className={selectedImage === index ? "active" : ""} type="button" key={image} onClick={() => setSelectedImage(index)}><img src={image} alt={`效果图 ${index + 1}`} loading="lazy" referrerPolicy="no-referrer" /></button>)}</div>}
            </div>
            <div className="modal-content">
              <div className="modal-tags"><span>{selected.category}</span><i>{sourceLabel(selected)}</i>{selected.tags.map((tag) => <i key={tag}>{tag}</i>)}</div>
              <h2>{selected.title}</h2><p className="original-title">{selected.originalTitle}</p>
              <div className="prompt-heading"><span>完整原提示词</span><button type="button" onClick={() => handleCopy(selected)}><CopyIcon />{copiedId === selected.id ? "已复制" : "一键复制"}</button></div>
              <pre>{selected.prompt}</pre>
              <dl><div><dt>原作者</dt><dd>{selected.author}{selected.authorHandle ? ` · @${selected.authorHandle}` : ""}</dd></div><div><dt>内容集合</dt><dd>{selected.collectionName}</dd></div><div><dt>许可 / 展示依据</dt><dd>{selected.promptLicense}</dd></div><div><dt>修改说明</dt><dd>{selected.modificationNote}</dd></div></dl>
              <div className="modal-links"><a href={selected.originalPostUrl} target="_blank" rel="noreferrer">查看原帖 <SourceIcon /></a><a href={selected.repositoryUrl} target="_blank" rel="noreferrer">公开仓库 <SourceIcon /></a>{selected.landingUrl && <a href={selected.landingUrl} target="_blank" rel="noreferrer">来源详情 <SourceIcon /></a>}<a href={selected.promptLicenseUrl} target="_blank" rel="noreferrer">许可原文 <SourceIcon /></a></div>
              <p className="attribution">{selected.attributionText}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
