# 前端工作区

`frontend/` 是新一轮前端规范分析、对齐和后续实现的根目录。

当前状态：**设计决策已确认，第一版设计系统已交付。**

## 已确认

- 原有设计系统整体弃用，不再作为新前端的规范来源。
- 旧文件暂时保留为历史材料，避免在替代规范确认前破坏现有原型。
- 产品术语仍以仓库根目录的 [`CONTEXT.md`](../CONTEXT.md) 为准。
- 项目源码位于 [`agenticos-asset-center-frontend/agenticos-asset-center-frontend/`](./agenticos-asset-center-frontend/agenticos-asset-center-frontend/)。
- 真实系统采集证据位于 [`../output/playwright/`](../output/playwright/)。

## 当前材料

- [规范对齐记录](./alignment.md)
- [AgenticOS 设计系统](./design-system/README.md)
- [页面与原型迁移流程](./design-system/migration.md)
- [设计系统证据与分歧索引](./design-system/evidence-index.md)

## 使用边界

`design-system/` 是新规范的唯一权威来源；`.agents/skills/agenticos-design-system/` 是当前项目的 AI 使用入口。旧 Skill 已删除，其余历史设计材料不参与新页面裁决。
