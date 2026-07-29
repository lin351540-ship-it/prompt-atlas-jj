import type { Metadata } from "next";
import "./globals.css";
import promptItems from "./data/prompt-items.json";
import liveIndex from "./data/live-index.json";

export const metadata: Metadata = {
  title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
  description: `${promptItems.length} 组授权真实生成效果与完整提示词，另有 ${liveIndex.items.length} 条 YouMind / X 公开灵感索引，重点覆盖 PPT、信息图、海报与产品视觉。`,
  keywords: ["PPT 提示词", "GPT Image 2", "真实生成效果", "生图提示词", "信息图", "Prompt Atlas"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Prompt Atlas｜生图与 PPT 提示词灵感库",
    description: "从真实生成效果反查完整提示词，并通过权利分层持续发现 YouMind 与 X 公开案例。",
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
