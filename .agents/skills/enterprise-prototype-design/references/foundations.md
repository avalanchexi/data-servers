# 视觉基础

## Tokens 优先

精确数值以 `../assets/design-tokens.css` 为准。页面 CSS 使用 `--ds-*` 语义变量，不复制第二套调色板、间距或阴影定义。

## 字体层级

| 用途 | 使用 tokens |
| --- | --- |
| 辅助信息 | `--ds-font-size-12` / `--ds-font-weight-regular` |
| 正文、控件、表格 | `--ds-font-size-14` / `--ds-font-weight-regular` |
| 模块标题、弹窗标题 | `--ds-font-size-16` / `--ds-font-weight-medium` |
| 页面标题 | `--ds-font-size-20` 或 `--ds-font-size-24` / `--ds-font-weight-medium` |
| 需要强调的数字 | `--ds-font-size-24` 或 `--ds-font-size-36` / `--ds-font-weight-medium` |

- 使用系统字体回退，不请求远程字体。
- 正文行高使用 `--ds-line-height-base`，紧凑标题使用 `--ds-line-height-tight`。
- 使用语义化 `h1–h3`；不要仅靠字体大小模拟结构。
- 用字重 tokens 表达层级，正文和普通标题优先 regular 或 medium。

## 色彩

- 主操作、链接、选中和焦点使用 primary 语义色。
- 正文、次级文本、辅助文本分别使用 `--ds-text-1/2/3`。
- 页面画布使用 `--ds-bg-canvas`，主要容器使用 `--ds-bg-surface`。
- 成功、警告、危险颜色只表达对应语义；必须同时配合文字或形状。
- 同一指标在同一原型中保持相同数据色。

## 圆角、边框与阴影

- 按钮、输入和标签通常使用 `--ds-radius-small`。
- 表格、卡片和弹窗通常使用 `--ds-radius-medium`；较大的展示容器才使用 `--ds-radius-large`。
- 普通边界使用细实线与 `--ds-border-2`。
- 阴影只表达浮层高度：普通浮层用 `--ds-shadow-1`，弹窗用 `--ds-shadow-3`。

## 动效

- 即时反馈、常规状态切换和复杂进入分别使用 fast、base、slow 动效 tokens。
- 动效服务于状态变化，不作为装饰。
- `prefers-reduced-motion: reduce` 下将持续时间归零。
