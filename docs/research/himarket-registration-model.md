# HiMarket 注册管理参考模型调研

> 调研日期：2026-08-27  
> 调研范围：本地 `/mnt/d/cursor/himarket` 源码、项目内架构文档与用户指南  
> 结论性质：HiMarket 领域模型与交互逻辑参考，不代表本平台采用 HiMarket、Higress、Nacos 或阿里云 AIRegistry

## 1. 结论摘要

HiMarket 最值得复用的不是某一网关的字段，而是下面四组对象分离：

1. `Product` 表达服务集市中的稳定产品身份；`ProductRef` 表达产品对底层技术资源的引用；`ProductPublication` 表达产品在哪个门户可见。三者分开后，产品元数据、运行绑定和目录可见性可以独立变化。HiMarket 的架构文档也把 `Product` 定义为可订阅 API 服务，并明确列出产品、发布、引用、订阅、凭证之间的关系。（来源：`/mnt/d/cursor/himarket/docs/ARCHITECTURE.md:134-153`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Product.java:57-98`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductRef.java:51-106`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductPublication.java:41-53`）
2. `Consumer`、`ConsumerCredential`、`ProductSubscription`、`ConsumerRef` 分别表达消费应用、应用凭证、产品授权和授权在底层网关中的消费者映射。这个拆分适合作为本平台“消费应用—服务授权—凭证绑定—网关执行投影”的参考。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Consumer.java:51-77`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerCredential.java:55-74`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductSubscription.java:54-81`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerRef.java:47-65`）
3. `Gateway` 保存实例身份和连接配置，`GatewayOperator` 把资源发现、配置读取、消费者创建、授权和撤销封装成适配器接口。这一“平台领域对象 + 适配器执行”的结构可以复用，但硬编码的网关枚举和各厂商 JSON 配置不能照搬。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Gateway.java:60-93`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/gateway/GatewayOperator.java:50-105`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/GatewayServiceImpl.java:343-354`）
4. HiMarket **不存在统一的 Agent、MCP、模型、Skill、Worker 注册模型**。Agent、模型主要引用网关或 Nacos 已有资源；Skill 使用 Nacos/AIRegistry 制品仓库；Worker 使用 Nacos AgentSpec；MCP 既可引用网关/Nacos，也有单独的自注册技术模型。因此，本平台只能把 HiMarket 当成若干局部模式的来源，不能直接把其“产品导入”当作统一注册管理。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ApiProducts.tsx:40-64`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/importer/ProductImporter.java:272-370`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/McpServerServiceImpl.java:154-250`）

对本平台的核心建议是：保留上述对象分离，但新增 HiMarket 缺少的 `RegistrationRequest`、`RegistrationExecution`、`ProductVersion`、`VisibilityPolicy`、`CredentialBinding`、审批结果和租户字段；产品主状态继续使用本项目已经确认的“上线/下线”状态机，不采用 HiMarket 的 `PENDING / READY / PUBLISHED` 作为对外生命周期。

## 2. HiMarket 的领域对象

### 2.1 服务产品与技术引用

`Product` 是集市产品主对象，包含产品 ID、管理员、名称、类型、描述、是否启用消费者认证、文档、图标、产品状态、自动审批开关和类型特征。它没有租户、注册者、私有/共享可见性、环境、版本、审核单或外部资源唯一标识字段。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Product.java:57-98`）

产品类型枚举包括 `REST_API`、`HTTP_API`、`MCP_SERVER`、`AGENT_API`、`MODEL_API`、`AGENT_SKILL`、`WORKER`。这说明 HiMarket 用一个产品超类型承载多种集市产品。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/ProductType.java:22-36`）

`ProductRef` 把产品关联到运行或注册来源：

- `productId` 指向产品；
- `gatewayId`、`nacosId` 指向外部实例；
- `sourceType` 区分 `GATEWAY / NACOS / CUSTOM / API_DEFINITION`；
- 不同网关分别使用 `apigRefConfig`、`adpAIGatewayRefConfig`、`apsaraGatewayRefConfig`、`higressRefConfig`；
- `apiConfig`、`mcpConfig`、`agentConfig`、`modelConfig` 保存从底层同步回来的产品类型配置；
- `enabled` 表达技术引用是否启用。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductRef.java:51-106`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/SourceType.java:22-58`）

这个模型实际形成了以下分层：

```text
Product（集市稳定身份）
   └── ProductRef（当前技术资源绑定）
          ├── Gateway resource
          ├── Nacos resource
          ├── custom config
          └── API definition
```

这一分层值得复用，但本平台应把 `ProductRef` 收敛为厂商中立的 `RuntimeBinding / SourceBinding`，厂商参数放入适配器配置，而不是继续给每个网关增加实体字段。

### 2.2 产品发布与目录展示

`ProductPublication` 只记录 `portalId + productId`，说明 HiMarket 把“出现在某个门户”建模为产品和门户的关联，而不是直接把目录地址写在产品上。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductPublication.java:41-53`）

后台发布时，系统先检查门户存在和是否重复发布，再把产品状态设为 `PUBLISHED` 并新增 `ProductPublication`；取消某个门户发布后，如果仍在其他门户发布则保持 `PUBLISHED`，否则回到 `READY`。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:328-355`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:388-425`）

非管理员查询时，服务端强制使用当前门户，并强制筛选 `PUBLISHED` 产品；产品详情也要求存在当前门户的 `ProductPublication`。因此，目录可见性首先由“发布到门户”控制，而不是由订阅状态控制。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:252-262`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:954-963`）

`ProductCategory` 保存名称、说明和图标，`ProductCategoryRelation` 建立产品和类别多对多关系；查询支持门户、产品类型、状态、名称和类别过滤。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductCategory.java:51-70`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductCategoryRelation.java:48-57`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/dto/params/product/QueryProductParam.java:27-50`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:966-1018`）

前台集市使用左侧类别导航、名称搜索和下载量/最近更新排序；Skill、Worker 卡片还展示作者、标签和下载次数。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/square/ProductMarketLayout.tsx:170-248`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/square/ProductMarketLayout.tsx:260-300`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/square/SkillCard.tsx:57-118`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/square/WorkerCard.tsx:57-118`）

### 2.3 消费者、凭证、订阅和网关映射

HiMarket 的 `Consumer` 更接近本平台的“消费应用”，不是自然人消费者。它属于一个 `Developer` 和一个 `Portal`，包含名称、说明和主消费者标记；同一开发者在同一门户下的 Consumer 名称唯一。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Consumer.java:35-77`）

创建 Consumer 时，系统同时初始化一个 `ConsumerCredential`，默认生成一项系统管理的 API Key。一个 Consumer 在数据库约束上只有一条凭证配置记录，但记录内部可以包含 API Key、HMAC 和 JWT 配置。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:121-136`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:242-253`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerCredential.java:42-74`）

API Key 支持系统生成或自定义，默认位置为 `Authorization`，默认来源为 `Default`；HMAC 支持 AK/SK；JWT 类型目前是空配置类。HiMarket 的凭证模型没有有效期、禁用、轮换、历史版本和“每项服务授权独立凭证”等字段。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/consumer/ApiKeyConfig.java:26-47`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/consumer/HmacConfig.java:26-37`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/consumer/JwtConfig.java:20-25`）

`ProductSubscription` 在数据层唯一绑定 `productId + consumerId`，并记录开发者、门户、状态和网关授权回执 `consumerAuthConfig`。状态只有 `PENDING` 和 `APPROVED`。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductSubscription.java:41-81`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/SubscriptionStatus.java:22-32`）

订阅时，系统先拒绝重复订阅，再按照产品级 `autoApprove` 或门户默认策略决定自动批准还是待审批；如果产品来自网关，批准动作同时创建网关侧授权，并把回执写入订阅。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:300-342`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:875-883`）

人工批准只允许把 `PENDING` 改为 `APPROVED`；它会读取消费应用凭证、产品技术引用，在网关创建或复用消费者并执行授权。取消订阅不是状态迁移，而是撤销网关授权后删除订阅记录。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:423-465`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:345-373`）

`ConsumerRef` 保存平台 Consumer 到某类网关消费者 ID 的映射；首次授权时创建底层消费者和映射，后续授权复用，若底层对象丢失则重建。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerRef.java:47-65`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:603-648`）

前台 Consumer 详情分为“基础信息/认证配置”和“订阅列表”两个页签；产品详情允许选择尚未订阅的 Consumer 发起订阅，并在管理弹窗查看各 Consumer 的订阅状态和取消订阅。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/pages/ConsumerDetail.tsx:125-181`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/ProductHeader.tsx:280-313`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/ProductHeader.tsx:535-699`）

### 2.4 网关实例与适配器

`Gateway` 包含网关 ID、名称、类型、管理员和按厂商拆分的连接配置。支持的枚举包括阿里云 API/AI 网关、ADP AI Gateway、Apsara Gateway 和 Higress。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Gateway.java:60-93`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/GatewayType.java:27-75`）

导入网关时校验 ID 和名称冲突，保存所属管理员；如果网关已经被产品引用则禁止删除。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/GatewayServiceImpl.java:102-130`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/GatewayServiceImpl.java:168-177`）

`GatewayOperator` 的能力面覆盖 HTTP/REST API、MCP、Agent、Model 发现与配置读取，以及 Consumer 创建、更新、删除、授权和撤销。运行时由 Spring 收集各 Operator，并按 `GatewayType` 建立映射。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/gateway/GatewayOperator.java:50-105`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/GatewayServiceImpl.java:343-354`）

这一接口是很好的适配器边界参考；但它仍有 HiMarket 特定耦合，例如客户端创建逻辑直接识别 APIG/Higress，新增网关类型需要扩枚举、实体字段和实现类。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/gateway/GatewayOperator.java:107-132`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Gateway.java:79-93`）

## 3. 状态与执行模型

### 3.1 产品状态

HiMarket 产品状态只有：

```text
PENDING → READY → PUBLISHED
```

`PENDING` 是未关联技术 API，关联 `ProductRef` 后成为 `READY`，发布到至少一个门户后成为 `PUBLISHED`；删除引用会退回 `PENDING`，取消最后一个门户发布会退回 `READY`。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/ProductStatus.java:22-28`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:495-517`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:527-543`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:388-425`）

这三个状态同时混合“技术绑定是否完成”和“是否在目录展示”，没有表达注册审核、上线执行、失败、取消、下线审核、环境部署和版本。因此它不能取代本平台已经确认的上线/下线复合状态机。

### 3.2 Skill/Worker 版本状态

Skill 和 Worker 的版本结果使用 `draft / reviewing / online / offline`，并根据审批流水线把 `reviewing + APPROVED` 投影为 `online` 或 `approved`，把 `reviewing + REJECTED` 投影为 `rejected`。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/dto/result/common/VersionResult.java:14-76`）

Skill/Worker 都提供版本列表、提交审核、上线、下线、设置 latest 和草稿操作；Skill 额外支持对拒绝版本强制发布。所有写操作都要求管理员权限。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/controller/SkillController.java:88-141`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/controller/WorkerController.java:88-140`）

发布产品到门户前，Skill/Worker 至少要有一个 `online` 版本。这里“制品版本上线”和“产品发布到门户”是两个独立动作，这个分层值得本平台参考。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:341-355`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ProductServiceImpl.java:470-483`）

### 3.3 导入/注册执行状态

通用产品导入是一次同步批处理：请求按来源在 `GATEWAY / NACOS / AIREGISTRY / EXTERNAL` 之间分派，每个条目单独捕获异常，结果只返回成功数量和失败条目的资源名称/错误消息。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/importer/ProductImporter.java:88-128`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/dto/result/product/ImportProductsResult.java:7-15`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/dto/result/product/ProductImportResult.java:6-16`）

网关导入先创建 Product，再建立 ProductRef；引用创建失败时删除刚创建的 Product。该过程没有独立的注册申请、执行任务、重试次数、幂等键、审批记录或可恢复状态。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/importer/ProductImporter.java:130-155`）

MCP 是唯一具有直接“注册”入口的产品类型。注册会校验 MCP 名称唯一性和连接配置，创建 `PENDING` 的 MCP Product，再保存 MCP 技术元数据；注册参数虽声明 `visibility` 和 `publishStatus`，`registerMcp` 的组装过程并未把这两个字段写入 Product 或 MCP 元数据。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/dto/params/mcp/RegisterMcpParam.java:8-77`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/McpServerServiceImpl.java:154-250`）

此外，HiMarket 提供受单一 `X-API-Key` 保护的外部 MCP 注册 API，但更新接口尚未开放。这是集成端点的实现参考，不是完整的注册治理模型。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/controller/OpenApiMcpController.java:45-89`）

## 4. 五类 AI 产品的覆盖情况

| 类型 | HiMarket 已有模型 | 产生/注册方式 | 可参考部分 | 关键缺口 |
|---|---|---|---|---|
| Agent | `Product(type=AGENT_API)` + `ProductRef.agentConfig` | 从 AI 网关或 Nacos 选择已有 Agent 后导入/引用 | Agent Card、协议、路由和能力字段；产品与运行引用分离 | 无独立 Agent 注册申请、注册执行、版本、可见性和所有权模型；不能由普通注册者完整管理 |
| MCP | `Product(type=MCP_SERVER)` + `ProductRef.mcpConfig`；另有 `McpServerMeta` 和 `McpServerEndpoint` | 网关/Nacos/外部市场导入，或 MCP 专用直接注册 | 展示元数据与技术元数据分离；运行端点独立；支持协议、连接、工具、沙箱部署 | 专用模型没有推广到其他类型；直接注册无审核/执行状态；visibility/publishStatus 未落库 |
| 模型 | `Product(type=MODEL_API)` + `ProductRef.modelConfig` | 从网关选择已有模型 API 后导入/引用 | 模型协议、路由、模型参数与产品信息分离 | 无模型注册表、模型版本、提供方/许可证/部署信息和注册审核；模型等同于网关路由 |
| Skill | `Product(type=AGENT_SKILL)` + `SkillConfig` + 后端 Registry | 创建后上传 ZIP，或从 Nacos/AIRegistry 导入；支持草稿、版本审核、上线/下线、下载 | 制品仓库适配、版本状态、latest、文件树/内容、下载入口 | 不是通过统一 AI 网关注册；写操作仅管理员；无注册者/私有共享/租户模型；后端类型带 Nacos/AIRegistry 假设 |
| Worker | `Product(type=WORKER)` + `WorkerConfig` | 创建/上传 AgentSpec 包，或从默认 Nacos 批量导入 | 制品版本、草稿、审核、上线/下线、下载和市场卡片 | 仅绑定 Nacos AgentSpec；无通用 Worker 注册协议、AI 网关绑定、私有共享和注册者模型 |

上表依据如下：

- Agent/模型/MCP 的前端引用模型分别保存 Agent 协议和 Agent Card、Model 协议和路由、MCP 协议和连接配置。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/types/api-product.ts:61-179`）
- 产品导入菜单规定：MCP 可来自网关、Nacos、第三方市场；Agent 可来自网关、Nacos；Skill 可来自 Nacos、AIRegistry；模型和 REST API 来自网关；Worker 使用单独的 Nacos 导入。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ApiProducts.tsx:40-80`）
- Skill 配置支持 `NACOS / AIREGISTRY` 仓库、namespace 和 skillName；Worker 配置只保存 Nacos、namespace 和 AgentSpec 名称。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/product/SkillConfig.java:35-81`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/product/WorkerConfig.java:33-68`）
- MCP 的展示字段归 Product，协议、连接、工具等技术字段归 `McpServerMeta`，运行端点归 `McpServerEndpoint`。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/McpServerMeta.java:38-104`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/McpServerEndpoint.java:35-93`）

## 5. 页面交互参考

### 5.1 管理端

HiMarket 将产品管理按 Model API、MCP Server、Agent API、Agent Skill、Worker、REST API 六个类型切换；每类页面统一提供搜索、列表/卡片、创建和按能力出现的导入入口。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ApiProducts.tsx:17-34`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ApiProducts.tsx:170-227`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ProductTable.tsx:425-470`）

通用导入弹窗采用四步式交互：选择来源/实例、选择 namespace（适用时）、搜索并多选资源、提交后显示成功数量和逐项失败。来源能力由产品类型动态限制。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ImportProductsModal.tsx:93-159`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ImportProductsModal.tsx:526-575`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ImportProductsModal.tsx:749-846`）

产品详情采用侧边分步导航：普通 API 产品为概览、关联 API、使用指南、门户；Skill/Worker 把关联 API 和指南替换为包管理；MCP 保留概览、关联 API、使用指南、门户。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ApiProductDetail.tsx:68-136`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ApiProductDetail.tsx:207-249`）

对本平台而言，可复用的交互骨架是：

```text
选择产品类型 → 选择“创建”或“注册已有产品”
→ 选择注册来源与实例 → 浏览/搜索来源资源 → 勾选
→ 补充平台元数据与私有/共享 → 校验 → 提交注册审核
→ 审核通过后执行注册 → 查看逐项结果 → 进入上线流程
```

需要新增的页面信息包括注册者、租户、环境、外部资源唯一标识、可见性、数据权限需求、注册审核、执行状态、幂等/冲突处理、重试和审计。HiMarket 的同步导入弹窗只能作为前半段资源选择器参考。

### 5.2 消费端

服务集市采用类型页 + 类别 + 搜索 + 排序 + 产品卡片；产品详情再发起订阅，订阅必须选择一个 Consumer。这个交互适合映射为本平台“服务集市 → 服务详情 → 选择消费应用 → 申请权限”。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/square/ProductMarketLayout.tsx:170-300`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/ProductHeader.tsx:280-313`；`/mnt/d/cursor/himarket/himarket-web/himarket-frontend/src/components/ProductHeader.tsx:535-599`）

但本平台的目录可见性受角色、租户、私有/共享和服务权限控制，不能只复用 HiMarket 的“是否发布到 Portal”过滤；授权粒度也必须扩为消费应用 + 服务产品 + 环境 + 权限范围，而不是 HiMarket 的产品 + Consumer 唯一关系。

## 6. 可复用逻辑与不应照搬的假设

### 6.1 建议复用

1. **稳定产品与技术绑定分离**：采用 `ServiceProduct` 与 `RuntimeBinding/SourceBinding`，避免底层资源变化导致集市产品身份变化。
2. **目录投影独立**：采用 `MarketEntry/VisibilityProjection` 表达一个已上线产品在服务集市中的展示，不把展示字段和运行配置混为一体。
3. **消费应用、服务授权、凭证绑定、执行投影分离**：沿用 Consumer/Subscription/ConsumerRef 的职责拆分，但替换名称和粒度。
4. **网关适配器接口**：保留发现资源、读取契约、校验连接、创建/更新注册、开通/撤销授权等厂商中立能力；每个适配器声明自己的支持矩阵。
5. **按类型呈现差异化开发页**：Agent、MCP、模型、Skill、Worker 共享生命周期骨架，详情页按类型插入协议、包、模型或工具配置。
6. **批量注册逐项结果**：保留“部分成功 + 逐项错误”的交互，但由持久化执行任务承载，而不是只返回一次 HTTP 结果。
7. **制品版本与市场上线分离**：Skill/Worker 先产生可用版本，再进入产品上线/集市展示；这一层级也应扩展到 Agent、MCP 和模型。

### 6.2 不应照搬

1. **`PENDING / READY / PUBLISHED` 产品状态**：它混合技术就绪和门户展示，也没有审批/执行状态。本平台继续使用已确认的“草稿—待上线审核—上线中—已上线—待下线审核—下线中—已下线”主状态。
2. **Portal 等于租户或服务集市**：HiMarket 的 Consumer、ProductPublication 都围绕 Portal；本平台的租户是最高隔离边界，租户下只有一个角色化服务集市，不能用 Portal 替代 Tenant。（HiMarket 的 Consumer 明确保存 portalId 和 developerId，来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Consumer.java:70-77`）
3. **管理员即产品所有者**：HiMarket Product 只有 `adminId`；本平台需要 registrant、owner、maintainer、approver，并允许消费方或开发者发起注册。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Product.java:62-73`）
4. **同步导入即注册完成**：本平台所有私有/共享产品都需要注册审核，并需要可追踪的异步执行、失败补偿和审计。
5. **产品级共享凭证**：HiMarket 创建 Consumer 时默认生成 API Key，授权复用该 Consumer 凭证；本平台默认 OAuth 2.0，并在每项服务授权下建立独立凭证绑定，选择 API Key 时才生成独立 Key。（HiMarket 行为来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:121-136`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/ConsumerServiceImpl.java:242-253`）
6. **删除凭证和取消即删记录**：HiMarket 暴露删除凭证接口，取消订阅也删除订阅记录；本平台已经要求 API Key 不物理删除，授权/凭证应保留历史状态和审计。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/controller/ConsumerController.java:103-138`）
7. **硬编码网关字段**：不在核心实体上增加 Higress/APIG/Apsara 等字段；使用 `GatewayAdapter`、`AdapterInstance` 和加密的扩展配置。
8. **MCP 专用注册旁路**：MCP 不能绕过统一注册申请、审核和上线状态；专用技术元数据可保留，但生命周期必须归统一模型管理。
9. **Skill/Worker 强绑定 Nacos/AIRegistry**：两者是适配器或制品仓库实现，不是领域定义；本平台应允许将来增加其他 Registry。
10. **没有租户字段的所有权过滤**：HiMarket 主要按管理员或 Portal 查询，不能满足本平台租户级数据、权限、资源和配置隔离。

## 7. 建议用于本平台的注册管理对象

```text
Tenant
 ├── AdapterInstance（统一网关/Registry/模型平台等连接实例）
 ├── ConsumerApplication
 │    └── ServiceAuthorization
 │         └── CredentialBinding
 └── ServiceProduct
      ├── ProductVersion
      ├── RegistrationRequest
      │    └── RegistrationExecution
      │         └── AdapterOperationResult
      ├── RuntimeBinding
      ├── VisibilityPolicy（PRIVATE / SHARED）
      └── MarketEntry
```

### 7.1 各对象职责

| 对象 | 建议职责 | HiMarket 参考 |
|---|---|---|
| `ServiceProduct` | 租户内稳定产品身份、类型、所有者、当前主状态 | `Product` |
| `ProductVersion` | 不可变的契约、包、模型/Agent/MCP 描述和权限需求 | Skill/Worker `VersionResult`，但扩展到所有类型 |
| `RegistrationRequest` | 谁以什么来源注册什么资源、选择私有/共享、为何使用平台数据 | HiMarket 缺失 |
| `RegistrationExecution` | 审批通过后的异步适配器执行，记录幂等键、步骤、重试和总状态 | HiMarket 同步 `ProductImporter` 的替代 |
| `RuntimeBinding` | 产品版本与网关、Registry、外部平台资源的映射 | `ProductRef` |
| `MarketEntry` | 已上线版本在本租户服务集市中的展示投影 | `ProductPublication` + Category |
| `ConsumerApplication` | 外部系统/Agent 的机器身份 | `Consumer` |
| `ServiceAuthorization` | 应用 + 产品 + 环境 + 权限范围的审批结果 | `ProductSubscription`，需扩粒度和状态 |
| `CredentialBinding` | 每项授权选用的 OAuth Client、API Key 或其他凭证及生命周期 | `ConsumerCredential`，但不共享到全部订阅 |
| `AdapterInstance` | 厂商中立连接实例及能力声明 | `Gateway`、`NacosInstance`、`AiRegistryInstance` 的收敛 |

### 7.2 建议注册状态机

HiMarket 没有可直接复用的注册状态机。结合本项目已经确认的“注册审核后才能上线”，建议保持两个串联但独立的生命周期：

```text
注册：草稿 → 待注册审核 → 已批准 → 注册中 → 已注册
              ↘ 已拒绝       ↘ 注册失败

上线：草稿/已注册 → 待上线审核 → 上线中 → 已上线
                                  ↘ 上线失败
```

`RegistrationExecution` 至少记录：`QUEUED / RUNNING / SUCCEEDED / PARTIALLY_SUCCEEDED / FAILED / CANCELLED`；批量注册的每一资源再记录独立结果。该状态不能从 HiMarket 的同步返回值推断后丢弃。

## 8. 对后续 Wayfinder 决策的输入

本调研已经澄清以下事实：

1. HiMarket 可作为“产品—运行引用—门户展示—订阅—网关执行”对象关系参考。
2. HiMarket 不能作为五类 AI 产品统一注册模型；必须由本平台补齐统一注册申请和执行对象。
3. Agent、模型在 HiMarket 中基本等同于被网关发现的 API 资源；如果本平台希望支持开发者创建，它还需要定义开发态和版本态。
4. MCP 有最丰富的独立技术对象，可借鉴“展示元数据、技术元数据、运行端点”三分法，但必须纳入统一审核和上线流程。
5. Skill/Worker 的版本/制品交互最成熟，可作为全类型版本管理的参考；其 Nacos/AIRegistry 实现只属于适配器层。
6. 服务集市页面可以借鉴类型切换、类别、搜索、排序、卡片和详情订阅，但可见性必须增加租户、角色、私有/共享和权限判断。
7. 凭证和订阅模型不能照搬；本平台应继续落实 OAuth 2.0 默认、每项授权独立凭证绑定和 API Key 不物理删除。

下一步产品决策应聚焦：五类产品的最小统一注册契约、注册执行是否允许部分成功、同一外部资源的版本关联规则、私有/共享可见性切换，以及各类型开发态与注册态如何衔接。
