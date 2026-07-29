"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Category = "PPT" | "信息图" | "海报" | "产品视觉" | "人物写真" | "插画";

type Source = {
  name: string;
  author: string;
  url: string;
  note: string;
  kind: "方法指南" | "公开案例" | "开源项目" | "灵感图库";
};

type PromptItem = {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  style: string;
  model: string;
  ratio: string;
  prompt: string;
  tags: string[];
  palette: string[];
  source: Source;
};

const sources: Source[] = [
  {
    name: "Image generation guide",
    author: "OpenAI Academy",
    url: "https://openai.com/academy/image-generation/",
    note: "官方提示结构与迭代方法，适合校准主体、构图、文字与约束。",
    kind: "方法指南",
  },
  {
    name: "PPT 系列 · 第一篇",
    author: "小小东",
    url: "https://x.com/xiaoxiaodong01/status/2081610998973399101",
    note: "公开发布的 PPT 生图案例入口，仅作视觉灵感索引。",
    kind: "公开案例",
  },
  {
    name: "PPT 系列 · 东方极简",
    author: "小小东",
    url: "https://x.com/xiaoxiaodong01/status/2081740752175153631",
    note: "东方留白与演示文稿视觉方向的公开案例。",
    kind: "公开案例",
  },
  {
    name: "PPT 系列 · 第六篇",
    author: "小小东",
    url: "https://x.com/xiaoxiaodong01/status/2082083429764800903",
    note: "公开 PPT 视觉案例，站内提示词为独立原创重构。",
    kind: "公开案例",
  },
  {
    name: "知识信息图案例",
    author: "小小东",
    url: "https://x.com/xiaoxiaodong01/status/2081583498037698587",
    note: "知识可视化与结构化信息图的公开展示。",
    kind: "公开案例",
  },
  {
    name: "磨砂玻璃视觉案例",
    author: "小小东",
    url: "https://x.com/xiaoxiaodong01/status/2080990831788605681",
    note: "半透明材质、层叠空间和科技视觉的公开参考。",
    kind: "公开案例",
  },
  {
    name: "Image Prompt Library",
    author: "YouMind OpenLab",
    url: "https://youmind.com/zh-CN/prompts/image",
    note: "大型公开提示词索引，可继续按海报、产品、字体等类别探索。",
    kind: "灵感图库",
  },
  {
    name: "GPT Image 2 Prompts",
    author: "YouMind OpenLab",
    url: "https://youmind.com/gpt-image-2-prompts",
    note: "面向 GPT Image 系列的公开案例与提示词入口。",
    kind: "灵感图库",
  },
  {
    name: "xiaoxiaodong skills",
    author: "nevertoday",
    url: "https://github.com/nevertoday/xiaoxiaodong",
    note: "作者公开的 GitHub 技能项目，可查看可复用的公开工作流。",
    kind: "开源项目",
  },
  {
    name: "Gemini image generation",
    author: "Google AI for Developers",
    url: "https://ai.google.dev/gemini-api/docs/image-generation",
    note: "官方生图与编辑指南，适合核对 16:9、文字渲染和参考图流程。",
    kind: "方法指南",
  },
  {
    name: "Prompt Basics",
    author: "Midjourney Docs",
    url: "https://docs.midjourney.com/docs/prompts",
    note: "主体、媒介、环境、光线、色彩与构图的官方基础规则。",
    kind: "方法指南",
  },
  {
    name: "Prompting in a Nutshell",
    author: "Ideogram Docs",
    url: "https://docs.ideogram.ai/using-ideogram/prompting-guide/in-a-nutshell",
    note: "适合带文字海报、排版与信息图的官方提示方法。",
    kind: "方法指南",
  },
  {
    name: "AI art prompt guide",
    author: "Adobe Firefly",
    url: "https://www.adobe.com/products/firefly/discover/ai-art-prompts.html",
    note: "覆盖媒介、构图、摄影、插画和材质的官方提示指南。",
    kind: "方法指南",
  },
  {
    name: "10,000+ Nano Banana Pro Prompts",
    author: "YouMind OpenLab",
    url: "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts",
    note: "CC BY 4.0 开源提示词库；复用时需署名、链接许可并说明修改。",
    kind: "开源项目",
  },
  {
    name: "GPT Image 2 Prompt Gallery",
    author: "wuyoscar",
    url: "https://github.com/wuyoscar/GPT-Image2-Skill",
    note: "MIT 开源图库；外部来源条目仍需保留原作者链接与署名。",
    kind: "开源项目",
  },
  {
    name: "Open Image Prompts",
    author: "NanmiCoder",
    url: "https://github.com/NanmiCoder/open-image-prompts",
    note: "大型公开索引；第三方提示词和图片未被重新授权，本站仅链接不复制。",
    kind: "灵感图库",
  },
  {
    name: "PPT Skill",
    author: "歸藏 / op7418",
    url: "https://github.com/op7418/guizang-ppt-skill",
    note: "电子杂志、Swiss 与整套 PPT 视觉流程；项目采用 AGPL-3.0。",
    kind: "开源项目",
  },
  {
    name: "Banana Slides",
    author: "Anionex",
    url: "https://github.com/Anionex/banana-slides",
    note: "整套 PPT、模板解析、页面描述、编辑与导出流程参考。",
    kind: "开源项目",
  },
];

const pptTopics = [
  ["AI 年度趋势", "从模型能力、应用落地、产业变化三个层次解释年度趋势", "趋势洞察 / 2026"],
  ["新能源商业路演", "展示市场规模、产品壁垒、商业模式与三年增长路径", "Investor Deck"],
  ["学术研究汇报", "呈现研究问题、技术路线、关键发现与下一步计划", "Research Brief"],
  ["城市文旅提案", "用城市文化符号串联客群、场景、路线与传播策略", "City Branding"],
  ["品牌年度复盘", "总结关键动作、品牌资产、增长数据与新年目标", "Annual Review"],
  ["课程知识讲解", "把复杂概念拆成定义、机制、例子和记忆抓手", "Knowledge Deck"],
  ["政务工作汇报", "清晰呈现目标、举措、阶段成果、问题与行动计划", "Progress Report"],
  ["数据增长复盘", "突出核心指标、漏斗变化、驱动因素和策略建议", "Growth Analytics"],
  ["产品发布会", "围绕用户痛点、核心功能、体验升级与上市信息展开", "Product Launch"],
  ["东方文化主题", "以传统意象讲述文化源流、当代表达与精神内核", "Eastern Narrative"],
  ["项目时间轴复盘", "按季度呈现里程碑、关键决策、风险变化与最终成果", "Milestone Review"],
  ["竞品对比分析", "用统一维度比较市场定位、核心能力、体验差异与机会空白", "Competitive Matrix"],
  ["技术架构解读", "从数据层、服务层、模型层到应用层解释系统结构与信息流", "System Architecture"],
  ["社会实践纪实", "串联出发背景、田野行动、人物故事、成果与青年感悟", "Fieldwork Story"],
  ["地理空间分析", "呈现研究区、数据来源、空间格局、驱动因素与规划建议", "Geo Insights"],
] as const;

const pptStyles = [
  {
    name: "编辑部极简",
    visual: "瑞士国际主义编辑设计，强网格、超大无衬线标题、细线分隔、少量荧光黄索引签",
    composition: "左侧 38% 放主标题与一句结论，右侧 62% 放一个核心数据和三条短洞察；底部设页码、章节与来源脚注",
    palette: ["#111318", "#f2f0e8", "#e8ff55", "#6b7280"],
    source: sources[0],
  },
  {
    name: "黑金发布会",
    visual: "克制的黑金发布会视觉，深黑背景、暖金细线、真实金属与微弱体积光，不要廉价炫光",
    composition: "中心偏左巨型标题，右侧单一 3D 主物体，数据采用竖向刻度；保留至少 35% 负空间",
    palette: ["#090909", "#d8b56a", "#f4ead7", "#6d5a35"],
    source: sources[3],
  },
  {
    name: "东方留白",
    visual: "当代东方极简，宣纸肌理、淡墨层次、朱砂小印、宋体与现代黑体混排，宁静而高级",
    composition: "标题位于左上安全区，主体意象在右下形成对角平衡，中部以细线连接三段信息，留白超过 50%",
    palette: ["#eee9dc", "#242421", "#a43b2f", "#8c877b"],
    source: sources[2],
  },
  {
    name: "玻璃科技",
    visual: "深海蓝科技空间，磨砂玻璃信息层、青色边缘光、精确网格和少量数据粒子，清晰不杂乱",
    composition: "中央半透明主卡承载结论，四周布置三个短数据节点，层级由尺寸与透明度区分，避免传统仪表盘感",
    palette: ["#08151f", "#4fd1c5", "#d9fbff", "#436674"],
    source: sources[4],
  },
  {
    name: "纸张拼贴",
    visual: "高级纸张拼贴与杂志排版，扫描纸纹、撕边、红蓝套印、黑色记号笔批注，真实手工层次",
    composition: "标题像杂志头版横跨上方，中心放一张主题照片剪影，四周用便签承载四个关键词，阅读顺序明确",
    palette: ["#eee7d8", "#171717", "#ef4c3e", "#3f67c2"],
    source: sources[1],
  },
] as const;

const secondarySpecs: Array<{
  category: Exclude<Category, "PPT">;
  ratio: string;
  topics: Array<[string, string, string]>;
  styles: Array<{ name: string; visual: string; composition: string; palette: string[]; source: Source }>;
}> = [
  {
    category: "信息图",
    ratio: "4:5",
    topics: [
      ["大模型工作原理", "把输入、分词、注意力、预测和输出解释成五步流程", "AI 科普"],
      ["碳循环全景", "呈现大气、植被、土壤、海洋与人类活动的碳交换", "环境科学"],
      ["个人知识管理", "展示收集、理解、连接、输出与复盘的闭环", "学习系统"],
      ["一周营养搭配", "按食物类别、份量和时间建立易执行的饮食结构", "健康生活"],
      ["城市雨洪系统", "解释降雨、汇流、海绵设施、调蓄和排放路径", "城市生态"],
      ["论文阅读方法", "从快速筛选到深读、笔记、验证和引用建立流程", "研究方法"],
      ["短视频制作流程", "拆解选题、脚本、拍摄、剪辑、发布与复盘", "内容生产"],
    ],
    styles: [
      { name: "知识地图", visual: "清爽知识地图，米白纸张、彩色模块、精确箭头和小型图标，像高质量科普杂志", composition: "中心主题向外辐射五个编号模块，每个模块只有一句结论与一个图标，底部加入名词解释", palette: ["#f3efe4", "#1b2a34", "#f0c94b", "#62a9a5"], source: sources[4] },
      { name: "蓝图剖面", visual: "工程蓝图与信息设计融合，深蓝底、白色细线、青绿高亮、清晰编号", composition: "从上到下形成过程剖面，左侧标注阶段，右侧给关键参数和解释，所有连线避免交叉", palette: ["#0a2740", "#e8f6f7", "#50c7bd", "#f2b95f"], source: sources[0] },
    ],
  },
  {
    category: "海报",
    ratio: "3:4",
    topics: [
      ["春季音乐节", "年轻、自由、城市草地与现场音乐的周末节庆", "Festival"],
      ["独立电影展", "关于城市记忆与个人叙事的艺术电影展映", "Film Week"],
      ["未来设计论坛", "聚焦 AI、材料与人机关系的设计大会", "Design Forum"],
      ["咖啡品牌上新", "一款带柑橘与坚果风味的春季限定咖啡", "New Arrival"],
      ["世界地球日", "以可行动的小事唤起公众环境责任", "Earth Day"],
      ["毕业作品展", "跨媒介、实验性、充满年轻能量的毕业展", "Graduation Show"],
      ["夜间读书会", "城市深夜、微光、共同阅读与思想交流", "Night Reading"],
    ],
    styles: [
      { name: "字体主导", visual: "实验性中文字体海报，超大字占画面 70%，错位网格、强烈红黑对比和微小英文注释", composition: "主标题纵向切分，日期作为第二视觉中心，地点和主办方放底部信息带，确保字形清楚", palette: ["#f2eee5", "#121212", "#ef3d33", "#b8b2a7"], source: sources[6] },
      { name: "电影颗粒", visual: "独立电影海报质感，低饱和摄影、粗颗粒、局部失焦、克制的暖色光与文学气息", composition: "单一主体置于下三分之一，标题悬浮在大片暗部负空间，信息沿边缘窄栏排列", palette: ["#171817", "#dbd3c2", "#b66744", "#6e756c"], source: sources[1] },
    ],
  },
  {
    category: "产品视觉",
    ratio: "1:1",
    topics: [
      ["无线耳机", "哑光银色真无线耳机与充电盒，强调轻盈与精密", "Consumer Tech"],
      ["东方香水", "透明方瓶、深红瓶盖与木质辛香调性", "Fragrance"],
      ["气泡饮料", "青柠薄荷风味的透明玻璃瓶气泡饮", "Beverage"],
      ["户外腕表", "钛金属表壳、橙色细节和坚固机能感", "Outdoor Gear"],
      ["护肤精华", "半透明乳白瓶身与轻盈水感质地", "Skincare"],
      ["机械键盘", "奶油白键帽、金属旋钮与桌面创作氛围", "Desk Setup"],
      ["旅行箱", "硬壳铝框旅行箱，突出结构、容量与耐用", "Travel"],
    ],
    styles: [
      { name: "棚拍雕塑", visual: "顶级商业棚拍，产品像雕塑一样独立，柔和渐变背景、精准轮廓光、真实材质与干净阴影", composition: "产品居中略偏右，左侧留品牌文案区，使用前中后三层台面制造空间，不加入无关道具", palette: ["#e8e5df", "#222526", "#c5a56a", "#ffffff"], source: sources[0] },
      { name: "悬浮实验室", visual: "未来实验室产品广告，冷色透明材质、受控液体或粒子、锐利高光，写实而非科幻概念画", composition: "产品悬浮在画面中心，功能部件以爆炸视图轻微分离，三条细线标注核心卖点", palette: ["#071b27", "#89e5e2", "#d9f8f6", "#3a5964"], source: sources[5] },
    ],
  },
  {
    category: "人物写真",
    ratio: "4:5",
    topics: [
      ["青年创业者", "自信但不端着的年轻创业者，真实办公环境", "Editorial Portrait"],
      ["女性科学家", "专注、理性、有亲和力的实验室研究者", "Science Portrait"],
      ["城市骑行者", "清晨街道中的通勤骑行者，带轻微运动感", "Urban Lifestyle"],
      ["传统手艺人", "在自然窗光下工作的木工或陶艺师", "Craft Story"],
      ["独立音乐人", "排练室里的年轻音乐人，松弛且有态度", "Music Editorial"],
      ["大学毕业生", "青春、清醒、面对未来的毕业季肖像", "Graduation"],
      ["银发旅行者", "精神饱满、自然微笑的银发旅行者", "Travel Portrait"],
    ],
    styles: [
      { name: "杂志自然光", visual: "高端人物杂志摄影，真实皮肤纹理、柔和侧窗光、35mm 纪实质感、克制调色", composition: "半身肖像位于一侧三分线，视线方向保留空间，背景可辨识但虚化，人物与环境有叙事关系", palette: ["#d8c5ae", "#27302d", "#ece4d8", "#8a6e56"], source: sources[0] },
      { name: "彩色闪光灯", visual: "当代青年文化杂志，直打闪光灯、明快色块、略带胶片颗粒与不完美瞬间", composition: "近景人物略微倾斜，前景加入一处遮挡形成临场感，右上保留刊头空间，避免影楼摆拍", palette: ["#e95d4f", "#3657b7", "#f0d94f", "#161616"], source: sources[7] },
    ],
  },
  {
    category: "插画",
    ratio: "4:5",
    topics: [
      ["雨天书店", "雨夜里温暖的小书店与躲雨的行人", "Cozy Story"],
      ["微型早晨", "住在咖啡杯和面包旁的微型人物开始一天", "Miniature World"],
      ["山海奇遇", "少年乘纸舟穿越云海与神话生物相遇", "Fantasy Journey"],
      ["校园四季", "同一棵树下学生从入学到毕业的时间流转", "Campus Memory"],
      ["城市守护者", "普通职业者化身守护城市日常的温柔英雄", "Urban Tale"],
      ["太空菜园", "宇航员在空间站照料漂浮的蔬菜与花朵", "Space Garden"],
      ["猫咪博物馆", "夜晚闭馆后猫咪悄悄参观艺术作品", "Whimsical Museum"],
    ],
    styles: [
      { name: "绘本颗粒", visual: "高级儿童绘本插画，蜡笔与彩铅颗粒、柔软轮廓、温暖但不俗艳，细节充满可发现的小故事", composition: "前景人物、中景行动、远景环境形成三层叙事，主要视线沿 S 形移动，边缘保留呼吸感", palette: ["#f2d59b", "#d7795c", "#547b75", "#313638"], source: sources[6] },
      { name: "复古丝网印刷", visual: "三色丝网印刷插画，有限色盘、粗糙套色偏移、几何阴影和复古出版物质感", composition: "用大形块先建立轮廓，再以小图案补充叙事；主体占画面 55%，标题区域保持干净", palette: ["#efe1bd", "#1f4c5a", "#e75d45", "#e8b648"], source: sources[8] },
    ],
  },
];

const models = ["通用", "GPT Image", "Gemini 图像", "Midjourney"];

function buildPrompt(
  category: Category,
  title: string,
  goal: string,
  kicker: string,
  style: { name: string; visual: string; composition: string },
  ratio: string,
) {
  const output = category === "PPT"
    ? "生成一张可直接作为演示文稿页面的完整视觉，不是网页 UI，不要画出笔记本电脑、投影幕或 PPT 软件界面。"
    : `生成一张完整的${category}成品，不要展示成相框、手机屏幕、设计软件界面或样机。`;
  const typeRule = category === "PPT"
    ? "标题 10–16 个汉字；正文最多 3 组，每组不超过 18 个汉字；关键数字比正文大 3 倍。若模型难以准确生成中文，保留清晰空白文字区和对齐基线，不要输出乱码。"
    : "中文主标题必须短而清楚；辅助信息控制在 2–4 组。若无法正确渲染文字，宁可保留干净留白，也不要生成伪汉字或乱码。";

  return `【任务】${output}\n\n【主题】“${title}”——${goal}。页面眉题可使用“${kicker}”，主标题请围绕主题重新提炼成一句有判断力的中文，不要写空泛口号。\n\n【视觉方向】${style.visual}。画面应像由成熟设计团队完成：克制、有网格、有明确的信息优先级，不要把所有元素平均铺满。\n\n【构图】${style.composition}。建立清晰的主视觉、第二信息层和脚注层；重要内容放在安全区内，边距一致，避免文字压住人物面部或产品关键结构。\n\n【信息设计】${typeRule} 字体层级至少包含主标题、章节标签、数据或关键词、脚注；数字和图标必须服务于叙事，不要装饰性堆砌。\n\n【质感与光线】材质细节真实，光线方向统一，阴影符合空间关系；保持高级印刷品或品牌发布物的完成度，画面锐利但不过度 HDR。\n\n【输出规格】画幅 ${ratio}，超清，边缘干净，适合后续在 PPT、社媒或印刷排版中继续编辑。\n\n【负面约束】不要水印、不要第三方 Logo、不要无意义英文、不要随机小字、不要乱码、不要重复物体、不要畸形手指、不要过度发光、不要俗艳渐变、不要廉价模板感、不要密集装饰。`;
}

const generatedPrompts: PromptItem[] = [
  ...pptTopics.flatMap((topic, topicIndex) =>
    pptStyles.map((style, styleIndex) => ({
      id: `ppt-${topicIndex + 1}-${styleIndex + 1}`,
      title: `${topic[0]} · ${style.name}`,
      subtitle: topic[1],
      category: "PPT" as const,
      style: style.name,
      model: models[(topicIndex + styleIndex) % models.length],
      ratio: "16:9",
      prompt: buildPrompt("PPT", topic[0], topic[1], topic[2], style, "16:9"),
      tags: [topic[2], style.name, topicIndex % 2 === 0 ? "封面" : "内容页"],
      palette: [...style.palette],
      source: style.source,
    })),
  ),
  ...secondarySpecs.flatMap((spec, specIndex) =>
    spec.topics.flatMap((topic, topicIndex) =>
      spec.styles.map((style, styleIndex) => ({
        id: `${spec.category}-${topicIndex + 1}-${styleIndex + 1}`,
        title: `${topic[0]} · ${style.name}`,
        subtitle: topic[1],
        category: spec.category,
        style: style.name,
        model: models[(specIndex + topicIndex + styleIndex) % models.length],
        ratio: spec.ratio,
        prompt: buildPrompt(spec.category, topic[0], topic[1], topic[2], style, spec.ratio),
        tags: [topic[2], style.name, spec.category],
        palette: style.palette,
        source: style.source,
      })),
    ),
  ),
];

const categoryOrder: Array<"全部" | Category> = ["全部", "PPT", "信息图", "海报", "产品视觉", "人物写真", "插画"];

function Preview({ item, large = false }: { item: PromptItem; large?: boolean }) {
  const style = {
    "--c1": item.palette[0],
    "--c2": item.palette[1],
    "--c3": item.palette[2],
    "--c4": item.palette[3],
  } as CSSProperties;

  return (
    <div className={`prompt-preview preview-${item.category} ${large ? "is-large" : ""}`} style={style} aria-label={`${item.title}的布局预览`}>
      <div className="preview-grid" />
      <span className="preview-kicker">{item.tags[0]}</span>
      <div className="preview-orbit preview-orbit-a" />
      <div className="preview-orbit preview-orbit-b" />
      <div className="preview-copy">
        <strong>{item.title.split(" · ")[0]}</strong>
        <span>{item.style} / PROMPT ATLAS</span>
      </div>
      <div className="preview-metric">
        <b>{String((item.id.length * 7) % 91 + 8).padStart(2, "0")}</b>
        <span>KEY VISUAL</span>
      </div>
      <div className="preview-bars"><i /><i /><i /></div>
      <span className="preview-ratio">{item.ratio}</span>
    </div>
  );
}

export default function Home() {
  const [category, setCategory] = useState<(typeof categoryOrder)[number]>("全部");
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("全部模型");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<PromptItem | null>(null);
  const [visible, setVisible] = useState(24);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("prompt-atlas-favorites");
      if (saved) queueMicrotask(() => setFavorites(JSON.parse(saved)));
    } catch { /* localStorage may be unavailable */ }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => Object.fromEntries(categoryOrder.map((name) => [name, name === "全部" ? generatedPrompts.length : generatedPrompts.filter((item) => item.category === name).length])), []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return generatedPrompts.filter((item) => {
      const categoryMatch = category === "全部" || item.category === category;
      const modelMatch = model === "全部模型" || item.model === model;
      const favoriteMatch = !onlyFavorites || favorites.includes(item.id);
      const haystack = `${item.title} ${item.subtitle} ${item.style} ${item.tags.join(" ")} ${item.prompt}`.toLowerCase();
      return categoryMatch && modelMatch && favoriteMatch && (!normalized || haystack.includes(normalized));
    });
  }, [category, model, onlyFavorites, favorites, query]);

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    try { window.localStorage.setItem("prompt-atlas-favorites", JSON.stringify(next)); } catch { /* no-op */ }
  }

  async function copyPrompt(prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setToast("提示词已复制");
    window.setTimeout(() => setToast(""), 1800);
  }

  return (
    <main className="site-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark">PA</span>
          <span><b>PROMPT ATLAS</b><small>生图提示词图鉴</small></span>
        </a>

        <nav className="side-nav" aria-label="提示词分类">
          <p>LIBRARY / 分类</p>
          {categoryOrder.map((name, index) => (
            <button key={name} className={category === name ? "active" : ""} onClick={() => { setCategory(name); setVisible(24); document.querySelector("#prompts")?.scrollIntoView({ behavior: "smooth" }); }}>
              <span><i>0{index}</i>{name}</span><em>{counts[name]}</em>
            </button>
          ))}
        </nav>

        <div className="side-note">
          <span>STATUS</span>
          <strong>公开来源 · 原创重构</strong>
          <p>不绕过付费墙，不复制会员原文。每条长提示词均可直接改写使用。</p>
        </div>

        <a className="side-source-link" href="#sources">查看公开来源 ↘</a>
      </aside>

      <section className="content" id="top">
        <header className="topbar">
          <span>JJ&apos;S VISUAL PROMPT INDEX</span>
          <div><i className="live-dot" /> 已整理 {generatedPrompts.length} 条</div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">PROMPT LIBRARY / 2026</span>
            <h1>把「好看」拆成<br /><em>可复制的结构。</em></h1>
            <p>重点收录 PPT 生图提示词，也覆盖信息图、海报、产品视觉、人物写真与插画。每条都包含视觉预览、完整提示词、分类与公开灵感来源。</p>
            <div className="hero-actions">
              <a href="#prompts" className="primary-action">浏览全部提示词 <span>↓</span></a>
              <a href="#sources" className="text-action">来源与使用说明</a>
            </div>
          </div>
          <div className="hero-board" aria-hidden="true">
            <div className="board-stamp">ORIGINAL<br />REBUILD</div>
            <span className="board-index">NO. 001—{generatedPrompts.length}</span>
            <strong>PPT<br />FIRST</strong>
            <p>75 presentation prompts<br />70 visual prompts</p>
            <div className="board-line" />
            <div className="board-tabs"><i /><i /><i /><i /></div>
          </div>
        </section>

        <section className="stats-strip" aria-label="内容统计">
          <div><b>{generatedPrompts.length}</b><span>原创长提示词</span></div>
          <div><b>{generatedPrompts.filter((item) => item.category === "PPT").length}</b><span>PPT 专项</span></div>
          <div><b>06</b><span>视觉分类</span></div>
          <div><b>{String(sources.length).padStart(2, "0")}</b><span>公开来源入口</span></div>
        </section>

        <section className="library" id="prompts">
          <div className="section-heading">
            <div><span>01 / PROMPT ARCHIVE</span><h2>提示词资料柜</h2></div>
            <p>当前显示 <b>{Math.min(visible, filtered.length)}</b> / {filtered.length}</p>
          </div>

          <div className="filters">
            <label className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(event) => { setQuery(event.target.value); setVisible(24); }} placeholder="搜索主题、风格、用途…" aria-label="搜索提示词" />
            </label>
            <select value={model} onChange={(event) => { setModel(event.target.value); setVisible(24); }} aria-label="按推荐模型筛选">
              <option>全部模型</option>
              {models.map((name) => <option key={name}>{name}</option>)}
            </select>
            <button className={`favorite-filter ${onlyFavorites ? "active" : ""}`} onClick={() => { setOnlyFavorites(!onlyFavorites); setVisible(24); }}>♡ 仅看收藏 {favorites.length ? `(${favorites.length})` : ""}</button>
          </div>

          <div className="mobile-categories">
            {categoryOrder.map((name) => <button key={name} className={category === name ? "active" : ""} onClick={() => { setCategory(name); setVisible(24); }}>{name}<sup>{counts[name]}</sup></button>)}
          </div>

          {filtered.length ? (
            <div className="prompt-grid">
              {filtered.slice(0, visible).map((item, index) => (
                <article className="prompt-card" key={item.id}>
                  <div className="card-index">{String(index + 1).padStart(3, "0")}</div>
                  <Preview item={item} />
                  <div className="card-body">
                    <div className="card-meta"><span>{item.category}</span><i>{item.ratio}</i><i>{item.model}</i></div>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                    <div className="tag-row">{item.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div>
                    <div className="card-source"><span>来源</span><a href={item.source.url} target="_blank" rel="noreferrer">{item.source.author} · {item.source.kind} ↗</a></div>
                    <div className="card-actions">
                      <button onClick={() => setSelected(item)}>查看完整提示词</button>
                      <button className="copy-button" onClick={() => copyPrompt(item.prompt)} aria-label={`复制${item.title}提示词`}>复制</button>
                      <button className={`heart ${favorites.includes(item.id) ? "active" : ""}`} onClick={() => toggleFavorite(item.id)} aria-label={favorites.includes(item.id) ? "取消收藏" : "收藏"}>{favorites.includes(item.id) ? "♥" : "♡"}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="empty-state"><b>没有找到对应提示词</b><span>换个关键词，或清除筛选条件。</span></div>}

          {visible < filtered.length && <button className="load-more" onClick={() => setVisible((count) => count + 24)}>继续展开 24 条 <span>↓</span></button>}
        </section>

        <section className="sources-section" id="sources">
          <div className="section-heading light">
            <div><span>02 / SOURCE DESK</span><h2>公开灵感来源</h2></div>
            <p>只链接公开页面，不代替原作者内容</p>
          </div>
          <div className="source-grid">
            {sources.map((source, index) => (
              <a href={source.url} target="_blank" rel="noreferrer" className="source-card" key={source.url}>
                <span className="source-number">S-{String(index + 1).padStart(2, "0")}</span>
                <em>{source.kind}</em>
                <h3>{source.name}</h3>
                <b>{source.author}</b>
                <p>{source.note}</p>
                <i>打开公开页面 ↗</i>
              </a>
            ))}
          </div>
          <div className="rights-note">
            <strong>版权与使用边界</strong>
            <p>本站的完整中文长提示词为原创重构，可作为学习与个人创作起点。外部案例、图片与作者页面的版权归原作者或平台所有；来源页面可能更新或下线。请勿将本站内容冒充为原作者会员资料，也不要用提示词生成侵权商标、人物肖像或受保护角色。</p>
          </div>
        </section>

        <footer>
          <div><span className="brand-mark small">PA</span><b>PROMPT ATLAS</b></div>
          <p>Built as a legal, public-source visual prompt index.</p>
          <a href="#top">返回顶部 ↑</a>
        </footer>
      </section>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <section className="prompt-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="关闭">×</button>
            <div className="modal-preview"><Preview item={selected} large /></div>
            <div className="modal-content">
              <div className="card-meta"><span>{selected.category}</span><i>{selected.style}</i><i>{selected.ratio}</i></div>
              <h2 id="modal-title">{selected.title}</h2>
              <p className="modal-subtitle">{selected.subtitle}</p>
              <div className="prompt-block">
                <div><b>完整提示词</b><button onClick={() => copyPrompt(selected.prompt)}>一键复制</button></div>
                <pre>{selected.prompt}</pre>
              </div>
              <div className="modal-source">
                <span>来源说明</span>
                <p>本提示词为本站原创重构；视觉方向参考了下方公开页面，不等同于原作者的付费提示词。</p>
                <a href={selected.source.url} target="_blank" rel="noreferrer">{selected.source.author} · {selected.source.name} ↗</a>
              </div>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </main>
  );
}
