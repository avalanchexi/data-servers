# AgenticOS 承载数据中台的架构能力评估

调研日期：2026-09-01
结论对象：当前仓库可见的 Seabox AI / AgenticOS，而不是对未知后端的推测

## 结论先行

**当前架构不足以直接承载生产级数据中台，但具备演进为其公共底座的条件。**

- 当前已得到运行证据的能力集中在 AgenticOS 公共层：登录认证、用户／组织／角色／菜单权限、系统级配置、Agent、系统监控和审计。它们适合作为数据中台的统一入口和共享底座。
- `agenticos-asset-center-frontend` 是当前项目的资产中心前端工程，是页面行为和 API 客户端契约的一手源码；其中提供的数据资产、数据治理和数据服务页面较完整，但随仓库提供的工程副本不含后端，本次 Playwright 又只采集了“系统管理”，没有捕获资产中心接口响应。因此这些源码足以支持目标原型分析，但仍不能据此判定相应后端已经具备。
- 数据工程只有数据源、简单全量／增量同步任务等前端契约；没有证据证明已具备批流任务开发、依赖编排、调度实例、开发／生产隔离、发布管控、计算引擎和资源组等数据平台内核。
- 当前证据中没有系统性的租户／工作空间上下文，也没有统一网关控制面、数据应用身份、数据权限闭包和生产级工作负载隔离。它们是上线前的架构阻断项。

因此：

- **当前可用性：不满足。** 可用于产品壳层、Agent 平台及局部能力验证，不能据此宣称已建成数据中台。
- **目标可行性：有条件可行。** 保留 AgenticOS 作为跨域公共底座，在其上新增独立的“数据平台控制面＋执行面”，通过适配器复用身份、配置、审计、Agent 和观测设施；不应把数据工程和数据治理塞进现有系统配置或通用 Cron／Workflow。

## 评估口径

### 分级定义

| 等级 | 本报告中的含义 |
| --- | --- |
| 已具备 | 真实系统页面存在，且本轮采集到相关后端 HTTP 成功响应；只证明当前可观察能力，不证明高可用、扩展性或生产规模。 |
| 可扩展 | 已有相邻的运行能力或清晰前端契约，可作为接入点，但仍需新增关键领域对象或执行能力。 |
| 缺失 | 在指定证据范围内没有找到必要能力，或现有通用能力不能承担该职责。 |
| 仅前端可见且后端未证实 | 页面、TypeScript API 客户端或原型存在，但没有后端实现源码或本轮真实接口响应。 |

### 证据等级

1. **运行证据**：Playwright 采集到的真实页面状态与脱敏 HTTP 响应，强于前端契约，但仍不揭示后端内部架构。
2. **前端契约**：`frontend/` 中的页面、类型和 API 客户端，只证明前端期望的接口与对象。
3. **决策证据**：`CONTEXT.md`、ADR 和已关闭工单，证明目标边界已经决定，不证明已经实现。
4. **原型证据**：`prototypes/` 只证明交互方案和目标范围，不作为运行架构证据。

关键限制：该目录按当前项目的资产中心前端工程使用，是现状前端的一手证据；其 [README](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/README.md) 和 [API_REQUIREMENTS](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/API_REQUIREMENTS.md) 同时说明，仓库中的工程副本来自 AgenticOS 资产中心业务域导出，不含后端实现、数据库迁移、运行数据和完整应用入口。这不降低其前端证据等级，但意味着它不能单独证明后端或生产架构。本轮 [Playwright 覆盖报告](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/coverage-report.md) 的“完整”仅指当前账号可见的 8 个系统管理模块、41 个页面／标签，不代表整个平台后端完整。

## DataLeap 与 DataWorks 给出的能力参照

本节只用于归一化数据中台能力范围，不把竞品实现或菜单直接当作本项目目标架构。

| 归一化能力层 | DataLeap 官方范围 | DataWorks 官方范围 | 本次采用的判断基线 |
| --- | --- | --- | --- |
| 数据资产 | 数据地图、元数据、血缘、指标、资产目录 | 数据地图、元数据检索、目录、血缘、资产管理、建模与指标 | 元数据采集、统一目录与搜索、技术／业务元数据、血缘、模型／指标、资产消费视图 |
| 数据工程 | 批流数据集成、任务开发、调度、发布、智慧运维、计算／调度／集成资源组 | 全域数据集成、批流任务开发、依赖调度、开发生产隔离、发布与运维 | 连接器、批流／CDC、开发 IDE、任务与 DAG、调度实例、发布、环境、引擎／资源、任务运维 |
| 数据治理 | 数据质量、SLA、数据安全、分类分级、细粒度权限、审计和治理闭环 | 数据标准、数据质量、数据地图、资产治理、安全中心、审批中心 | 标准、质量门禁、分类分级、脱敏、数据权限、生命周期、SLA、问题处置和治理度量 |
| 数据服务 | API 开发发布、应用与密钥、网络配置 | 向导／SQL API、测试、版本、API 网关发布、应用授权和调用 | API／数据流产品、契约、测试、版本、审批、网关、消费应用、授权、配额与运行观测 |
| 公共底座 | 租户、项目、成员角色、引擎／资源绑定、流水线扩展 | 租户／地域、工作空间、RAM／RBAC、资源绑定、OpenAPI／OpenEvent／Extensions | 租户与空间、身份权限、配置、工作流、网关、运行时、观测审计和开放扩展 |

两家官方资料共同表明，“有数据页面”不等于“有数据中台架构”。项目／工作空间隔离、引擎和资源绑定、任务依赖与实例、发布运维、数据质量门禁、网关和开放扩展同样是核心组成。

## 四个产品域能力矩阵

### 1. 数据资产

| 能力 | 分级 | 当前证据与判断 | 关键缺口／影响 |
| --- | --- | --- | --- |
| 资产总览、地图、目录、搜索 | 仅前端可见且后端未证实 | [资产中心 README](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/README.md) 列出 9 个一级页面；[asset.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/asset.ts) 定义总览、地图和目录接口。 | 没有资产接口真实响应、元数据存储模型、索引与规模证据。 |
| 元数据采集与数据源 | 仅前端可见且后端未证实 | `asset/collect`、[datasource.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/datasource.ts) 提供采集任务、数据源测试、Schema 和预览契约。 | 缺采集器运行、增量策略、失败恢复、凭据托管和租户隔离证据。 |
| 血缘、上下文图谱、本体／语义 | 仅前端可见且后端未证实 | [datacontext.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/datacontext.ts)、`ontology.ts`、`semantic-layer.ts` 有同步、血缘、图谱和模型契约。 | 没有解析覆盖、字段级血缘、跨引擎一致性与真源治理证据。 |
| 标准、指标和资产责任 | 仅前端可见且后端未证实 | `asset/standard`、目录权属、估值等契约存在。 | 需要与模型、任务、质量和权限形成统一对象标识与闭环。 |

**域结论：产品表面较完整，后端架构未证实。** 适合作为目标控制面的前端起点，不可视为可用资产平台。

### 2. 数据工程

| 能力 | 分级 | 当前证据与判断 | 关键缺口／影响 |
| --- | --- | --- | --- |
| 数据源连接与简单同步 | 仅前端可见且后端未证实 | [datasource.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/datasource.ts) 和 [sync-task.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/sync-task.ts) 定义数据库／API／文件源、全量／增量、Cron、运行和日志。 | 没有真实接口响应；连接器类型、网络、凭据、容错和 CDC 能力未证实。 |
| 批流任务开发与 DAG | 缺失 | 通用 [workflows.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/workflows.ts) 面向 Agent 节点；不能证明 SQL／Spark／Flink 等数据任务的代码、依赖和产出契约。 | 缺少数据工程的核心开发模型，无法形成可治理的数据加工链路。 |
| 调度实例、补数、基线与 SLA | 缺失 | 真实系统有通用 Cron 任务和系统监控，但页面内容是插件／业务模块定时任务，不是数据任务实例图、依赖、补数或基线。 | 通用 Cron 不能替代数据调度器；无法保证上下游时效与恢复。 |
| 开发／生产隔离、版本与发布 | 缺失 | 当前源码未发现统一 Workspace／Environment 上下文；数据服务 ADR 中的版本与发布是目标决策。 | 无法安全完成开发、测试、评审、发布和回滚。 |
| 计算引擎、资源组与工作负载运行 | 缺失 | 未发现数据计算引擎绑定、资源队列、资源组、作业镜像或执行器证据。 | 这是从管理壳层走向数据生产平台的最大结构缺口。 |
| 数据任务运维 | 可扩展 | AgenticOS 已有系统监控、Cron 和审计，可复用采集、身份与跳转能力。 | 必须新建数据任务／实例领域模型和运维中心；不能与系统监控合并。 |

**域结论：核心缺失。** 当前同步契约只能算接入种子，尚不足以承载 DataLeap／DataWorks 所代表的数据研发与生产链路。

### 3. 数据治理

| 能力 | 分级 | 当前证据与判断 | 关键缺口／影响 |
| --- | --- | --- | --- |
| 数据标准与落标 | 仅前端可见且后端未证实 | `asset/standard` 有标准集、代码、命名词典、映射、推荐和覆盖率契约。 | 未证明标准与模型、字段、发布和质量规则联动。 |
| 数据质量 | 仅前端可见且后端未证实 | `asset/quality` 有模板、规则、执行、复检、结果、评分和 SLA 报告契约。 | 未证明规则下推、调度触发、强规则阻断下游和告警处置。 |
| 数据安全与权限 | 仅前端可见且后端未证实 | `asset/security` 有分类分级、自动打标、脱敏、ACL 和资产审计契约；真实系统“安全合规”主要是 LLM 输入／输出安全，不能等同数据安全。 | 需要统一的数据资源授权模型、行列权限、策略执行点和申请审批。 |
| 生命周期、治理评估与闭环 | 仅前端可见且后端未证实 | `asset/lifecycle`、`asset/dcmm`、`asset/governance` 契约及对应页面存在。 | 未证明归档／销毁执行、证据链、问题责任和整改闭环。 |

**域结论：界面和契约覆盖广，但不能证明治理控制已进入数据生产链路。** 没有数据工程内核时，质量、血缘和治理规则很难形成可执行闭环。

### 4. 数据服务

| 能力 | 分级 | 当前证据与判断 | 关键缺口／影响 |
| --- | --- | --- | --- |
| 服务注册、发布与调用统计 | 仅前端可见且后端未证实 | `asset/service` 有服务 CRUD、状态、MCP 发布、调用统计和外部数据登记契约。 | 缺 API 契约真源、不可变版本、测试证据、部署和真实调用链。 |
| API／AI 服务开发 | 仅前端可见且后端未证实 | [数据服务决策地图](../../.scratch/data-service-platform/map.md) 和 [AI 服务开发原型](../../prototypes/ai-service-development.html) 已明确目标生命周期；它们是决策／原型，不是实现。 | 需要正式服务制品库、测试、审批、发布执行和数据权限闭包。 |
| Agent／MCP／Skill 接入 | 可扩展 | Playwright 捕获 `/api/v1/agents` 成功响应；[agent.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/agent.ts)、[mcp.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/mcp.ts)、`skills.ts` 提供管理契约。 | Agent 得到运行证据，MCP／Skill 主要仍是前端契约；还缺数据应用身份、固定版本、授权和网关执行投影。 |
| 统一网关与数据应用授权 | 缺失 | [ADR 0001](../adr/0001-data-application-as-exclusive-consumption-boundary.md)、[ADR 0002](../adr/0002-govern-all-external-data-and-operation-channels-through-gateways.md) 和网关工单定义了目标边界；当前没有相应后端或真实网关控制面证据。 | 没有统一外部访问、认证、配额、路由、停流、发布和审计边界，不能生产开放数据。 |
| 服务运行监控 | 可扩展 | 系统监控和审计已运行，数据服务运行管理原型已单独定义网关健康、配置发布和事件范围。 | 应建立数据服务域监控；与平台系统监控共享遥测基础设施，但不合并职责或页面。 |

**域结论：具备 Agent 平台和产品设计基础，但数据服务控制面／数据面未证实。** 目标可行，当前不可生产使用。

## AgenticOS 公共底座能力矩阵

| 公共能力 | 分级 | 证据与边界 | 对数据中台的影响 |
| --- | --- | --- | --- |
| 登录与会话 | 已具备 | Playwright 捕获 `/auth/config`、`/auth/me`、企微扫码成功响应；[auth.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/auth.ts) 有本地／OAuth／企微契约。 | 可复用为统一身份入口。 |
| 用户、组织、角色、菜单 RBAC | 已具备 | 真实页面有用户、组织、18 个角色和功能读写权限；前端有 `users.ts`、`organization.ts`、`role.ts`、`permission.ts`。 | 可复用平台级功能权限；仍需补数据资源权限和空间作用域。 |
| 租户、工作空间与环境隔离 | 缺失 | `src/` 中仅零散出现 `tenant_id`，没有贯穿请求、资源和路由的 Tenant／Workspace 上下文；组织不等于租户或数据项目。 | 不补齐则无法保证数据、任务、资源、配置和凭据隔离。 |
| 系统配置 | 已具备 | Playwright 捕获 `/admin/system-config` 和 `/admin/app-config` 成功响应，页面展示 24／32 个分类；源码支持敏感值遮罩和批量更新。 | 可作为基础配置服务种子，但现状偏全局文件配置。目标需支持 `global → tenant → workspace → environment → domain/object` 作用域、Schema、版本、Secret 引用和发布。 |
| 工作流／审批 | 仅前端可见且后端未证实 | [workflows.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/workflows.ts) 是 Agent 工作流契约；系统配置有审批策略，审计中有审批相关事件，但本轮无通用审批服务响应。 | 应复用统一审批编排，但数据任务 DAG、数据质量执行和网关发布不能由审批工作流替代。 |
| 统一网关 | 缺失 | 只有目标 ADR、研究和 [运行管理原型](../../prototypes/runtime-management.html)。 | 属生产数据服务的阻断项，应形成厂商中立控制面和适配器。 |
| Agent／MCP／Skill 平台 | 可扩展 | Agent 接口有真实响应，三类 API 客户端和 Agent runtime context 已存在。 | 适合做治理 Agent、开发助手和扩展入口；不能代替确定性的数据执行器。 |
| 运行时与资源隔离 | 可扩展 | 有 Agent、QA Task、Cron、缓存、向量库和 SQLite 的运行表面；没有数据作业执行器、资源队列、沙箱／网络／临时数据隔离证据。 | 可复用任务框架和观测接入，必须新增数据工作负载运行层。 |
| 系统监控 | 已具备 | [采集报告](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/system-management-data-report.md) 和 `/admin/system-monitor/dashboard` 成功响应证明系统／Agent 运行监控存在。 | 保持“平台系统运维”定位；数据工程任务运维和数据服务运行监控分别建设，不合并。 |
| 审计 | 已具备 | 真实审计页面有用户、数据源、工作流、Agent、配置和安全事件，`/audit/stats` 成功响应；[audit.ts](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/audit.ts) 有查询、详情和导出契约。 | 可作为统一审计底座，但需增加租户／空间、数据资产、任务实例、数据应用、网关发布和权限范围关联。 |
| 开放扩展机制 | 可扩展 | 动态菜单、Agent／MCP／Skill 与插件声明 Cron 已出现；未发现稳定的版本化 OpenAPI、事件订阅、扩展生命周期和兼容性治理。 | 应形成 OpenAPI＋领域事件＋受管扩展 SDK，避免各产品域直接耦合内部表或配置文件。 |

## 当前架构为什么“不足但可演进”

### 已经成立的基础

- 统一 React 前端壳层、动态菜单和功能权限能承载新增产品域入口。
- 认证、组织、角色、系统配置、监控、审计已在真实系统运行。
- Agent、MCP、Skill、数据源、数据集、语义／本体／上下文等 API 边界为后续适配提供了可见接缝。
- [CONTEXT.md](../../CONTEXT.md) 已把 AgenticOS、数据中台四域和公共底座区分开；三份 ADR 已把外部消费收敛到数据应用和统一网关，方向正确。

### 不能靠“补页面”解决的结构缺口

1. **统一隔离上下文**：Tenant、Workspace／Project、Environment 必须成为所有资产、任务、服务、配置、审计和资源的强制键与鉴权上下文。
2. **数据平台元模型**：需要统一标识数据源、数据集／表／字段、任务、产出、血缘、标准、质量规则、服务版本和数据应用，避免 9 个资产页面各自形成孤立 CRUD。
3. **数据工程执行面**：连接器、批流任务、DAG 调度、实例、补数、引擎适配、资源组、开发生产隔离、发布和回滚必须是独立内核。
4. **可执行治理**：标准、质量、分类分级、权限和生命周期规则必须在任务发布、运行和服务调用路径上有策略执行点。
5. **统一网关控制面**：服务版本、路由、策略、数据应用身份、授权、凭据、配额、配置发布和审计需要形成一致闭环。
6. **稳定扩展面**：Agent 只能通过受治理 OpenAPI／事件／MCP 工具操作控制面，不得直接改数据库、配置文件或绕过审批发布。

## 建议目标分层

```text
产品体验层
  数据资产 | 数据工程 | 数据治理 | 数据服务 | 其他 AgenticOS 产品域

数据平台控制面（新增）
  统一元模型 | 元数据/血缘 | 任务/DAG/发布 | 标准/质量/安全 | 服务/应用/授权

AgenticOS 公共底座（复用并补强）
  Tenant/Workspace/Environment | IAM/RBAC | 分层配置 | 审批工作流
  统一网关控制面 | Agent/MCP/Skill | 审计 | OpenAPI/事件/扩展注册

执行与适配层（新增）
  采集/CDC/批流连接器 | SQL/Spark/Flink 等引擎适配 | 调度器/资源组
  API/AI 网关适配 | Secret/KMS | 对象存储/元数据存储

观测层（共享设施、分域产品）
  平台系统监控 | 数据任务运维 | 数据服务运行监控 | 治理/SLA
```

配置建设应落在底层配置能力，而不是继续扩张当前“系统配置”页面：配置服务统一提供作用域、Schema、继承、版本、Secret 引用、校验、发布和审计；系统配置、数据工程连接器／引擎配置、数据治理策略和数据服务域设置分别拥有自己的事实源与管理界面。产品域只引用公共配置的生效结果，不维护第二份真源。

## 建设门槛与建议顺序

在进入大规模页面实现前，至少应完成以下架构验证：

1. 定义并做穿透式原型：Tenant／Workspace／Environment 如何进入鉴权、API、数据库键、缓存键、任务、审计和 Secret。
2. 用一个 tracer bullet 打通“数据源 → 同步任务 → 表资产 → 血缘 → 质量规则 → 发布 → 任务实例运维”，证明控制面与执行面闭环。
3. 再打通“ADS 资产 → API 服务版本 → 数据应用授权 → 网关配置发布 → 调用审计”，验证三份 ADR 的可执行性。
4. 为工作流、调度器、网关、计算引擎、Secret 和观测建立适配器契约；明确哪些自建、哪些接入外部基础设施。
5. 通过后端源码、OpenAPI、数据库模型、部署清单和真实接口补证后，再把“仅前端可见”升级为“已具备”。

## 官方参考资料

以下链接均为厂商官方资料，访问日期均为 **2026-09-01**。

### 火山引擎 DataLeap

- [DataLeap 产品页：产品功能与架构](https://www.volcengine.com/product/dataleap/)
- [DataLeap 概述：数据集成、开发、运维、治理、资产、安全与资源组](https://www.volcengine.com/docs/6260/65403)
- [基本概念：项目、任务、调度与依赖](https://www.volcengine.com/docs/6260/65392?lang=zh)
- [数据加工：批流开发与计算引擎](https://www.volcengine.com/docs/6260/1356590?lang=zh)
- [任务运维：任务实例、依赖、回溯与监控](https://www.volcengine.com/docs/6260/71684?lang=zh)
- [血缘应用：表、列、分区血缘](https://www.volcengine.com/docs/6260/71699)
- [数据服务 API 调用：应用、密钥与网络配置](https://www.volcengine.com/docs/6260/127700?lang=zh)
- [项目成员与角色权限](https://www.volcengine.com/docs/6260/144944)
- [DataOps 流水线与扩展程序](https://www.volcengine.com/docs/6260/164814?lang=zh)

### 阿里云 DataWorks

- [什么是 DataWorks：产品架构与六类核心能力](https://help.aliyun.com/zh/dataworks/user-guide/what-is-dataworks/)
- [产品功能全景：集成、开发运维、建模、治理与服务](https://help.aliyun.com/zh/dataworks/user-guide/functions-and-features/)
- [工作空间：隔离、角色与计算资源绑定](https://help.aliyun.com/zh/dataworks/user-guide/workspace-management)
- [数据地图：元数据、目录、检索与血缘](https://help.aliyun.com/zh/dataworks/user-guide/data-map/)
- [数据质量：规则、调度触发与强规则阻断](https://help.aliyun.com/zh/dataworks/user-guide/new-data-quality/)
- [数据服务入门：API 开发、测试、发布、网关与应用授权](https://help.aliyun.com/zh/dataworks/user-guide/getting-started-with-dataservice-studio)
- [开放平台：OpenAPI、OpenEvent 与 Extensions](https://help.aliyun.com/zh/dataworks/user-guide/open-platform-overview)

## 本地一手材料索引

- 产品语言与目标边界：[CONTEXT.md](../../CONTEXT.md)
- 前端事实边界：[frontend/alignment.md](../../frontend/alignment.md)
- 资产中心源码说明：[README](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/README.md)、[API_REQUIREMENTS](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/API_REQUIREMENTS.md)
- 真实系统采集：[数据明细报告](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/system-management-data-report.md)、[网络证据](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl)
- 数据服务已决策：[决策地图](../../.scratch/data-service-platform/map.md)、[设置边界](../../.scratch/data-service-platform/issues/16-decide-settings-policy-scope.md)、[网关配置边界](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md)
- 难逆转边界：[ADR 0001](../adr/0001-data-application-as-exclusive-consumption-boundary.md)、[ADR 0002](../adr/0002-govern-all-external-data-and-operation-channels-through-gateways.md)、[ADR 0003](../adr/0003-map-external-data-consumers-through-data-applications.md)
- 原型（仅目标交互证据）：[统一数据服务平台](../../prototypes/data-service-platform-prototype.html)、[运行管理](../../prototypes/runtime-management.html)、[设置](../../prototypes/settings-page-prototype.html)、[AI 服务开发](../../prototypes/ai-service-development.html)
