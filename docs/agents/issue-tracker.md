# 议题跟踪器：本地 Markdown

本仓库的议题和规格以 Markdown 文件形式存放在 `.scratch/` 中。

## 约定

- 每项功能使用一个目录：`.scratch/<feature-slug>/`
- 规格文件为 `.scratch/<feature-slug>/spec.md`
- 实施议题按工单分别保存至 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 开始编号；不得将所有工单合并到一个文件中
- 分流状态记录在每个议题文件顶部附近的 `Status:` 行中，角色字符串参见 `triage-labels.md`
- 评论和对话历史追加到文件底部的 `## Comments` 标题下

## 当技能要求“发布到议题跟踪器”时

在 `.scratch/<feature-slug>/` 下创建新文件；如果目录不存在，则一并创建。

## 当技能要求“获取相关工单”时

读取指定路径中的文件。用户通常会直接提供文件路径或议题编号。

## Wayfinder 操作

供 `/wayfinder` 使用。每份**路线图**由一个主文件和每个工单对应的一个**子文件**组成。

- **路线图**：`.scratch/<effort>/map.md`，包含 Notes、Decisions-so-far 和 Fog 正文
- **子工单**：`.scratch/<effort>/issues/NN-<slug>.md`，从 `01` 开始编号，正文中包含问题；`Type:` 行记录工单类型（`research`、`prototype`、`grilling` 或 `task`），`Status:` 行记录 `claimed` 或 `resolved`
- **阻塞关系**：在文件顶部附近使用 `Blocked by: NN, NN`；当列出的所有工单均为 `resolved` 时，该工单解除阻塞
- **任务前沿**：扫描 `.scratch/<effort>/issues/`，寻找处于开放、未阻塞且未认领状态的文件；编号最小者优先
- **认领**：开始工作前将 `Status:` 设为 `claimed` 并保存
- **解决**：将答案追加到 `## Answer` 标题下，把 `Status:` 设为 `resolved`，然后在 `map.md` 的 Decisions-so-far 中追加上下文指针（摘要及链接）
