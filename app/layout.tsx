import type { Metadata } from "next";
import "./globals.css";
import localPromptItems from "./data/prompt-items.json";
import fullIndexSummary from "./data/full-index-summary.json";
import diffusionDbItems from "./data/diffusiondb-3d.json";
import nanoBananaData from "./data/nano-banana-public.json";

const totalBrowsable =
  fullIndexSummary.uniquePromptCount + localPromptItems.length + diffusionDbItems.length + nanoBananaData.items.length;

export const metadata: Metadata = {
  title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
  description: `由小明猩制作的提示词美术馆：${totalBrowsable.toLocaleString()} 组真实生成效果与完整提示词，融合小明猩动漫制作者主页，可直接站内查看和复制。`,
  authors: [{ name: "小明猩" }],
  creator: "小明猩",
  keywords: ["PPT 提示词", "GPT Image 2", "真实生成效果", "生图提示词", "信息图", "Prompt Atlas"],
  icons: { icon: "./favicon.svg", shortcut: "./favicon.svg" },
  openGraph: {
    title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
    description: "小明猩制作：在统一瀑布流中浏览真实生成效果，并在站内查看与复制完整提示词。",
    type: "website",
    images: ["https://lin351540-ship-it.github.io/prompt-atlas-jj/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Atlas｜小明猩制作",
    description: "真实效果、完整提示词、站内直看。",
    images: ["https://lin351540-ship-it.github.io/prompt-atlas-jj/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><head>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
    <link rel="preconnect" href="https://esm.sh" crossOrigin="anonymous" />
    <link rel="dns-prefetch" href="https://esm.sh" />
  </head><body>{children}</body></html>;
}
