# 湖仓一体架构中的流式数据资产分层研究

> 调研日期：2026-08-26  
> 研究问题：流式数据资产是否一定属于 ADS 层，以及湖仓一体架构如何处理流式资产  
> 来源范围：Apache Kafka、Apache Flink、Apache Iceberg、Apache Hudi、Apache Paimon、Delta Lake、Databricks、阿里云 DataWorks 等官方文档或规范  
> 结论性质：架构研究与产品设计建议，不构成底层技术选型

> **项目决策更新（2026-08-26）**：API 服务继续只允许使用 ADS 层资产；数据流服务暂不设置 ADS 层级限制，可以引用任意语义层中已登记、受治理并取得数据权限的流式数据资产。本决策已经纳入第 7 节，并取代“数据流服务只绑定 ADS 服务流”的原建议。

## 1. 直接结论

**流式数据资产不一定属于 ADS 层。**

`ODS / DWD / DWS / ADS` 表达的是数据经过了什么加工、具有什么业务语义、准备给谁使用；Topic、事件流、变更流、动态表、流式湖表表达的是数据如何持续产生、存储、计算和交付。两者是两条正交的分类轴。

因此，以下对象都可能是流式资产：

- ODS：原始业务事件流、数据库 CDC 落地流、原始日志 Topic；
- DWD：清洗、去重、标准化后的业务明细事件流；
- DWS：持续更新的公共粒度汇总流或动态汇总表；
- ADS：面向某一消费场景形成稳定契约的服务流、应用指标流或应用视图。

这个结论不是说项目必须允许数据服务直接暴露 ODS、DWD 或 DWS，而是说：**不能用“是不是流”判断它是不是 ADS；是否允许对外服务还需要独立的服务就绪条件。**

## 2. 事实：数仓层级与流式形态是不同维度

### 2.1 ODS/DWD/DWS/ADS 是加工和应用语义

阿里云 DataWorks 的官方定义中：

- ODS 接收贴近源系统结构的原始数据；
- DWD 以业务事件构建最细粒度明细事实；
- DWS 以主题对象构建公共粒度汇总；
- ADS 面向具体应用或产品，存放个性化统计结果。

DataWorks 同时允许企业自定义层级，说明这些名称是数据建模与治理约定，并不是由某一种存储或计算技术强制决定的。[DataWorks：数仓分层](https://help.aliyun.com/zh/dataworks/user-guide/data-warehouse-layering/)

DataWorks 对“离线实时一体化数仓”的描述更直接：数据库、日志和 Kafka/DataHub 等实时消息可统一接入，并共同遵循 ODS → DWD → DWS → ADS 分层；同一份数据可服务离线和实时计算。[DataWorks：构建企业级离线实时一体化数仓](https://help.aliyun.com/zh/dataworks/user-guide/data-warehouse-solutions)

**事实结论**：实时消息并不会因为采用 Topic 或持续计算而自动成为 ADS；实时和离线都可以穿过同一套业务语义层级。

### 2.2 Topic/Event Stream 是事件日志和传输形态

Apache Kafka 把 Topic 描述为生产者发布、消费者订阅的事件集合；Topic 被划分为 Partition，同一 Key 的事件进入同一分区，分区内保持写入顺序，事件按配置的保留期留存。[Apache Kafka：Introduction](https://kafka.apache.org/documentation/)

Kafka Streams 又明确给出流表二元性：事件流可被视为表的变更日志，重放变更日志可重建表；表也可被视为某一时刻每个 Key 最新值的快照。[Apache Kafka Streams：Core Concepts](https://kafka.apache.org/41/streams/core-concepts/)

**事实结论**：Topic 说明数据的日志、分区、保留和订阅方式，不说明它是原始层、明细层、汇总层还是应用层。

### 2.3 动态表把表语义与持续计算连接起来

Apache Flink 的动态表是随时间变化的逻辑表。连续查询不断处理输入表的变更并更新结果表；流可以转换成动态表，动态表也可以编码为 Append、Upsert 或 Retract Changelog Stream。动态表本身首先是逻辑概念，不要求执行时完整物化。[Apache Flink：Dynamic Tables](https://nightlies.apache.org/flink/flink-docs-stable/zh/docs/dev/table/concepts/dynamic_tables/)

Flink 还允许在带主键和时间属性的动态表上表达版本化表；Upsert Kafka、Debezium 和 Canal 等变更源都可形成版本化表来源。[Apache Flink：Versioned Tables](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/sql-table-concepts/versioned_tables/)

**事实结论**：表与流不是互斥资产类型。一个表可以持续变化并输出变更流，一个事件流也可以投影为当前状态表。

## 3. 推断：应该采用“语义层 × 运行形态”二维分类

以下为基于上述官方事实形成的架构推断：

| 业务语义层 | 典型流式对象 | 典型湖仓对象 | 是否天然可对外服务 |
|---|---|---|---|
| ODS / Bronze | 原始事件 Topic、数据库 CDC 日志、原始埋点流 | 原始事件追加表、CDC 历史表、隔离区表 | 否 |
| DWD / Silver 明细 | 清洗去重后的订单事件流、统一客户变更流 | 标准明细表、主键更新表、版本化表 | 否，通常供内部复用 |
| DWS / Silver-Gold 公共汇总 | 窗口聚合结果流、公共指标变更流 | 公共汇总表、持续物化汇总表 | 不一定，需要按契约审核 |
| ADS / Gold 应用服务 | 面向消费场景的服务事件流、告警流、应用指标流 | 服务视图、应用宽表、应用物化视图 | 仍需达到服务就绪条件 |

“是否可对外服务”不能只看层级，还至少需要检查：所有者、业务域、数据权限、敏感级别、契约版本、Schema 兼容性、质量规则、SLA、保留期和审计策略。

建议资产元数据至少拆成以下维度：

```text
semanticLayer     = ODS | DWD | DWS | ADS
physicalForm      = TOPIC | LAKE_TABLE | CHANGELOG | DYNAMIC_TABLE | MATERIALIZED_VIEW
changeSemantics   = APPEND | UPSERT | RETRACT
freshnessMode     = BATCH | MICRO_BATCH | CONTINUOUS
serviceReadiness  = INTERNAL | CURATED | SERVICE_READY
```

这可以避免出现两个常见误判：

1. “Kafka Topic 都是 ADS”——错误，原始 Kafka Topic 可能属于 ODS；
2. “湖表都是离线表”——错误，湖表可以同时接受流写入、供流式增量读取和批量快照查询。

## 4. 湖仓一体中的主流处理方式

### 4.1 原始流通常先落入 Bronze/ODS，但消息总线可继续保留

Databricks 的 Medallion 官方定义以质量递进组织湖仓：Bronze 保存原始数据，示例来源包括 Kafka；Silver 进行清洗和校验；Gold 面向业务用户形成聚合和业务可用数据。[Databricks：Medallion Lakehouse Architecture](https://docs.databricks.com/aws/en/lakehouse/medallion)

典型链路是：

```text
业务系统 / 数据库 CDC / 设备事件
          │
          ├── 事件日志（Kafka/Pulsar 等，承担实时缓冲、订阅和有限期重放）
          │
          └── Bronze/ODS 湖表（保留原始事实、长期审计和历史重算基础）
                    ↓ 连续清洗、标准化、去重、关联
               Silver/DWD 湖表或明细变更流
                    ↓ 连续聚合、场景投影
               DWS/ADS 物化表或服务流
```

**推断**：消息总线与湖表并非二选一。消息总线适合低延迟分发和短中期重放；湖表适合长期、低成本、可快照查询和批流复用。是否双写、先写消息还是直接流入湖表，应由恢复目标、数据时效和成本确定。

### 4.2 Bronze/Silver/Gold 可参考 ODS/DWD/DWS/ADS，但不能机械等同

官方 Medallion 模型描述的是质量递进：Bronze 为 Raw，Silver 为 Validated，Gold 为 Enriched/Business-ready。[Databricks：Medallion Lakehouse Architecture](https://docs.databricks.com/aws/en/lakehouse/medallion)

DataWorks 的 ODS/DWD/DWS/ADS 则同时包含明细粒度、公共汇总和具体应用用途。[DataWorks：数仓分层](https://help.aliyun.com/zh/dataworks/user-guide/data-warehouse-layering/)

因此只能做近似映射：

| Medallion | 常见近似映射 | 不能直接等同的原因 |
|---|---|---|
| Bronze | ODS | 两者都偏原始，但 ODS 往往强调贴源结构，Bronze 更强调原始保真和可重建 |
| Silver | DWD + DIM，部分 DWS | Silver 的核心是清洗、校验和整合，不严格规定明细或汇总粒度 |
| Gold | 部分 DWS + ADS | Gold 强调业务可用，可能包含跨场景公共指标；ADS 更强调具体应用或产品 |

**推断**：不能因为某张表属于 Gold 就自动把它命名为 ADS，也不能把所有 DWS 都归入 Silver。企业需要保留自己的语义层级规则。

### 4.3 Lakehouse 表本身可同时服务批和流

Delta Lake 官方文档明确说明：同一张 Delta 表既是批表，也可作为流式 Source 和 Sink；其事务日志支持并发批/流写入场景。[Delta Lake：Welcome](https://docs.delta.io/)、[Delta Lake：Table Streaming Reads and Writes](https://docs.delta.io/delta-streaming/)

Delta Change Data Feed 能记录表版本间的 Insert、Update 和 Delete，既可批量读取，也可流式读取；官方用例包括增量处理 Silver/Gold 表以及把变更传输到 Kafka 或关系数据库。[Delta Lake：Change Data Feed](https://docs.delta.io/delta-change-data-feed/)

Apache Hudi 支持 Snapshot、Incremental 和 CDC 等不同查询形态；Incremental Query 读取某一时点后变化的最新状态，CDC Query 读取包含前后镜像和操作类型的完整变化。[Apache Hudi：Table & Query Types](https://hudi.apache.org/docs/table_types/)、[Apache Hudi：SQL Queries](https://hudi.apache.org/docs/sql_queries/)

Apache Paimon 的主键表支持流式更新和 Changelog Read，快照又保存某一时点的表状态；无主键的 Append Table 则只接受追加数据。[Apache Paimon：Tables](https://paimon.apache.org/docs/master/concepts/rest/tables/)、[Apache Paimon：Basic Concepts](https://paimon.apache.org/docs/master/concepts/basic-concepts/)

Apache Iceberg 支持 Flink 的批写和流写，并可在 V2 表上按主键 Upsert；但 Spark Structured Streaming 的增量读取主要处理 Append Snapshot，Overwrite/Delete Snapshot 存在明确限制。[Apache Iceberg：Flink Writes](https://iceberg.apache.org/docs/latest/flink-writes/)、[Apache Iceberg：Structured Streaming](https://iceberg.apache.org/docs/latest/spark-structured-streaming/)

**事实与限制结论**：开放湖表格式已经支持不同程度的流写、增量读和变更读，但能力并不完全相同。产品领域模型应表达 Append/Upsert/Retract、快照、位点和保留期，不能假设所有适配器都能提供相同的 CDC 语义。

### 4.4 连续物化视图可形成服务层，而不必复制两套开发逻辑

Flink 的 Materialized Table 以查询定义和数据新鲜度驱动刷新；低新鲜度目标可采用持续流式增量更新，较长新鲜度可采用周期性全量或分区刷新。[Apache Flink 2.3：Materialized Table Overview](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/sql/materialized-table/overview/)

这意味着一个 ADS 服务投影可以由同一份声明式查询形成：需要秒级/分钟级时持续刷新，需要小时/天级时批量刷新；服务层不必维护语义不一致的“实时 SQL”和“离线 SQL”两套定义。

## 5. Lambda、Kappa 与 Streaming Lakehouse 如何看待分层

### 5.1 Lambda：冷热两条计算路径，不代表两套语义层

Lambda Architecture 为相同输入建立批处理冷路径与低延迟热路径，最后向查询侧组合结果；其主要问题是两条路径容易出现重复计算逻辑和运维复杂度。[Microsoft Azure Architecture Center：Big Data Architectures](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/big-data-architectures)

**推断**：Lambda 的 Hot/Cold 是处理路径，不应分别映射成 ADS/ODS。热路径也需要经过明细标准化和业务规则，冷路径也能产出 ADS。

### 5.2 Kappa：单一事件日志与重放，不意味着所有事件都是服务数据

Kappa Architecture 以统一事件日志和单一流处理路径处理实时与历史数据，需要重算时重放日志。[Microsoft Azure Architecture Center：Big Data Architectures](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/big-data-architectures)

Apache Flink 将有界数据视为会结束的 Stream、无界数据视为不会结束的 Stream，并使用统一 API 处理两者；批处理是有界流处理。[Apache Flink：Architecture](https://flink.apache.org/what-is-flink/flink-architecture/)

**推断**：Kappa 统一的是计算路径和重放方式，不取消数据质量、业务粒度和消费用途分层。原始事件日志仍可属于 ODS，重放后产生的明细、汇总和服务输出仍分别属于 DWD、DWS、ADS。

### 5.3 Streaming Lakehouse：统一批流存储与计算，但继续保留语义分层

Apache Flink 将 Streaming Lakehouse 描述为流批统一计算引擎与流批统一湖格式的组合，通过 Materialized Table 统一实时与历史数据管道。[Apache Flink 2.0：Streaming Lakehouse](https://flink.apache.org/2025/03/24/apache-flink-2.0.0-a-new-era-of-real-time-data-processing/)

**推断**：Streaming Lakehouse 消除的是“流数据只能在消息系统、批数据只能在文件表”的技术割裂，并没有消除 Bronze/Silver/Gold 或 ODS/DWD/DWS/ADS 的治理意义。

## 6. 流式资产的治理对象

在湖仓一体平台中，建议把一条流治理为“数据资产”，而不是只登记一个 Topic 地址。至少应包括：

| 治理方面 | 建议元数据或规则 | 原因 |
|---|---|---|
| 归属 | tenant、业务域、数据 Owner、生产 Owner | 决定审批和责任边界 |
| 语义 | semanticLayer、事件类型、业务主键、事件时间 | 区分原始事件、明细事实、汇总结果和服务输出 |
| 结构 | Schema、版本、兼容策略、样例、必填字段 | 持续生产者与消费者必须协同演进 |
| 变更模型 | Append、Upsert、Retract、是否含前后镜像 | 决定消费者如何恢复当前状态 |
| 时序 | Partition Key、分区内顺序、Watermark、迟到规则 | 决定聚合和一致性边界 |
| 存储 | Topic 保留期、湖表快照、Changelog 保留期、归档策略 | 决定可重放范围和恢复能力 |
| 质量 | 完整性、唯一性、及时性、Schema 违规隔离 | 决定能否晋级到 DWD/DWS/ADS |
| 安全 | 分级分类、字段权限、脱敏、租户和环境隔离 | 决定谁能发现、开发和消费 |
| 服务 | serviceReadiness、契约版本、SLA、授权范围 | 决定能否对外提供数据服务 |
| 血缘 | 来源 Topic/表、转换作业、目标表/服务 | 支持影响分析、审计和问题回溯 |

其中，Schema 与数据保留不能只在服务层处理。Kafka Topic 会按配置保留事件；Paimon、Delta、Hudi 等湖表的 Changelog 或 Change Feed 也有各自的生命周期与能力边界。服务承诺的“可从某位点恢复”不能超过底层保留窗口。[Apache Kafka：Introduction](https://kafka.apache.org/documentation/)、[Delta Lake：Change Data Feed](https://docs.delta.io/delta-change-data-feed/)、[Apache Paimon：Configurations](https://paimon.apache.org/docs/master/maintenance/configurations/)

## 7. 对本项目当前约束的决策落实

### 7.1 当前表述的问题

原约束“数据服务只允许使用 ADS 层数据”如果同时应用于 API 和数据流，会产生以下问题：

1. 原始 Topic、数据库 CDC 和标准明细流会被错误标成 ADS；
2. 无法表达从 ODS 原始事件到 DWD 标准事件，再到 ADS 服务事件的流式加工血缘；
3. 将物理载体、实时性与业务语义层混为一谈；
4. 后续接入 Delta/Hudi/Paimon 的表变更流时，很难判断“这是一张表”还是“这是一条流”，而实际上它可以同时是两者。

### 7.2 已确认的替换文本

项目已经确认将约束改成：

> **API 服务只能绑定 ADS 表、逻辑表或视图。数据流服务暂不按 ODS、DWD、DWS 或 ADS 等数仓语义层级限制来源，可以绑定任意层中已登记、受治理并取得数据权限的流式数据资产。数仓语义层作为资产元数据和上线审核信息展示，不作为数据流服务的硬性拦截条件。数据流服务模块仍不得绕过资产治理直接暴露数据库 CDC、未登记 Topic 或任意外部消息流。**

该决策把“API 的 ADS 准入”和“数据流的治理准入”分开。取消 ADS 限制不等于取消租户、业务域、Schema、质量、安全、数据权限和上线审核。

### 7.3 推荐对象关系

```text
StreamDataAsset
  ├── ODS 原始事件流
  ├── DWD 标准明细流
  ├── DWS 公共汇总流
  └── ADS 应用服务流
          ↓ 资产治理、数据权限、服务审核
StreamService
          ↓ 授权、消费端点、凭证
ConsumerApplication
```

关键边界是：

- 数据开发/治理模块负责登记和治理 `StreamDataAsset`，记录语义层、Schema、质量、安全、权限和血缘；
- 数据服务模块可以引用任意语义层中治理完成且获准使用的流式资产，负责服务契约、上线、授权、凭证、交付、监控和审计；
- 原始 CDC 或外部 Topic 只有完成正式资产登记、数据方审核、Schema 与质量治理后才可能成为来源，不能通过填写一个连接地址直接对外；
- 是否需要为对外消费再形成逻辑投影、输出 Topic 或湖表 Change Feed，由具体服务契约和底层适配能力决定，不再强制归为 ADS。

### 7.4 统一使用“流式数据资产”

不再把 `ADSStreamAsset` 作为数据流服务的统一来源对象，改为：

| 对象 | 含义 | 是否可直接由数据流服务绑定 |
|---|---|---:|
| `StreamDataAsset` 流式数据资产 | 任意语义层的受治理流资产，记录 Topic/湖表、Schema、层级、血缘、质量和权限 | 治理完成且取得数据权限后可以 |
| `ADSServiceStream` ADS 服务流 | `StreamDataAsset` 的可选 ADS 子类型，表示已经位于 ADS 的应用服务流 | 可以，但不是唯一可绑定类型 |

这样可以得到一致答案：

- 流式数据资产不一定在 ADS；
- 数据流服务暂不以 ADS 作为硬性准入条件；
- 语义层级必须展示并参与审批，但真正的准入条件是资产治理状态和数据权限。

## 8. 建议纳入后续产品确认的问题

1. 首期允许直接绑定哪些 `StreamDataAsset` 物理形态：Topic、事件流、湖表 Change Feed，还是全部建模但分期适配？
2. 除“治理完成＋数据权限通过”外，是否需要单独的 `SERVICE_READY` 准入状态？
3. ODS 原始事件流对外服务时，是否需要额外的敏感数据、质量和稳定性审核规则？
4. 首期是否只允许单一流式资产，还是允许数据服务层做多流关联？
5. Schema 兼容、消息保留和 SLA 由数据 Owner 还是服务开发者负责？
6. 湖表 Change Feed 超出保留期后，是否允许从表快照重新初始化消费者？

## 9. 来源清单

- [Apache Kafka：Introduction](https://kafka.apache.org/documentation/)
- [Apache Kafka Streams：Core Concepts](https://kafka.apache.org/41/streams/core-concepts/)
- [Apache Flink：Architecture](https://flink.apache.org/what-is-flink/flink-architecture/)
- [Apache Flink：Dynamic Tables](https://nightlies.apache.org/flink/flink-docs-stable/zh/docs/dev/table/concepts/dynamic_tables/)
- [Apache Flink：Versioned Tables](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/sql-table-concepts/versioned_tables/)
- [Apache Flink 2.3：Materialized Table Overview](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/sql/materialized-table/overview/)
- [Apache Flink 2.0：Streaming Lakehouse](https://flink.apache.org/2025/03/24/apache-flink-2.0.0-a-new-era-of-real-time-data-processing/)
- [Apache Iceberg：Flink Writes](https://iceberg.apache.org/docs/latest/flink-writes/)
- [Apache Iceberg：Structured Streaming](https://iceberg.apache.org/docs/latest/spark-structured-streaming/)
- [Apache Hudi：Table & Query Types](https://hudi.apache.org/docs/table_types/)
- [Apache Hudi：SQL Queries](https://hudi.apache.org/docs/sql_queries/)
- [Apache Paimon：Tables](https://paimon.apache.org/docs/master/concepts/rest/tables/)
- [Apache Paimon：Basic Concepts](https://paimon.apache.org/docs/master/concepts/basic-concepts/)
- [Delta Lake：Welcome](https://docs.delta.io/)
- [Delta Lake：Table Streaming Reads and Writes](https://docs.delta.io/delta-streaming/)
- [Delta Lake：Change Data Feed](https://docs.delta.io/delta-change-data-feed/)
- [Databricks：Medallion Lakehouse Architecture](https://docs.databricks.com/aws/en/lakehouse/medallion)
- [DataWorks：数仓分层](https://help.aliyun.com/zh/dataworks/user-guide/data-warehouse-layering/)
- [DataWorks：构建企业级离线实时一体化数仓](https://help.aliyun.com/zh/dataworks/user-guide/data-warehouse-solutions)
- [Microsoft Azure Architecture Center：Big Data Architectures](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/big-data-architectures)
