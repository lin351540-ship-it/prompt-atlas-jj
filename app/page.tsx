"use client";

/* eslint-disable @next/next/no-img-element -- static GitHub Pages export uses self-hosted source assets */

import { useEffect, useMemo, useState } from "react";
import promptItems from "./data/prompt-items.json";
import liveIndex from "./data/live-index.json";

type PromptItem = (typeof promptItems)[number];
type LiveItem = (typeof liveIndex.items)[number];
type SortMode = "ppt" | "source" | "title";

const categories = ["全部", "PPT / 信息图", "海报设计", "社媒 / 品牌", "UI / 产品", "人像摄影", "插画 / 漫画", "实验 / 对比"] as const;
const discoveryTabs = ["全部", "PPT / 信息图", "小小东", "YouMind / X"] as const;

const sourceLinks = [
  {
    eyebrow: "LAYOUT REFERENCE",
    title: "YouMind · GPT Image 2 Prompts",
    copy: "参考其真实作品优先、卡片浏览与详情阅读路径；本站不复制其付费内容。",
    url: "https://youmind.com/zh-CN/gpt-image-2-prompts",
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
    copy: "22 组含完整提示词的 PPT / 信息图案例，作为本站演示设计专区的重要补充。",
    url: "https://github.com/2slides/awesome-nano-banana-ppt-prompts",
  },
  {
    eyebrow: "PUBLIC DISCOVERY · SOURCE LINK ONLY",
    title: "YouMind OpenLab · GitHub Mirror",
    copy: "只同步公开 GitHub 镜像中的标题、摘要与原帖入口；不抓取 YouMind 网站或隐藏接口。",
    url: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
  },
  {
    eyebrow: "MOTION RESEARCH",
    title: "Transitions.dev",
    copy: "参考卡片缩放、数字弹入、弹窗过渡与分段切换的行为语言，本站动画为独立 CSS 实现。",
    url: "https://transitions.dev/",
  },
] as const;

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.6" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function DiscoveryCard({ item }: { item: LiveItem }) {
  return (
    <article className="discovery-card">
      <div className={`discovery-visual theme-${item.previewTheme}`} aria-label={`${item.title}版权安全示意预览`}>
        <div className="visual-grid" />
        <span className="visual-orb orb-a" />
        <span className="visual-orb orb-b" />
        <div className="visual-copy"><small>ILLUSTRATIVE PREVIEW</small><b>{item.category}</b><strong>{item.title}</strong></div>
        <div className="visual-panels"><i /><i /><i /></div>
      </div>
      <div className="discovery-body">
        <div className="discovery-kicker"><span>{item.sourcePlatform}</span><i>{item.rightsMode === "source-link-only" ? "仅索引" : item.rightsMode}</i></div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="discovery-credit">
          <div><small>PUBLIC SOURCE</small><b>{item.author}</b><span>{item.origin}</span></div>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">查看公开来源 <SourceIcon /></a>
        </div>
      </div>
    </article>
  );
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("ppt");
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("prompt-atlas-real-favorites") ?? "[]");
    } catch {
      return [];
    }
  });
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selected, setSelected] = useState<PromptItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [discoveryTab, setDiscoveryTab] = useState<(typeof discoveryTabs)[number]>("PPT / 信息图");
  const [discoveryLimit, setDiscoveryLimit] = useState(18);

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

  const counts = useMemo(
    () => Object.fromEntries(categories.map((name) => [name, name === "全部" ? promptItems.length : promptItems.filter((item) => item.category === name).length])),
    [],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = promptItems.filter((item) => {
      if (category !== "全部" && item.category !== category) return false;
      if (onlyFavorites && !favorites.includes(item.id)) return false;
      if (!keyword) return true;
      return [item.title, item.originalTitle, item.description, item.prompt, item.author, item.category, ...item.tags]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
    return [...result].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "zh-CN");
      if (sort === "source") return a.index - b.index;
      return Number(b.category === "PPT / 信息图") - Number(a.category === "PPT / 信息图") || Number(b.featured) - Number(a.featured) || a.index - b.index;
    });
  }, [category, favorites, onlyFavorites, query, sort]);

  const heroItems = useMemo(
    () => [
      promptItems.find((item) => item.id.startsWith("2slides-")),
      promptItems.find((item) => item.index === 3),
      promptItems.find((item) => item.index === 17),
    ].filter(Boolean) as PromptItem[],
    [],
  );

  const discoveryItems = useMemo(() => {
    if (discoveryTab === "全部") return liveIndex.items;
    if (discoveryTab === "小小东") return liveIndex.items.filter((item) => item.author === "小小东");
    if (discoveryTab === "YouMind / X") return liveIndex.items.filter((item) => item.syncMethod === "github-public-mirror");
    return liveIndex.items.filter((item) => item.category === discoveryTab);
  }, [discoveryTab]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("prompt-atlas-real-favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleCopy = async (item: PromptItem) => {
    await copyText(item.prompt);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1700);
  };

  return (
    <main>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="glass-nav" aria-label="主导航">
        <a className="brand" href="#top" aria-label="Prompt Atlas 首页">
          <span className="brand-glyph">P</span>
          <span><b>Prompt Atlas</b><small>REAL OUTPUT LIBRARY</small></span>
        </a>
        <nav>
          <a href="#gallery">作品库</a>
          <a href="#discovery">实时发现</a>
          <a href="#sources">来源</a>
          <a href="#rights">授权说明</a>
        </nav>
        <a className="nav-cta" href="#gallery">开始浏览 <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="signal"><i /> 授权案例 · 公开发现 · 可追溯来源</div>
          <h1>先看效果。<br /><span>再找到真正可用的提示词。</span></h1>
          <p>为 PPT、信息图、海报与产品视觉整理的成熟案例库：授权专区展示真实生成图和完整提示词；发现专区持续补充 YouMind GitHub 镜像与 X 公开原帖入口。</p>
          <div className="hero-actions">
            <a className="glass-button primary" href="#gallery">查看 {promptItems.length} 组真实案例 <ArrowIcon /></a>
            <a className="quiet-link" href="#discovery">浏览 {liveIndex.items.length} 条公开发现</a>
          </div>
          <div className="proof-row">
            <span><b>{counts["PPT / 信息图"]}</b>PPT / 信息图实图</span>
            <span><b>{new Set(promptItems.map((item) => item.author)).size}</b>位原作者</span>
            <span><b>{liveIndex.sourceStats.youMindTotal.toLocaleString()}</b>YouMind 上游目录</span>
          </div>
        </div>

        <div className="hero-gallery" aria-label="精选真实生成效果">
          <div className="hero-halo" />
          {heroItems.map((item, index) => (
            <button className={`hero-shot hero-shot-${index + 1}`} type="button" key={item.id} onClick={() => setSelected(item)}>
              <img src={item.image} alt={`${item.title}真实生成效果`} />
              <span><small>0{index + 1} · REAL OUTPUT</small><b>{item.title}</b></span>
            </button>
          ))}
          <div className="hero-orbit-note"><i />点击作品查看完整提示词</div>
        </div>
      </section>

      <section className="ticker" aria-label="站点特点">
        <div><span>ACTUAL GENERATED IMAGES</span><span>ORIGINAL PROMPTS</span><span>PUBLIC DISCOVERY INDEX</span><span>SOURCE-LEVEL RIGHTS</span><span>ACTUAL GENERATED IMAGES</span><span>ORIGINAL PROMPTS</span></div>
      </section>

      <section className="library" id="gallery">
        <div className="section-intro">
          <div>
            <span className="section-index">01 / CURATED GALLERY</span>
            <h2>从效果图，反查<br />可复制的完整提示词。</h2>
          </div>
          <p>默认优先显示 PPT / 信息图。点击任意作品即可查看完整提示词、原作者、原帖与许可信息。</p>
        </div>

        <div className="glass-toolbar">
          <label className="search-field">
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索主题、作者、风格或提示词…" aria-label="搜索提示词" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">×</button>}
          </label>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="排序方式">
            <option value="ppt">PPT 优先</option>
            <option value="source">按来源序号</option>
            <option value="title">按标题排序</option>
          </select>
          <button className={onlyFavorites ? "favorite-toggle active" : "favorite-toggle"} type="button" onClick={() => setOnlyFavorites((value) => !value)}>
            <span>♥</span> 收藏 {favorites.length || ""}
          </button>
        </div>

        <div className="category-rail" aria-label="分类筛选">
          {categories.map((name) => (
            <button className={category === name ? "active" : ""} type="button" key={name} onClick={() => setCategory(name)}>
              <span>{name}</span><i>{String(counts[name]).padStart(2, "0")}</i>
            </button>
          ))}
        </div>

        <div className="result-line">
          <span>SHOWING {String(filtered.length).padStart(2, "0")} / {promptItems.length}</span>
          <span>{category}{query ? ` · “${query}”` : ""}</span>
        </div>

        {filtered.length ? (
          <div className="prompt-grid">
            {filtered.map((item) => {
              const favorite = favorites.includes(item.id);
              return (
                <article className="prompt-card" key={item.id}>
                  <button className="image-button" type="button" onClick={() => setSelected(item)} aria-label={`查看${item.title}完整提示词`}>
                    <img src={item.image} alt={`${item.title}真实生成效果`} loading="lazy" />
                    <span className="image-sheen" />
                    <span className="image-badge">REAL OUTPUT</span>
                    <span className="image-open">查看完整提示词 <ArrowIcon /></span>
                  </button>
                  <div className="card-body">
                    <div className="card-kicker"><span>{item.category}</span><i>{item.ratio}</i></div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
                    <div className="card-credit">
                      <div><small>ORIGINAL AUTHOR</small><b>{item.author}</b></div>
                      <a href={item.originalPostUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.author}的原始来源`}><SourceIcon /></a>
                    </div>
                    <div className="card-actions">
                      <button type="button" onClick={() => handleCopy(item)}><CopyIcon />{copiedId === item.id ? "已复制" : "复制提示词"}</button>
                      <button className={favorite ? "heart active" : "heart"} type="button" onClick={() => toggleFavorite(item.id)} aria-label={favorite ? "取消收藏" : "收藏"}>♥</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><span>NO MATCH</span><h3>没有找到对应作品</h3><p>换一个关键词，或关闭“只看收藏”。</p><button type="button" onClick={() => { setQuery(""); setOnlyFavorites(false); setCategory("全部"); }}>重置筛选</button></div>
        )}
      </section>

      <section className="discovery-section" id="discovery">
        <div className="section-intro compact discovery-intro">
          <div>
            <span className="section-index">02 / LIVE DISCOVERY</span>
            <h2>公开灵感持续增长，<br />但权利边界始终可见。</h2>
          </div>
          <p>YouMind 网站不做爬取。本站每 6 小时读取其公开 GitHub 镜像的标题、摘要和原帖入口；X 条目为人工核对的公开链接。下方预览均为本站示意构图，不冒充原作者生成图。</p>
        </div>

        <div className="live-stats" aria-label="公开索引同步状态">
          <span><small>UPSTREAM CATALOG</small><b>{liveIndex.sourceStats.youMindTotal.toLocaleString()}</b><i>YouMind 镜像公布总量</i></span>
          <span><small>INDEXED HERE</small><b>{liveIndex.items.length}</b><i>本站当前公开入口</i></span>
          <span><small>PPT DISCOVERY</small><b>{liveIndex.items.filter((item) => item.category === "PPT / 信息图").length}</b><i>PPT / 信息图线索</i></span>
          <span><small>X EDITORIAL</small><b>{liveIndex.sourceStats.xEditorialLinks}</b><i>小小东公开原帖</i></span>
        </div>

        <div className="discovery-toolbar">
          <div className="discovery-tabs" aria-label="公开发现筛选">
            {discoveryTabs.map((name) => (
              <button type="button" className={discoveryTab === name ? "active" : ""} key={name} onClick={() => { setDiscoveryTab(name); setDiscoveryLimit(18); }}>
                {name}
              </button>
            ))}
          </div>
          <span>{Math.min(discoveryLimit, discoveryItems.length)} / {discoveryItems.length} · {liveIndex.status === "fresh" ? "本轮同步成功" : "使用上次成功快照"}</span>
        </div>

        <div className="discovery-grid">
          {discoveryItems.slice(0, discoveryLimit).map((item) => <DiscoveryCard item={item} key={item.id} />)}
        </div>

        {discoveryLimit < discoveryItems.length && (
          <button className="load-more" type="button" onClick={() => setDiscoveryLimit((value) => value + 18)}>
            加载更多公开来源 <span>+{Math.min(18, discoveryItems.length - discoveryLimit)}</span>
          </button>
        )}
      </section>

      <section className="source-section" id="sources">
        <div className="section-intro compact">
          <div><span className="section-index">03 / SOURCE MAP</span><h2>参考设计，尊重来源。</h2></div>
          <p>布局灵感、内容资产与 UI 技术分别标注，不把“公开可见”误写成“可以随意搬运”。</p>
        </div>
        <div className="source-grid">
          {sourceLinks.map((source, index) => (
            <a href={source.url} target="_blank" rel="noreferrer" className="source-card" key={source.title}>
              <span>0{index + 1}</span><small>{source.eyebrow}</small><h3>{source.title}</h3><p>{source.copy}</p><i><SourceIcon /></i>
            </a>
          ))}
        </div>
      </section>

      <section className="rights-section" id="rights">
        <div className="rights-glass">
          <span className="section-index">04 / RIGHTS & TRANSPARENCY</span>
          <h2>开放收集，不等于来源消失。</h2>
          <div className="rights-columns">
            <p><b>A · 授权展示：</b>ToseaAI、ApiMartAI 与 2slides 三个明确许可集合，可展示完整提示词和仓库配套的真实效果图。每条记录保留作者、原帖、仓库、许可与修改说明。</p>
            <p><b>B · 公开索引：</b>YouMind GitHub 镜像与 X 原帖只展示短摘要、本站示意预览和来源链接，不下载第三方图片、不复制长提示词。本站不破解 VIP、不绕过权限，也不抓取 YouMind 网站或 X 页面。</p>
          </div>
          <div className="license-row"><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 <SourceIcon /></a><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0 <SourceIcon /></a><a href="https://github.com/lin351540-ship-it/prompt-atlas-jj" target="_blank" rel="noreferrer">查看本站仓库 <SourceIcon /></a></div>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-glyph">P</span><span><b>Prompt Atlas</b><small>REAL OUTPUT LIBRARY</small></span></div>
        <p>{promptItems.length} 组真实案例 · {liveIndex.items.length} 条公开索引 · 原作者署名 · 权利分层</p>
        <a href="#top">返回顶部 ↑</a>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="prompt-modal" role="dialog" aria-modal="true" aria-label={`${selected.title}完整提示词`}>
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="关闭">×</button>
            <div className="modal-visual">
              <img src={selected.image} alt={`${selected.title}真实生成效果大图`} />
              <div><span>ACTUAL GENERATED OUTPUT</span><b>{selected.ratio}</b></div>
            </div>
            <div className="modal-content">
              <div className="modal-tags"><span>{selected.category}</span>{selected.tags.map((tag) => <i key={tag}>{tag}</i>)}</div>
              <h2>{selected.title}</h2>
              <p className="original-title">{selected.originalTitle}</p>
              <div className="prompt-heading"><span>完整原提示词</span><button type="button" onClick={() => handleCopy(selected)}><CopyIcon />{copiedId === selected.id ? "已复制" : "一键复制"}</button></div>
              <pre>{selected.prompt}</pre>
              <dl>
                <div><dt>原作者</dt><dd>{selected.author}{selected.authorHandle ? ` · @${selected.authorHandle}` : ""}</dd></div>
                <div><dt>内容集合</dt><dd>{selected.collectionName}</dd></div>
                <div><dt>许可</dt><dd>{selected.promptLicense}</dd></div>
                <div><dt>修改说明</dt><dd>{selected.modificationNote}</dd></div>
              </dl>
              <div className="modal-links">
                <a href={selected.originalPostUrl} target="_blank" rel="noreferrer">查看原帖 <SourceIcon /></a>
                <a href={selected.repositoryUrl} target="_blank" rel="noreferrer">开源仓库 <SourceIcon /></a>
                <a href={selected.promptLicenseUrl} target="_blank" rel="noreferrer">许可原文 <SourceIcon /></a>
              </div>
              <p className="attribution">{selected.attributionText}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
