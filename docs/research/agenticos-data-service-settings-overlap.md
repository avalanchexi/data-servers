# 数据服务域设置与 AgenticOS 系统配置重叠分析

日期：2026-09-01
结论状态：基于当前本地一手证据的研究结论

## 研究问题

本报告回答：数据服务域原型中的设置与运行配置，和 Seabox AI / AgenticOS 已有的系统配置、字典、身份权限、安全策略、网关相关能力及审计能力，哪些只是名称或界面相似，哪些涉及同一业务对象、策略或事实源，以及这些能力应由哪一层拥有。

## 结论摘要

1. **当前没有证据证明存在两套已运行的配置事实源。** 数据服务设置页明确是离线原型，保存只修改当前页面状态，刷新恢复，不下发网关或运行时；AgenticOS 真实系统则已有可读取、更新的系统配置、应用配置、字典、身份权限、安全策略和审计 API。因此，当前重叠主要是目标设计与既有平台能力的职责重叠，不是已经发生的数据库级双写。[设置原型](../../prototypes/archive/2026-09-02/settings-page-prototype.html) [AgenticOS 系统配置 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-config.ts) [AgenticOS 应用配置 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/app-config.ts)
2. **集市产品类型与系统字典只是名称相近，不是同一分类。** 当前系统字典中的“产品版本类型”表达标准版、高级版等版本档位；数据服务的集市产品类型表达 Agent、MCP、模型、Skill、Worker、API、数据流和逻辑表，并决定固定运行语义。前者不能直接替代后者，后者也不应变成可随意新增删除的通用字典。[字典真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/013-系统配置-字典配置.json) [数据服务设置决策](../../.scratch/data-service-platform/issues/16-decide-settings-policy-scope.md)
3. **认证存在三套不同语义，必须拆开。** AgenticOS 的本地/OAuth/企微登录是“人登录平台”；系统配置中的模型、数据库、LiteLLM 等密钥是“平台连接外部依赖”；数据服务的 OAuth 2.0、API Key、JWT、mTLS 是“数据应用调用服务”。三者不能共用一个“认证配置”对象，但应共享 AgenticOS 的安全底线、秘密引用和审计能力。[认证 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/auth.ts) [应用配置真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/011-系统配置-应用配置.json) [领域定义](../../CONTEXT.md)
4. **类型专属限制与 AgenticOS 运行参数是分层交集，不是天然重复。** 数据服务配置的是数据应用级额度和产品级业务上限；AgenticOS 已有的是 Agent、代码执行、工具并行、模型 Token 等平台运行参数或执行器参数。前者不能突破后者；真正执行时应由网关、Agent/Worker/Skill 运行时和模型适配器接收投影，而不是每层各自成为同一限制的权威来源。[环境配置真实网络证据](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl) [类型专属限制原型](../../prototypes/archive/2026-09-02/settings-page-prototype.html)
5. **最严重的职责冲突是授权主体。** 现有资产中心源码把“数据服务授权”描述为 `RequirePermission（asset-service）+ ACL 行列范围`，ACL 以“资产×角色”为主体；数据服务已决策则把外部消费身份、服务授权、配额和运行观测收敛到“数据应用”。菜单权限适合约束人能否管理页面，角色 ACL 适合约束平台内人员的数据使用，但不能替代外部数据应用的运行时授权。这里属于业务职责重叠与模型冲突，必须在建设前消除。[现有授权管理页](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/pages/home/asset-center/service/tabs/AuthManageTab.tsx) [现有行列权限页](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/pages/home/asset-center/security/tabs/AclTab.tsx) [数据应用 ADR](../adr/0001-data-application-as-exclusive-consumption-boundary.md)
6. **系统审计应成为公共审计事实源，数据服务保留领域投影。** AgenticOS 已有跨模块审计查询、导出、留存和清理；数据服务需要的网关变更、外部数据调用、中台加工等字段更具体。建议扩展公共事件契约并由数据服务提供筛选后的领域视图，而不是再建一套可修改或独立留存的审计库。[审计 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/audit.ts) [系统审计真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/035-系统审计-审计日志.json) [数据服务运行审计定义](../../CONTEXT.md)
7. **AgenticOS 现有“环境配置”不是数据服务所需的逻辑环境主数据。** 真实页面管理的是 `config.yaml` 中由环境变量占位的模型、Agent、代码执行、日志等参数；它没有证据表明存在可供授权、发布和路由统一引用的环境实体。因此两者当前只是同名，平台仍需明确逻辑环境的唯一标识和生命周期。[环境配置真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/010-系统配置-环境配置.json)
8. **网关配置目前没有发生事实源重复，但公共底座证据不足。** 数据服务已经设计了路由、策略、配置发布和漂移处理；现有 AgenticOS 证据只显示 Agent 通知网关的参数和安全插件的 Gateway 通道，没有发现厂商中立的网关路由、发布、差异和回滚对象。物理网关连接与秘密应归 AgenticOS 公共底座，数据服务拥有面向本域的期望配置和发布意图，网关/运行时负责执行。[网关边界决策](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md) [运行管理原型](../../prototypes/archive/2026-09-02/runtime-management.html)

## 判定方法

### 重叠等级

| 等级 | 含义 | 裁决方式 |
| --- | --- | --- |
| O0 | 无重叠 | 保持独立 |
| O1 | 仅名称、页面或字段相似，业务对象不同 | 澄清命名，不合并事实源 |
| O2 | 语义或字段有交集，但处于不同策略层/执行层 | 建立上限、引用或投影关系 |
| O3 | 管理同一职责或对同一对象给出冲突解释 | 必须确定唯一所有者并迁移/适配 |
| O4 | 已证实同时持久化同一对象或策略 | 立即停止双写并合并事实源 |

本轮没有发现 O4。原因不是已经证明不存在双写，而是数据服务原型没有真实持久化，同时当前前端导出包不包含后端实现，无法验证数据库表、配置写入链路和运行时消费关系。

### 证据等级

| 等级 | 说明 |
| --- | --- |
| F1 | 真实系统 Playwright 状态、截图或脱敏 GET 响应直接证明的运行事实 |
| F2 | AgenticOS 前端 API 契约或页面源码直接证明的实现意图 |
| D | 已确认的领域文档、ADR 或 Wayfinder 决策 |
| P | 离线原型表达的目标行为；不是已实现能力 |
| I | 基于多项证据作出的架构推断，必须在后端或集成设计中复核 |

## 逐项重叠矩阵

### 一、数据服务域三个设置项

| 配置对象 | 字段或策略 | 作用范围 | 管理角色 | 当前/目标事实源 | 运行执行方 | 审计方式 | 重叠等级 | 建议归属 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 集市产品类型 | 数据服务：固定代码 Agent、MCP、模型、Skill、Worker、API、数据流、逻辑表；可改展示名称、说明、排序、对外呈现状态。AgenticOS 字典：`type_code/item_code/item_name/sort_order/is_active/extra`，当前“产品版本类型”条目是标准版、高级版等版本档位 | 数据服务类型决定服务集市展示及产品配置结构；系统字典为 OA/CRM 等跨模块枚举 | 数据服务管理者；系统字典当前页面为系统管理能力 | P/D：数据服务类型注册表尚未实现；F1/F2：`/v1/system/dict-types` 是已运行字典事实源 | 类型代码由数据服务产品模型解释；展示过滤由集市执行。系统字典由业务读取 API 消费 | 数据服务决策要求修改和停用留痕；当前字典 API 有时间戳但没有从本轮证据证明对应审计事件 | **O1**；若把固定运行类型直接做成可新增字典则升为 O3 | 固定类型代码、运行语义和展示元数据归数据服务域；AgenticOS 可提供通用配置存储能力，但不得允许通过通用字典创造新的运行类型。现有 `product_version_type` 保持独立 |
| 认证与密钥策略：数据应用接入 | 允许/默认认证方式；OAuth 访问令牌与客户端密钥期限；API Key 期限；独立 JWT 可接受时长；mTLS 证书接受边界 | 一个租户内的数据应用调用数据服务；实际值受数据安全底线约束 | 数据服务管理者在平台底线内设默认值和上限；应用负责人选择实际配置 | D/P：数据服务领域策略与原型；当前没有对应生产 API 证据 | 认证服务签发/校验，统一网关执行认证投影，证书适配层执行 mTLS；数据服务不保存秘密明文 | 设置变更、应用版本、凭据签发/禁用/轮换都应进入公共审计；当前只证明公共审计可记录认证失败和部分 Token 操作 | **O2**，与平台身份、安全底线和秘密管理交叉，但不是同一认证对象 | 域内默认值/上限归数据服务；可用认证机制、安全下限、秘密保管与签发服务归 AgenticOS 公共底座；数据服务只保存策略和秘密引用 |
| 类型专属限制 | Agent、MCP、模型、Skill、Worker、API、数据流七类的请求、Token、工具、脚本、任务或订阅限制；额度主体是数据应用，全部凭据共享 | 数据应用×产品类型，必要时细化到固定服务版本和环境 | 数据服务管理者设域默认/上限；应用负责人在允许范围内提交实际值 | D/P：原型状态；F1：AgenticOS `config.yaml` 已存在执行超时、工具调用、并发、Token 等平台参数 | 入口请求由网关；Agent/MCP/Skill/Worker 由相应运行时或适配器；模型由模型网关/LiteLLM；数据流由订阅适配器 | 策略变更、应用发版和拒绝/超限事件进入公共审计，领域页显示其投影 | **O2**；同名限制的主体和层级不同 | 数据服务拥有“每个数据应用获准多少”的业务策略；AgenticOS/执行器拥有“平台最多能执行多少”的硬上限。应用值必须满足 `应用值 ≤ 数据服务上限 ≤ 平台/安全硬上限`，发布后生成执行投影 |

证据：[数据服务设置范围决策](../../.scratch/data-service-platform/issues/16-decide-settings-policy-scope.md) [设置原型](../../prototypes/archive/2026-09-02/settings-page-prototype.html) [字典 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-dict.ts) [字典 GET 响应](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl) [系统配置 GET 响应](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl)

### 二、认证、密钥与执行限制的细分

| AgenticOS 已有对象 | 已见字段/策略 | 与数据服务的关系 | 事实源与执行 | 重叠等级 | 归属裁决 |
| --- | --- | --- | --- | --- | --- |
| 人员登录配置 | `login.local.enabled`、`login.oauth.enabled/base_url/cookie_domain/tenant_id`、企微登录开关；用户 `auth_summary` | 同样出现 OAuth，但主体是平台用户，不是数据应用；登录会话也不是服务调用凭据 | F1/F2：AgenticOS 应用配置与 Auth API；由平台认证服务执行 | **O1** | 完全归 AgenticOS 身份域。数据服务只引用当前用户、角色和组织，不复刻登录配置 |
| 平台外部依赖秘密 | 模型/Embedding/Rerank API Key、LiteLLM master key、数据库密码、MinIO access/secret key、SMTP 密码、外部 API Key；真实响应对敏感值做掩码 | 与数据服务 API Key 只有“都是秘密”这一表面相似；前者是平台服务连接凭据，后者是外部消费应用身份 | F1/F2：系统/应用配置文件及环境变量占位；实际秘密管理后端未证明 | **O1/O2** | 配置引用和秘密材料归公共秘密管理；数据服务凭据必须使用独立命名空间和主体，不进入通用配置文件明文字段 |
| LiteLLM Token | `expires_at`、`rpm_limit`、`tpm_limit`、`max_budget`、`models`、`status`；系统应用配置还有 `max_tokens_per_user` | 若数据服务的模型产品由 LiteLLM 执行，Token 期限、RPM/TPM 与模型额度会映射到同一执行器；当前证据没有证明数据应用与 LiteLLM Token 的映射关系 | F2：LiteLLM API；执行方是 LiteLLM 适配层 | **O2，待验证是否会升为 O3** | 数据应用授权和额度仍归数据服务；LiteLLM Token 作为执行投影或底层凭据。禁止人工在两个页面分别维护同一应用的 RPM/TPM |
| Agent/代码/Hermes 运行参数 | `agent_execution_timeout`、`max_concurrent_agents`、`code_execution.timeout/max_tool_calls`、`tool_parallel_max`、`daily_token_limit` 等 | 与 Agent、Skill、Worker、模型的类型专属限制字段相似，但当前是实例/运行时全局参数，不是数据应用授权额度 | F1：真实 `system-config` GET；执行方是 Agent/Hermes/代码执行运行时 | **O2** | 归 AgenticOS 运行时硬上限；数据服务只能配置更窄的应用级限制并发布投影 |
| LLM 安全“限流管理” | 真实页面将限流列为安全防御方向，但 `safety.ts` 的已见结构主要是内容策略、LLM 扫描配置与统计，没有独立限流对象 | 与模型/Agent 类型限额名称交叉，当前不足以证明管理同一额度 | F1 页面文字 + F2 API 契约；执行关系未证明 | **O1/O2，证据不足** | 在后端核实是否存在限流策略；若存在，安全域拥有不可突破的紧急/合规上限，数据服务拥有业务额度，统一网关合并执行 |

证据：[LiteLLM API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/litellm.ts) [系统配置真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/009-系统配置-base.json) [LLM 安全真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/029-安全合规-LLM安全.json) [安全 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/safety.ts)

### 三、环境、应用配置和字典

| 配置对象 | AgenticOS 当前事实 | 数据服务目标事实 | 作用范围/管理角色 | 事实源与执行方 | 审计 | 重叠等级 | 建议归属 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| “环境配置” | 真实页面说明为可视化管理 `config.yaml`；24 类、96 项，覆盖模型、Agent、代码执行、日志、工具、网络等，并大量使用 `${VAR}` 环境变量占位；仅超级管理员可修改 | 数据服务域设置已明确不含环境管理，但服务授权、网关发布和运行观测都需要引用运行环境 | AgenticOS 部署/实例范围，超级管理员；数据服务只消费逻辑环境 | F1/F2：`/v1/admin/system-config` 和批量更新/备份 API；实际由各 AgenticOS 组件读取 | 公共系统审计的事件列表含“配置更新/系统配置变更”；是否覆盖每个字段写入需后端验证 | **O1**：同名但对象不同；另有能力缺口 | 将当前页面更准确称为“运行参数/环境变量配置”。逻辑 `Environment`（开发/测试/生产、租户、状态、网关绑定）应由 AgenticOS 公共底座建立唯一事实源，数据服务以 ID 引用 |
| AgenticOS“应用配置” | 32 类、133 项，包括系统信息、加密、API 监听、数据库/连接池、DocQA、平台登录、CRM、文件、数据上下文、SMTP、风险监控等 | 数据服务中的“数据应用实际配置”是外部消费场景的版本化业务对象，包含服务选择、授权、凭据、额度和环境 | AgenticOS 超级管理员管理部署配置；数据应用负责人管理消费场景版本 | F1/F2：`/v1/admin/app-config`；数据服务目标尚未实现；分别由平台组件和网关/运行时执行 | 系统配置变更进入公共审计；数据应用版本需工作流和发布审计 | **O1**：`应用` 一词碰撞，不是同一对象 | 保持两个模型独立，并在 UI/接口中使用“AgenticOS 应用运行配置”与“数据应用”完整名称，禁止共享 `app_config` 聚合 |
| 系统字典 | 当前 8 个系统字典类型，服务 OA/CRM 产品、合同、审批和工时等；API 支持字典类型和条目的 CRUD，系统字典有 `is_system` 标识 | 数据服务没有通用字典设置；集市产品类型代码由平台固定，不是普通枚举 | 跨产品域公共字典，系统管理员；数据服务管理者只管域内展示元数据 | F1/F2：`/v1/system/dict-types`；业务通过 `/v1/system/dicts/{typeCode}` 读取 | 当前证据未证明每次字典改动的审计契约 | **O0**，与集市类型只有 O1 | 系统字典继续归 AgenticOS。只有真正跨域、允许业务维护的枚举才进入字典；数据服务固定类型不可迁入 |

证据：[系统配置 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-config.ts) [应用配置 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/app-config.ts) [字典 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-dict.ts) [系统配置状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/010-系统配置-环境配置.json) [应用配置状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/011-系统配置-应用配置.json)

### 四、权限与数据授权

| 权限对象 | 字段或策略 | 主体与范围 | 当前事实源 | 执行方 | 审计 | 重叠等级 | 建议归属 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 平台身份、组织与角色 | 用户状态/认证渠道/组织；角色代码、内置标识；用户与角色绑定 | 人员及组织，跨所有产品域 | F1/F2：用户、组织、角色 API 和真实权限页面 | AgenticOS 认证与权限中间件 | 真实系统审计事件包含用户、角色、组织变更 | **O0/O1** | AgenticOS 唯一拥有。数据服务引用 `user_id/org_id/role_id`，不建立第二套人员目录 |
| 功能菜单权限 | 菜单 `id/section/route/order/hidden/enabled`；角色×菜单的 `read/write`；前端还有 `readonly_menus/readonly_all` | 人能否浏览或编辑某个管理页面 | F1/F2：`sys_menus` 被页面明确称为菜单定义唯一事实源；权限 API 更新角色/菜单矩阵 | 后端权限守卫 + 前端只读作用域 | 公共审计事件列表包含更新菜单权限 | **O1**：与“服务权限”同名，但对象不同 | AgenticOS 拥有。数据服务各页面注册菜单点并复用它，只用于管理面访问，不表示获准调用数据服务 |
| 现有资产中心 ACL | `asset_id × role_id × scope(column/row/both)`，列掩码、行级过滤；数据服务授权页写明复用 RequirePermission + ACL | 平台内角色对资产行列的访问；现有页面又把它描述成“数据服务授权” | F2：`/v1/asset/security/acls` 与现有授权管理源码 | 数据安全 ACL / 查询改写机制 | `/v1/asset/security/audit-logs` 是独立审计入口；与系统审计是否同库未知 | **O3**：与目标数据应用授权在“服务授权”职责上冲突 | ACL 归数据治理/数据安全，作为资产级允许边界。管理人员开发访问可继续按角色；外部运行必须把批准范围投影到 `data_application_id`，不得把角色 ACL 直接当作数据应用凭据权限 |
| 数据服务服务授权 | 数据应用、服务固定版本、环境、数据权限、操作权限、认证方式、额度；租户从上下文继承 | 每个外部消费场景一项数据应用身份 | D：`CONTEXT.md` 与 ADR；P：原型；未发现生产 API | 统一网关、数据权限执行器、服务/任务运行时 | 公共审计必须关联应用、消费场景、服务版本、认证、授权和数据范围 | **O3**（相对于现有“角色+ACL 即服务授权”的表述） | 数据服务域拥有授权业务对象；资产安全提供分类、脱敏和行列规则的约束/决策输入；AgenticOS 工作流批准，公共底座执行和审计 |

证据：[权限 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/permission.ts) [菜单 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/menu.ts) [角色 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/role.ts) [功能权限真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/019-权限管理-功能权限.json) [现有资产安全 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/asset.ts) [外部消费者 ADR](../adr/0003-map-external-data-consumers-through-data-applications.md)

### 五、安全策略、网关和审计

| 配置对象 | AgenticOS 当前事实 | 数据服务目标事实 | 作用范围/管理角色 | 事实源与执行方 | 审计 | 重叠等级 | 建议归属 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 内容与 LLM 安全策略 | `name/category/scope/match_type/pattern/action/severity/enabled/sort_order`；作用域覆盖输入、输出、工具调用/结果；另有 LLM 扫描配置 | 数据服务运行策略只保存外部安全策略引用和绑定范围，不建设 WAF/内容安全规则编辑器 | AgenticOS 跨产品安全底线，安全管理员；数据服务管理者只能选择获准引用并绑定到服务/应用 | F1/F2：`/v1/safety/policies`、`/v1/safety/llm-config`；SafetyMiddleware/插件/Gateway 通道执行 | 安全事件表 + 系统审计 + 消息通知，真实页面直接展示该链路 | **O2**；若数据服务复制规则内容则升为 O3 | 安全策略定义与最低处置归 AgenticOS 安全合规；数据服务只拥有 `policy_id + binding scope + release status`，不得复制 pattern/处置规则 |
| 网关路由与策略 | 现有证据仅见 `agent.gateway_notify_interval`、LLM 安全 Gateway 直连通道和 LiteLLM 适配；没有发现通用路由、后端池、发布、漂移、回滚 API | 数据服务运行管理已经定义入口、路由、后端、认证投影、限流/安全/AI 路由、配置发布、漂移与紧急停流 | 数据服务产品域的期望配置；公共底座的物理实例与适配器；管理者经工作流操作 | D/P：数据服务决策和原型；F1/F2：AgenticOS 只有零散网关线索；实际网关是执行方 | 每次发布、回滚、紧急停流和漂移接纳必须进入公共审计 | **O2（接口边界）/当前无 O4** | AgenticOS 拥有 Gateway 实例、适配器、能力声明、连接和 Secret 引用；数据服务拥有本域路由/策略期望状态与配置发布；发布服务生成厂商适配配置并回写状态 |
| 系统审计 | `event_type/category/user/action/result/resource/details/session/platform/time`；查询、详情、CSV/JSON 导出、统计；用户操作和系统事件分别设置留存，支持清理预览/执行 | 数据服务要展示管理操作、系统运行、外部调用和中台加工四类结构化审计，并含应用、服务版本、授权、数据范围、加工批次等领域字段 | 跨域审计由系统管理员/审计员；数据服务管理者查看本域投影 | F1/F2：`/v1/audit/*`；P/D：数据服务审计；现有资产安全另有 `/asset/security/audit-logs` | 公共审计本身是留痕服务；数据服务不得修改记录 | **O3（职责/页面重叠），物理事实源是否重复未证明** | 建立公共 `AuditEvent` 唯一写入契约，允许领域扩展字段或受控引用；系统审计做全局查询/留存，数据服务和资产安全只做领域投影，取消独立可变审计存储 |

证据：[安全策略 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/safety.ts) [安全策略真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/027-安全合规-策略配置.json) [LLM 安全真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/029-安全合规-LLM安全.json) [网关运行配置研究](gateway-runtime-configurations.md) [网关边界决策](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md) [审计 API](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/audit.ts) [日志管理真实状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/037-系统审计-日志管理.json)

## 建议的唯一事实源与投影关系

| 能力 | 唯一事实源 | 数据服务保存什么 | 数据服务不应保存什么 | 执行/投影 |
| --- | --- | --- | --- | --- |
| 用户、组织、角色、菜单权限 | AgenticOS 身份权限 | 主体 ID、页面菜单注册、审批参与者引用 | 人员档案、登录渠道、角色主数据 | AgenticOS 权限守卫 |
| 逻辑环境 | AgenticOS 公共配置（需补建显式环境实体） | `environment_id` 与域内发布状态 | 第二份开发/测试/生产清单、平台部署变量 | 网关/运行时按环境投影 |
| 安全底线 | AgenticOS 安全合规 | 安全策略引用、绑定对象、生效/发布状态 | 正则、关键词、WAF 规则、全局最低阈值副本 | SafetyMiddleware、插件、网关 |
| 秘密与凭据材料 | AgenticOS 凭据/秘密服务（当前证据只证明掩码配置，完整服务待核实） | 凭据元数据、状态、`secret_ref`、数据应用归属 | API Key/Client Secret/私钥明文、通用平台连接秘密 | 认证服务、网关、mTLS 适配器 |
| 集市产品类型 | 数据服务域 | 固定类型代码与展示元数据 | 任意扩展的执行语义 | 集市和服务开发模块 |
| 数据应用与服务授权 | 数据服务域 | 应用版本、固定服务版本、环境、权限、额度、认证选择 | 人员菜单权限、资产分类规则副本 | 工作流批准；网关/数据权限/运行时执行 |
| 资产分类、脱敏、行列安全规则 | 数据治理/数据安全域 | 批准结果、规则/决策引用、应用级投影状态 | 第二份资产 ACL 定义 | 数据权限执行器/查询改写 |
| 网关物理接入 | AgenticOS 公共底座 | 实例/适配器引用、能力校验结果 | 连接 Secret、厂商安装参数、节点配置 | 网关适配器 |
| 数据服务网关期望配置 | 数据服务运行管理 | 路由、域内策略绑定、配置发布、期望状态 | 厂商原始配置和基础设施状态 | 配置发布服务生成投影，网关执行 |
| 审计事件 | AgenticOS 公共审计 | 领域查询模型或索引，不另写权威记录 | 可修改副本、独立留存规则 | 各域发事件；公共审计持久化；领域页面投影 |

推荐的策略合并顺序是：

`AgenticOS 安全/运行时硬上限 → 数据服务域默认值与上限 → 数据应用获批实际值 → 网关/运行时执行投影`。

任何一层收紧都不能由下游放宽；执行器回报的实际状态不能反向静默覆盖期望配置。发现漂移时，由配置发布流程显式选择覆盖实际状态或接纳实际状态，并生成新的审计事件。[配置漂移领域定义](../../CONTEXT.md)

## 必须在建设前关闭的边界问题

1. **授权迁移：** 明确现有资产中心“数据服务授权”页是仅供平台内角色访问资产，还是要承载外部系统授权。如果后者，必须迁移为数据应用主体；角色 ACL 只能成为审批约束和运行投影的输入。
2. **逻辑环境：** 定义公共 `Environment` 的 ID、租户归属、生命周期和网关绑定；不能继续把 `config.yaml` 的“环境配置”标签当作业务环境主数据。
3. **凭据服务：** 核实 AgenticOS 是否已有秘密管理、签发、禁用、轮换和吊销服务。当前证据只证明字段掩码和若干 Token API，不足以证明通用凭据生命周期。
4. **额度投影：** 对 Agent、MCP、模型、Skill、Worker、API、数据流逐类定义“业务额度字段 → 执行器字段”的映射，并确定无法原生执行时的适配器责任。
5. **审计统一：** 核实 `/v1/audit/*`、`/v1/asset/security/audit-logs`、安全事件表及运行日志的物理关系；定义统一事件 ID、租户/域、主体类型、资源类型、授权引用、追踪 ID 和不可修改/留存要求。
6. **网关控制面：** 核实是否存在当前前端包未导出的网关后端；若不存在，需要建设实例/适配器注册、期望配置、发布、状态回写和漂移检测，而不是把这些对象塞入通用 `config.yaml` 批量编辑。

## 证据限制

1. Playwright 采集对当前账号可见的系统管理 8 个模块、41 个状态覆盖完整，但结论只适用于该账号可见范围；没有采集只读详情记录。[覆盖报告](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/coverage-report.md)
2. 采集策略阻止 PUT/PATCH/DELETE 及可疑写 POST，因此 GET 响应能证明读取形态和当前数据，不能证明写入校验、并发控制、审批、回滚或审计一定正确。[采集清单](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/manifest.json)
3. 脱敏网络证据只捕获了 100 个 API 响应；权限和审计页面虽然有结构化页面状态，网络文件未为每个标签保存独立响应，不能据此推出完整后端表结构。[网络证据](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl)
4. `frontend/` 是资产中心业务域导出包，包含大量 API 契约但不是完整可启动应用，也不含本轮需要验证的后端源码；API 路径证明前端依赖的契约，不证明服务内部实现和物理存储。[前端对齐记录](../../frontend/alignment.md)
5. 数据服务的设置和运行管理是决策文档与离线 HTML 原型。原型中的保存、发布、审计和策略执行文字用于表达目标边界，不是生产能力验收证据。[设置原型](../../prototypes/archive/2026-09-02/settings-page-prototype.html) [运行管理原型](../../prototypes/archive/2026-09-02/runtime-management.html)
6. 本报告只判定设置及相关公共管理模块的重叠与归属，不单独证明 AgenticOS 整体已经具备建设完整数据中台所需的后端架构；该问题应结合源码架构、运行监控和集成接缝另行评估。

## 本轮使用的一手材料

- 领域语言与边界：[CONTEXT.md](../../CONTEXT.md)
- 不可逆决策：[ADR-0001](../adr/0001-data-application-as-exclusive-consumption-boundary.md)、[ADR-0002](../adr/0002-govern-all-external-data-and-operation-channels-through-gateways.md)、[ADR-0003](../adr/0003-map-external-data-consumers-through-data-applications.md)
- 数据服务既有决策：[设置范围](../../.scratch/data-service-platform/issues/16-decide-settings-policy-scope.md)、[网关配置边界](../../.scratch/data-service-platform/issues/21-decide-gateway-runtime-configuration-boundary.md)、[运行与设置原型优先级](../../.scratch/data-service-platform/issues/22-prioritize-runtime-settings-prototype.md)
- 数据服务原型：[设置](../../prototypes/archive/2026-09-02/settings-page-prototype.html)、[运行管理](../../prototypes/archive/2026-09-02/runtime-management.html)、[统一原型](../../prototypes/archive/2026-09-02/data-service-platform-prototype.html)
- AgenticOS 前端契约：[系统配置](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-config.ts)、[应用配置](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/app-config.ts)、[字典](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/system-dict.ts)、[权限](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/permission.ts)、[审计](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/audit.ts)、[安全](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/safety.ts)、[资产中心](../../frontend/agenticos-asset-center-frontend/agenticos-asset-center-frontend/src/api/asset.ts)
- 真实系统证据：[系统管理采集报告](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/system-management-data-report.md)、[结构化状态](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/states/)、[脱敏网络证据](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/network/network-details.jsonl)、[截图](../../output/playwright/seabox-system-management-detail-audit/20260901T011050Z/screenshots/)
