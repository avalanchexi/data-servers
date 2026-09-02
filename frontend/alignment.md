# 前端规范对齐记录

状态：决策已确认，第一版已交付
更新日期：2026-09-01

## 目标

以项目源码和真实系统 Playwright 证据为输入，建立单一、可执行、可验收的前端规范基线，并明确视觉事实、业务行为和实现代码各自的权威边界。

## 已确认的决策

### D-001：弃用原有设计系统

原有设计系统整体弃用。以下资产不再作为 `frontend/` 的规范来源：

- 根目录 `DESIGN-SPEC.md`；
- `.agents/skills/enterprise-prototype-design/` 中的旧原型规范；
- 旧 `design-tokens.css` 及 `--ds-*` token 体系；
- 以旧规范为前提形成的页面级视觉约束。

`DESIGN-SPEC.md` 和旧原型暂时保留为历史材料和迁移比对依据，不应被新代码继续复制。原 `.agents/skills/enterprise-prototype-design/` 已在新规范落地后删除，根目录 `AGENTS.md` 只指向新的项目级 Skill。

### D-002：采用 `frontend` 作为目录名

根目录使用标准拼写 `frontend/`。此前创建的 `fronted/` 已整体更名，相关代理指令和文档引用已同步更新。

### D-003：确认源码与真实系统证据位置

- 项目源码：`frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/`；
- 技术载体参考库：Windows `D:\\cursor\\agenticos-asset-center-frontend`，在当前环境对应 `/mnt/d/cursor/agenticos-asset-center-frontend/`；
- 真实系统 Playwright 采集：`output/playwright/`；
- 对齐时不再把旧原型设计系统作为第三套裁决来源。

技术载体参考库用于核对 React、Tailwind、主题变量、共享组件和现有页面实现。它是迁移实现基线，但未经治理的源码不直接成为新设计系统的规范权威。

### D-004：新设计系统必须可被 AI 直接使用

新设计系统不是只供人阅读的视觉说明，也不是单个 HTML 模板；它必须为 AI 提供明确、可检索、可组合和可校验的设计引导。规范至少覆盖：

- 页面壳层、内容区、列表／详情／编辑等布局模式；
- 栅格、宽度、间距、密度和响应边界；
- 字体族、字号、字重、行高、标题层级和正文语义；
- 品牌色、中性色、语义色、表面、边框、交互状态和数据可视化配色；
- 基础组件、复合组件、业务模式、状态与变体；
- AI 在生成页面时的选择规则、禁止组合、完整示例和验收方法。

最终交付需要同时具有规范性描述和可执行约束，使 AI 生成的页面能够通过 token、组件、布局和视觉回归规则验证。

### D-005：覆盖整个 AgenticOS 与全部现有原型

新设计系统的目标范围是整个 AgenticOS，不限于当前 Playwright 已完整采集的系统管理，也不限于资产中心。数据服务及 `prototypes/` 中的全部设计原型均属于覆盖范围。

当前系统管理 8 个模块、41 个页面／标签状态用于建立第一阶段公共基线；资产中心、数据服务和其他产品域需要通过源码、专项采集和原型清单继续补齐领域模式。完成公共基线不等于完成整站覆盖。

### D-006：采用治理式提炼而非原样固化或重新设计

新设计系统保留真实 AgenticOS 的品牌识别、整体视觉语言、主要布局和已验证交互，同时归一化近似颜色、间距、圆角、层级、组件变体、交互状态和可访问性问题。Playwright 事实用于识别产品现状，但单个页面中的偶然实现和不一致不自动升级为规范。

这一选择既不原样复制现有缺陷，也不脱离真实系统重新发明另一套视觉语言。

### D-007：新建仓库级设计 Skill 作为 AI 使用入口

新设计系统需要提供一个新的、面向 AgenticOS 的设计 Skill，供 AI 在设计、生成、修改和审查页面时调用。已退役的 `$enterprise-prototype-design` 不恢复、不继承为新规范入口。

Skill 位于 `.agents/skills/agenticos-design-system/`，仅支持用户通过 `$agenticos-design-system` 显式调用；它只负责引导 AI 使用 `frontend/design-system/` 中的唯一规范源。

### D-008：现有原型保留业务证据，视觉实现按新规范迁移

`prototypes/` 中的现有页面继续作为业务内容、信息架构、页面状态和操作流程的证据；其中沿用旧 `--ds-*` tokens、旧组件样式或旧版视觉规则的部分不再具有规范权威。

迁移时保留经过确认的业务结构与交互语义，视觉 token、组件外观、布局细节和状态表达统一切换到新设计系统；不能把视觉改版误当成业务流程重写。

### D-009：采用面向原型阶段的三层轻量技术载体

新设计系统采用以下三层载体：

1. `frontend/design-system/` 保存颜色、字体、间距、栅格、圆角等公共 tokens 与规范资产；
2. 以 `D:\cursor\agenticos-asset-center-frontend` 的 React 19 + Tailwind CSS 4 实现为参考，沉淀共享组件契约和使用示例；
3. HTML 原型复用同一套 tokens 和页面模式，不再维护另一套独立视觉体系。

当前处于原型设计阶段，暂不建设独立 npm 包或复杂组件展示站点。现有项目是实现基线而非未经治理的规范权威；其硬编码颜色、未闭合变量、重复页面壳层和零散尺寸需要在提炼时归一化。

### D-010：Skill 仅由用户显式触发

新 Skill 不参与自动发现。只有用户显式输入 `$agenticos-design-system` 时才调用；仅描述 AgenticOS 页面设计、生成、修改或视觉审查任务不会自动触发。

### D-011：Skill 是 AI 入口，设计规范只有一个权威来源

`frontend/design-system/` 是 tokens、布局、组件和页面模式的唯一规范来源；`.agents/skills/agenticos-design-system/` 负责指导 AI 按任务读取、应用和校验规范。

Skill 不复制 token 数值或维护另一套视觉规则，避免重新形成“规范文档、Skill、源码”彼此冲突的多套标准。

### D-012：第一版只正式规范和验收亮色主题

参考项目中的暗色变量保留为待治理能力，但当前 Playwright 主要证据为亮色系统，因此第一版不承诺暗色页面质量，也不把暗色适配作为交付阻塞项。

### D-013：第一版定位为桌面 Web

第一版规定桌面栅格、常用内容宽度、密度和窄窗口防溢出规则，不单独建立移动端组件与页面模式。现有页面中的少量响应式写法可作为兼容实现，但不构成移动端设计承诺。

### D-014：第一版交付五类可供 AI 使用的规范资产

第一版包含：

1. 基础 tokens；
2. 布局、栅格、字体与标题规范；
3. 基础组件和业务组件规则；
4. 列表、详情、表单、监控、配置等页面模式；
5. AI 生成规则、示例和验收清单。

内容深度保持与现有原型相当，不扩展到生产级组件包、完整无障碍认证或复杂前端基础设施建设。

### D-015：本轮不批量迁移全部现有原型

本轮创建新设计系统和对应 Skill，并以一个综合示例页验证规范。现有原型暂不批量改写，后续按页面或产品域逐步迁移。

### D-016：新 Skill 命名为 `$agenticos-design-system`

仓库目录为 `.agents/skills/agenticos-design-system/`，用于 AgenticOS 前端设计、生成、修改和视觉审查任务。

### D-017：数据服务原型作为领域证据补充

`D:\cursor\agenticos-asset-center-frontend\asset-service-prototype.html`（当前环境为 `/mnt/d/cursor/agenticos-asset-center-frontend/asset-service-prototype.html`）纳入第一版证据范围，用于补充数据服务的页面结构、六个任务页签、状态、操作和领域组件模式。

该文件不能取代 Playwright 对目标网站的设计事实。字体、壳层尺寸、颜色、密度或组件外观发生冲突时，以 `output/playwright/` 中目标网站证据为准；业务结构和交互语义则结合源码与该原型判断。

### D-018：字体和布局采用目标网站实测基线

第一版采用 Playwright 采集确认的字体栈：`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`。页面标题约为 20px，常规正文和表格以 14–16px 为主，紧凑辅助信息为 12px。

41 个系统管理状态均在 1440×900 视口中呈现相同主壳层：内容卡片为 `(x: 260, y: 76, width: 1160, height: 804)`。据此确认 56px 顶栏、240px 侧栏和 20px 工作区边距。页面使用全宽弹性内容卡片，不强制套用全局 12 栏栅格；局部根据内容采用 Flex、双栏或三栏网格。间距使用 4px 基础序列，以 16、20、24、32px 为主要页面间距。

### D-019：数据服务参考运行不覆盖公共视觉基线

`http://127.0.0.1:8765/asset-service-prototype.html` 是 `asset-service-prototype.html` 的用户侧参考运行地址。2026-09-01 对同一文件的等价 HTTP 渲染已验证五个页签、空态、鼠标切换、方向键切换和控制台状态。

该原型为了复现特定显示缩放，在 100% 浏览器视口下包含约 125% 的尺寸放大。当前六个页签为服务集市、数据应用、授权审核、运行监控、网关策略和设置；运行监控与网关策略分别保留自身的二级页面状态，设置保留域级共用配置的目录与详情结构。它继续用于裁决数据服务的页面结构和交互语义，不覆盖 D-018 中由目标系统 41 个 Playwright 状态确认的字体、壳层、密度与组件视觉基线。具体来源映射和分歧处理见 `frontend/design-system/evidence-index.md`。

### D-020：显式调用后的迁移任务进入受控流程

用户显式调用 `$agenticos-design-system` 后，既有页面、旧原型和退役 `--ds-*` 视觉体系的迁移进入受控流程。命中迁移条件时，Skill 在编辑前读取 `frontend/design-system/migration.md`，并按其中四个 Gate 完成业务证据冻结、规范映射、实施和验证。

`DESIGN-SPEC.md` 继续作为历史归档，只用于识别遗留 tokens、类名和页面意图；它不进入当前视觉数值裁决。迁移冲突仍由 `frontend/design-system/evidence-index.md` 与本文件处理。

## 仓库现状

项目源码是从 AgenticOS 导出的“资产中心”业务域包，当前盘点结果如下：

- 技术栈为 React 19、TypeScript 5.6、Vite 5、Tailwind CSS 4、Zustand、Axios、Vitest；
- `src/` 共 190 个文件，其中资产中心页面域 73 个文件、测试文件 16 个；
- 包含资产中心 9 个一级页面、共享 UI 组件、主题变量、API 客户端及权限适配；
- 现有主题使用 `--color-*`、`--radius-*`、`--space-*`，与已弃用的 `--ds-*` 体系不同；
- 当前导出包没有 `index.html`、`main.tsx`、`App.tsx` 或完整路由入口；`vite.config.ts` 仍引用缺失的 `index.html`、`wecom.html` 和测试初始化文件，因此它不是可直接启动的完整应用；
- 外层还存在一层同名包装目录和 `__MACOSX` 解压元数据，尚未做目录归一化。

Playwright 最新完整采集轮次为 `output/playwright/seabox-system-management-detail-audit/20260901T011050Z/`：

- 覆盖系统管理 8 个模块、41 个页面或标签状态，覆盖审计无阻断缺口；
- 包含 41 张全页截图、结构化状态和脱敏网络证据；
- 网络证据确认了资产中心 9 个菜单标识及整站导航关系；
- 当前没有资产中心 9 个页面及其页签的逐页截图或结构化状态。

因此，现有 Playwright 证据足以校准整站壳层、主题语言、导航和共享组件，但不足以单独完成资产中心页面级视觉与交互验收。

产品语言仍由根目录 `CONTEXT.md` 统一管理。它描述的是“数据服务平台 / 数据服务域”，而现场研究覆盖的是更大的 Seabox AI 整站，两者范围不能默认等同。

## 已识别的迁移冲突

| 维度 | 项目源码 | 真实系统证据 | 对齐结论 |
| --- | --- | --- | --- |
| 业务范围 | 资产中心 9 个一级页面 | 系统管理 8 个模块、41 个状态 | 页面证据范围不匹配 |
| 规范性质 | 可执行实现与 API 契约 | 观察性视觉、结构和运行证据 | 需要形成新的规范性文档 |
| 技术交付 | 业务域导出包，缺完整入口 | 已部署真实系统 | 需确认独立运行或回并方式 |
| 视觉语言 | 已有 `--color-*` 主题和共享组件 | 可验证壳层与系统管理页面 | 资产中心仍需专项采集 |
| 业务行为 | 页面逻辑、权限与 API 客户端 | 当前只读采集，不覆盖写操作 | 源码与后端契约优先 |
| 验收证据 | 16 个已有测试文件 | 截图、状态 JSON、网络证据 | 需建立对应关系与回归检查 |

## 建议的规范分层

建议建立四层来源：

1. `CONTEXT.md`：产品术语和业务语义；
2. 项目源码与 API 契约：业务行为和实现边界；
3. Playwright 真实系统采集：视觉、布局、内容结构和只读交互事实；
4. 由前两类事实提炼的新规范、tokens、组件契约与自动化验收。

发生冲突时，建议由真实系统裁决视觉与只读交互，由源码和后端契约裁决业务行为；不能验证的部分明确标为待确认。

## 本轮实施边界

- 建立 `frontend/design-system/` 的规范、tokens、页面模式、AI 指南和综合示例；
- 建立 `$agenticos-design-system` Skill 并接入仓库指令；
- 不改写现有产品源码，不批量迁移旧原型；旧 Skill 已按确认删除，其余历史设计资产暂时保留；
- 资产中心专项采集、暗色主题、移动端和生产级组件包留待后续迭代。

## 第一版交付

- 规范入口：`frontend/design-system/README.md`；
- 可执行 tokens：`frontend/design-system/tokens.css`；
- 基础、组件、页面模式与 AI 指南：`frontend/design-system/*.md`；
- 综合示例：`frontend/design-system/example.html`；
- 自动校验：`node frontend/design-system/validate.mjs`；
- AI 入口：`.agents/skills/agenticos-design-system/`。
