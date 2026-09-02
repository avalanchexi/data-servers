# Worker Template 架构：收益、类比、设计原因与适用边界

> 研究日期：2026-09-02  
> 研究对象：HiMarket `WORKER` 产品、Nacos `AgentSpec`、HiClaw 运行时  
> 证据基线：`D:\cursor\himarket`，提交 `a352157ba406eecc93ebac7a52babe9500c26950`

## 1. 结论先行

HiMarket 的 Worker Template 本质上是把一个 Agent Worker 的**角色、规则、能力引用和资源文件制品化**，
再把“市场发现与治理”“规格存储与版本”“实例运行与权限”拆成三层。

它的主要价值不是让 Agent 本身更聪明，而是让 Agent 工作单元变得：

- 可复用：同一规格可以被不同团队或环境安装，而不必从提示词和工具配置重新拼装。
- 可治理：版本可以进入草稿、审核、发布、上线、下线和 `latest` 管理流程。
- 可审计：角色规则和资源不再只是某个运行实例里的隐式状态，而成为可检查的制品。
- 可交付：可以上传、下载、导入和安装，形成独立于运行中 Agent API 的供应链。
- 可解耦：市场不必承担任务调度，运行时也不必自己建设商品目录和审核后台。
- 可安全部署：凭据、模型授权和 MCP 权限可以在实例化时由目标运行环境注入，而不必写入公共模板。

但它不是完整的 Agent 部署标准，也不是安全沙箱、容器镜像或可调用服务契约。
只有同时约定包结构、运行时解释规则、依赖解析和部署绑定，模板才具有真正的跨运行时可移植性。

## 2. 先把三个对象分开

本文使用三个不同概念：

1. **Worker Template / Worker 产品**：供人发现、审核、发布和安装的市场对象。
2. **AgentSpec 版本制品**：Nacos 保存的规格内容、资源文件、版本状态和标签。
3. **Worker Agent 实例**：运行时依据某个固定版本创建的实际执行主体。

它们的关系是：

```text
作者 / 管理员
    │ 上传 ZIP、编辑草稿、提交审核
    ▼
HiMarket（Market / Governance）
    │ 产品目录、标签、版本入口、审核发布、下载安装
    ▼
Nacos AgentSpec Registry（Artifact / Version）
    │ 规格内容、资源、固定版本、状态、latest 标签
    ▼
HiClaw 等运行时（Runtime / Instance）
    │ 选择模型与凭据、绑定 MCP、创建实例、派发任务、观测执行
    ▼
Worker Agent 实例 / 任务执行
```

这不是概念推测。HiMarket 的 `WorkerController` 公开的是上传、文件浏览、版本、草稿、下载、
CLI 信息和 Nacos 导入接口，没有创建运行实例、派发任务或停止进程的接口：
`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:49-176`。

服务实现进一步显示：上传进入 Nacos AgentSpec，版本列表、审核、发布、草稿、下载和安装坐标
围绕制品生命周期展开：
`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:76-110,180-340,390-555,1129-1160`。

Nacos 官方也明确区分可发现、可调用的 Agent 与描述 Agent 行为、能力和资源的 AgentSpec：
[Nacos AgentSpec Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)。

HiClaw 则把 Worker 创建和销毁、任务派发、进度追踪、独立凭据与 MCP 权限控制放在运行环境：
[HiClaw](https://higress.ai/en/hiclaw/)。

## 3. 这种设计实际带来的好处

### 3.1 把“Agent 配置”提升为可治理制品

没有制品层时，Agent 的角色提示词、Skills、MCP 配置和资源文件容易散落在：

- 某个部署目录；
- 某个数据库字段；
- 某次聊天上下文；
- 某位开发者的本地环境；
- 某个不可追溯的运行实例。

Worker Template 将这些内容收拢为一个有名称、有版本、有作者、有状态的交付单元。
因此，团队可以回答“生产实例基于哪个模板版本”“谁提交、谁审核、何时上线”等治理问题。

### 3.2 复用的是完整工作角色，而不只是单项能力

Skill 通常表达某项可装载能力；Worker Template 则可以组合角色规则、多个 Skills、MCP 入口和资源。
其复用粒度更接近“可派工的岗位模板”，而不是“工具箱里的一把工具”。

HiMarket 0.7.0 将其称为 Worker Template Marketplace，并展示 `AGENTS.md`、`SOUL.md`、
`MEMORY.md`、Skill 和 MCP 等模板资源：
[HiMarket 0.7.0 Release](https://github.com/higress-group/himarket/releases/tag/v0.7.0)。

这里必须保留边界：这些文件是否强制、具体字段如何解释，仍取决于 AgentSpec 和目标运行时契约；
不能由市场页面的展示反推为 HiMarket 已定义完整运行 Schema。

### 3.3 市场治理与运行编排可以独立演进

Market 层优化的是目录、搜索、审核、发布和下载体验；Registry 层优化的是制品、版本和分发；
Runtime 层优化的是模型接入、凭据隔离、任务调度、弹性、超时和观测。

拆分之后：

- 新运行时可以消费已有模板目录，而不必复制市场后台。
- HiMarket 可以增加审核或推荐能力，而不必理解每种调度器的内部实现。
- Nacos 可以提供版本和分发能力，而不必承担 Worker 实例生命周期。
- 运行时可以采用自己的安全域、模型路由和调度策略。

这是一种“控制面分工”，不是“一个产品完成所有 Agent 生命周期”。

### 3.4 版本固定提高复现、回滚和审计能力

固定 AgentSpec 版本比复制一份会继续变化的目录更可控：

- 出现回归时，可以定位行为规则或资源在哪个版本发生变化。
- 灰度环境和生产环境可以明确安装不同版本。
- 审核针对具体版本，而不是针对一个不断变化的名字。
- 回滚可以重新选择已知版本，不必人工恢复零散文件。

`latest` 适合提升发现和安装便利性，但运行记录仍应保存解析后的**固定版本或摘要**；
只记录 `latest` 会让未来无法证明当时究竟运行了什么。

### 3.5 晚绑定使一个模板适配不同环境

模型、凭据、MCP 授权、并发、超时、实例数和资源限制通常随环境变化：

- 开发与生产使用不同模型账户和密钥；
- 不同部门被允许访问的 MCP 工具不同；
- 成本、数据分级和地域政策会改变模型路由；
- 同一角色在交互任务与批处理任务中的并发、超时不同；
- 运行时的调度与隔离机制并不相同。

因此，模板更适合描述相对稳定的“我是谁、如何工作、需要哪些能力”，
运行时在安装或实例化时绑定“在哪里运行、用谁的凭据、允许调用什么、给多少资源”。

晚绑定的安全价值尤其重要：公共或跨团队分发的模板不应携带生产密钥。
代价是仅凭模板不能完全复现一次执行，平台还必须记录部署绑定和运行时版本。

### 3.6 形成 Agent 资产的供应链入口

市场化后，Agent Worker 可以像其他工程制品一样拥有生产者、审核者、消费者和废弃流程。
这为后续增加签名、来源证明、依赖清单、漏洞扫描、许可证和兼容性声明提供了挂载点。

需要强调：**可挂载安全治理不等于当前已经安全**。
HiMarket 的版本审核只能证明存在治理流程，不能替代对 ZIP、脚本、提示词、Skills 和 MCP 配置的安全检查。

## 4. 为什么不只使用其他现有对象

### 4.1 为什么不只用 Agent API

Agent API 描述的是一个已经运行、可远程调用的服务入口，适合发现端点、协商能力和发起调用。
它不能单独交付 Agent 的内部角色规则、资源文件和可安装内容，也无法满足离线安装或在本地实例化。

Worker Template 与 Agent API 可以组合：先安装模板并创建实例，再把实例作为 Agent API 注册。
前者回答“如何构建这个工作单元”，后者回答“如何调用已经运行的工作单元”。

### 4.2 为什么不只用 Skill

Skill 是能力组件，Worker Template 是组合后的工作角色。
只分发 Skills 会把角色设定、工作流、工具边界、初始资源和能力组合重新留给每个使用者拼装，
难以形成可审核的整体版本。

反过来，不能把所有逻辑都塞进 Worker 模板；稳定、可复用的单项能力仍应拆成 Skill，
由多个 Worker 组合使用，否则会产生大量重复副本。

### 4.3 为什么不只用容器镜像

容器镜像擅长封装可执行文件、系统库和文件系统，保证计算环境交付；
Worker Template 擅长表达 Agent 的角色语义、规则、资源和能力组合，并允许治理人员直接审阅。

只用镜像会有三个问题：

- 角色规则深埋在镜像层中，市场难以预览和逐文件审核。
- 为少量提示词或资源变化重建整套镜像，制品较重且语义不清晰。
- 镜像本身不表达模型授权、MCP 权限和 Agent 市场元数据。

二者不是替代关系。实际系统可以用 OCI 镜像交付运行引擎，用 Worker Template 交付角色和资源，
并由部署记录把“模板版本 + 镜像摘要 + 运行参数”固定在一起。

## 5. 类似架构比较

下表比较的是**架构类比**，不是说 Worker Template 与这些标准兼容或等价。

| 类似架构 | 相似点 | 关键差异 |
| --- | --- | --- |
| Helm Chart | 都把一组资源包装成可版本化、可分发和可安装的模板；都允许在安装时绑定环境值 | Helm 面向 Kubernetes 资源渲染和集群安装，有明确的 chart/values/template 约定；AgentSpec 面向 Agent 行为与资源，HiMarket 当前不提供等价的通用参数合并和集群部署语义 |
| OCI Artifact / Image Manifest | 都把交付物作为 Registry 中可拉取的版本制品，适合增加摘要、签名和来源证明 | OCI 主要定义内容寻址、manifest/blob 和分发协议，不定义 Agent 角色、审核状态或运行解释；HiMarket/Nacos 的 Worker 具有领域化版本流程，但不能自动获得 OCI 的互操作和供应链工具生态 |
| Kubernetes CRD / Operator | 都把“声明规格”和“实际运行”分离，运行控制器可以依据规格创建实例 | CRD 有 Kubernetes API、期望状态、status 和持续 reconciliation；AgentSpec 是版本化规格包，HiMarket 不负责持续调谐 Worker 实例，也没有证据表明它是集群内 desired-state 对象 |
| Backstage Software Template | 都通过目录提供可发现、可复用、可治理的模板，并把复杂脚手架封装成产品入口 | Backstage 模板通常执行参数化动作来生成代码仓库或组件，产物随后独立演进；Worker Template 主要作为可安装 Agent 规格持续保留版本身份，运行实例可追溯到该版本 |
| A2A Agent Card | 都描述 Agent 相关身份与能力，帮助消费者理解“它能做什么” | Agent Card 面向运行中远程 Agent 的发现、端点、能力、Skills 和认证声明；它不是内部资源包、提示词包或安装制品，也不承担 Worker 草稿与发布治理 |

一手参考：

- [Helm Charts](https://helm.sh/docs/topics/charts/)
- [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec)
- [OCI Image Manifest](https://github.com/opencontainers/image-spec/blob/main/manifest.md)
- [Kubernetes Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Backstage Software Templates](https://backstage.io/docs/features/software-templates/)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)

最接近的总体理解是：Worker Template 同时借鉴了“Helm 的可安装模板”“OCI 的制品分发”
和“CRD/Operator 的规格与实例分离”，但当前并没有统一这三套标准的完整契约。

## 6. 安全与版本治理为什么是核心，而不是附加功能

Agent 模板可能携带提示词、脚本、Skills、MCP 配置和其他资源。
这些内容不只是普通配置：它们可能改变 Agent 可访问的数据、可调用的工具和采取行动的方式。

因此，一个可信的 Worker 供应链至少需要区分：

- 作者提交：谁提供了内容；
- 自动检查：包结构、路径、恶意脚本、敏感信息和依赖风险；
- 人工审核：角色目标、指令冲突、工具范围和数据边界；
- 发布批准：哪个固定版本允许消费者安装；若系统要求内容不可变，还需额外使用摘要、签名或只读策略保证；
- 运行授权：安装后在当前环境中实际允许哪些模型、凭据和 MCP；
- 执行追踪：某次实例和任务使用了哪个模板版本及部署绑定。

HiMarket/Nacos 已提供版本状态、草稿、审核、发布、上线/下线与下载等治理基础，
但源码证据不能证明已经完整实现上述扫描、签名、依赖锁定和运行审计。
这些应被视为 Data servers 采用此架构时必须补足的能力，而不是现状声明。

## 7. 代价与风险

### 7.1 多层元数据和一致性成本

产品信息在 HiMarket，规格与版本状态在 Nacos，实例状态在运行时。
系统必须定义每个字段的权威来源、同步方向、失败重试和删除语义，否则容易出现市场显示在线、
Registry 版本已下线，或运行时仍缓存旧版本等不一致。

### 7.2 “可下载”不等于“可移植”

如果不同运行时对文件结构、Skill 加载、MCP 配置或记忆文件的解释不同，
同一个 ZIP 只能在特定运行时工作。真正的可移植性需要：

- 声明所需运行时及兼容版本；
- 声明依赖的 Skills、MCP 能力和模型特性；
- 明确必选与可选文件及 Schema；
- 对安装前兼容性进行验证。

### 7.3 晚绑定会削弱单制品复现

模板不包含密钥和环境策略是正确的，但模型版本、系统级规则、MCP 实现或权限策略变化，
仍可能让相同模板产生不同结果。因此需要额外保存 deployment manifest 或运行快照。

### 7.4 Agent 行为不能像普通二进制一样完全预测

版本审核提高可控性，却不能保证输出确定、正确或安全。
模板上线前仍需要行为测试、越权测试、提示词注入测试和目标运行时中的回归评估。

### 7.5 供应链攻击面扩大

可安装包可能包含隐藏指令、恶意脚本、被替换的 Skill、危险 MCP 目标或敏感信息。
市场越便于复用，恶意内容的传播半径也越大。需要内容摘要、签名、扫描、来源证明和最小权限运行。

### 7.6 版本和依赖爆炸

Worker、Skills、运行引擎、模型与 MCP 服务都有自己的版本。
如果没有兼容矩阵和依赖锁定，审核一个 Worker 版本并不能证明它与未来依赖组合仍然兼容。

### 7.7 运营复杂度增加

市场、Registry 和运行时各自需要权限、可用性、备份、监控和故障处理。
对规模很小、模板极少的团队，这些治理收益可能不足以抵消运维成本。

## 8. 何时不应该采用 Worker Template Marketplace

以下场景通常不值得引入完整市场和版本治理层：

- 只有一个 Agent、一个团队和一个运行环境，配置与代码始终一同发布。
- Agent 只是无状态 API 包装，没有可复用的角色规则、资源或能力组合。
- 需要的是确定性后台 Job、Cron 或消息消费者，而不是可装载能力的 Agent 工作角色。
- 核心需求是交付运行二进制和系统依赖，此时容器镜像或普通软件包更直接。
- 模板含有大量客户专属数据或密钥，不能安全地抽取成可共享制品。
- 运行时之间没有共同包契约，却试图仅凭 ZIP 宣称跨环境可移植。
- 团队尚无审核、权限和依赖治理能力，市场只会放大未经验证内容的传播。
- 需要持续声明和调谐实例数量、健康状态与故障恢复，却没有 Operator/调度控制器。

特别需要避免把旧有“异步任务、队列、Cron、重试和资源限制”继续称为 Worker。
这些是 Job 或运行时调度领域；Worker Template 只描述 Agent 工作单元制品。

## 9. 对 Data servers 的直接启示

### 9.1 领域模型应拆成制品态与运行态

建议至少区分：

- `WorkerProduct`：市场信息、分类、标签和可见性；
- `WorkerVersion`：固定 AgentSpec 版本、状态、作者、摘要和兼容性声明；
- `WorkerInstallation`：安装到哪个运行环境、解析到哪个固定版本；
- `WorkerInstance`：运行时创建的实例、状态和权限绑定；
- `WorkerTask`：向实例派发的一次任务及执行记录。

不能把模板的 `latestVersion` 当成实例当前运行版本，也不能把产品发布当成实例启动。

### 9.2 先做 Registry/Runtime 适配边界，再扩展运行参数

领域层可使用厂商中立的 Worker Template/Version 术语；Nacos 的 namespace、AgentSpec 名称和
版本状态由 Registry Adapter 映射。运行时的模型、凭据、MCP 权限、并发和调度由 Runtime Adapter 管理。

这样既忠实于 HiMarket 来源，也避免把 Nacos 或 HiClaw 的实现细节固化成平台唯一模型。

### 9.3 安装必须产生可审计锁定记录

安装时不应只保存 `latest`，而应保存：

- AgentSpec 名称和解析后的固定版本；
- 可用时保存内容摘要或签名标识；
- 目标运行时类型和版本；
- 依赖 Skill/MCP 的解析结果；
- 非敏感运行参数及策略版本；
- 凭据引用而非凭据明文。

这份记录连接“市场审核通过的制品”和“实际运行的实例”，也是回滚与事故审计的依据。

### 9.4 把兼容性和安全验证放在安装门槛

在 Data servers 中引入 Worker Marketplace 时，安装前至少应验证包结构、运行时兼容性、
依赖可用性、敏感信息、危险文件路径以及声明的 MCP 权限；运行时仍必须执行最小权限隔离。

审核通过不应自动授予生产权限，市场下线也不应在没有明确策略时自动销毁正在运行的实例。

### 9.5 保留与其他制品体系组合的能力

Worker Template 不需要重新发明所有供应链机制。未来可以考虑：

- 用 OCI Artifact 保存内容并复用摘要、签名和镜像仓库生态；
- 用 Kubernetes Operator 管理需要持续调谐的 Worker 实例；
- 用 A2A Agent Card 暴露已运行实例的调用入口；
- 用独立 Skill Registry 管理可复用能力依赖。

这些属于可选演进方向，不是 HiMarket 当前实现已经具备的兼容性。

## 10. 最终判断

Worker Template 架构适合解决的是：**如何把 Agent 工作角色作为组织资产进行组合、审核、版本化、
分发和安装，同时把环境相关权限与执行责任留给运行时。**

它之所以这样设计，是因为 Agent 的“定义”“分发”“运行”具有不同变化速度和安全责任：
角色与资源需要可审计版本，市场需要可发现和审批，凭据与调度必须服从部署环境。

其成功条件不是拥有一个 ZIP 上传按钮，而是形成完整链路：

```text
可审阅规格
  + 不可混淆的固定版本
  + 可信制品供应链
  + 明确的运行时契约
  + 安装时权限晚绑定
  + 实例与任务可追溯
```

缺少其中任何一项，Worker Template 都可能退化为“带版本号的提示词压缩包”；
具备这些条件后，它才真正成为 Agent 平台中的可治理工作单元。
