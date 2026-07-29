# Prompt Atlas JJ

一个面向 PPT、信息图、海报与产品视觉的生图提示词资料库。

线上地址：<https://lin351540-ship-it.github.io/prompt-atlas-jj/>

## 内容分层

- **授权案例库**：ToseaAI、ApiMartAI、2slides。展示仓库配套的真实生成效果、完整提示词、原作者、原帖与许可证。
- **公开发现索引**：YouMind OpenLab 的公开 GitHub 镜像与人工核对的 X 原帖。只展示短摘要、本站示意预览和来源链接，不下载第三方图片，也不复制受限内容。

当前快照包含 160+ 组授权案例和 100+ 条公开发现，其中 40+ 组授权案例属于 PPT / 信息图；精确数字以页面顶部实时统计为准。

## 本地运行

```bash
npm install
npm run dev
```

验证和静态导出：

```bash
npm test
node scripts/export-static.mjs
```

## 数据同步

`sync-sources.yml` 每 6 小时拉取三个明确许可的 GitHub 内容源，并刷新 YouMind OpenLab 的公开 GitHub 索引。X 不进行自动抓取，公开帖子只通过人工核对 URL 收录。

```bash
npm run sync
```

本地执行同步时，三个授权源需要位于站点同级目录 `prompt-gallery-sources/` 下。GitHub Actions 会自动创建这些临时快照。

## 许可说明

本站代码与各数据源、图片、提示词的许可相互独立。每条授权案例在详情中记录来源许可；公开发现条目仅提供来源索引。若你是原作者并希望更正署名或下架，请通过本仓库 Issue 联系维护者。
