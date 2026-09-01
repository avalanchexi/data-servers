# AgenticOS 与 AI 网关的关系：以本项目为例如何建设

> 文档性质：架构解释与建设建议。为避免把界面、代码和规划混为一谈，下文用“事实”“前端契约”“已接受决策”“建议”四类标签标注证据强度。

## 一页结论

- **事实**：AgenticOS 是承载多个产品域和公共能力的完整平台；网关、运行时、系统配置、监控和审计属于 AgenticOS 公共底座，不属于数据中台或数据服务域本身。[CONTEXT.md](../../CONTEXT.md#L11-L24)
- **已接受决策**：所有向外部提供平台数据或允许外部主体执行中台实质操作的通道，都必须经统一网关完成注册、路由、认证、授权、策略和审计，不能旁路直连。[ADR-0002](../adr/0002-govern-all-external-data-and-operation-channels-through-gateways.md#L5-L7)
- **已接受决策**：数据应用是一项外部消费场景的唯一运行身份、授权、凭据、配额和审计边界；内部服务仍独立开发、上线和注册网关。[ADR-0001](../adr/0001-data-application-as-exclusive-consumption-boundary.md#L5-L11) [ADR-0003](../adr/0003-map-external-data-consumers-through-data-applications.md#L5-L7)
- **判断**：当前仓库能证明 LiteLLM 管理、模型配置、安全 Hook、Agent 运行上下文、安全事件和审计链路等分散能力，但不能证明已有完整的 AI 网关控制面。
- **建议**：AgenticOS 承担控制面和跨域运行时；AI 网关是模型、Agent、MCP 等南北向流量的执行点；数据服务域保存数据应用授权及与其绑定的网关期望配置；数据应用沙箱保持独立执行边界。
- **建议**：过渡期以 Higress 作为 API 与 AI 流量的统一数据面，LiteLLM 保留为 Higress 后方的内部模型协议与供应商适配器，不再作为对外网关或策略真源。

## 1. 证据应如何阅读

| 标签 | 含义 | 本文用法 |
|---|---|---|
| 事实 | 领域文档、现有源码或采集状态直接证明 | 描述已经存在或已被观察到的能力 |
| 前端契约 | TypeScript 客户端声明的可调用接口和数据结构 | 证明前端预期的后端表面，不等价于端到端实现验收 |
| 已接受决策 | `status: accepted` ADR 或已解决议题 | 约束对象归属、流程和禁止事项 |
| 建议 | 基于前述证据形成的目标架构 | 需要后续实现、测试和正式决策 |

## 2. 当前到底有什么

### 2.1 已观察到的事实

- 系统配置页包含模型、快速模型、嵌入、重排、Agent、工具、安全、网络等配置分类，并把模型 Provider、Base URL、API Key 和 Token 上限作为系统配置项；这证明存在模型与运行参数管理，不证明存在入口、路由、后端池和配置发布控制面。[系统配置状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/009-%E7%B3%BB%E7%BB%9F%E9%85%8D%E7%BD%AE-base.json#L1226)
- LLM 安全页展示输入输出检测、注入规则、工具安全、限流，以及 `pre_process` / `post_process` Hook、安全事件表和系统审计日志链路；这证明安全能力可插入调用路径，也不等价于统一路由和发布能力。[LLM 安全状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/029-%E5%AE%89%E5%85%A8%E5%90%88%E8%A7%84-LLM%E5%AE%89%E5%85%A8.json#L532)

### 2.2 前端契约证明的能力

- `LiteLLMApi` 暴露 Token 创建、更新、撤销、删除，使用量查询，模型列表和健康检查。[litellm.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/litellm.ts#L71-L102)
- `AgentApi` 暴露 Agent 增删改查、启停和运行上下文；运行上下文包含模型、系统提示词、资源、数据集与 MCP Server。[agent.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/agent.ts#L65-L117)
- `safety.ts` 暴露安全统计、事件、策略、模板、LLM 检测配置和 LLM 安全统计，包括输入、输出、工具及 RAG 阻断指标。[safety.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/safety.ts#L96-L180)

### 2.3 当前缺口

现有契约没有同时呈现环境绑定、入口、路由、后端池、统一策略集、期望状态、实际状态、差异、审批和可回滚配置发布。
因此“LiteLLM 已接入”“模型可配置”“安全 Hook 已存在”“有审计事件”只能说明网关相关零件已出现，不能把系统称为完整网关控制面。
完整控制面至少要把一次已批准的数据应用版本确定性地编译、发布并回读为一组可审计的运行对象。

## 3. 四个边界

```text
数据服务域                    AgenticOS 公共底座                 运行执行点
数据应用版本与授权 ──期望配置──> 校验 / 审批 / 发布 / 审计 ──下发──> Higress 统一数据面
       │                              │                              ├─> LiteLLM ─> 模型提供方
       │                              │                              ├─> Agent / MCP 运行时
       └────────固定版本与身份────────┴────────调用身份───────────────└─> 数据 API
                                                                        │
                                                            独立数据应用沙箱
```

1. **AgenticOS**：控制跨域身份、工作流、系统配置、网关适配、运行观测与审计，并承载平台公共运行时。[CONTEXT.md](../../CONTEXT.md#L19-L24)
2. **AI 网关**：执行模型、Agent、MCP 等在线流量的认证、路由、流控、安全和观测；它不是 AgenticOS 的同义词，也不负责产品开发或审批。[统一网关定义](../../CONTEXT.md#L303-L309)
3. **数据服务域**：保存数据应用、固定服务版本、数据与操作授权，以及由这些业务事实推导的厂商中立期望配置；不保存 Secret 原文，不直接操作厂商 CRD。
4. **沙箱**：运行平台托管数据应用及其整体 Agent 制品，执行 Tools、Memory、Prompt 和 Worker；网关只控制进入沙箱的流量，不能把沙箱执行器嵌进网关进程。[运行边界](../../CONTEXT.md#L421-L430)

## 4. 推荐数据流

1. 管理者创建或修改数据应用版本，固定模型、API、Agent、MCP、Skill、Worker 版本，并提交数据、服务和操作授权。
2. 通用工作流分别审批授权项；任何必需项失败时，版本整体不生效，旧版本继续运行。[版本生效规则](../../CONTEXT.md#L431-L445)
3. 数据服务域把获批版本编译成六个厂商中立对象的期望快照，绑定 `data_application_id`、版本、环境和授权摘要。
4. AgenticOS 控制面做静态校验、适配器能力校验、差异预览和风险分级，生成唯一 `ConfigRelease`。
5. 发布器通过 Higress 适配器下发入口、路由、上游与策略；Secret 只以引用解析，不能进入业务记录或发布差异正文。
6. 外部调用先到 Higress。Higress 校验数据应用身份和策略后，模型流量转给内部 LiteLLM，MCP、Agent 与 API 流量转给对应运行时或服务。
7. 平台托管 Agent 或 Worker 进入独立数据应用沙箱执行；每一跳保留数据应用身份，服务身份不能替换或扩大其授权。
8. 指标、访问日志、追踪、安全事件和实际配置回流 AgenticOS；调用日志与管理审计分开保存，漂移只告警，不自动覆盖任何一侧。[运行配置研究](gateway-runtime-configurations.md#L118-L145)

## 5. 六个厂商中立对象

以下对象来自既有研究建议，不直接复制 Higress、LiteLLM 或其他厂商的 Route、Plugin、CRD。[对象研究](gateway-runtime-configurations.md#L13-L36)

| 对象 | 责任 | 关键关联 |
|---|---|---|
| `GatewayRuntimeBinding` | 逻辑环境与网关适配器实例的运行绑定 | 环境、能力声明、连接引用、实际版本 |
| `IngressEndpoint` | 协议、域名、TLS 引用和暴露方式 | 一个环境下的入口，不含 Secret 原文 |
| `RuntimeRoute` | 固定服务版本的匹配、目标和权重 | 数据应用身份、服务版本、入口 |
| `BackendPool` | 模型、Agent、MCP、API 后端及健康策略 | 端点、协议、负载均衡、健康状态 |
| `RuntimePolicySet` | 认证投影、配额、流控、安全、AI 与观测策略 | 绑定入口、路由或数据应用版本 |
| `ConfigRelease` | 一次可校验、审批、发布、回滚的期望快照 | 对象差异、执行步骤、结果、审计引用 |

六个对象是控制面真源；厂商对象只是适配器生成的运行投影。回滚必须创建新的 `ConfigRelease`，不能篡改历史发布。

## 6. Higress 与 LiteLLM 的过渡定位

**建议，不是现状事实**：把 Higress 选为统一数据面，使 API 与 AI 流量共享入口、身份、授权、策略、观测和发布链路；逻辑上仍保留 API 网关与 AI 网关的能力分工。

LiteLLM 继续负责模型 Provider 协议转换、模型目标适配及其已有的 Token、用量、模型和健康接口，但放在 Higress 后方：

- 外部数据应用凭据在 Higress 终止，Higress 到 LiteLLM 使用内部服务身份；
- 数据应用授权、路由、配额和发布版本以六个中立对象为真源，不能在 LiteLLM 单独改出第二套策略；
- LiteLLM 使用量和健康数据回流统一观测，不能被误当作完整调用审计；
- 迁移期允许保留现有 LiteLLM API，新增能力先经控制面和 Higress，验证后再关闭外部直达 LiteLLM 的路径。

这一选择的代价是多一跳和适配器维护；收益是模型专用适配与统一南北向治理解耦。P0 必须用实测证明协议、流式响应、鉴权透传、故障处理和回滚满足要求，不能仅凭产品名称验收。

## 7. 分阶段实施与验收

### P0：边界、模型和双路径验证

- 实施：固化四方权属；定义六个对象的最小 schema、状态与关联；建立 Higress 适配器接口；打通“外部 → Higress → LiteLLM → 模型”和“外部 → Higress → MCP 运行时”两条测试路径。
- 验收：六类对象均可持久化、校验和生成 dry-run 差异；两条路径都携带同一数据应用身份；无授权请求默认拒绝；外部不能直达 LiteLLM；沙箱进程、凭据和故障域与网关分离。
- 停止条件：任一协议必须绕过统一身份或策略、流式调用不可观测、回滚无法恢复旧路由时，不进入 P1。

### P1：最小可用控制面

- 实施：建设网关概览、注册与路由、策略管理、配置发布、运行监控、异常事件、审计日志；接入工作流审批、Secret 引用、原子生效、失败重试和回滚。[已解决议题](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md#L14-L27)
- 验收：一个获批数据应用版本只生成一个可追溯 `ConfigRelease`；部分失败不切换当前版本；回滚产生新记录；访问日志与管理审计可按应用、版本、发布关联；任何页面和差异中均不出现 Secret 原文。
- 停止条件：授权与发布能部分生效、厂商对象成为业务真源、或人工修改无法形成漂移时，不进入 P2。

### P2：生产治理闭环

- 实施：增加简单权重灰度、AI 多目标权重与优先级降级、紧急停流、漂移处置、指标/日志/追踪关联、安全 Hook 策略化，以及多实例和故障演练。
- 验收：灰度权重在误差预算内；紧急停流经二次确认立即生效并补齐事后审批；漂移既不自动覆盖平台也不自动覆盖网关；Prompt 和响应正文默认不采样，审批、脱敏、限时三项齐全才可开启。
- 验收：模型、MCP、Agent 与 API 共享数据应用身份和审计链；服务每一跳只能收窄授权；故障演练证明 Higress、LiteLLM、目标运行时和沙箱可分别定位及降级。

## 8. 非目标与最终判定

- 不把 Kubernetes、Namespace、Pod、副本、服务网格、网关节点或可观测基础设施纳入产品控制面；这些属于基础设施系统。[边界决策](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md#L14-L20)
- 不为离线 Skill 包虚构网关路由；只有在线调用、任务提交或持续订阅入口形成网关运行投影。[CONTEXT.md](../../CONTEXT.md#L307-L309)
- 不让网关注册替代服务开发、测试、版本、审核和上线，也不让服务身份持有高于数据应用的权限。
- 不把 Higress 或 LiteLLM 的原生对象暴露为数据服务域产品模型。

最终判定标准只有一个：从“获批的数据应用版本”到“网关实际生效配置”必须存在可重复编译、可审批、可回滚、可对账的闭环；在此之前，本项目拥有的是网关相关能力集合，而不是完整的 AI 网关控制面。
