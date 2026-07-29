import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Atlas｜真实生图提示词效果库",
  description: "54 组真实生成效果、完整原提示词与可追溯来源，重点覆盖 PPT、信息图、海报与产品视觉。",
  keywords: ["PPT 提示词", "GPT Image 2", "真实生成效果", "生图提示词", "信息图", "Prompt Atlas"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Prompt Atlas｜真实生图提示词效果库",
    description: "从真实生成效果反查完整提示词，并保留原作者、原帖与许可信息。",
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
