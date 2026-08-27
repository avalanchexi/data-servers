# 来源与维护说明

本文件在维护原型设计规范 Skill、核对来源、补充本地规范未覆盖的组件或明确生成 React/Figma 原型时读取，不进入生成的 HTML，也不在用户界面展示来源品牌。

## 首次提炼

- 提炼日期：2026-08-27
- 视觉 tokens 与组件行为参考固定的第三方开源设计系统源码快照。
- 页面模式参考同一来源的企业后台示例，并按当前项目的桌面单 HTML 目标重新表述。

## 固定来源

- `arco-design/arco-design`：`c2b050d9c7ce94bebba94f616a0721344231caac`；用于视觉 tokens、组件状态和交互语义。
- `arco-design/arco-design-pro`：`bb6aebcceca6b294b438be4c13dc7328ee80d70b`；用于企业后台页面模式和信息层级。
- 官方组件规范（HTML 与 React 原型均适用）：<https://arco.design/docs/spec/link>
- Figma 组件库：<https://www.figma.com/community/file/1053233047330321743/arco-design-system>
- 用户指定的 Figma 设计文件：<https://www.figma.com/design/hckCpSOIWd9LeBShCsus7f/Arco-Design-System--Community->

## 组件规范与设计源使用边界

- HTML 是默认原型交付；只有任务明确要求时才使用 React 或 Figma。
- HTML 与 React 原型均按上述官方规范落实组件结构、尺寸、样式、状态和交互，并遵循本地 `component-patterns.md`、`design-tokens.css` 及项目级调整。
- Figma 社区文件是组件视觉与变体参考库，不是当前仓库的唯一事实来源。
- 日常设计使用已提炼的本地规范；核对未覆盖组件或用户指定设计源时再访问外部来源，无需先完成整库下载。只有实际导出、落盘并核对的资源才可称为本地组件资产，来源链接本身不代表已导入。
- 不直接复制来源站点的 Logo、品牌文字、宣传内容、远程资源或遥测代码。
- 外部链接可能变化；更新本 Skill 时先人工核对，再把必要规则写回仓库内对应参考文件。

## 项目级调整

- 将品牌变量改为 primary 等中性语义名称。
- 不复制 Logo、品牌文案、React 组件实现、UI Kit 或构建环境。
- 默认交付桌面 Web、自包含 HTML；只有任务明确要求时改用 React，不承诺生产 React 兼容层。
- 所有来源更新必须先做差异审计，再人工挑选会改变 HTML 原型决策的部分。

## 协作维护流程

1. 以仓库中已提交的 `.agents/skills/enterprise-prototype-design/` 为唯一有效版本；个人桌面来源只用于人工审计。
2. 修改前在 `.scratch/` 建立或认领范围明确的工单；并行协作者避免同时修改同一规则文件，以工单认领和 Git 差异协调重叠。
3. Skill 变更保持为独立 Git 差异，不夹带产品文档、业务原型或其他无关修改。
4. 由一名未参与修改的协作者检查触发边界、规则唯一性、代表性 HTML 行为、品牌清理和验证证据。
5. 每次变更至少运行 Skill 结构检查、生成内容品牌扫描和一项代表性 HTML 行为检查；完整键盘路径只在任务明确要求时验证。
6. 评审通过后提交变更；Git 历史和对应工单答案记录原因与证据，不另建 README 或 CHANGELOG。
