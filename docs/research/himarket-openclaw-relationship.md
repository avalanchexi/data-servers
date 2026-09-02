# HiMarket、HiClaw 与 OpenClaw 关系核验

核验日期：2026-09-02  
本地 HiMarket 源码快照：`D:\cursor\himarket`，HEAD `a352157ba406eecc93ebac7a52babe9500c26950`；此前已核对该 HEAD 与官方 `origin/main` 一致。本文只使用官方仓库、官方文档和本地源码，不使用二手文章。

## 结论先行

1. **HiMarket 与 OpenClaw 存在官方明确的“分发目标/兼容性”关系，但未发现 HiMarket 后端嵌入或依赖 OpenClaw 运行时。** 当前官方 HiMarket 前端把 OpenClaw 列为 Skill 安装目标，将 Skill 下载目录设为 `~/.openclaw/skills`，并在 Worker 市场文案中明确称 Worker 适用于 HiClaw 和 OpenClaw；但 Worker 详情页内置的一键导入脚本实际面向 AgentTeams/HiClaw，不是 OpenClaw CLI 或 OpenClaw API。
2. **HiClaw 不是 OpenClaw 的别名。** HiClaw（当前官方公共契约已演进为 AgentTeams）是多 Agent 协作与生命周期控制平台；OpenClaw 是它支持的 Agent 运行时之一，并且在多个版本/部署方式中是默认或主要 Manager/Worker 运行时。AgentTeams 还支持 CoPaw/QwenPaw、Hermes 等运行时。
3. **当前 `D:\cursor\Data servers` 未发现 OpenClaw、HiClaw 或 AgentTeams 的代码、包、镜像或运行时依赖；HiMarket 仅作为产品交互和注册管理参考。** 仓库自己的约束也明确写着“不承诺复用代码、部署源项目或形成运行时依赖”。

## 一、HiMarket 与 OpenClaw

### 已证实

#### 1. HiMarket 对 OpenClaw 有直接的 Skill 分发适配

HiMarket 的 Skill 详情页把 OpenClaw 列为安装目标：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\SkillDetail.tsx:52-63`

选择 OpenClaw 后，默认输出目录是 `~/.openclaw/skills`：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\SkillDetail.tsx:92-105`

这个目录并非只用于展示：页面把 `outputDir` 传给 Nacos CLI 的 `skill-get` 命令，并在切换安装目标时更新目录：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\SkillDetail.tsx:395-403`
- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\SkillDetail.tsx:808-844`

因此可以确认的集成粒度是：**HiMarket 能生成把 Skill 包下载到 OpenClaw 约定目录的安装命令。** 这属于制品分发适配，不等于 HiMarket 启动、托管或调用 OpenClaw。

#### 2. HiMarket 官方前端明确宣称 Worker 与 OpenClaw 兼容

Worker 市场的产品类型英文标签是 `OpenClaw Worker`：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\Square.tsx:189-200`

中英文市场文案把 OpenClaw 作为 Worker 的目标环境，并明确写有“适用于 HiClaw 和 OpenClaw”：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\locales\zh-CN\emptyState.json:23-26`
- `D:\cursor\himarket\himarket-web\himarket-frontend\src\locales\en-US\emptyState.json:23-26`
- `D:\cursor\himarket\himarket-web\himarket-frontend\src\locales\zh-CN\square.json:42-44`

HiMarket v0.7.0 官方 Release 把这项能力命名为 **Worker Template Marketplace**，说明模板可预装 `AGENTS.md / SOUL.md / MEMORY / SKILL / MCP` 套件：[HiMarket v0.7.0 Release](https://github.com/higress-group/himarket/releases/tag/v0.7.0)。这解释了兼容性的制品基础：模板交付的是 Agent 工作区资源，而不是一个已经运行的服务进程。

#### 3. HiMarket 内置的 Worker 一键安装链目前直接指向 AgentTeams/HiClaw

Worker 详情页把安装区标注为 `AgentTeams install`，并生成 `higress.ai/hiclaw/import.sh` 或 `import.ps1` 命令；包地址采用 `nacos://...` AgentSpec URI：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\WorkerDetail.tsx:689-696`
- `D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\WorkerDetail.tsx:797-843`

对应本地化标题已显示为“安装到 AgentTeams”：

- `D:\cursor\himarket\himarket-web\himarket-frontend\src\locales\zh-CN\workerDetail.json:13`
- `D:\cursor\himarket\himarket-web\himarket-frontend\src\locales\en-US\workerDetail.json:13`

这证明 **HiMarket→HiClaw/AgentTeams 是有具体导入脚本的直接集成**；而对 OpenClaw Worker，目前源码能证明的是市场兼容性声明和通用包分发，未看到同等的 `openclaw ...` Worker 导入命令。

### 推断

- HiMarket Worker 包中的 `AGENTS.md`、`SOUL.md`、Skills 等文件与 OpenClaw 工作区模型相容，因此同一模板可以被 OpenClaw 系运行时消费。这一推断与 HiMarket 官方兼容性文案一致，但**具体文件合并、优先级、Secrets 注入和实例生命周期仍由消费方运行时决定**。
- HiMarket 与 OpenClaw 的关系最准确地描述为“市场/Registry 到运行时的制品兼容”，而不是“HiMarket 基于 OpenClaw 构建”或“HiMarket 是 OpenClaw 控制台”。

### 未发现

- 未发现 HiMarket Java 后端对 OpenClaw SDK、OpenClaw API 或 OpenClaw 进程的直接调用。
- 未发现 HiMarket Worker Controller 的运行、调度或实例管理接口；它管理上传、文件、版本、草稿、下载和导入：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:40-176`。
- 未发现 HiMarket Worker 详情页生成 OpenClaw 专用的 Worker 安装命令。不能仅凭市场文案断言“任意 AgentSpec 包都能无损运行于任意 OpenClaw 版本”。

## 二、HiClaw 与 OpenClaw

### 已证实

HiClaw 官方仓库把自身定义为协作式多 Agent 运行平台：Manager 编排多个 Worker，并负责可见、可干预的协作，而不是自行实现所有 Agent 逻辑：[HiClaw 官方仓库](https://github.com/agentscope-ai/HiClaw)。

当前官方项目名称和公共契约已演进为 AgentTeams。官方 Release 明确记录从 HiClaw 命名迁移到 AgentTeams，以及对旧名称/环境变量的兼容：[AgentTeams Releases](https://github.com/agentscope-ai/AgentTeams/releases)。因此本文提到“HiClaw”时，运行架构以当前 AgentTeams 官方文档为准。

AgentTeams 官方架构明确区分两层：

- OpenClaw：Node.js Agent runtime；
- AgentTeams：管理 Worker 身份、Matrix 房间、持久化数据、容器/Pod 和生命周期。

来源：[AgentTeams Overview](https://github.com/agentscope-ai/AgentTeams/blob/main/docs/overview.md)、[AgentTeams Architecture](https://github.com/agentscope-ai/AgentTeams/blob/main/docs/architecture.md)。

官方仓库还把 OpenClaw 标为默认/主要 Manager 与 Worker 运行时，并列出 CoPaw、Hermes 等替代项：[AgentTeams AGENTS.md — Runtime model](https://github.com/agentscope-ai/AgentTeams/blob/main/AGENTS.md)。

所以准确关系是：

```text
HiClaw / AgentTeams（多 Agent 控制面、协作与生命周期）
    ├─ OpenClaw（可选/主要 Agent 运行时）
    ├─ CoPaw / QwenPaw（可选运行时）
    └─ Hermes（可选 Worker 运行时）
```

OpenClaw 本身是独立开源项目，有自己的安装、Gateway、Agent loop、Skills 和配置体系：[OpenClaw 官方仓库](https://github.com/openclaw/openclaw)、[OpenClaw 官方 Quickstart](https://docs.openclaw.ai/quickstart)。

### 推断

- 可以说 HiClaw/AgentTeams“以 OpenClaw 作为一种底层 Agent runtime 并在其外围增加多 Agent 协作、身份、通信、网关和实例管理”。
- 不应说 HiClaw 与 OpenClaw 是同一产品，也不应把任何 HiClaw Worker CR/容器直接等同于一个 OpenClaw 模板包：前者是运行态资源，后者是运行时/工作区内容。

### 未发现

- 官方来源不支持“HiClaw 是 OpenClaw 官方发行版”或“OpenClaw 必须依赖 HiClaw”这类表述。
- OpenClaw 独立运行时可以单独安装；HiClaw/AgentTeams 也已经支持非 OpenClaw Worker runtime。

## 三、`D:\cursor\Data servers` 当前依赖情况

### 已证实

项目约束明确把本地 HiMarket 定位为产品交互参考，并写明当前不承诺复用代码、部署源项目或形成运行时依赖：

- `D:\cursor\Data servers\CONTEXT.md:459-462`
- `D:\cursor\Data servers\.scratch\data-service-platform\map.md:13-18`

本次对工作区做了三组只读检索：

```powershell
git -C 'D:\cursor\Data servers' grep -n -i -E 'openclaw|hiclaw|agentteams|himarket' -- ':!docs/**' ':!.scratch/**' ':!CONTEXT.md'

rg -n -i --hidden --glob '!docs/**' --glob '!**/node_modules/**' \
  'openclaw|hi[- ]?claw|agentteams|himarket' 'D:\cursor\Data servers'

# 另对 package.json、锁文件、pom.xml、go.mod、requirements、pyproject、
# Dockerfile 与 compose 文件逐类检索同一组名称。
```

结果：

- 排除文档、研究工单和 `CONTEXT.md` 后，受版本控制的代码/配置没有命中；
- 依赖清单、锁文件、Dockerfile、Compose 配置没有命中；
- 文件名中没有 OpenClaw、HiClaw 或 AgentTeams，HiMarket 命中仅为研究文档/工单；
- 当前已实现边界因此是“参考 HiMarket”，不是“依赖 HiMarket/OpenClaw/HiClaw”。

### 推断

- Data servers 当前页面和领域设计可以借鉴 HiMarket 的市场、产品、发布和 Registry 边界，但不会因此自动获得 OpenClaw 或 AgentTeams 兼容性。
- 若未来决定支持 OpenClaw，应新增显式集成契约，例如 Skill 安装目录、Worker 包兼容矩阵、运行时适配器、版本固定和凭据注入；不能把“参考 HiMarket UI”视为已完成集成。

### 未发现

- 未发现 `openclaw` npm/pip/Go/Maven 依赖。
- 未发现 OpenClaw/HiClaw/AgentTeams 镜像、容器、Helm Chart、CRD 或环境变量。
- 未发现调用 HiMarket、OpenClaw 或 AgentTeams API 的生产代码。
- 未发现可以证明 Data servers 已经能安装或运行 HiMarket Worker 包的端到端实现。

## 最终边界表

| 问题 | 结论 | 证据强度 |
| --- | --- | --- |
| HiMarket 是否官方面向 OpenClaw | 是；Skill 有 OpenClaw 安装目录适配，Worker 市场有明确兼容性文案 | 源码已证实 |
| HiMarket 是否依赖/托管 OpenClaw runtime | 未发现 | 源码检索未发现；不能证明绝对不存在外部部署 |
| HiMarket Worker 是否有 OpenClaw 专用一键导入 | 未发现；现有脚本面向 AgentTeams/HiClaw | 源码已证实 |
| HiClaw 是否等同 OpenClaw | 否 | 官方架构已证实 |
| HiClaw 如何使用 OpenClaw | 将其作为 Manager/Worker Agent runtime 之一，并在外围管理协作与生命周期 | 官方文档已证实 |
| Data servers 是否依赖 OpenClaw/HiClaw/AgentTeams | 当前未发现 | 本地代码、配置和依赖清单检索 |
| Data servers 与 HiMarket 的当前关系 | 仅作为信息架构、交互和注册管理参考 | 项目约束已证实 |
