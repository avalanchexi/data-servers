# 领域文档

本文件规定工程技能在探索代码库时，应如何读取和使用本仓库的领域文档。

## 开始探索前需要读取

- 根目录下的 **`CONTEXT.md`**
- 如果根目录存在 **`CONTEXT-MAP.md`**，则改为读取该文件；它会指向各上下文的 `CONTEXT.md`，应读取与当前任务相关的文件
- **`docs/adr/`** 中与即将处理区域相关的 ADR；在多上下文仓库中，还应检查 `src/<context>/docs/adr/` 中限定于特定上下文的决策

如果这些文件不存在，**直接继续，不作提示**。不要报告文件缺失，也不要预先建议创建它们。`/domain-modeling` 技能会在术语或决策真正明确后按需创建这些文件；该技能可通过 `/grill-with-docs` 和 `/improve-codebase-architecture` 调用。

## 文件结构

单上下文仓库（适用于大多数仓库）：

```text
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

多上下文仓库（根目录存在 `CONTEXT-MAP.md`）：

```text
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← 上下文专属决策
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## 使用术语表中的词汇

当输出中需要命名领域概念时，例如议题标题、重构提案、假设或测试名称，应使用 `CONTEXT.md` 中定义的术语。不要改用术语表明确排除的同义词。

如果需要的概念尚未出现在术语表中，这通常意味着你正在使用项目并未采用的语言，应重新考虑；也可能表明确实存在领域建模缺口，应将其记录下来，供 `/domain-modeling` 处理。

## 标明与 ADR 的冲突

如果输出与现有 ADR 冲突，应明确指出，不得静默覆盖：

> _与 ADR-0007（事件溯源订单）冲突，但值得重新讨论，因为……_
