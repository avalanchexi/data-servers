# 设计系统证据与分歧索引

状态：2026-09-01 已对齐
结论：公共壳层、基础组件和数据服务参考原型不存在未裁决的 v1 设计分歧。

本文件只记录来源、覆盖范围和裁决结果，不复制规范数值。视觉规则以本目录其他规范文件为准，业务术语以仓库根目录 `CONTEXT.md` 为准。

## 1. 证据登记

| ID | 来源 | 证据角色 | 当前范围 |
| --- | --- | --- | --- |
| E-01 | [`coverage-report.md`](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/coverage-report.md) | 目标系统采集完整性 | 当前账号可见的系统管理 8 个模块、41 个状态，阻断缺口为 0 |
| E-02 | [`states/`](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/) 与 [`screenshots/`](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/screenshots/) | 壳层、字体、密度、只读交互和页面结构事实 | 1440×900 桌面亮色基线 |
| E-03 | [`src/themes/themes.css`](../agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/themes/themes.css) 与 [`src/components/ui/`](../agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/components/ui/) | React/Tailwind 变量、组件 API、状态与权限适配 | 仓库内源码快照 |
| E-04 | `D:\cursor\agenticos-asset-center-frontend` | E-03 的技术载体参考库 | React 19、TypeScript、Tailwind CSS 4；不是未经治理的规范源 |
| E-05 | `D:\cursor\agenticos-asset-center-frontend\asset-service-prototype.html` | 数据服务结构、页签、空态、操作和交互语义 | 服务集市、数据应用、授权审核、运行监控、网关策略、设置 |
| E-06 | `http://127.0.0.1:8765/asset-service-prototype.html` | E-05 的用户侧参考运行地址 | 2026-09-01 审计环境无法直接访问该用户进程；同一文件经本地 HTTP 等价渲染验证 |
| E-07 | `prototypes/` 与当前业务源码 | 已有页面的内容、状态、动作和流程 | 视觉实现需要逐页迁移，旧 `--ds-*` 不参与裁决 |

证据优先级不是单一全局排序：视觉和只读交互由 E-01/E-02 裁决，组件 API 与业务行为由 E-03/E-04 裁决，数据服务的页面任务由 E-05/E-06 补充。完整原则见 [`frontend/alignment.md`](../alignment.md) 的 D-003、D-006、D-008 和 D-017。

## 2. Playwright 覆盖索引

每个编号在最新采集目录中同时对应一个状态 JSON 和一张全页截图。

| 模块 | 状态编号 | 已覆盖入口 |
| --- | --- | --- |
| 系统监控 | 001–008 | Dashboard、定时任务、日志监控、应用缓存、LLM 缓存、向量表、SQLite 数据库 |
| 系统配置 | 009–013 | 环境配置、应用配置、分析报告模板、字典配置 |
| 权限管理 | 014–020 | 用户管理、组织管理、角色管理、功能菜单、功能权限、IM 用户映射 |
| 消息管理 | 021–023 | 消息列表、消息模板 |
| 安全合规 | 024–029 | 概览、合规事件、策略配置、安全回答、LLM 安全 |
| 风险监管 | 030–033 | 风险模型构建、风险预警、风险闭环处置 |
| 系统审计 | 034–037 | 审计日志、用量统计、日志管理 |
| 反馈回测 | 038–041 | 反馈中心、评测集管理、回归测试 |

## 3. 组件实现索引

以下映射帮助 AI 找到行为证据；规范用法仍读取 [`components.md`](./components.md) 和 [`tokens.css`](./tokens.css)。

| 组件组 | 源码入口 | 主要规范位置 |
| --- | --- | --- |
| 操作与输入 | `Button`、`Input`、`Textarea`、`Select`、`SearchableSelect`、`Combobox`、`UserCombobox`、`Cascader`、`DatePicker`、`MonthRangePicker`、`RadioGroup`、`Slider` | `components.md` 的基础组件、工具栏、表单与选择器 |
| 导航与范围定位 | `Tabs`、`Pagination`、`Tree` | `components.md` 的页签、分页与通用状态；`patterns.md` 的列表和树表模式 |
| 数据展示 | `Card`、`Table`、`TreeTable`、`StatusBadge` | `components.md` 的数据表格和状态语义 |
| 浮层与反馈 | `Modal`、`Drawer`、`ConfirmDialog`、`Message`、`InlineAlert`、`EmptyState`、`Tooltip` | `components.md` 的反馈与浮层 |
| 领域组合 | `src/components/asset/` 与 `src/pages/home/asset-center/` | `components.md` 的领域复合组件；`patterns.md` 的数据资产、监控、数据服务与 AI 模式 |

源码导出入口为 [`src/components/ui/index.ts`](../agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/components/ui/index.ts)。新增近似组件前先检查该入口。

## 4. 分歧审计

| 审计项 | 观察到的差异 | 裁决与落点 | 状态 |
| --- | --- | --- | --- |
| 壳层与字体 | 数据服务 HTML 在 100% 浏览器下包含约 125% 的参考放大值；目标系统 41 个状态保持另一套一致几何 | HTML 只提供数据服务任务和交互证据；公共视觉使用 E-02 实测结果，见 `tokens.css` 与 `foundations.md` | 已裁决 |
| 控件密度 | 目标系统工具栏大量使用 sm，源码同时支持 sm/md/lg；原说明曾把中号写成普遍下限 | 明确标准表单默认 md，高密度工具栏、表格和分页可用 sm，强调页签用 lg | 已修正 |
| 组件变量 | 参考组件引用的部分语义变量未被第一版 `tokens.css` 覆盖 | 补齐实现兼容语义；校验器扫描仓库内 React 源码的全部 `var(...)` 引用 | 已修正 |
| 主操作 | 目标系统用纯主色表达选择态，React `Button` 用品牌渐变表达 primary | 选择态保持纯主色，独立 primary 操作用品牌渐变；两者不混为一种状态 | 已裁决 |
| StatusBadge | 源码徽标比综合示例更紧凑 | 新增组件级 padding tokens，示例与源码契约对齐 | 已修正 |
| Tabs 交互 | 参考组件和数据服务运行原型支持方向键，综合示例最初只支持鼠标 | 综合示例补齐 `ArrowLeft`/`ArrowRight`/`Home`/`End`、焦点移动和 tabpanel 关联 | 已修正 |
| 圆角 | 主题文件的抽象半径与 Tailwind 组件实际 `rounded-*` 不完全相同 | 以已使用的组件形状和治理后的四级半径为准，不复制未使用的主题档位 | 已裁决 |
| 标题语义 | 目标系统页面标题多数为 `h2`，独立数据服务原型使用 `h1` | 完整壳层允许产品级 `h1` + 页面 `h2`；独立原型使用 `h1`，视觉 token 相同 | 已裁决 |
| 暗色主题 | 参考源码包含暗色变量，当前 Playwright 基线是亮色 | 按 D-012 留待后续，不属于 v1 分歧或阻断项 | 超出范围 |

## 5. 数据服务运行验证

2026-09-02 使用与 E-05 相同的 HTML 文件进行 1440×900 等价 HTTP 渲染：页面成功加载，无控制台错误；六个页签具有 `tablist`/`tab`/`tabpanel` 语义；鼠标切换与方向键切换均更新选中页签和面板。运行监控只呈现五个运行页面，网关策略只呈现策略管理与配置发布；设置保留集市产品类型、认证与密钥策略、类型专属限制三个目录入口及其编辑、校验和确认交互。该验证只证明原型结构和交互可用，不把原型内的显示缩放值升级为公共设计 token。

## 6. 已知证据边界

- 当前没有资产中心 9 个一级页面的逐页 Playwright 截图和结构化状态；涉及这些页面的领域专属视觉决定需使用源码证据并标记为 evidence-derived，不能声称已被目标系统截图验证。
- v1 不验收暗色、移动端或生产级组件包。
- Playwright 完整性只适用于采集账号可见的菜单、标签和路由。

在这些边界内，本轮没有未解决的 P0/P1 分歧。新增证据若改变当前裁决，应先更新 [`frontend/alignment.md`](../alignment.md)，再修改规范文件和本索引。
