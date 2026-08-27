# 确定原型设计规范 Skill 的内容边界

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 01

## Question

根据“清点原型设计规范 Skill 的最小来源闭包”的事实结果，确定哪些规则写入入口 `SKILL.md`，哪些按字体与视觉基础、内容、布局与栅格、组件、页面模式、交互状态和可访问性拆入 `references/`，哪些 tokens 或模板进入 `assets/`，以及哪些源文档、代码和展示材料不得进入当前仓库；同时确定复制、提炼和品牌中立化的处理边界。

## Answer

原型设计规范 Skill 采用品牌中立、HTML-first、渐进披露的内容结构。

1. **入口边界**：`SKILL.md` 只保存触发范围、HTML 原型工作流、参考资料路由，以及设计一致性、品牌清理和可访问性等不可违反的约束；详细设计规则不在入口重复。
2. **参考资料**：`references/` 固定包含 `foundations.md`、`content-guidelines.md`、`layout-and-grid.md`、`component-patterns.md`、`page-patterns.md` 和 `interaction-and-accessibility.md`。它们分别承载字体与视觉基础、内容规范、布局与栅格、组件模式、页面模式、交互状态与可访问性。
3. **机器可用样式**：从源 tokens 提炼并合并为品牌中立的 `assets/design-tokens.css`，供 AI 在 HTML 原型中直接复用；本阶段不复制 React 组件、图标或 HTML 模板。
4. **迁移方式**：规则采用提炼重写，保留会改变原型决策的数值和语义关系；删除生成内容中的第三方 Logo、品牌名称和品牌宣传文字。必要的技术来源信息只进入内部维护说明，不进入生成的 HTML。
5. **明确排除**：不复制 `node_modules/`、`dist/`、`.reference/`、`.tmp/`、React 组件实现、类型声明、展示卡、UI Kit、Vite 配置、完整示例应用、Logo、`COMPLETION_AUDIT.md`、源设计系统 README、构建说明、依赖锁文件或个人绝对路径。

HTML 是否限制为单文件、离线依赖、模板策略和具体交付验收标准留给“确定 HTML 原型的设计与交付契约”决定。

## Comments

- 2026-08-27：用户确认 Q1—Q4 全部按建议执行，本工单解决。
