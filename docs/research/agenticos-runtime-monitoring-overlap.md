# 数据服务运行管理与 AgenticOS 运行监控重叠研究

研究日期：2026-09-01  
研究范围：数据服务运行管理原型、既有运行管理决策、AgenticOS 前端导出源码、Playwright 真实系统系统监控／系统审计证据、`CONTEXT.md` 与已接受 ADR。  
既定前提：数据服务运行管理与 AgenticOS 系统监控定位不同，保留两个入口，不以页面合并为候选方案。

## 结论

**决定验证结果**：保留两个模块是合理的。数据服务运行管理回答“某个数据应用通过固定服务版本能否正常消费能力，以及网关期望配置是否安全生效”；AgenticOS 系统监控回答“公共底座组件、调度器、日志、缓存和本地存储是否可运行、可诊断、可维护”。两者在用户、对象、时间窗口、健康语义和可执行动作上均不同。[E1][E3][E4][E6]

**事实**：当前 AgenticOS Dashboard 聚合的是 Agent、知识库、数据集、Cron、向量表、审计事件、日志文件、SQLite、Token、记忆和安全统计；其系统监控 API 契约围绕日志文件、向量表、SQLite 和 Cron 汇总。现有真实页面及源码没有提供数据服务原型所需的网关实例、路由、后端、服务固定版本、数据应用、QPS、请求成功率或 P95 等业务运行维度。[E5][E6][E7]

**事实**：数据服务运行管理已明确排除 Kubernetes、服务网格、网关节点、主机／容器日志等基础设施运维，只保留网关控制意图、服务调用健康、消费执行观测、异常与结构化运行审计；外部执行没有观测时必须保持未知。[E1][E3][E4]

**核心判断**：页面和职责重叠低，底层信号重叠中等，审计事实源重叠高。应采用“两个领域视图、一个公共遥测与审计底座”：

1. AgenticOS 公共底座拥有调度器、原始日志、缓存、向量库、SQLite、网关适配器／数据面执行、公共指标管道、事件与审计存储的权威事实；
2. 数据服务域拥有服务产品、固定版本、数据应用、授权、网关期望配置、配置发布、服务健康和领域异常的业务语义与读模型；
3. 两边复用原始指标和事件，但按各自对象重新聚合；不共享一个“总成功率”，也不从基础设施健康推断服务消费正常；
4. 数据服务审计保留独立页面，但应是 AgenticOS 公共审计的领域投影，不另建第二套不可变日志、保留策略和导出事实源。

**证据限制**：现有前端源码定义了公共监控与审计 API 契约，却没有后端实现、遥测 Schema 或跨域关联代码；Playwright 是只读页面采集。因而“两个视图复用同一指标／事件底座”是推荐架构，不是已经实现的事实。[E5][E7][E8]

## 1. 判定口径

### 1.1 重叠等级

| 等级 | 判定 |
|---|---|
| 无 | 对象、目标和事实源都不同，只可能通过故障影响关系相连 |
| 低 | 页面相邻或可互相跳转，但不共享主要事实或控制权 |
| 中 | 复用同一原始指标、日志、执行事件或对象标识，但聚合口径和处置动作不同 |
| 高 | 若各自实现会产生两个权威事实源；必须共享底层记录或单一执行控制权 |

“高重叠”不等于合并页面，只表示必须消除双写或双重控制。

### 1.2 六层职责模型

| 层次 | 核心问题 | 权威归属 | 数据服务运行管理中的呈现 |
|---|---|---|---|
| 基础设施与系统健康 | 进程、调度器、日志、缓存、向量库、本地数据库是否可用 | AgenticOS 公共底座／外部基础设施系统 | 仅在影响数据服务时显示状态摘要和只读下钻链接 |
| 网关与路由控制面 | 服务流量应如何注册、路由、鉴权、限流、发布 | 数据服务域拥有领域意图；AgenticOS 公共底座拥有适配执行与实际状态 | 完整展示期望配置、实际投影、差异、审批、发布和回滚 |
| 服务产品运行健康 | 固定服务版本是否可接受调用 | 数据服务域 | 按服务、版本、路由、后端查看请求量、错误、延迟、降级和异常 |
| 数据应用消费观测 | 某消费场景的应用执行与所调用服务是否正常 | 数据服务域；执行原始信号来自 AgenticOS 运行时或外部适配器 | 应用自身指标与服务调用指标分开展示；缺测为未知 |
| 异常事件 | 哪个运行异常影响了哪些应用、服务和版本 | 公共事件底座保存事实；数据服务域维护影响投影与业务处置上下文 | 只展示数据服务影响、严重度、持续／恢复和关联对象 |
| 审计 | 谁在何时对何对象做了什么、依据什么授权、结果如何 | AgenticOS 公共审计存储；各产品域提供类型化上下文 | 数据服务领域视图，不复制存储、保留策略或导出管线 |

该分层与 `CONTEXT.md` 对 AgenticOS 公共底座、数据服务运行管理、服务运监和运行审计的定义一致；统一网关仍是跨域能力，但数据服务域负责表达其服务／应用语义。[E1][E2]

## 2. 数据服务运行管理逐项矩阵

| 数据服务功能 | 现有职责与对象 | 最接近的 AgenticOS 页面 | 重叠 | 建议归属与复用方式 | 依据 |
|---|---|---|---|---|---|
| 网关概览 | 当前环境的网关实例、入口、能力范围、关联对象、运行状态、请求趋势和最近异常 | Dashboard、日志监控 | 中 | 数据服务保留业务概览；网关适配器健康和原始请求指标由底座采集。Dashboard 可显示“网关组件健康”，但不得复制服务请求大盘；从异常或组件卡片按 `gateway_binding_id` 下钻 | 原型明确展示实例、入口、请求量和成功率；AgenticOS Dashboard 目前只聚合日志、SQLite、向量表、Cron 等系统库存。[E4][E5][E6] |
| 运行情况（原“注册与路由”） | 按网关实例查看后端服务与端口、协议、状态、QPS、成功率、P95、异常以及服务／版本／路由技术映射 | 日志监控、Dashboard | 中 | 数据服务拥有服务运行读模型与紧急停流入口；底座拥有网关数据面和原始 access/trace/metric 信号。日志页只保留原始诊断，不再建立另一份服务健康状态 | 既有决定将其限定为南北向流量与服务健康，明确排除节点、工作负载和低层诊断指标。[E3][E4] |
| 策略管理 | 认证投影、限流配额、超时重试熔断、CORS/IP、AI 多目标路由、外部安全策略引用；修改形成草稿 | 系统审计；当前系统监控无对应配置页 | 低（页面）／高（执行审计） | 数据服务拥有领域策略意图和受影响对象；底座拥有适配器执行与实际生效状态。每次校验、自动分配和生效写入公共审计，并以 `policy_id`、`application_version_id`、`config_release_id` 关联 | 原型策略按数据应用自动分配，ADR 要求应用发版与策略分配原子生效。[E2][E4] |
| 配置发布 | 将路由与策略变更经过校验、审批、执行、失败重试或新发布回滚后变为实际配置 | 系统审计；定时任务只能执行底层作业，不是发布产品模型 | 中（执行）／高（审计） | 数据服务拥有 `ConfigRelease` 生命周期和业务状态；底座执行下发并回报步骤。Cron 可承载异步执行，但任务不能取代发布记录；发布和每个执行尝试共用关联 ID | `CONTEXT.md` 与既有决策明确配置发布不是服务版本发布，回滚形成新发布；AgenticOS Cron 契约只有通用任务与执行输出。[E1][E3][E5] |
| 服务运监（原“运行监控”） | 按数据应用、固定服务版本及产品类型查看调用或执行健康；应用自身与服务调用分开 | Dashboard、定时任务、日志监控、系统审计用量统计 | 中 | 数据服务拥有应用／服务维度和类型化指标；复用底座的 request/trace、Agent run、tool call、Cron run、Token 和日志信号。各类成功率与耗时独立计算，Token 用量不能代替服务健康 | 领域定义禁止将请求、运行、工具、脚本、任务和数据流合成统一指标；现场 Dashboard／用量统计确有 API、工具和 Token 数据，但缺数据应用与固定服务版本维度。[E1][E5][E6] |
| 异常事件 | 数据服务成功率下降、延迟升高、模型降级、发布失败、上游不可用及影响对象 | Dashboard 审计/安全摘要、日志监控、系统审计系统事件 | 中 | 公共事件底座接收系统与网关事件；数据服务异常页维护按服务、版本、数据应用计算的影响投影。一个事件可有多个领域投影，但只保留一个 `incident_id`，恢复状态由事件源或处置流统一更新 | 原型异常仅保留数据服务健康事件；AgenticOS 审计已有系统错误、警告、资源告警等公共事件类型。[E4][E6] |
| 审计日志 | 管理操作、数据服务系统事件、外部数据调用和中台数据加工的不可变结构化留痕 | 系统审计／审计日志、日志管理 | 高 | 保留数据服务领域页面，但底层写入 AgenticOS 公共审计。公共层负责不可变存储、保留、查询和导出；数据服务定义领域事件 Schema 与读模型。禁止把 AgenticOS 访问日志全文复制到领域审计 | AgenticOS API 已有审计列表、统计、详情、导出、保留和清理；但现有 Schema 仅 `user_operation/system_event` 和通用 `details`，尚不足以证明服务授权、数据权限、固定版本等字段已结构化。[E1][E5][E6] |

## 3. AgenticOS 系统监控与系统审计逐项矩阵

| AgenticOS 功能 | 真实系统／源码职责 | 与数据服务运行管理的重叠 | 重叠 | 建议归属与下钻 | 依据 |
|---|---|---|---|---|---|
| Dashboard | 汇总 Agent、知识库、数据集、Cron、向量表、审计、日志文件、SQLite、Token、记忆与安全统计 | 仅日志、Token、审计、Cron 或底层组件故障会成为数据服务信号 | 低 | 继续作为系统库存与公共组件健康总览；增加“受影响产品域／服务数”只读投影即可，按 `component_id` 或 `incident_id` 跳到数据服务异常，不新增服务运行大盘 | 页面状态、截图和 `/admin/system-monitor/dashboard` 响应一致显示系统库存与文件／表级统计。[E5][E6][E7] |
| 定时任务 | 通用调度器健康、任务注册、调度、状态、上下次执行，以及暂停、恢复、触发、输出、删除 | Worker、数据加工或数据应用运行可能由其触发；配置发布也可能借其异步执行 | 中 | AgenticOS 保留调度控制权；数据服务只引用 `scheduler_job_id/job_run_id` 展示领域任务结果。暂停、删除等调度动作不复制到服务运监；业务重跑必须走领域权限和审计 | 真实页含插件／业务模块任务和破坏性操作；源码契约有 scheduler health、pause/resume/trigger/remove 与 outputs。[E5][E6] |
| 日志监控 | 按模块查看文件路径、大小、级别和全文，并可清空、下载、改级别 | access、agent、dataqa、errors、slow-query 等日志可生成服务指标或异常证据 | 中 | AgenticOS 独占原始日志查看、保留、清理和级别控制；数据服务只保存受控日志引用、摘要与关联 ID，不展示全文。由采集管道解析指标和事件，不能让领域页面直接扫描日志文件 | 源码暴露日志全文、清空、下载和级别修改；真实页面显示 access 等 15 个文件及原始请求行。[E5][E6] |
| 应用缓存／LLM 缓存 | 统计 namespace／表的数量、体积、命中率、TTL，并允许清空、删键或刷新 TTL；LLM 缓存含模型、命中和 Token | 缓存退化可能导致服务延迟／成本变化；数据服务可能关心 AI 缓存命中结果 | 低至中 | 缓存配置与清理归 AgenticOS；数据服务仅在服务详情显示按请求或服务聚合的 cache hit/miss（若有），并在缓存故障影响服务时下钻。严禁从数据服务页面清全局缓存 | API 契约提供 Redis 运行指标、namespace 管理、逐键删除和 LLM 缓存清理；真实页显示全局共享缓存及清空动作。[E5][E6] |
| 向量表 | 列出物理表、行数并预览数据 | 仅当向量检索或语义缓存是某服务上游时形成影响关系 | 低 | 归 AgenticOS 存储诊断；数据服务显示受影响服务和只读 `storage_resource_id` 链接，不复制表浏览。表行数不能作为服务健康指标 | 源码只定义表名、行数和数据预览；现场某表预览返回 400，说明表存在也不证明服务可用。[E5][E6][E7] |
| SQLite 数据库 | 列出数据库文件、大小、表、列和受限数据预览 | 本地会话、记忆或审计状态可能影响 Agent 服务，但与网关／API 健康无直接等价关系 | 低 | 归 AgenticOS 存储诊断；仅由异常关联受影响的 Agent／服务，不在数据服务运行页暴露路径、表或行。避免把 `state.db` 等实现细节固化为领域契约 | API 契约明确是文件／表预览；真实页面展示 `memory_store.db`、`state.db` 和表结构。[E5][E6] |
| 系统审计／审计日志 | 查询、详情、统计、CSV/JSON 导出；覆盖用户操作和系统事件 | 数据服务管理操作、调用、加工和发布审计必须落入同一不可变链路 | 高 | AgenticOS 为唯一审计存储与保留策略所有者；数据服务提供域类型、字段校验和专用查询视图。系统审计应能按 `domain=data-service`、对象与关联 ID 回查；数据服务页下钻公共审计详情 | 真实系统已有 4,593 条记录、事件分类和跨模块动作；源码提供审计查询、详情、导出、统计和保留／清理契约。[E5][E6] |
| 系统审计／用量统计与日志管理 | 按会话统计模型 Token／调用／缓存；管理用户操作、系统事件和访问日志保留 | 服务运监可能复用 Token 与调用计数；领域审计不能另设保留策略 | 中（用量）／高（保留） | 用量原始事实与保留策略归 AgenticOS；数据服务按应用和固定服务版本建立派生用量视图。现有会话数据只有用户、模型等维度，不能直接充当数据应用计费或健康指标 | 真实页提供会话级 Token 与缓存命中，日志管理设置 3/90/180 天保留；源码契约对应 token usage、retention 和 cleanup。[E5][E6] |

## 4. 原始指标复用与口径隔离

### 4.1 可复用的原始信号

以下是**建议架构**，不是当前实现证明：

| 原始信号 | 公共采集者 | 数据服务派生视图 | 必须避免 |
|---|---|---|---|
| 网关请求开始／结束、HTTP／gRPC 状态、路由、后端、耗时、重试／熔断 | 网关适配器／公共遥测管道 | QPS、错误率、P95、服务版本健康、应用调用健康、异常 | 直接把 access.log 全文复制进领域库；不同窗口混算 |
| Agent run、tool call、模型目标、TTFT、Token、降级、缓存命中 | AgenticOS 运行时／AI 网关 | Agent／MCP／模型类服务指标和数据应用执行指标 | 用 API 成功推断 Agent 最终成功；把 Token 用量当健康度 |
| Scheduler job/run、开始／结束、状态、耗时、输出引用 | AgenticOS 调度器 | Worker／数据加工批次运行、失败与重试结果 | 把 tick 成功率当业务任务成功率；在领域页复制暂停／删除控制 |
| 日志记录与异常检测结果 | 公共日志／事件管道 | 服务异常证据、最近异常摘要、诊断跳转 | 暴露请求／响应正文、秘密值或主机日志全文 |
| 审计事件 | 公共审计写入器 | 数据服务管理、调用、加工和发布审计投影 | 两套审计编号、保留策略或导出结果不一致 |
| 缓存／向量／SQLite 组件健康 | AgenticOS 系统监控 | 受影响服务的依赖状态与事件关联 | 把表行数、DB 文件大小或缓存总命中率直接等同服务健康 |

### 4.2 推荐标签与基数边界

**建议**：公共指标使用稳定、非敏感的资源标签，至少包含 `tenant_id`、`environment_id`、`runtime_component_id`、`gateway_binding_id`、`service_product_id`、`service_version_id`、`route_id` 和 `backend_id`；数据应用级指标再增加 `data_application_id` 与 `application_version_id`。跨调用链使用 `request_id` 和 `trace_id`，异步执行使用 `execution_id` 或 `job_run_id`。

用户名称、外部消费场景文本、请求参数、响应正文、凭据、数据行值不得作为指标标签。它们会造成高基数或敏感数据泄露；必要信息通过受控对象查询或审计引用获取。该约束与运行审计“不保存秘密值、请求响应正文”的边界一致。[E1]

**证据缺口**：当前 `AuditLog` 契约只有 `target_resource`、`session_id`、`platform` 和通用 `details`，System Monitor 契约也以文件名、表名和数量为主；没有证据表明上述统一标签已存在。[E5]

## 5. 统一标识与关联上下文

### 5.1 最小关联标识

| 关联对象 | 推荐标识 | 生产者 | 主要消费者 |
|---|---|---|---|
| 租户／环境 | `tenant_id`, `environment_id` | 公共配置上下文 | 两套页面、指标、审计 |
| 公共运行组件 | `runtime_component_id` | AgenticOS 组件注册／运行时 | Dashboard、日志、异常影响分析 |
| 网关运行绑定 | `gateway_binding_id` | 公共网关底座 | 网关概览、系统健康、发布执行 |
| 服务与版本 | `service_product_id`, `service_version_id` | 数据服务域 | 路由、服务运监、异常、审计 |
| 数据应用与版本 | `data_application_id`, `application_version_id` | 数据服务域 | 消费观测、策略投影、授权、审计 |
| 路由／后端／策略 | `route_id`, `backend_id`, `policy_id` | 数据服务领域意图；公共底座返回实际投影 ID | 运行情况、策略、生效校验 |
| 配置发布 | `config_release_id`, `release_attempt_id` | 数据服务域／执行器 | 审批、执行、异常、审计 |
| 同步与异步执行 | `request_id`, `trace_id`, `execution_id`, `scheduler_job_id`, `job_run_id` | 网关／运行时／调度器 | 指标、日志、异常、审计 |
| 异常与审计 | `incident_id`, `audit_event_id` | 公共事件／审计底座 | 两套页面互跳和证据链 |

**建议**：领域对象 ID 与技术投影 ID 分开。`service_version_id` 不应被网关厂商 Route ID 替代；`data_application_id` 不应被 API Key、用户名或 Agent 名称替代。这与 ADR 中“数据应用是专属消费场景边界、网关只是运行投影”的决定一致。[E2]

### 5.2 三条关联链

```text
数据面调用
request_id / trace_id
  → data_application_id + application_version_id
  → service_product_id + service_version_id
  → gateway_binding_id + route_id + backend_id
  → incident_id（若异常）
  → audit_event_id（若需留痕）

控制面发布
config_release_id
  → policy_id / route_id
  → release_attempt_id
  → runtime_component_id / gateway_binding_id
  → incident_id（失败或漂移）
  → audit_event_id

异步任务／数据加工
scheduler_job_id + job_run_id
  → execution_id / processing_batch_id
  → data_application_id 或 processing_task_id
  → request_id / trace_id（调用服务时）
  → incident_id + audit_event_id
```

其中 `processing_batch_id` 是中台数据加工审计所需的建议字段；现有原型已表达调度批次、来源／目标资产、读写数量和结果，但源码未证明其公共 Schema 已存在。[E1][E4][E5]

## 6. 异常、审计关联与下钻

### 6.1 下钻原则

1. **数据服务 → AgenticOS 系统监控**：只有诊断公共组件时跳转，携带 `environment_id`、`runtime_component_id`、时间范围和 `incident_id`；目标页定位到日志模块、Cron run、缓存 namespace、向量资源或数据库资源。数据服务页面不直接提供清日志、删任务、清缓存等底座动作。
2. **AgenticOS 系统监控 → 数据服务**：当公共事件计算出受影响服务时，显示“受影响数据应用／服务”摘要，并携带 `service_version_id`、`data_application_id`、时间范围或 `incident_id` 跳到服务运监／异常事件。
3. **任一运行页 → 公共审计**：携带 `audit_event_id`；若尚未生成单条审计，则用 `request_id`、`config_release_id`、`job_run_id` 或 `incident_id` 过滤公共审计。
4. **公共审计 → 领域对象**：根据 `domain`、`resource_type`、`resource_id` 和版本 ID 打开数据服务只读详情，避免用对象名称或自由文本搜索作为唯一关联。
5. **时间上下文保持**：下钻时保留原时区、开始／结束时间和观测窗口；系统日志的瞬时记录与服务 P95 等窗口指标不能因跳转而改变口径。

### 6.2 典型异常关联

| 场景 | 公共底座证据 | 数据服务视图 | 审计链 |
|---|---|---|---|
| 服务成功率下降 | 网关请求指标、错误日志、route/backend、trace | 固定服务版本异常，列出受影响数据应用 | `incident_id` 关联调用审计；若采取紧急停流，再关联管理审计与事后审批 |
| Agent 模型降级 | AI 网关目标选择、TTFT、Token、降级事件 | Agent／模型服务降级，应用自身执行结果仍独立 | 调用审计引用物理目标与降级结果，不保存 Prompt／响应正文 |
| Worker／加工任务失败 | Cron run、execution、输出引用、公共日志 | Worker 应用或加工批次失败；服务调用可另行成功／失败 | `job_run_id` 关联加工审计、异常与必要的重跑操作审计 |
| 缓存／向量库故障 | component、namespace/table、系统事件与日志 | 仅显示受影响服务和依赖退化，不显示全局清理动作 | 公共系统事件为事实源；领域异常以同一 `incident_id` 建影响投影 |
| 配置发布失败 | release attempt、适配器执行结果、实际／期望差异 | 发布失败，旧配置继续运行，支持修正重试 | `config_release_id` 关联审批、执行尝试、异常和管理审计 |

## 7. 当前架构证据与缺口

### 7.1 已有可复用基础

- **事实**：AgenticOS 已有分离的 `/admin/system-monitor/*`、`/cron/*`、`/admin/cache/*`、`/admin/llm-cache/*` 和 `/audit/*` 前端 API 契约，说明公共日志、调度、缓存、存储诊断和审计已形成模块边界。[E5]
- **事实**：Playwright 网络证据确认 Dashboard、缓存、向量、SQLite、审计统计和 Token 用量接口在真实系统返回数据；覆盖审计确认当前账号可见的系统管理页面无阻断性采集缺口。[E7][E8]
- **事实**：数据服务原型已经把网关控制、服务健康、应用消费、异常和审计分开建模，并明确未知观测和审计最小化边界。[E1][E4]

### 7.2 必须补强的接口契约

以下均为**推断与建议**：

1. 公共遥测事件需要补充租户、环境、领域对象、技术投影和跨链路关联 ID；当前 API 类型没有证明这些字段存在；
2. 公共审计需要从 `user_operation/system_event + details` 扩展为可验证的领域事件 Envelope，至少包括 `domain`、`resource_type`、`resource_id`、`resource_version_id`、`correlation_id`、`authorization_refs` 和不可变时间／主体／结果；
3. 网关适配器应同时输出实际配置投影、发布执行结果和运行指标，数据服务只维护厂商中立的期望配置；
4. 事件中心需要支持“一条公共事件、多个领域影响投影”，否则系统事件和数据服务异常会重复建单、恢复状态漂移；
5. 深链接口应使用稳定 ID 与时间范围，不依赖页面名称、日志文件名或厂商对象名；
6. 数据服务页面必须使用只读依赖状态和受控跳转，底座破坏性动作继续受 AgenticOS 权限与审计约束。

## 8. 证据限制

1. `frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/` 是导出的前端业务域包，不含完整应用入口和系统监控页面组件；本研究只能把其中 API 类型和调用函数视为前端契约，不能视为后端实现或生产架构证明。[E5][E9]
2. Playwright 采集只覆盖当前账号可见页面的只读状态与脱敏网络响应；没有执行清日志、清缓存、暂停／删除任务、审计导出、配置发布或紧急停流，不能证明写操作权限、事务性和审计完整性。[E6][E7][E8]
3. 向量表 `dataset_vdb_schema` 的数据预览在采集中返回 400；这证明了 UI／API 有失败状态，不足以判断向量存储整体健康或失败原因。[E6][E7]
4. 系统监控 Dashboard 展示的是库存、文件／表大小和汇总数量，缺少基础设施 CPU、内存、节点和网关专用指标；因此本报告不把它描述为完整基础设施可观测平台。[E5][E6]
5. 数据服务原型内容和数值为设计决策与示例数据，不是生产采集结果；其职责边界可作为已确认产品决定，指标可用性仍需后端接口验证。[E3][E4]

## 9. 最终边界决定

保留“数据服务运行管理”和“AgenticOS 系统监控／系统审计”两个入口，按以下契约对齐：

- 不合并页面、不复制破坏性系统操作；
- 统一网关适配执行、原始遥测、事件和审计基础设施；
- 数据服务拥有领域意图、产品／应用维度、健康口径、异常影响和领域审计视图；
- AgenticOS 拥有公共组件健康、调度、日志、缓存、物理存储诊断、审计存储与保留；
- 用稳定 ID、时间范围、`incident_id` 和 `audit_event_id` 双向下钻；
- 在统一标识和公共事件 Schema 落地前，不宣称两套视图已完成指标或审计关联。

## 证据索引

- [E1：`CONTEXT.md`](../../CONTEXT.md)，重点见 11–24、179–212、240–256、287–300 行。
- [E2：数据应用边界 ADR](../adr/0001-data-application-as-exclusive-consumption-boundary.md)、[统一网关治理 ADR](../adr/0002-govern-all-external-data-and-operation-channels-through-gateways.md)、[外部消费方映射 ADR](../adr/0003-map-external-data-consumers-through-data-applications.md)。
- [E3：统一网关运行配置边界工单](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md)、[运行管理与设置原型优先级工单](../../.scratch/data-service-platform/issues/22-prioritize-runtime-settings-prototype.md)。
- [E4：数据服务运行管理原型](../../prototypes/archive/2026-09-02/runtime-management.html)，重点见 839–845、879–1189、1330–1840、2196–2288 行。
- [E5：AgenticOS 系统监控 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-monitor.ts)、[Cron API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/cron.ts)、[缓存 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/cache-manage.ts)、[LLM 缓存 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/llm-cache.ts)、[审计 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/audit.ts)。
- [E6：Playwright 系统监控状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/002-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-Dashboard.json)、[定时任务](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/003-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-%E5%AE%9A%E6%97%B6%E4%BB%BB%E5%8A%A1.json)、[日志监控](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/004-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-%E6%97%A5%E5%BF%97%E7%9B%91%E6%8E%A7.json)、[应用缓存](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/005-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-%E5%BA%94%E7%94%A8%E7%BC%93%E5%AD%98.json)、[LLM 缓存](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/006-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-LLM%E7%BC%93%E5%AD%98.json)、[向量表](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/007-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-%E5%90%91%E9%87%8F%E8%A1%A8.json)、[SQLite](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/008-%E7%B3%BB%E7%BB%9F%E7%9B%91%E6%8E%A7-SQLite-%E6%95%B0%E6%8D%AE%E5%BA%93.json)、[系统审计](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/035-%E7%B3%BB%E7%BB%9F%E5%AE%A1%E8%AE%A1-%E5%AE%A1%E8%AE%A1%E6%97%A5%E5%BF%97.json)、[用量统计](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/036-%E7%B3%BB%E7%BB%9F%E5%AE%A1%E8%AE%A1-%E7%94%A8%E9%87%8F%E7%BB%9F%E8%AE%A1.json)、[日志管理](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/037-%E7%B3%BB%E7%BB%9F%E5%AE%A1%E8%AE%A1-%E6%97%A5%E5%BF%97%E7%AE%A1%E7%90%86.json)。
- [E7：脱敏网络证据](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl)。
- [E8：Playwright 覆盖审计](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/coverage-report.md) 与 [采集报告](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/system-management-data-report.md)。
- [E9：前端规范对齐记录](../../frontend/alignment.md)，重点见“确认源码与真实系统证据位置”和“仓库现状”。
