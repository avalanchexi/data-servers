---
name: enterprise-prototype-design
description: Design, generate, revise, or review brand-neutral desktop Web prototypes for this repository. Use for offline HTML mockups and explicitly requested React prototypes such as admin pages, dashboards, lists, forms, and interaction demos; do not use for production frontend implementation, component-library development, or ordinary documentation.
---

# 原型设计规范 Skill

## 目标

为当前仓库生成可离线打开、自包含、品牌中立的桌面 Web HTML 原型。原型应使用统一 tokens，并保持清晰的信息层级、真实交互和桌面可访问性。

## 开始前

1. 读取仓库领域文档，使用其中的正式术语和状态名称。
2. 读取 [视觉基础](references/foundations.md) 与 [布局和栅格](references/layout-and-grid.md)。
3. 根据任务按需读取：
   - 编写页面文案时读取 [内容规范](references/content-guidelines.md)。
   - 使用表单、表格、弹窗或复杂状态时读取 [组件模式](references/component-patterns.md)。
   - 新建工作台、列表、表单或登录类页面时读取 [页面模式](references/page-patterns.md) 中对应部分。
4. 实现交互或交付前读取 [交互与可访问性](references/interaction-and-accessibility.md)。
5. 维护本 Skill、核对来源，或任务明确要求 React/设计源对照时才读取 [来源说明](references/provenance.md)。

不要一次性加载与当前页面无关的参考内容。

## 输出契约

- 默认交付一个 `.html` 文件，CSS 和 JavaScript 内联，不依赖网络、CDN、远程字体、远程图片或在线组件库。
- 只有任务明确要求 React 时才改变交付技术；组件外观与行为遵循来源说明中的官方规范，但生成界面仍保持品牌中立。
- 只面向桌面 Web，以 `1440×900` 为主要设计和验收视口；不实现平板或移动端适配。
- 从 [design-tokens.css](assets/design-tokens.css) 选取并内联所需语义 tokens；不要另建平行颜色、间距或字号体系。
- 使用语义 HTML。已展示的导航、筛选、分页、校验、弹窗和反馈必须可操作。
- 使用真实、简洁的中文业务数据和文案；未知值显示“—”。
- 不出现第三方 Logo、品牌名称、宣传文字、emoji 图标或个人绝对路径。
- 页面如需图标，使用风格一致、品牌中立的内联 SVG，并提供正确的可访问名称或 `aria-hidden`。

## 硬约束

- 页面整体在支持的桌面视口不得横向溢出；宽表格只能在自身容器内滚动。
- 同一任务区域只有一个主操作；危险操作必须明确对象、影响并二次确认。
- 正文对比度至少 `4.5:1`；使用原生交互元素并保留 `:focus-visible`，完整 Tab 顺序与焦点管理只在任务明确要求时实现。
- 表单标签、帮助、错误与控件建立程序化关联；颜色不是唯一的状态表达。
- 支持 `prefers-reduced-motion`。
- 不实现原型没有展示或验证价值的后台逻辑。

## 交付检查

1. 双击 HTML 可以离线运行，控制台没有错误。
2. 在 `1440×900` 和常见桌面宽度检查布局、表格和弹窗。
3. 走通导航、筛选、主要操作、弹窗和关闭路径；任务明确要求键盘可访问性时，再检查 Tab 顺序、焦点陷阱与焦点归还。
4. 检查标题层级、tokens、组件状态、空状态、错误状态和反馈。
5. 搜索第三方品牌词、Logo 引用、远程 URL、emoji 和个人绝对路径。
