# Prompt Atlas JJ

面向 PPT、信息图、海报、社媒、产品视觉与插画的真实效果图提示词资料库。

在线地址：[Prompt Atlas](https://lin351540-ship-it.github.io/prompt-atlas-jj/)

## 当前内容

- 14,074 条 YouMind 官方 GitHub 公开索引唯一记录，均含提示词正文与至少一张效果图地址。
- 168 条来自 2slides、ToseaAI、ApiMartAI 等公开许可集合的补充记录。
- 共 14,242 张去重卡片；小小东内容与其他来源使用同一套卡片、筛选和详情弹窗。
- 全量提示词拆成 29 个静态分片：浏览时先读取轻量目录，打开或复制时再读取对应正文。
- Geist Sans / Mono 自托管字体、三列/双列/单列响应式瀑布流、图片多源容错、搜索、收藏与分类筛选。

YouMind 上游 `manifest.json` 当前声明 14,106 条，但 11 个公开分类文件按 `id` 去重后实际为 14,074 条；网站同时显示声明值与可验证值，不补写不存在的记录。

## 本地运行

```bash
npm install
npm run dev
```

验证并导出 GitHub Pages 静态站点：

```bash
npm test
node scripts/export-static.mjs
```

## 数据同步

```bash
npm run sync
```

同步流程会刷新三个许可明确的公开集合、YouMind 精选完整记录，以及 YouMind 官方 `gpt-image-2-prompts-search` 公共 JSON。GitHub Actions 每 6 小时运行一次并重新导出 `docs/`。

## 来源与权利

本站不破解 VIP、不调用隐藏接口、不抓取 YouMind 受限网页或 X 媒体。全量数据来自 YouMind OpenLab 官方公开 GitHub 仓库；效果图保留上游远程地址，提示词和图片版权仍归各自作者或权利人。

提示词由 [YouMind.com](https://youmind.com) 通过公开社区搜集 ❤️

第三方项目、字体和内容许可详见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。如需更正署名或下架，请通过本仓库 Issue 联系维护者。
