import type { Metadata } from "next";
import "./globals.css";
import localPromptItems from "./data/prompt-items.json";
import fullIndexSummary from "./data/full-index-summary.json";

const totalBrowsable = fullIndexSummary.uniquePromptCount + localPromptItems.length;

export const metadata: Metadata = {
  title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
  description: `${totalBrowsable.toLocaleString()} 组可浏览记录：真实生成效果、完整提示词、YouMind 公开索引、小小东与优质开源 PPT 案例。`,
  keywords: ["PPT 提示词", "GPT Image 2", "真实生成效果", "生图提示词", "信息图", "Prompt Atlas"],
  icons: { icon: "./favicon.svg", shortcut: "./favicon.svg" },
  openGraph: {
    title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
    description: "在统一瀑布流中浏览真实生成效果，并在站内查看与复制完整提示词。",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
