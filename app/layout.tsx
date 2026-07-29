import type { Metadata } from "next";
import "./globals.css";
import promptItems from "./data/prompt-items.json";
import liveIndex from "./data/live-index.json";

export const metadata: Metadata = {
  title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
  description: `${promptItems.length + liveIndex.sourceStats.youMindCompleteRecords} 组真实生成效果与完整提示词，含 ${liveIndex.sourceStats.youMindImages} 张 YouMind 公开实图和小小东专题，重点覆盖 PPT、信息图、海报与产品视觉。`,
  keywords: ["PPT 提示词", "GPT Image 2", "真实生成效果", "生图提示词", "信息图", "Prompt Atlas"],
  icons: {
    icon: "./favicon.svg",
    shortcut: "./favicon.svg",
  },
  openGraph: {
    title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
    description: "在统一瀑布流中浏览真实生成效果、复制完整提示词，并查看 YouMind OpenLab 与小小东的可追溯来源。",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
