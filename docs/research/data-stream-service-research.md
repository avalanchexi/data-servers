# 数据流服务与流式传输设计调研

> 调研日期：2026-08-26  
> 适用范围：数据中台“数据服务”模块  
> 结论性质：产品与领域设计研究，不是某一消息中间件的实施方案

## 1. 研究结论摘要

### 1.1 建议结论

1. **数据流服务应被定义为对既有受治理流式数据资产的产品化交付**，负责契约、权限、审核、上线、订阅、凭证、观测和审计；暂不按 ODS、DWD、DWS 或 ADS 等数仓语义层限制来源，但不负责从数据库捕获变更，也不负责抽取、清洗、关联、聚合或写入目标系统。
2. 首期允许两类来源：
   - 其他中台模块已经生产、治理并登记的 **消息主题／事件流／湖表变更流**；
   - 获得数据方批准的 **受控生产应用**，通过受控生产端点发布已经符合资产契约的事件。
3. 自动把物理表或逻辑表转换为变更流属于 CDC；定时抽取、映射、关联、聚合属于 ETL 或流计算，均不纳入本模块。
4. 建议以 **AsyncAPI 3.1** 表达流式服务契约，以 **CloudEvents 1.0** 作为跨协议事件信封；底层通过适配器映射 Kafka、Pulsar 或云消息服务。
5. 厂商中立的消费关系应拆成：`消费应用 → 服务授权 → 消费端点 → 位点`。消费端点由适配器分别映射为 Kafka Consumer Group、Pulsar Subscription、Google Subscription 或 Azure Consumer Group，不能把这些底层对象强行建成同一个领域对象。
6. 默认交付语义建议为 **至少一次**；顺序只承诺同一分区键内有序；“精确一次”只能作为特定适配器和限定链路的能力，不应成为平台通用承诺。
7. 认证默认采用 **OAuth 2.0 Client Credentials**。每项“消费应用 × 数据流服务 × 环境”的授权拥有独立凭证绑定，并映射为主题和消费组权限。API Key 可作为可选认证方案，但不能假设所有消息协议原生支持 API Key。
8. 服务下线应停止新申请、暂停已有授权并停止服务交付，但**不得删除来源主题、订阅、消费组或位点**。重新上线后，仍有效且未撤销的授权从原位点恢复；若数据已经超过保留期，必须提示存在消费缺口。
9. 首期原型应深入到完整业务闭环和关键流式参数，但不实现真实消息代理、CDC、ETL、流计算或跨系统精确一次。

## 2. 研究前提与术语标记

本研究遵循已经确认的约束：

- API 服务只允许使用 ADS 层数据；数据流服务暂不按数仓语义层限制来源，但只能引用已登记、受治理并取得数据权限的流式数据资产。
- 开发者创建并上线数据流服务。
- 消费者先创建独立消费应用，再申请数据流服务权限。
- 平台支持多租户，租户是最高数据、权限、资源和配置边界。
- 上线、下线和授权审批使用通用工作流引擎。
- CDC、ETL 当前不在数据服务模块范围。
- 对外产品术语统一使用“上线／下线”，不使用“上架／下架”。

文中标记含义：

- **来源事实**：官方规范或产品文档明确描述的能力。
- **推断**：由多个来源事实归纳出的厂商中立结论。
- **建议**：结合本项目约束给出的产品方案。
- **待决**：需要后续产品或技术架构确认的事项。

## 3. 数据流来源及与 CDC、ETL 的边界

### 3.1 来源事实

- 发布／订阅系统的基本形态是生产者向主题发送消息，订阅者通过订阅接收并确认消息；Topic、Schema、Subscription、Publisher、Subscriber 是独立对象。[Google Cloud Pub/Sub 核心概念](https://cloud.google.com/pubsub/docs/pubsub-basics)
- Apache Pulsar 同样把 Producer、Topic、Subscription、Consumer 和消息确认分开；持久化订阅会维护游标，消费者重启后可从已记录位置继续。[Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)
- Azure Event Hubs 把 Event Hub／Kafka Topic 定义为追加式分布日志，生产应用可以通过 SDK、Kafka 客户端或 HTTPS 写入，消费应用通过消费组分别维护位置。[Azure Event Hubs 概述](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about)

### 3.2 推断：本平台可以接受的来源

| 来源类型 | 描述 | 是否属于本模块创建数据 | 是否建议首期支持 |
|---|---|---:|---:|
| 已有受治理流式资产 | 其他中台模块已完成生产、治理并登记的消息主题、事件流或湖表变更流 | 否，只绑定和交付 | 是，主要路径 |
| 受控生产应用 | 业务应用把已经满足资产契约的数据发布到平台提供或管理的生产端点，并形成受治理流式数据资产 | 否，应用负责生成业务事件；本模块只接入和校验 | 是，受控路径 |
| 已有外部流注册为流式资产 | 外部平台已有主题，先经过数据方审核并在中台资产体系登记为受治理流式数据资产 | 否，只建立受治理的来源映射 | 可支持 |
| 逻辑表自动变更流 | 监听表的新增、修改、删除并生成事件 | 是，本质是 CDC | 否 |
| SQL 定时抽取／多表关联／聚合 | 从表读取、转换并生成流 | 是，本质是 ETL 或流计算 | 否 |
| 任意外部主题直接暴露 | 未经过资产登记、治理与数据方审核，直接作为数据服务 | 不满足治理与授权约束 | 否 |

### 3.3 建议边界

数据流服务的输入只能是一个已经存在的 `StreamDataAsset`。该资产可以属于任意数仓语义层；若来源是外部主题或生产应用，必须先由相邻的数据资产／数据接入能力完成以下工作：

```text
来源登记 → 租户与业务域归属 → 数据方审核 → 数据分级分类
→ Schema 与样例校验 → 生成 StreamDataAsset → 数据服务层引用
```

数据服务层只负责：

```text
选择受治理流式数据资产 → 定义服务契约和交付策略 → 测试
→ 提交上线 → 服务集市展示 → 消费应用申请
→ 开通消费端点和凭证 → 调用监控与审计
```

**建议**：原型中的“来源类型”只显示“已有流式数据资产”和“受控生产应用”。资产详情展示其 ODS、DWD、DWS 或 ADS 语义层，但不据此拦截数据流服务开发。不要出现“数据库表、CDC 任务、ETL 任务、流计算作业”等选项。

## 4. 标准对象及厂商中立映射

### 4.1 来源事实

- Kafka Consumer Group 由相同 `group.id` 的消费者实例组成；同一组内分摊分区，不同组各自获得主题消息；Kafka 为每个分区记录数值 Offset。[KafkaConsumer 官方 API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)
- Pulsar Subscription 是 Topic 上的具名交付规则和游标，支持 Exclusive、Shared、Failover、Key_Shared；持久游标保存消费位置。[Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)
- Google Pub/Sub 中，一个 Topic 可以连接多个 Subscription；同一 Subscription 下的多个 Subscriber 分摊消息。[Google Cloud Pub/Sub 核心概念](https://cloud.google.com/pubsub/docs/pubsub-basics)
- Azure Event Hubs 中，Consumer Group 是同一流的独立逻辑视图，每个消费应用可以独立维护位置；Checkpoint 是每个分区最后成功处理的位置。[Azure Event Hubs 概述](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about)、[分区负载与 Checkpoint](https://learn.microsoft.com/en-us/azure/event-hubs/event-processor-balance-partition-load)

### 4.2 推荐领域对象

| 领域对象 | 职责 | 关键字段示例 |
|---|---|---|
| `StreamDataAsset` 流式数据资产 | 数据流服务允许引用的受治理来源，不受数仓语义层硬限制 | tenantId、businessDomain、semanticLayer、sourceRef、owner、classification、governanceStatus |
| `StreamService` 数据流服务 | 面向服务集市的稳定产品身份 | serviceId、name、owner、visibility、serviceStatus |
| `StreamServiceVersion` 服务版本 | 不可变的契约与交付策略快照 | version、sourceBinding、contractVersion、deliveryPolicy、permissionScope |
| `SourceBinding` 来源绑定 | 厂商中立来源与底层主题的映射 | adapterType、environment、endpointRef、topicRef、health |
| `MessageContract` 消息契约 | 描述 Channel、消息、操作和安全要求 | asyncapiDocument、channel、operation、contentType |
| `Schema` / `SchemaVersion` | 消息载荷定义与兼容策略 | format、definition、version、compatibilityMode、status |
| `ProducerApplication` 生产应用 | 向受治理流式数据资产发布事件的机器身份 | appId、owner、credentialRef、allowedChannel |
| `ConsumerApplication` 消费应用 | 外部系统在平台中的稳定机器身份 | appId、owner、networkZone、status |
| `ServiceAuthorization` 服务授权 | 业务审批结果及允许范围 | appId、serviceId、environment、scope、validity、status |
| `ConsumptionEndpoint` 消费端点 | 授权在消息基础设施中的适配器映射 | authorizationId、adapterRef、endpointType、endpointRef、initialPosition、status |
| `ConsumerRuntime` 消费运行投影 | 展示底层组／订阅的成员、积压和健康度，不作为跨厂商配置模型 | memberCount、lagOrBacklog、lastProgressAt、health |
| `Position` 位点 | 每分区消费进度 | partition、offset／cursor／checkpoint、updatedAt |
| `DeliveryPolicy` 交付策略 | 交付语义、顺序、重试、死信等 | semantics、orderingKey、processingTimeout、retryPolicy、dlqPolicy |
| `CredentialBinding` 凭证绑定 | 授权与认证材料的关联 | authType、clientId／keyId、secretRef、scope、status、expiresAt |

### 4.3 底层映射

| 厂商中立概念 | Kafka | Pulsar | Google Pub/Sub | Azure Event Hubs |
|---|---|---|---|---|
| 流／Channel | Topic | Topic | Topic | Event Hub／Kafka Topic |
| 并行单元 | Partition | Partition | 服务内部管理 | Partition |
| 独立消费视图 | Consumer Group | Subscription | Subscription | Consumer Group |
| 组内扩展 | Group Member | Shared／Key_Shared Consumer | 同 Subscription 的多个 Subscriber | 同 Consumer Group 的多个 Processor |
| 位点 | Committed Offset | Cursor | Ack 状态 | Checkpoint／Offset |
| 失败重试 | 通常由消费端或配套主题实现 | Redelivery／Retry Letter Topic | Retry Policy | 消费应用实现 |
| 死信 | 通常由应用或配套主题实现 | Dead Letter Topic | Dead-letter Topic | 消费应用或配套服务实现 |

**推断**：`ServiceAuthorization` 是平台业务对象，`ConsumptionEndpoint` 是适配器边界；Kafka Consumer Group、Pulsar Subscription、Google Subscription 和 Azure Consumer Group 都是消费端点的不同实现，不能强行共享一套底层字段。Kafka 普通消费者以提交 Offset 表达进度，不能假定存在 Pulsar 式逐条 Ack、Nack 和 Ack Timeout。否则更换基础设施时，审批与授权模型会被某个产品的术语锁定。

**建议**：首期每一项有效服务授权默认建立一个独立消费端点，由平台适配器生成不可冲突的底层订阅名或 `group.id`，例如：

```text
tenantId.serviceId.environment.authorizationId
```

消费者可以为组设置业务别名，但不能自由填写底层 `group.id`，以免越权读取其他授权的位点或消息。

## 5. 消息契约、Schema 与事件信封

### 5.1 AsyncAPI

**来源事实**：AsyncAPI 3.1 是协议无关的消息驱动 API 描述规范，可描述 Server、Channel、Operation、Message、Schema 和 Security Scheme；Message 可包含 Headers、Payload 和 Correlation ID，Schema 可采用 JSON Schema、Avro 等格式。[AsyncAPI 3.1 规范](https://www.asyncapi.com/docs/reference/specification/v3.1.0)

**建议**：数据流服务以 AsyncAPI 文档作为机器可读契约，并把以下内容纳入上线版本：

- 测试／生产 Server 和协议适配器；
- Channel 地址或逻辑名称；
- 消费操作；若允许受控生产，再增加发送操作；
- 消息头、载荷、样例、Correlation ID；
- Schema 格式和版本；
- OAuth 2.0／API Key 等安全方案；
- 分区键、顺序范围、交付语义、重试和死信等平台扩展字段。

**来源事实**：AsyncAPI 负责描述消息 API 和协议绑定，但不统一规定消费位点、重试、死信或其生命周期；这些能力需要使用规范扩展字段和基础设施适配器表达。[AsyncAPI 扩展规范](https://www.asyncapi.com/docs/concepts/asyncapi-document/extending-specification)

### 5.2 CloudEvents

**来源事实**：CloudEvents 是厂商中立的事件格式规范，必需属性包括 `id`、`source`、`specversion`、`type`；`source + id` 可用于识别重复事件，`dataschema` 可指向载荷 Schema。[CloudEvents 核心规范](https://github.com/cloudevents/spec/blob/ce@v1.0.2/cloudevents/spec.md)

**来源事实**：CloudEvents 只规范事件及其协议绑定，不规定消费处理模型、重试、顺序或业务语义。[CloudEvents Primer](https://github.com/cloudevents/spec/blob/ce@v1.0.2/cloudevents/primer.md)

**建议**：跨平台或跨协议的数据流默认使用 CloudEvents 1.0 信封；已有流式资产如果无法转换，可保留原格式，但必须在契约中明确等价的事件 ID、事件类型、来源、发生时间、Schema 版本和追踪字段。

### 5.3 Schema 版本与兼容性

**来源事实**：Pulsar 的 Schema 按 Topic 保存并版本化，消息携带 Schema 版本；官方提供 BACKWARD、FORWARD、FULL 及其 TRANSITIVE 兼容策略，兼容检查的目标是避免新 Schema 破坏既有消费者。[Apache Pulsar Schema](https://pulsar.apache.org/docs/5.0.x/schema-understand/)

**建议**：共享数据流服务默认采用 `FULL_TRANSITIVE`；若业务只能接受单向兼容，应由管理者在上线审核时批准例外。破坏性 Schema 变更必须创建新的服务主版本或新的 Channel，不能覆盖线上契约。

推荐 Schema 状态机：

```text
草稿 → 校验中 → 兼容 → 生效 → 已废弃 → 已归档
             ↘ 不兼容
```

## 6. 交付语义、顺序、位点、重试和死信

### 6.1 交付语义

**来源事实**：Kafka 默认可以实现至少一次；读取、处理并写回 Kafka 时，可使用事务生产者、事务性位点更新和 `read_committed` 获得限定范围的精确一次处理。[Kafka Design](https://kafka.apache.org/43/design/design/)

**来源事实**：Pulsar 的消息重投采用至少一次语义；消费者确认后推进订阅游标。[Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)

**来源事实**：Google Pub/Sub 默认至少一次；其精确一次能力只适用于 Pull／StreamingPull，并有地域和客户端条件。[Google Pub/Sub 精确一次交付](https://cloud.google.com/pubsub/docs/exactly-once-delivery)

**推断**：跨 Kafka、Pulsar、云消息服务和外部业务系统的“端到端精确一次”没有统一含义，不能仅靠数据服务平台开关保证。

**建议**：

- 默认 `AT_LEAST_ONCE`，要求消费者按照 `source + id` 或业务幂等键去重。
- 可选 `AT_MOST_ONCE` 只用于允许丢失、不允许重复的特殊场景。
- `EXACTLY_ONCE_CAPABLE` 仅表示底层适配器在限定边界内具备能力，页面必须展示适用条件，不能写成无条件 SLA。

### 6.2 顺序

**来源事实**：Kafka Offset 是分区内位置，消费组把各分区分配给组内消费者；Pulsar 的分区路由和订阅模式也分别影响顺序与并行度。[KafkaConsumer 官方 API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)、[Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)

**建议**：平台只承诺“同一分区键内有序”，不承诺跨分区全局顺序。上线契约必须明确分区键字段；如果无分区键，页面显示“无顺序保证”。

### 6.3 位点和初始位置

**来源事实**：Kafka 为每个分区维护 Offset；Azure Event Hubs 的 Checkpoint 也按“消费组 × 分区”记录最后成功处理的位置。[KafkaConsumer 官方 API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)、[Azure Event Hubs Checkpoint](https://learn.microsoft.com/en-us/azure/event-hubs/event-processor-balance-partition-load)

**建议**：每项消费端点需要配置初始位置：

- `LATEST`：仅消费授权生效后的新消息，建议作为默认值；
- `EARLIEST_AVAILABLE`：从当前保留范围内最早位置开始；
- `AT_TIMESTAMP`：从指定时间开始，底层支持时可选；
- `RESUME`：重新上线或恢复授权时从原位点继续。

位点重置属于高风险操作，必须单独申请、审批并记录前后位置。

### 6.4 重试与死信

**来源事实**：Pulsar 支持负确认、确认超时、Retry Letter Topic 和 Dead Letter Topic；达到最大重试次数后可进入死信主题。[Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)

**来源事实**：Google Pub/Sub 的 Retry Policy 属于 Subscription；消息超过配置的投递尝试后可转发到 Dead-letter Topic。[Google Pub/Sub Dead-letter Topics](https://cloud.google.com/pubsub/docs/handling-failures)

**推断**：重试和死信是“每项消费端点”的策略，而不是来源主题的全局属性；Kafka 等底层可能需要由消费 SDK 或配套主题实现。

**建议**：统一抽象以下字段：

- 最大重试次数；
- 固定／指数退避；
- 最小、最大重试间隔；
- 确认超时；
- 死信策略和死信主题引用；
- 是否允许人工重放；
- 重放操作人、范围和审计记录。

首期默认：至少一次、指数退避、有限次数重试、启用死信。实际默认数值由基础设施容量和业务 SLA 决定，不在总体设计中写死。

## 7. 授权、OAuth 2.0 与 API Key

### 7.1 来源事实

- OAuth 2.0 Client Credentials 适用于客户端以自身身份访问预先授权资源；客户端向 Token Endpoint 认证并获取 Access Token，Scope 可限制访问范围。[RFC 6749 §4.4](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4)
- AsyncAPI 3.1 支持在 Server 或 Operation 上声明 OAuth 2.0、API Key、X.509、SASL 等安全方案；OAuth 2.0 可声明 Client Credentials 和所需 Scope。[AsyncAPI 3.1 Security Scheme](https://www.asyncapi.com/docs/reference/specification/v3.1.0#securitySchemeObject)
- Kafka 客户端支持 SASL/OAUTHBEARER；权限可分别约束 Topic 和 Group。AWS MSK 的官方权限示例显示，消费数据至少涉及连接、Topic 读取及 Group 描述／修改等权限。[Kafka Consumer 配置](https://kafka.apache.org/43/generated/consumer_config.html)、[AWS MSK 消费授权示例](https://docs.aws.amazon.com/msk/latest/developerguide/iam-access-control-use-cases.html)
- Pulsar 把认证和授权分开，授权可限制客户端在 Tenant、Namespace、Topic 上可执行的动作，并支持 OAuth 2.0 Access Token 认证。[Pulsar 授权](https://pulsar.apache.org/docs/5.0.x/security-authorization/)、[Pulsar OAuth 2.0](https://pulsar.apache.org/docs/5.0.x/security-oauth2/)
- Azure Event Hubs 官方建议优先使用基于 Microsoft Entra ID 的 OAuth 2.0 令牌，而不是共享访问签名；授权主体可以是应用服务主体。[Azure Event Hubs 授权](https://learn.microsoft.com/en-us/azure/event-hubs/authorize-access-event-hubs)

### 7.2 推荐绑定模型

```text
租户（由上下文继承）
  └─ 消费应用
      └─ 服务授权（数据流服务 + 环境 + 权限范围 + 有效期）
          ├─ 消费端点（由适配器映射为订阅或消费组）
          └─ 凭证绑定
              ├─ OAuth 2.0 Client Credentials（默认）
              └─ API Key（可选）
```

权限范围至少包含：

- `stream:consume`；若允许生产则单独配置 `stream:produce`；
- 允许访问的服务和环境；
- 对应消费端点及底层 Topic／Group／Subscription 权限；
- 消息字段或数据范围约束的引用；
- 速率、带宽、并发消费者数等配额；
- 有效期、网络区域和可选 Agent／最终用户限制。

**建议**：为了满足“每项服务授权独立凭证”的要求，每项授权创建独立的 OAuth Client，或创建不可跨授权复用的子凭证；OAuth Scope、Broker Topic ACL 和 Consumer Group ACL 都由同一授权派生。凭证不能跨服务或跨环境复用。

### 7.3 API Key 生命周期解释

用户最新要求中同时出现“不支持删除”和“支持删除”，两者相互冲突。本研究按开头明确表达的 **不支持删除** 作为暂定口径：

```text
待签发 → 已启用 → 已禁用
              ├→ 已过期
              └→ 已轮换
```

- 每项服务授权拥有独立 API Key。
- 支持有效期、禁用和轮换，不提供物理删除；历史只保留 Key ID、哈希／密文引用和审计记录，不展示旧明文。
- 不允许新旧 Key 并行时，轮换应采用“新 Key 激活与旧 Key 禁用”的原子切换；这会增加瞬时中断风险，需要在页面明确提示。

### 7.4 待决冲突

**待决**：已经确认“OAuth 2.0 为默认，其他认证可选”，同时又要求“每项服务授权强制生成独立 API Key”。若每项授权无论认证方式都生成 API Key，会产生闲置静态秘密，违背最小秘密原则。

建议二选一：

1. **推荐**：每项授权强制生成独立“凭证绑定”，默认绑定 OAuth Client；只有选择 API Key 方案时才签发 Key。
2. 每项授权同时签发 OAuth Client 和 API Key，但必须明确 API Key 的实际用途、存储、轮换和禁用策略。

## 8. 上线、下线及对已有消费者的影响

### 8.1 服务主状态机

沿用平台统一业务术语：

```text
草稿 → 待上线审核 → 上线中 → 已上线
           ↓           ↓
         已驳回      上线失败

已上线 → 待下线审核 → 下线中 → 已下线
             ↓           ↓
           已驳回      下线失败

已下线 → 待上线审核 → 上线中 → 已上线
```

### 8.2 上线的内部执行步骤

```text
校验流式数据资产来源可用
→ 校验 AsyncAPI 与 Schema 兼容性
→ 固化服务版本和运行数据权限
→ 创建／更新网关或消息基础设施映射
→ 服务集市可见状态生效（共享产品）
→ 已上线
```

消费端点不应在服务上线时批量创建，而应在具体消费应用的授权审批通过后按需开通。

### 8.3 下线的标准影响

**来源事实**：Kafka Topic 的数据按 Topic 保留时间／容量策略删除；`retention.ms` 实际上构成消费者必须及时读取数据的期限。[Kafka Topic Configs](https://kafka.apache.org/43/configuration/topic-configs/)

**来源事实**：Pulsar 默认保存未确认消息形成 Backlog，也可以通过 TTL 让未确认消息过期；因此暂停消费者后，能否完整恢复取决于保留与过期策略。[Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)

**建议**：下线按以下顺序执行：

```text
停止新的服务申请
→ 私有／共享可见状态失效
→ 将已有 ServiceAuthorization 标记为“因服务下线暂停”
→ 停止受平台控制的新发布和消费交付
→ 在配置的排空窗口内等待在途消息提交 Offset／Ack
→ 撤销或暂停消费 Topic／Group／Subscription 权限并禁用凭证
→ 保留消费端点、底层订阅／消费组、位点和全部审计历史
```

明确影响：

- 已有消费者不能继续拉取或建立新连接；短期 Access Token 或长连接可能在网关策略生效前存在短暂窗口，实施方案必须定义最大生效时间。
- 下线默认不停止其他模块的上游生产者，也不删除来源 Topic 或湖表变更流，因为数据流服务不是 CDC／ETL 任务和消息基础设施所有者。
- 暂停期间消息可能继续进入来源 Topic；能否在重新上线后完整补消费，取决于 Topic 保留期、Subscription TTL 和积压配额。
- 重新上线成功后，自动恢复仍在有效期内且未撤销的授权，并使用原消费端点和原位点继续消费。
- 如果原位点已超出保留范围，系统必须将授权标记为“恢复有缺口”，要求消费者选择最早可用位置或放弃缺口，不得静默跳过。
- 永久清理 Topic、订阅、消费组或位点属于单独的“退役／清理”流程，不等同于普通下线。

## 9. 推荐状态机

### 9.1 来源绑定状态

```text
待校验 → 校验中 → 可用
             └→ 校验失败

可用 → 降级 → 不可用
 └────────→ 已停用
```

来源不可用影响服务健康度，但不应自动修改已经审批完成的服务版本。

### 9.2 服务版本状态

```text
草稿 → 审核中 → 已批准 → 已发布 → 已废弃 → 已归档
          └→ 已驳回 → 草稿
```

主界面只展示统一的上线／下线主状态；版本状态作为详情中的内部状态。

### 9.3 服务授权状态

```text
待审批 → 已批准
   └→ 已拒绝

已批准 ↔ 已暂停
   ├→ 已过期
   └→ 已撤销
```

审批结果与技术开通结果必须分离；授权已批准但消费端点创建失败时，授权仍为“已批准”，页面另行展示“开通失败”。

### 9.4 消费端点执行状态

```text
未开通 → 开通中 → 已生效
              └→ 开通失败

已生效 ↔ 已暂停
已暂停 → 已退役
```

暂停原因建议使用原因码，而不是扩张主状态：

- `SERVICE_OFFLINE`：服务下线；
- `MANUAL`：管理者手动暂停；
- `CREDENTIAL_DISABLED`：凭证禁用；
- `SOURCE_UNAVAILABLE`：来源不可用；
- `QUOTA_OR_RISK`：配额或风控触发。

`已过期`、`已撤销` 为终态；普通重新上线只恢复 `SERVICE_OFFLINE` 导致的暂停。

### 9.5 消费运行健康状态

底层订阅或消费组不需要复杂审批状态，只作为消费运行投影视图：

```text
未开通 → 创建中 → 正常
              └→ 创建失败

正常 ↔ 无消费者连接
正常 ↔ 消费积压
正常 ↔ 异常
```

“无连接、积压、异常”更适合作为健康状态或告警，不应改变服务授权状态。

## 10. 首期高保真原型设计深度

### 10.1 应完整覆盖的业务闭环

#### 开发者侧

1. 数据流服务列表与状态筛选。
2. 创建向导：
   - 基本信息；
   - 选择受治理流式数据资产／受控生产应用；
   - 选择测试、生产环境；
   - 导入或编辑 AsyncAPI；
   - Schema、样例消息、兼容策略；
   - 分区键、交付语义、初始位置、重试、死信、配额；
   - 权限范围与数据方审批引用；
   - 连通性、样例、Schema 和权限测试；
   - 提交上线审核。
3. 版本详情与上线／下线执行时间线。
4. 服务详情中的运行摘要：吞吐、消费应用数、积压、重试、死信、Schema 错误。

#### 消费者侧

1. 在服务集市查看有权可见的数据流服务详情。
2. 查看 AsyncAPI、Schema、样例、交付语义、保留期、调用前提和 SDK 示例。
3. 选择消费应用和环境，提交使用申请。
4. 授权通过后查看：
   - 连接地址和协议；
   - OAuth Token Endpoint、Client ID、Scope；
   - 可选 API Key；
   - 消费端点及底层订阅／消费组标识；
   - 初始位置、确认和重试说明；
   - 示例客户端配置。
5. 在消费应用详情查看连接数、吞吐、Lag、最后确认时间、失败和死信摘要。

#### 管理者侧

1. 审批中心展示工作流待办和申请详情；技术执行日志回到数据流服务详情。
2. 上线审核至少展示来源归属、Schema 变化、数据范围、共享范围、环境、交付策略和风险检查。
3. 运行管理展示来源健康、消费组、Lag、重试、死信、授权和凭证异常。
4. 下线影响分析展示有效授权、在线消费者、当前 Lag、保留期和可能的数据缺口。

### 10.2 原型应模拟但不真实实现的能力

- 主题连接测试和 Schema 兼容检查；
- 创建／暂停消费端点及其底层订阅／消费组；
- OAuth Client、API Key 签发和轮换；
- 消费 Lag、重试、死信和吞吐监控；
- 工作流审批回调与上线／下线执行步骤。

### 10.3 明确不进入首期原型的能力

- 创建和运行 CDC 任务；
- 创建和运行 ETL、流计算、SQL Join／Aggregate 作业；
- Broker 集群、分区副本、存储节点和跨集群复制运维；
- 真实客户端 SDK 生成器；
- 跨 Broker 和外部业务数据库的端到端精确一次；
- 死信消息内容的生产级处置台和大规模重放执行。

## 11. 建议的产品默认值

| 项目 | 首期建议默认值 | 理由 |
|---|---|---|
| 交付模式 | Pull／原生消息客户端 | 更适合高吞吐流式消费；Push／Webhook 后续作为适配器 |
| 交付语义 | 至少一次 | Kafka、Pulsar 和云消息服务的共同稳定基线 |
| 事件信封 | CloudEvents 1.0 | 跨协议可移植，提供事件 ID 和来源 |
| 契约格式 | AsyncAPI 3.1 | 协议无关并能描述 Channel、Message、Security |
| Schema | JSON Schema、Avro | 兼顾 API 友好与消息系统场景 |
| 兼容策略 | FULL_TRANSITIVE | 保护独立演进的生产者和消费者 |
| 初始位置 | LATEST | 避免新授权意外读取大量历史数据 |
| 认证 | OAuth 2.0 Client Credentials | 适合机器到机器访问和短期令牌 |
| API Key | 可选、每授权独立 | 兼容不支持 OAuth 的调用方，同时限制爆炸半径 |
| 重试 | 有限次数＋退避＋死信 | 避免毒消息无限阻塞或重试风暴 |
| 下线数据处理 | 保留订阅、组和位点 | 支持重新上线后恢复，避免普通下线变成破坏性操作 |

## 12. 待决问题

1. **来源边界**：已确认数据流服务暂不受 ADS 层限制；仍需确认首期支持的底层资产形态，以及是否继续禁止由数据服务模块从逻辑表自动生成变更流。
2. **首期协议适配器**：首个真实适配器优先 Kafka-compatible、Pulsar-compatible，还是两者同时？原型可以同时展示，但实施工作量不同。
3. **交付方式**：首期是否只深入 Pull／消息客户端，Webhook Push 仅保留扩展入口？
4. **OAuth 与 API Key**：每项授权是“强制创建一个凭证绑定，默认 OAuth，API Key 可选”，还是“OAuth 和 API Key 都必须签发”？
5. **API Key 删除口径**：以“不支持物理删除”为准是否确认？
6. **初始位点**：是否接受新授权默认 `LATEST`，读取历史必须在申请中显式选择并审批？
7. **下线生效窗口**：短期 Access Token 和长连接允许多长时间内完成强制失效？
8. **暂停期积压**：服务下线后是允许积压到来源保留期，还是对每项订阅设置更短的暂停保留上限？
9. **Schema 范围**：首期是否只支持 JSON Schema 和 Avro，Protobuf 留作适配器扩展？
10. **精确一次措辞**：是否确认平台只展示“底层能力及适用条件”，不提供厂商无关的端到端精确一次承诺？

## 13. 主要一手来源

- [Apache Kafka Design](https://kafka.apache.org/43/design/design/)
- [Apache Kafka Consumer API](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)
- [Apache Kafka Topic Configs](https://kafka.apache.org/43/configuration/topic-configs/)
- [Apache Pulsar Messaging](https://pulsar.apache.org/docs/5.0.x/concepts-messaging/)
- [Apache Pulsar Schema](https://pulsar.apache.org/docs/5.0.x/schema-understand/)
- [Apache Pulsar OAuth 2.0](https://pulsar.apache.org/docs/5.0.x/security-oauth2/)
- [Apache Pulsar Authorization](https://pulsar.apache.org/docs/5.0.x/security-authorization/)
- [AsyncAPI Specification 3.1.0](https://www.asyncapi.com/docs/reference/specification/v3.1.0)
- [CloudEvents Specification 1.0.2](https://github.com/cloudevents/spec/blob/ce@v1.0.2/cloudevents/spec.md)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [Google Cloud Pub/Sub 核心概念](https://cloud.google.com/pubsub/docs/pubsub-basics)
- [Azure Event Hubs 概述](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-about)
- [AWS MSK IAM 消费授权](https://docs.aws.amazon.com/msk/latest/developerguide/iam-access-control-use-cases.html)
