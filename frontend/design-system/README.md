# AgenticOS 设计系统

状态：v1，桌面亮色原型基线
更新日期：2026-09-01

本目录是 AgenticOS 新前端设计规范的唯一权威来源。它由真实系统 Playwright 采集、现有 React/Tailwind 实现和领域原型治理式提炼而成，供人和 AI 共同使用。

## 文件导航

| 文件 | 职责 |
| --- | --- |
| [`tokens.css`](./tokens.css) | 颜色、字体、尺寸、间距、圆角、阴影和壳层几何的唯一数值源 |
| [`foundations.md`](./foundations.md) | 字体、标题、颜色、布局、局部网格和桌面边界 |
| [`components.md`](./components.md) | 基础组件、复合组件、状态与使用约束 |
| [`patterns.md`](./patterns.md) | 列表、详情、表单、配置、监控、数据资产和 AI 场景的页面模式 |
| [`migration.md`](./migration.md) | 既有页面、旧 `--ds-*` 原型和 React 实现的自动迁移门槛与验收流程 |
| [`ai-guide.md`](./ai-guide.md) | AI 生成、迁移和视觉审查流程及验收清单 |
| [`evidence-index.md`](./evidence-index.md) | Playwright、组件源码和数据服务运行原型的证据范围、分歧裁决与组件映射 |
| [`example.html`](./example.html) | 可离线打开的综合示例，不是新的规范副本 |
| [`validate.mjs`](./validate.mjs) | 检查必要文件、token 使用和退役体系引用 |

## 证据与裁决

规范已经形成后，新页面首先遵循本目录。遇到未覆盖场景时先查 [`evidence-index.md`](./evidence-index.md)，再回看对应证据，并把经过确认的结论补回本目录。2026-09-01 的对齐审计已关闭公共壳层、基础组件和数据服务原型中的已知分歧，没有未解决的 v1 阻断项。

1. 视觉、壳层和只读交互事实：`output/playwright/seabox-system-management-detail-audit/20260901T011050Z/`；
2. React/Tailwind 实现参考：`D:\cursor\agenticos-asset-center-frontend`；
3. 数据服务领域补充：该项目中的 `asset-service-prototype.html`；
4. 业务内容、状态和流程：当前源码及 `prototypes/`；
5. 产品术语：仓库根目录 `CONTEXT.md`。

旧 `$enterprise-prototype-design` 及其 `design-tokens.css` 已删除。`DESIGN-SPEC.md` 和遗留 `--ds-*` 原型仅是历史材料，不参与新页面裁决。

## 适用范围

- AgenticOS 全部桌面 Web 页面与原型；
- 系统管理、资产中心、数据服务、AI 服务开发、运行管理等产品域；
- HTML 原型和 React 19 + Tailwind CSS 4 实现；
- 亮色主题，基准视口为 1440×900。

v1 不承诺移动端、暗色主题、独立 npm 组件包或完整生产应用入口。

## 接入方式

HTML 原型直接引用：

```html
<link rel="stylesheet" href="../frontend/design-system/tokens.css">
```

路径按原型所在目录调整。React/Tailwind 项目在全局样式中导入该文件，组件继续使用 `var(--color-*)`、`var(--space-*)` 等语义变量。Tailwind 负责布局组合，tokens 负责视觉数值。

需要设计、迁移、生成、修改或审查 AgenticOS 页面时，由用户显式输入 `$agenticos-design-system` 调用。显式调用后的迁移任务会由 Skill 加载 [`migration.md`](./migration.md)。完成后运行：

```bash
node frontend/design-system/validate.mjs
```

## 变更原则

- 新增 token 前先确认现有语义无法表达需求；
- 页面不得建立自己的品牌色、间距体系或标题层级；
- 领域特有状态可扩展语义 token，但需说明业务含义和证据来源；
- 修改数值时只改 `tokens.css`，同步检查示例和受影响页面；
- 现有原型迁移时保留业务结构与状态，仅替换视觉实现。
