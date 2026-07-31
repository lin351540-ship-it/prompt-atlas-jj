"use client";

/* eslint-disable @next/next/no-img-element -- this static gallery intentionally renders source-hosted previews */

import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import bootstrapFeed from "./data/bootstrap-feed.json";
import fullIndexSummary from "./data/full-index-summary.json";
import CdnDesignRuntime from "./cdn-design-runtime";

type Category = "全部" | "PPT / 信息图" | "海报设计" | "社媒 / 品牌" | "UI / 产品" | "人像摄影" | "插画 / 漫画" | "实验 / 对比" | "创意发现";
type SourceMode = "全部来源" | "小小东" | "X 公开分享" | "YouMind 全量公开索引" | "Nano Banana 公开集" | "EvoLink CC0" | "开放授权 3D" | "PPT 开源集" | "其他开源集";
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
const sourceModes: SourceMode[] = ["全部来源", "小小东", "X 公开分享", "YouMind 全量公开索引", "Nano Banana 公开集", "EvoLink CC0", "开放授权 3D", "PPT 开源集", "其他开源集"];
function dedupePromptItems(items: CatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalizedPrompt = item.prompt.replace(/\s+/g, " ").trim().toLowerCase();
    const key = normalizedPrompt ? `${item.originalPostUrl}|${normalizedPrompt}` : item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const initialItems = bootstrapFeed.items as unknown as CatalogItem[];
const heroBootstrapItems = bootstrapFeed.heroItems as unknown as CatalogItem[];
const curatedYouMindImages = new Set(bootstrapFeed.curatedImageUrls);
const feedStats = bootstrapFeed.stats;

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
    eyebrow: "PUBLIC X ALT PROMPTS · ATTRIBUTED",
    title: "X · Public Prompt Radar",
    copy: `${feedStats.x.completeRecords} 条带完整 ALT 提示词的公开 X 记录、${feedStats.x.imageCount} 张效果图，覆盖 ${feedStats.x.authorCount} 位作者；其中小小东 ${feedStats.x.xiaoxiaodongCount} 条。`,
    url: "https://x.com/search?q=%22GPT%20Image%22%20prompt&src=typed_query",
  },
  {
    eyebrow: "GPT IMAGE 2 CASES · CC0 1.0",
    title: "EvoLink · Open Prompt–Image Cases",
    copy: `${feedStats.evolink.completeRecords} 条 CC0 完整提示词、${feedStats.evolink.imageCount} 张公开效果图，来自 ${feedStats.evolink.authorCount} 位 X 原作者。`,
    url: "https://github.com/Evolink-AI/awesome-gpt-image-2-API-and-Prompts",
  },
  {
    eyebrow: "OFFICIAL PUBLIC INDEX · 14K+",
    title: "YouMind · GPT Image 2 Prompts Search",
    copy: `${fullIndexSummary.uniquePromptCount.toLocaleString()} 条可验证唯一记录、${fullIndexSummary.completePromptCount.toLocaleString()} 条完整正文；本站按官方公开 JSON 分片同步。`,
    url: "https://github.com/YouMind-OpenLab/gpt-image-2-prompts-search",
  },
  {
    eyebrow: "CURATED FULL RECORDS · CC BY 4.0",
    title: "YouMind OpenLab · Awesome GPT Image 2",
    copy: `${feedStats.youMindCompleteRecords} 条带原作者、原帖与多张效果图的精选完整记录。`,
    url: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
  },
  {
    eyebrow: "NANO BANANA · CC BY 4.0",
    title: "YouMind · Awesome Nano Banana Pro",
    copy: `${feedStats.nano.completeRecords} 条逐项可核验完整记录、${feedStats.nano.imageCount} 张真实效果图；公开仓库当前声明 ${feedStats.nano.declaredTotal.toLocaleString()} 条总量。`,
    url: "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts",
  },
  {
    eyebrow: "3D PROMPT–IMAGE PAIRS · CC0 1.0",
    title: "DiffusionDB · Open 3D Collection",
    copy: `${feedStats.diffusionCount} 组经过安全筛选的 3D 原提示词与对应生成图；图片已本地化，卡片详情可直接站内查看。`,
    url: "https://github.com/poloclub/diffusiondb",
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
  {
    eyebrow: "PINNED DESIGN RUNTIME · MIT · CDN",
    title: "Motion/mini + Vanilla Tilt · 双 CDN",
    copy: "固定版本双 CDN 负责统一入场节奏、近视口 3D 倾斜与指针光泽；任一来源失败可自动切换，全部失败仍保留本地样式。",
    url: "https://github.com/motiondivision/motion",
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

function ResilientImage({ sources, alt, className, eager = false }: { sources: string[]; alt: string; className?: string; eager?: boolean }) {
  const usableSources = sources.filter(Boolean);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (!usableSources.length || sourceIndex >= usableSources.length) {
    return <span className={`image-fallback ${className ?? ""}`} role="img" aria-label={`${alt}（效果图源暂不可用）`}><i>IMAGE SOURCE</i><b>效果图暂不可用</b><small>提示词正文仍可在站内查看</small></span>;
  }

  return <img className={`${className ?? ""}${loaded ? " is-loaded" : ""}`} src={usableSources[sourceIndex]} alt={alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setSourceIndex((index) => index + 1); }} />;
}

function previewAspectRatio(ratio: string) {
  const match = ratio.replace("：", ":").match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
  if (!match) return "4 / 3";
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > 0 && height > 0 ? `${width} / ${height}` : "4 / 3";
}

function galleryColumnCount() {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia("(max-width: 560px)").matches) return 1;
  if (window.matchMedia("(max-width: 1100px)").matches) return 2;
  return 3;
}

function itemMatchesCategory(item: CatalogItem, category: Category) {
  return category === "全部" || item.category === category || item.categories?.includes(category);
}

function sourceMatches(item: CatalogItem, source: SourceMode) {
  if (source === "全部来源") return true;
  if (source === "小小东") return item.author === "小小东" || item.authorHandle.toLowerCase() === "xiaoxiaodong01";
  if (source === "X 公开分享") return item.syncMethod === "x-public-alt-prompt";
  if (source === "YouMind 全量公开索引") return item.syncMethod === "youmind-public-search-index" || item.syncMethod === "github-public-full-record";
  if (source === "Nano Banana 公开集") return item.syncMethod === "github-public-nano-banana-record";
  if (source === "EvoLink CC0") return item.syncMethod === "github-public-evolink-cc0";
  if (source === "开放授权 3D") return item.syncMethod === "diffusiondb-cc0-curated";
  if (source === "PPT 开源集") return item.collectionName.includes("2slides");
  return item.syncMethod !== "youmind-public-search-index"
    && item.syncMethod !== "github-public-full-record"
    && item.syncMethod !== "diffusiondb-cc0-curated"
    && item.syncMethod !== "github-public-nano-banana-record"
    && item.syncMethod !== "github-public-evolink-cc0"
    && item.syncMethod !== "x-public-alt-prompt"
    && !item.collectionName.includes("2slides");
}

function sourceLabel(item: CatalogItem) {
  if (item.syncMethod === "x-public-alt-prompt") return item.authorHandle.toLowerCase() === "xiaoxiaodong01" ? "小小东 · X 公开提示词" : "X 公开提示词";
  if (item.author === "小小东" || item.authorHandle.toLowerCase() === "xiaoxiaodong01") return "小小东 · YouMind";
  if (item.syncMethod === "github-public-evolink-cc0") return "EvoLink · CC0";
  if (item.syncMethod === "youmind-public-search-index") return "YouMind 公开索引";
  if (item.syncMethod === "github-public-full-record") return "YouMind 精选记录";
  if (item.syncMethod === "github-public-nano-banana-record") return "YouMind · Nano Banana";
  if (item.syncMethod === "diffusiondb-cc0-curated") return "DiffusionDB · CC0 3D";
  if (item.collectionName.includes("2slides")) return "2slides";
  if (item.collectionName.includes("Tosea")) return "ToseaAI";
  if (item.collectionName.includes("ApiMart")) return "ApiMartAI";
  return item.collectionName;
}

function moveSpotlight(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  event.currentTarget.style.setProperty("--spot-x", `${x}px`);
  event.currentTarget.style.setProperty("--spot-y", `${y}px`);
  event.currentTarget.style.setProperty("--tilt-x", `${((0.5 - y / rect.height) * 2.4).toFixed(2)}deg`);
  event.currentTarget.style.setProperty("--tilt-y", `${((x / rect.width - 0.5) * 2.8).toFixed(2)}deg`);
}

function resetSpotlight(event: React.PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
}

function moveCreatorParallax(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
  event.currentTarget.style.setProperty("--creator-x", `${x}px`);
  event.currentTarget.style.setProperty("--creator-y", `${y}px`);
}
async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch { /* fall through to the selection-based fallback */ }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Clipboard copy was rejected");
}

export default function Home() {
  const [fullItems, setFullItems] = useState<CatalogItem[]>([]);
  const [supplementalItems, setSupplementalItems] = useState<CatalogItem[]>([]);
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
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(60);
  const [galleryColumns, setGalleryColumns] = useState(0);
  const [indexReloadKey, setIndexReloadKey] = useState(0);
  const chunkCache = useRef(new Map<string, Map<number, string>>());
  const catalogAnchor = useRef<{ id: string; top: number } | null>(null);
  const modalScrollY = useRef(0);
  const modalRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const promptRequest = useRef(0);
  const selectedId = selected?.id;

  const catalogItems = useMemo(
    () => dedupePromptItems([...fullItems, ...supplementalItems, ...initialItems]),
    [fullItems, supplementalItems],
  );

  useLayoutEffect(() => {
    const updateColumns = () => setGalleryColumns(galleryColumnCount());
    updateColumns();
    window.addEventListener("resize", updateColumns, { passive: true });
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    let active = true;
    const feeds = [
      ["./data/feeds/x-open-prompts.json", (data: unknown) => (data as { items: CatalogItem[] }).items],
      ["./data/feeds/evolink-public.json", (data: unknown) => (data as { items: CatalogItem[] }).items],
      ["./data/feeds/diffusiondb-3d.json", (data: unknown) => data as CatalogItem[]],
      ["./data/feeds/nano-banana-public.json", (data: unknown) => (data as { items: CatalogItem[] }).items],
      ["./data/feeds/live-index.json", (data: unknown) => (data as { items: CatalogItem[] }).items.filter((item) => item.syncMethod === "github-public-full-record")],
    ] as const;
    Promise.all(feeds.map(async ([url, select]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Supplemental feed returned ${response.status}`);
      return select(await response.json());
    }))
      .then((groups) => {
        if (active) startTransition(() => setSupplementalItems(dedupePromptItems(groups.flat())));
      })
      .catch(() => {
        // The compact bootstrap remains usable when a supplemental feed is unavailable.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("./data/youmind/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error(`Public index returned ${response.status}`);
        return response.json() as Promise<PublicCatalogRecord[]>;
      })
      .then((records) => {
        if (!active) return;
        const visibleCard = [...document.querySelectorAll<HTMLElement>("[data-card-id]")]
          .filter((card) => {
            const rect = card.getBoundingClientRect();
            return rect.bottom > 100 && rect.top < window.innerHeight - 100;
          })
          .sort((a, b) => Math.abs(a.getBoundingClientRect().top - 120) - Math.abs(b.getBoundingClientRect().top - 120))[0];
        catalogAnchor.current = visibleCard ? { id: visibleCard.dataset.cardId ?? "", top: visibleCard.getBoundingClientRect().top } : null;
        const mappedRecords = records.filter((record) => !record.imageUrls.some((image) => curatedYouMindImages.has(image))).map(mapPublicRecord);
        startTransition(() => {
          setFullItems(mappedRecords);
          setIndexStatus("ready");
        });
      })
      .catch(() => active && setIndexStatus("error"));
    return () => { active = false; };
  }, [indexReloadKey]);

  useLayoutEffect(() => {
    const snapshot = catalogAnchor.current;
    if (!snapshot || !fullItems.length) return;
    catalogAnchor.current = null;
    const anchor = [...document.querySelectorAll<HTMLElement>("[data-card-id]")].find((card) => card.dataset.cardId === snapshot.id);
    if (!anchor) return;
    const delta = anchor.getBoundingClientRect().top - snapshot.top;
    if (Math.abs(delta) < 1) return;
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollBy(0, delta);
    root.style.scrollBehavior = previousBehavior;
  }, [fullItems]);

  useEffect(() => {
    if (!selectedId) return;
    const body = document.body;
    const root = document.documentElement;
    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    modalScrollY.current = window.scrollY;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = [...modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.classList.add("modal-open");
    body.style.position = "fixed";
    body.style.top = `-${modalScrollY.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (scrollbarWidth) body.style.paddingRight = `${scrollbarWidth}px`;
    window.addEventListener("keydown", onKey);
    const focusFrame = window.requestAnimationFrame(() => modalRef.current?.querySelector<HTMLElement>(".modal-close")?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      body.classList.remove("modal-open");
      Object.assign(body.style, previousStyles);
      window.removeEventListener("keydown", onKey);
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, modalScrollY.current);
      root.style.scrollBehavior = previousBehavior;
      restoreFocusRef.current?.focus({ preventScroll: true });
    };
  }, [selectedId]);

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
  }, [visibleLimit, category, query, source, onlyFavorites, sort, indexStatus, galleryColumns]);

  const counts = useMemo(() => Object.fromEntries(categories.map((name) => [name, catalogItems.filter((item) => itemMatchesCategory(item, name)).length])), [catalogItems]);
  const sourceCounts = useMemo(() => Object.fromEntries(sourceModes.map((name) => [name, catalogItems.filter((item) => sourceMatches(item, name)).length])), [catalogItems]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = catalogItems.filter((item) => {
      if (!itemMatchesCategory(item, category)) return false;
      if (!sourceMatches(item, source)) return false;
      if (onlyFavorites && !favorites.includes(item.id)) return false;
      if (!keyword) return true;
      return [item.title, item.originalTitle, item.description, item.prompt, item.author, item.category, item.collectionName, ...item.tags].join(" ").toLowerCase().includes(keyword);
    });
    return [...result].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "zh-CN");
      if (sort === "source") return a.index - b.index;
      const priority = (item: CatalogItem) => item.authorHandle.toLowerCase() === "xiaoxiaodong01" ? 5
        : item.syncMethod === "x-public-alt-prompt" ? 4
          : item.collectionName.includes("2slides") ? 4
          : item.syncMethod === "github-public-full-record" ? 3
            : item.syncMethod === "github-public-nano-banana-record" ? 3
              : item.syncMethod === "github-public-evolink-cc0" ? 3
              : item.syncMethod === "diffusiondb-cc0-curated" ? 2
            : item.featured ? 2
              : item.syncMethod === "youmind-public-search-index" ? 1 : 0;
      return Number(b.category === "PPT / 信息图") - Number(a.category === "PPT / 信息图") || priority(b) - priority(a) || b.index - a.index;
    });
  }, [catalogItems, category, favorites, onlyFavorites, query, sort, source]);

  const visibleItems = useMemo(() => filtered.slice(0, visibleLimit), [filtered, visibleLimit]);
  const stableColumns = useMemo(() => {
    if (!galleryColumns) return [];
    const columns = Array.from({ length: galleryColumns }, () => [] as CatalogItem[]);
    visibleItems.forEach((item, index) => columns[index % galleryColumns].push(item));
    return columns;
  }, [galleryColumns, visibleItems]);
  const heroItems = heroBootstrapItems;

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
    const requestId = ++promptRequest.current;
    setSelectedImage(0);
    setSelected(item);
    setPromptLoading(!item.prompt);
    if (item.prompt) return;
    try {
      const resolved = await loadPrompt(item);
      if (promptRequest.current === requestId) setSelected((current) => current?.id === item.id ? resolved : current);
    } catch {
      if (promptRequest.current === requestId) setSelected((current) => current?.id === item.id ? { ...item, prompt: "提示词分片暂时加载失败，请稍后重试。" } : current);
    } finally {
      if (promptRequest.current === requestId) setPromptLoading(false);
    }
  };

  const handleCopy = async (item: CatalogItem) => {
    setCopyErrorId(null);
    try {
      const resolved = await loadPrompt(item);
      await copyText(resolved.prompt);
      if (selected?.id === item.id) setSelected(resolved);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 1700);
    } catch {
      setCopiedId(null);
      setCopyErrorId(item.id);
      window.setTimeout(() => setCopyErrorId((current) => current === item.id ? null : current), 2200);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { localStorage.setItem("prompt-atlas-real-favorites", JSON.stringify(next)); } catch { /* keep this session usable when storage is unavailable */ }
      return next;
    });
  };

  const renderPromptCard = (item: CatalogItem) => {
    const favorite = favorites.includes(item.id);
    const images = item.imageUrls?.filter(Boolean).length ?? Number(Boolean(item.image));
    return <article className="prompt-card reveal-card" data-card-id={item.id} data-cdn-tilt="card" key={item.id} onPointerMove={moveSpotlight} onPointerLeave={resetSpotlight}>
      <button className="image-button" style={{ aspectRatio: previewAspectRatio(item.ratio) }} type="button" onClick={() => openItem(item)} aria-label={`查看${item.title}完整提示词`}>
        <ResilientImage sources={item.imageUrls?.length ? item.imageUrls : [item.image]} alt={`${item.title}真实生成效果`} />
        <span className="image-sheen" /><span className="image-badge">REAL OUTPUT</span>{images > 1 && <span className="image-count">{images} 张实图</span>}<span className="image-open">站内查看完整提示词 <ArrowIcon /></span>
      </button>
      <div className="card-body">
        <div className="card-kicker"><span>{item.category}</span><i>{item.ratio}</i></div><span className="source-pill">{sourceLabel(item)}</span>
        <h3>{item.title}</h3><p>{item.description}</p>
        <div className="tag-row">{item.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div>
        <div className="card-credit"><div><small>来源</small><b>{item.author}</b></div><a href={item.originalPostUrl} target="_blank" rel="noreferrer" aria-label={`打开${item.author}的原始来源`}><SourceIcon /></a></div>
        <div className="card-actions"><button type="button" onClick={() => handleCopy(item)}><CopyIcon />{copiedId === item.id ? "已复制" : copyErrorId === item.id ? "复制失败，请重试" : "复制完整提示词"}</button><button className={favorite ? "heart active" : "heart"} type="button" onClick={() => toggleFavorite(item.id)} aria-label={favorite ? "取消收藏" : "收藏"} aria-pressed={favorite}>♥</button></div>
      </div>
    </article>;
  };

  const selectedImages = selected ? (selected.imageUrls?.length ? selected.imageUrls : [selected.image]).filter(Boolean) : [];
  const totalBrowsable = indexStatus === "ready" ? catalogItems.length : fullIndexSummary.uniquePromptCount + bootstrapFeed.extraUniqueCount;

  return (
    <main>
      <CdnDesignRuntime />
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />

      <header className="glass-nav" aria-label="主导航">
        <a className="brand" href="#top" aria-label="Prompt Atlas 首页"><span className="brand-glyph">P</span><span><b>Prompt Atlas</b><strong className="brand-creator">小明猩制作</strong></span></a>
        <nav><a href="#gallery">图库</a><a href="#sources">来源</a><a href="#rights">说明</a></nav>
        <a className="nav-cta" href="#gallery">浏览图库 <ArrowIcon /></a>
      </header>

      <section className="hero" id="top" data-cdn-reveal>
        <div className="creator-home" data-cdn-tilt="hero" onPointerMove={moveCreatorParallax}>
          <div className="creator-depth-field" aria-hidden="true"><span className="depth-ring ring-one" /><span className="depth-ring ring-two" /><span className="depth-chip chip-x">X</span><span className="depth-chip chip-ppt">PPT</span><span className="depth-chip chip-3d">3D</span><i className="depth-star star-one">✦</i><i className="depth-star star-two">✧</i></div>
          <div className="creator-portrait-panel" aria-label="小明猩制作者形象">
            <div className="portrait-bokeh portrait-bokeh-a" /><div className="portrait-bokeh portrait-bokeh-b" />
            <div className="creator-anime-wrap">
              <img className="creator-anime" src="./creator-anime.webp" alt="手持白玫瑰、从撕纸中出现的动漫制作者形象" fetchPriority="high" />
            </div>
            <div className="portrait-label"><small>PROMPT ATLAS / CREATOR</small><strong>小明猩</strong><span>网站制作者 · 视觉主理人</span></div>
            <div className="portrait-capsule"><i />OPEN SOURCE CURATION</div>
          </div>

          <article className="creator-profile-sheet">
            <div className="profile-glass-glow" />
            <header className="creator-name-row">
              <div><span>WEBSITE CREATOR</span><h1>小明猩</h1><p>Prompt Atlas 网站制作者</p></div>
              <div className="creator-like"><b>{totalBrowsable.toLocaleString()}</b><span>组收录</span></div>
            </header>

            <div className="creator-role-row"><span>AI 生图游侠</span><strong>把公开、可验证的灵感排进同一座美术馆</strong></div>
            <div className="creator-profile-meta"><span><b>重点</b>PPT / 信息图</span><span><b>模型</b>GPT Image 2</span><span><b>方式</b>站内直看</span></div>

            <div className="creator-badge-track" aria-label="来源与能力徽章">
              <span className="badge-sun">AI</span><span className="badge-aqua">P</span><span className="badge-blue">CC</span><span className="badge-gold">X</span><span className="badge-silver">3D</span><span className="badge-dark">{Math.floor(totalBrowsable / 1000)}K</span>
            </div>

            <div className="profile-line"><span>签名</span><strong>先看真实效果，再复制完整提示词。</strong></div>

            <div className="creator-album-block">
              <div className="creator-album-heading"><span>✦</span><strong>PPT 灵感空间</strong><small>主理精选</small></div>
              <div className="creator-album-strip">
                {heroItems.slice(0, 4).map((item) => <button type="button" key={`ppt-${item.id}`} onClick={() => openItem(item)} aria-label={`查看主理精选：${item.title}`}><ResilientImage sources={item.imageUrls?.length ? item.imageUrls : [item.image]} alt={`${item.title}真实生成效果`} eager /></button>)}
              </div>
            </div>

            <div className="creator-album-block secondary">
              <div className="creator-album-heading"><span>⌘</span><strong>Image 2 精选</strong><small>{(feedStats.x.completeRecords + feedStats.evolink.completeRecords + feedStats.nano.completeRecords).toLocaleString()} 条开放图文</small></div>
              <div className="creator-album-strip compact">
                {heroItems.slice(1, 7).map((item) => <button type="button" key={`image-${item.id}`} onClick={() => openItem(item)} aria-label={`查看精选案例：${item.title}`}><ResilientImage sources={item.imageUrls?.length ? item.imageUrls : [item.image]} alt={`${item.title}真实生成效果`} eager /></button>)}
              </div>
            </div>

            <div className="creator-sheet-actions"><a href="#rights">来源与授权</a><a className="primary" href="#gallery">开始浏览 <ArrowIcon /></a></div>
          </article>
        </div>
        <div className="hero-floating-copy" data-cdn-reveal><span>真实效果图</span><i /> <span>完整提示词</span><i /> <span>持续同步</span></div>
      </section>

      <section className="maker-strip" aria-label="网站制作者" data-cdn-reveal><strong>小明猩制作</strong><span>真实效果 · 完整提示词 · 站内直看</span></section>

      <section className="library" id="gallery">
        <div className="section-depth-decor" aria-hidden="true"><span>XM</span><i /><b>PROMPT<br />ATLAS</b></div>
        <div className="section-intro" data-cdn-reveal><div><span className="section-index">01 / 提示词图库</span><h2>先看效果，<br />再复制完整提示词。</h2></div><p>{totalBrowsable.toLocaleString()} 条记录统一使用同一种卡片，点击即可在站内展开。</p></div>

        <div className={`index-status ${indexStatus}`} aria-live="polite"><i /><span>{indexStatus === "loading" ? "正在装入 YouMind 14K+ 公开索引…" : indexStatus === "ready" ? `公开索引已就绪：${fullIndexSummary.uniquePromptCount.toLocaleString()} 条唯一记录` : "全量索引暂时未加载，当前仍可浏览精选与开源集合"}</span>{indexStatus === "error" && <button type="button" onClick={() => { setIndexStatus("loading"); setIndexReloadKey((value) => value + 1); }}>重新加载</button>}</div>

        <div className="glass-toolbar">
          <label className="search-field"><SearchIcon /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(60); }} placeholder="搜索标题、主题、作者或风格…" aria-label="搜索提示词案例" />{query && <button type="button" onClick={() => { setQuery(""); setVisibleLimit(60); }} aria-label="清空搜索">×</button>}</label>
          <select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setVisibleLimit(60); }} aria-label="排序方式"><option value="ppt">PPT / 小小东优先</option><option value="source">按来源序号</option><option value="title">按标题排序</option></select>
          <button className={onlyFavorites ? "favorite-toggle active" : "favorite-toggle"} type="button" aria-pressed={onlyFavorites} onClick={() => { setOnlyFavorites((value) => !value); setVisibleLimit(60); }}><span>♥</span> 收藏 {favorites.length || ""}</button>
        </div>

        <div className="category-rail" aria-label="分类筛选">{categories.map((name) => <button className={category === name ? "active" : ""} type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setVisibleLimit(60); }}><span>{name}</span><i>{Number(counts[name] ?? 0).toLocaleString()}</i></button>)}</div>
        <div className="source-rail" aria-label="来源筛选"><small>SOURCE / 来源</small>{sourceModes.map((name) => <button className={source === name ? "active" : ""} type="button" key={name} aria-pressed={source === name} onClick={() => { setSource(name); setVisibleLimit(60); if (name === "小小东" || name === "开放授权 3D") setCategory("全部"); }}>{name}<i>{Number(sourceCounts[name] ?? 0).toLocaleString()}</i></button>)}</div>
        <div className="result-line"><span>SHOWING {visibleItems.length.toLocaleString()} / {filtered.length.toLocaleString()}</span><span>{category} · {source}{query ? ` · “${query}”` : ""}</span></div>

        {filtered.length ? <>
          <div className={galleryColumns ? "prompt-grid stable-columns" : "prompt-grid initial-columns"} style={galleryColumns ? { gridTemplateColumns: `repeat(${galleryColumns}, minmax(0, 1fr))` } : undefined}>
            {galleryColumns
              ? stableColumns.map((column, columnIndex) => <div className="prompt-column" key={`column-${columnIndex}`}>{column.map(renderPromptCard)}</div>)
              : visibleItems.map(renderPromptCard)}
          </div>
          {visibleLimit < filtered.length && <button className="load-more" type="button" onClick={() => setVisibleLimit((value) => Math.min(value + 60, filtered.length))}>继续加载同类卡片 <span>+{Math.min(60, filtered.length - visibleLimit)}</span></button>}
        </> : <div className="empty-state"><span>NO MATCH</span><h3>没有找到对应作品</h3><p>换一个关键词，或重置来源与分类。</p><button type="button" onClick={() => { setQuery(""); setOnlyFavorites(false); setCategory("全部"); setSource("全部来源"); }}>重置筛选</button></div>}
      </section>

      <section className="source-section" id="sources">
        <div className="section-intro compact" data-cdn-reveal><div><span className="section-index">02 / SOURCE MAP</span><h2>内容、字体与动画，<br />分别标清来源。</h2></div><p>完整提示词、真实效果图和 UI 参考各自保留出处。“公开可浏览”不等同于放弃版权，卡片详情始终附带来源与展示依据。</p></div>
        <div className="source-grid">{sourceLinks.map((item, index) => <a href={item.url} target="_blank" rel="noreferrer" className="source-card reveal-card" data-cdn-tilt="source" key={item.title} onPointerMove={moveSpotlight} onPointerLeave={resetSpotlight}><span>{String(index + 1).padStart(2, "0")}</span><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.copy}</p><i><SourceIcon /></i></a>)}</div>
      </section>

      <section className="rights-section" id="rights">
        <div className="rights-glass" data-cdn-tilt="panel" data-cdn-reveal><span className="section-index">03 / RIGHTS & TRANSPARENCY</span><h2>能公开验证多少，就准确展示多少。</h2><div className="rights-columns"><p><b>A · 公开数据范围：</b>YouMind 官方清单宣称 {fullIndexSummary.declaredTotalPrompts.toLocaleString()} 条；当前 11 个公开分类文件按 ID 去重后实际可验证 {fullIndexSummary.uniquePromptCount.toLocaleString()} 条，且均有提示词正文。分类会重叠，因此会员数合计不等于唯一条目数。</p><p><b>B · 新增开放图文：</b>当前新增 X 公开 ALT 完整提示词 {feedStats.x.completeRecords} 条、EvoLink CC0 图文 {feedStats.evolink.completeRecords} 条、Nano Banana {feedStats.nano.completeRecords} 条，以及 {feedStats.diffusionCount} 组 DiffusionDB CC0 原提示词—对应生成图；逐条保留作者、原帖和展示依据。</p><p><b>C · 获取与展示方式：</b>本站不破解 VIP、不绕过登录、不抓取私密或删除内容，也不复制受限会员页。X 仅收录公开检索可见、明确分享提示词且 ALT 正文完整的帖子；作者未声明开放许可证的 X 卡片会明确标记为“公开分享、保留署名”，不冒充 CC 授权。</p></div><p className="youmind-credit">提示词由 <a href="https://youmind.com" target="_blank" rel="noreferrer">YouMind.com</a>、X 公开作者及开放仓库共同提供；每张卡片均保留逐条来源。</p><div className="license-row"><a href={fullIndexSummary.source} target="_blank" rel="noreferrer">YouMind 公开索引 <SourceIcon /></a><a href="https://x.com/search?q=%22GPT%20Image%22%20prompt&src=typed_query" target="_blank" rel="noreferrer">X 公开分享 <SourceIcon /></a><a href="https://github.com/Evolink-AI/awesome-gpt-image-2-API-and-Prompts/blob/main/LICENSE" target="_blank" rel="noreferrer">EvoLink CC0 <SourceIcon /></a><a href="https://github.com/poloclub/diffusiondb" target="_blank" rel="noreferrer">DiffusionDB CC0 <SourceIcon /></a><a href="https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/blob/main/LICENSE" target="_blank" rel="noreferrer">Nano Banana CC BY 4.0 <SourceIcon /></a><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 <SourceIcon /></a><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0 <SourceIcon /></a><a href="https://github.com/JCodesMore/ai-website-cloner-template/blob/main/LICENSE" target="_blank" rel="noreferrer">JCodesMore MIT <SourceIcon /></a><a href="https://github.com/motiondivision/motion/blob/main/LICENSE.md" target="_blank" rel="noreferrer">Motion MIT <SourceIcon /></a><a href="https://github.com/micku7zu/vanilla-tilt.js/blob/master/LICENSE" target="_blank" rel="noreferrer">Vanilla Tilt MIT <SourceIcon /></a><a href="https://www.jsdelivr.com/" target="_blank" rel="noreferrer">jsDelivr CDN <SourceIcon /></a><a href="https://github.com/lin351540-ship-it/prompt-atlas-jj" target="_blank" rel="noreferrer">本站仓库 <SourceIcon /></a></div></div>
      </section>

      <footer className="site-footer" data-cdn-reveal><div className="footer-maker"><span className="creator-avatar">猩</span><span><small>网站制作者</small><strong>小明猩</strong></span></div><p>Prompt Atlas · {totalBrowsable.toLocaleString()} 组真实效果与完整提示词</p><a href="#top">返回顶部 ↑</a></footer>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        <section className="prompt-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label={`${selected.title}完整提示词`}>
          <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="关闭">×</button>
          <div className="modal-visual">
            <ResilientImage key={selectedImages[selectedImage] ?? selected.id} sources={selectedImages.length ? [selectedImages[selectedImage], ...selectedImages.filter((_, index) => index !== selectedImage)] : []} alt={`${selected.title}真实生成效果 ${selectedImage + 1}`} />
            <div className="modal-caption"><span>ACTUAL GENERATED OUTPUT · {selectedImages.length ? selectedImage + 1 : 0}/{selectedImages.length}</span><b>{selected.ratio}</b></div>
            {selectedImages.length > 1 && <div className="modal-thumbs" aria-label="切换真实效果图">{selectedImages.map((image, index) => <button className={selectedImage === index ? "active" : ""} type="button" key={image} onClick={() => setSelectedImage(index)}><ResilientImage sources={[image]} alt={`效果图 ${index + 1}`} /></button>)}</div>}
          </div>
          <div className="modal-content">
            <div className="modal-tags"><span>{selected.category}</span><i>{sourceLabel(selected)}</i>{selected.tags.map((tag) => <i key={tag}>{tag}</i>)}</div>
            <h2>{selected.title}</h2><p className="original-title">{selected.originalTitle}</p>
            <div className="prompt-heading"><span>完整原提示词</span><button type="button" disabled={promptLoading} onClick={() => handleCopy(selected)}><CopyIcon />{promptLoading ? "读取中…" : copiedId === selected.id ? "已复制" : copyErrorId === selected.id ? "复制失败，请重试" : "一键复制"}</button></div>
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
