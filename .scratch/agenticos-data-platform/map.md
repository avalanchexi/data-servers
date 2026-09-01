# AgenticOS 数据中台承载力与功能边界决策地图

Label: wayfinder:map

## Destination

形成一套可直接进入总体设计或规格阶段的中文决策基线：基于 AgenticOS 前端源码、Playwright 真实系统证据、数据服务原型、领域文档和 ADR，判断 AgenticOS 建设数据中台的架构充分性，并明确数据服务域设置、运行管理与 AgenticOS 公共底座之间的交集、重复项、单一事实源和收敛方向。

## Notes

- 本地图默认只解决决策，不修改前端源码、原型或后端实现。
- 评估对象是完整的 AgenticOS；数据服务域只是数据中台中的一个产品域。
- 数据中台由数据资产、数据工程、数据治理和数据服务四个产品域组成；身份权限、系统配置、工作流、网关、运行时、监控和审计归 AgenticOS 公共底座。
- 配置归属原则：跨产品域配置归 AgenticOS 系统配置；数据服务域特有规则归数据服务域设置；公共配置在数据服务中只引用或展示，不维护第二份事实源。
- 跨域及底层配置能力由 AgenticOS 公共底座统一管理和建设，数据中台各产品域消费公共配置并维护各自的域特有配置。
- 重叠从界面、业务职责、配置事实源、运行控制与观测四层判断；界面相似不自动等于职责重复。
- 数据服务运行管理与 AgenticOS 系统监控定位不同，不合并成一个模块；研究只需明确观测数据复用、下钻关系和职责边界。
- 架构能力按“已具备、可扩展、缺失、仅前端可见且后端未证实”分级，分别给出当前可用性和目标架构可行性。
- 数据中台能力范围可以参考火山引擎 DataLeap 与阿里云 DataWorks 的官方产品资料，但外部产品只作为能力覆盖与分层参考，不替代本地源码和真实系统证据。
- 一手证据包括 [`frontend/`](../../frontend/)、[`output/playwright/`](../../output/playwright/)、[`prototypes/`](../../prototypes/)、[`CONTEXT.md`](../../CONTEXT.md)、[`docs/adr/`](../../docs/adr/) 及既有数据服务决策票；旧设计系统不作为裁决来源。
- Playwright 最新完整系统管理证据以 `output/playwright/seabox-system-management-detail-audit/20260901T011050Z/` 为准。
- DataLeap 与 DataWorks 的外部事实只采用官方文档、官方产品架构或官方 API 资料，并记录访问日期。
- 每次处理 `grilling` 工单时使用 `$grilling` 与 `$domain-modeling`；事实调研使用 `$research`，所有结论必须链接到本地一手源码、采集状态、截图、原型或既有决策。

## Decisions so far

- [调研数据服务域设置与 AgenticOS 系统配置重叠](issues/01-research-system-configuration-overlap.md) — 多数同名配置并非同一对象；授权主体与审计事实源存在必须收敛的职责冲突，认证和类型限制应采用公共硬上限、域策略和执行投影分层。
- [调研数据服务运行管理与 AgenticOS 运行监控重叠](issues/02-research-runtime-monitoring-overlap.md) — 保留两个领域入口，采用一个公共遥测、事件和审计底座，并以稳定标识和时间上下文实现双向下钻。
- [调研 AgenticOS 承载数据中台的架构能力](issues/03-research-platform-architecture-capacity.md) — 当前不足以直接承载生产级数据中台；复用公共底座并新增数据平台控制面和执行面后有条件可行。
- [确定重叠功能的单一归属与收敛策略](issues/04-decide-overlap-consolidation.md) — 公共配置、授权框架、网关执行、遥测和审计归 AgenticOS 公共底座；数据服务保留领域设置、授权事实、运行控制与领域投影；两个监控入口不合并，平台内部调用使用受管双身份并禁止免鉴权旁路。
- [判断 AgenticOS 作为数据中台基座的采用边界](issues/05-decide-platform-adoption-boundary.md) — AgenticOS 有条件作为数据中台应用层目标原型的公共底座；四个产品域采用平台骨架与关键链路，排除集群管理和实施级架构设计，现有前端源码、Playwright 与原型证据足以继续原型设计。

## Not yet specified

当前没有尚未明确且仍属于本地图原型决策范围的问题。

## Out of scope

- 本轮不修改或重构 AgenticOS 源码、数据服务原型和旧设计系统资产。
- 本轮不实现生产后端、数据工程引擎、网关、工作流或可观测基础设施。
- 本轮不以页面存在证明后端能力已经生产可用。
- 本轮不完成完整数据中台总体设计；只形成进入总体设计所需的事实与边界决策。
- [判断 AgenticOS 作为数据中台基座的采用边界](issues/05-decide-platform-adoption-boundary.md) 已将后端源码补证、数据库与部署拓扑、详细 ADR、迁移兼容、性能容量、容灾和生产验收后置到应用层原型确认后的独立总体设计／实施路线图，因为这些内容超过当前原型阶段深度。
