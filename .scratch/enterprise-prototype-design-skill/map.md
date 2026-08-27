# 原型设计规范 Skill 引入地图

Label: wayfinder:map

## Destination

在当前仓库中交付并验证一个可供多人协作、可被 Codex 自动发现的仓库级“原型设计规范 Skill”：它主要指导 AI 生成 HTML 原型，并使字体、标题层级、布局、栅格、组件、交互状态与可访问性符合既定设计规范；生成的示例和原型不得出现第三方 Logo、品牌名称或品牌宣传文字。

## Notes

- 本地图明确覆盖 Wayfinder 默认的“只规划”边界：决策完成后继续包含 Skill 的创建、验证与协作交接，直到 Destination 达成。
- Skill 的统一名称为“原型设计规范 Skill”，目录名为 `enterprise-prototype-design`；它是仓库级代理协作能力，不是数据服务平台领域中的“平台 Skill 产品”。
- 仓库级安装位置使用 `.agents/skills/enterprise-prototype-design/`，并允许根据任务描述自动触发，同时保留 `$enterprise-prototype-design` 显式调用。
- 主要产物是 HTML 原型；是否限制为单文件、是否必须离线运行以及需要覆盖哪些响应式形态，由对应工单决定。
- 必须复用源设计系统中会改变 AI 设计决策的必要内容，但不得整包复制个人桌面目录。
- 品牌清理约束面向生成的示例和原型：不得出现第三方 Logo、品牌名称或品牌宣传文字；内部技术依赖和必要的来源追溯不伪造、不隐去。
- HTML 是默认原型格式；任务明确要求 React 时遵循用户指定的官方规范链接，Figma 社区组件库只作为内部视觉与变体参考，二者不得造成用户界面的品牌展示或远程运行依赖。
- 当前优先保证原型设计质量；默认只要求基础语义、对比度、可见焦点和控件关联，完整 Tab 顺序、焦点陷阱、焦点归还及纯键盘走查仅在任务明确要求键盘可访问性时进入范围。
- 每次处理 `grilling` 工单时使用 `$grilling` 与 `$domain-modeling`；创建或修改 Skill 时使用 `$skill-creator`；事实清点使用 `$research`；粗稿验证使用 `$prototype`。
- 领域语言以 [`CONTEXT.md`](../../CONTEXT.md) 为准；不得把本 Skill 与服务集市中的“平台 Skill 产品”混称。
- 源设计系统当前位于 `/mnt/c/Users/何峰/Desktop/Design system`，只作为迁移来源；个人绝对路径不得进入最终 Skill。
- 当前工作树已有其他协作者的未提交改动；本地图不得覆盖或夹带这些改动。

## Decisions so far

- [清点原型设计规范 Skill 的最小来源闭包](issues/01-research-minimal-source-closure.md) — 现有 Skill 不能原样复制；采用品牌中立、HTML-first 的入口与按需 references，只按决策需要保留规范化 CSS tokens，排除 React 实现、展示站点、构建环境和所有品牌展示。
- [确定原型设计规范 Skill 的内容边界](issues/02-decide-skill-content-boundary.md) — 入口只负责工作流、路由与硬约束，六份按需参考承载设计规则，并提供单一品牌中立 CSS tokens；React 实现、完整示例和品牌展示不进入当前仓库。
- [确定 HTML 原型的设计与交付契约](issues/03-decide-html-prototype-contract.md) — 默认交付离线自包含的桌面 Web 单 HTML，以 1440px 设计基线统一字体、栅格、tokens、组件状态、交互和可访问性，不承担平板或移动端适配。
- [确定 Skill 的多人协作与维护方式](issues/04-decide-collaboration-maintenance.md) — 仓库内 Skill 是唯一事实来源；协作者认领后以独立 Git 差异修改，人工选择性同步源规则，并以稳定名称、单一规则位置、来源记录和同行评审防止分叉。
- [验证原型设计规范 Skill 的内容组织](issues/05-prototype-skill-package.md) — 隔离分支 `prototype/enterprise-prototype-design` 的固定提交 `3f576e7` 验证了入口、按需参考、唯一 tokens、React/Figma 来源路由和品牌中立桌面 HTML；正式验收采用结构、静态内容和浏览器行为三层检查。
- [实施仓库级原型设计规范 Skill](issues/06-implement-repository-skill.md) — 已在 `.agents/skills/enterprise-prototype-design/` 落地短入口、六份设计规则、内部来源说明和唯一 CSS tokens，并以一条 `AGENTS.md` 指针支持自动发现与多人协作；未引入示例、构建依赖或多余元数据。
- [验证 Skill 行为与品牌安全](issues/07-validate-skill-and-brand-safety.md) — 仓库发现、显式调用入口、引用闭包、唯一 tokens、品牌隔离和 1200–1440px 桌面行为均已验证；修正后的固定原型提交为 `ec017d6`，完整键盘路径按用户最新要求改为显式需求才验收。
- [确认原型设计规范 Skill 可供多人协作使用](issues/08-accept-collaboration-readiness.md) — 正反自动路由、正式维护路径和独立同行复审均通过；该 Skill 已接受为当前仓库唯一的项目级原型设计规则入口，隔离验证分支最终固定提交为 `97e5929`。

## Destination status

已达成。仓库级 Skill 的内容、原型行为、品牌隔离、自动触发边界和多人维护流程均已有可复查证据；当前地图没有待解决工单。

## Validation boundary

- 自动检查负责 Skill 结构、禁用内容、关键 tokens、桌面限定和 HTML 基础结构；浏览器行为检查负责控制台、桌面溢出、主要交互状态和反馈路径。无需截图像素对比、移动端测试或默认执行完整 Tab/焦点路径测试。

## Out of scope

- 把源设计系统的 `node_modules/`、`dist/`、`.reference/`、`.tmp/` 或完整展示站点复制到当前仓库。
- 建设或发布生产级 React 组件库、npm 包、Storybook 或独立设计系统站点。
- 在生成的示例或原型中展示任何第三方 Logo、品牌名称或品牌宣传文案。
- 建设 Figma 组件库，或把设计系统推广到当前仓库之外的其他项目。
- 实现数据服务平台正式前端产品；本地图只交付指导 AI 设计原型的仓库级 Skill。
