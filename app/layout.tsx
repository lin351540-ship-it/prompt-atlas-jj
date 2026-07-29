import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Atlas｜生图提示词图鉴",
  description: "145 条原创重构生图提示词，重点覆盖 PPT，并提供视觉预览、详细提示词、分类与公开来源。",
  keywords: ["PPT 提示词", "生图提示词", "AI 绘画", "信息图", "海报设计", "Prompt Atlas"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Prompt Atlas｜生图提示词图鉴",
    description: "把好看拆成可复制的结构：145 条原创重构视觉提示词。",
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
