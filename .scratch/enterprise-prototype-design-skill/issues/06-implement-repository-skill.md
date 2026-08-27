# 实施仓库级原型设计规范 Skill

Type: task
Status: resolved
Parent: ../map.md
Blocked by: 05

## Question

按照已确认的内容组织，在 `.agents/skills/enterprise-prototype-design/` 中创建最终 `SKILL.md`、必要的 `references/`、`assets/` 和可选元数据；从源设计系统复制或提炼已批准的必要内容，移除示例和原型中的第三方 Logo、品牌名称及品牌宣传文案，并在 `AGENTS.md` 中补充对多人协作者有用且不重复 Skill 内容的入口说明。

## Answer

已在当前主工作树完成仓库级原型设计规范 Skill：

- 入口：`.agents/skills/enterprise-prototype-design/SKILL.md`
- 唯一精确数值来源：`.agents/skills/enterprise-prototype-design/assets/design-tokens.css`
- 按需参考：`foundations.md`、`content-guidelines.md`、`layout-and-grid.md`、`component-patterns.md`、`page-patterns.md`、`interaction-and-accessibility.md`
- 内部来源与 React/Figma 边界：`references/provenance.md`

最终入口保留自动发现所需的 model-facing `description`，覆盖桌面 Web HTML 原型以及任务明确要求的 React 原型，同时排除生产前端实现、组件库开发和普通文档任务。正文只保留工作流、按需路由、HTML-first 输出契约、品牌中立硬约束和交付检查；设计细节没有复制到入口或 `AGENTS.md`。

`AGENTS.md` 已增加一条简短指针：设计、生成、修改或审查桌面 Web 原型时使用 `$enterprise-prototype-design`，规则以仓库目录为唯一事实来源，并继续用 `CONTEXT.md` 区分平台产品术语 `Skill`。

本阶段没有加入 `agents/openai.yaml`：自动调用由 Skill `description` 提供，用户没有要求额外 UI 元数据或显式调用限制，原型验证也未证明该文件有必要。没有加入 README、示例 HTML、模板、脚本、React 组件、UI Kit、构建依赖或来源目录链接。

实施后运行 `quick_validate.py`，结果为 `Skill is valid!`；文件无原型占位、个人绝对路径、第三方品牌展示词或远程样式资源。技术来源名称与用户指定链接只保留在 `provenance.md`。

## Comments

- 2026-08-27：开始正式实施；以原型分支固定提交 `3f576e7` 为输入，只把已验证的 Skill 包结构和规则写入当前仓库，不复制原型页面或来源项目代码。
- 2026-08-27：正式包实施完成；除最终化入口标题、移除原型标记和覆盖显式 React 原型触发外，规则内容与已验证粗稿保持一致。
