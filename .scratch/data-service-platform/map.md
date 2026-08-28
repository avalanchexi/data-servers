# 数据服务平台产品与原型决策地图

Label: wayfinder:map

## Destination

形成一套可以交给 `$to-spec` 的中文决策集，使后续能够编写数据服务平台总体设计，并实现一个符合 Arco Design 风格、离线可运行的单 HTML 高保真交互原型；进入规格阶段前，不再遗留会实质改变产品边界、领域模型、关键流程或原型范围的未决问题。

## Notes

- 本地图只解决决策，不直接编写最终设计文档或原型代码。
- 所有交互和文档使用中文。
- 每次处理 grilling 工单时必须使用 `$grilling` 与 `$domain-modeling`，并在术语确定后即时更新 `CONTEXT.md`。
- 事实调研使用 `$research`，优先官方文档、规范和本地一手源码。
- 领域语言以 [`CONTEXT.md`](../../CONTEXT.md) 为准。
- 数据流事实依据包括[数据流服务与流式传输设计调研](../../docs/research/data-stream-service-research.md)和[湖仓一体架构中的流式数据资产分层研究](../../docs/research/lakehouse-streaming-asset-layering.md)。
- HiMarket 只作为注册管理逻辑和交互参考，当前不承诺部署、复用代码或形成运行时依赖。
- DataLeap 只作为 API 开发交互参考；本平台还必须提供 Coding Agent 开发方式。
- API 服务只使用 ADS 资产；数据流服务暂不按数仓层级限制来源，但必须使用受治理且获授权的流式数据资产。
- 用户希望每轮问题批量给出，并按主题分组提供分析、选项和推荐答案。

## Decisions so far

- [确认既有领域与范围基线](issues/01-confirm-domain-baseline.md) — 以 `CONTEXT.md` 及已完成调研作为路线图前置基线，后续工单只处理仍会影响规格或原型的开放决策。
- [调研 HiMarket 注册管理参考模型](issues/02-research-himarket-registration-model.md) — 可复用产品、发布、消费者、订阅、凭证与网关适配器的职责分离，但 AI 产品注册、审批、执行状态、租户和凭证生命周期需要平台补齐。
- [调研 API 服务三种开发方式](issues/03-research-api-development-modes.md) — 传统、低代码和 Coding Agent 是共享草稿、契约、测试、版本与上线链路的三种创作入口，Agent 只生成需人工采纳的补丁。
- [调研统一网关运行管理的必要配置](issues/20-research-gateway-runtime-configurations.md) — 统一网关运行管理应管理入口、路由、后端、策略、配置发布及运行观测；HiMarket 可参考资源发现、授权适配和监控，但不足以作为完整控制面。
- [确定统一网关运行配置与发布边界](issues/21-decide-gateway-runtime-configuration-boundary.md) — 采用厂商中立的网关控制面和独立配置发布，确认风险分级审批、紧急停流、简单灰度、AI 多模型路由、安全引用及人工处理配置漂移。
- [确定运行管理与设置的首版原型优先级](issues/22-prioritize-runtime-settings-prototype.md) — 全部菜单保留，以 P0/P1 验证核心方向；平台级能力不单独建设，只在被核心场景使用时细化状态、引用、结果和入口。
- [确定设置模块的策略与字段边界](issues/16-decide-settings-policy-scope.md) — 设置收敛为面向管理者的一张极简页面，只维护集市产品类型的呈现信息，以及受数据安全底线约束的认证与密钥策略默认值和上限；租户、环境、网关接入、系统和运维配置均移出。
- [验证 AI 服务开发与数据应用装配](issues/23-prototype-ai-service-development.md) — 已选择方案 C「服务制品流水线」作为主入口，以全局生命周期组织 AI 服务；Agent 专属编辑器和数据应用三层装配保留下钻，A／B 仅用于显式历史比较。
- [标准化三份核心原型的设计系统](issues/24-standardize-prototype-design-system.md) — AI 服务开发、运行管理和设置原型统一采用完整规范令牌、数据服务平台壳层及共享按钮、状态、表格、抽屉、弹窗和反馈组件，并由跨文件自动检查防止视觉规范漂移。
- [验证数据服务平台统一原型](issues/25-prototype-unified-data-service-platform.md) — 采用六项统一目录和单文件直接合并，默认进入服务集市；保留三个已验收来源原型的运行内容，未验收的服务集市、审批中心和 API 开发等待后续协作页面接入。

## Not yet specified

- 页面级异常、空状态、无权限状态和边界文案，将在关键业务流程确定后再细化。
- 适配器专属高级参数是否进入首期产品，将在数据流传输协议和运行语义确定后再判断。
- 最终演示数据、演示脚本和跨角色切换顺序，将在角色旅程原型验证后再固定。

## Out of scope

- 数据中台其他并行设计模块的内部实现；本地图只定义数据服务平台与它们的边界。
- MaaS 中台内部的模型训练、知识库、Prompt、评测和资源调度实现。
- CDC、ETL、流计算任务的开发与运行；数据流服务只交付已有受治理流式数据资产。
- 通用工作流引擎内部建模器和流程执行实现。
- Broker 集群、网关产品、容器层租户隔离和生产部署的真实实施选型。
- 生产级后端、真实消息代理和正式系统建设；这些属于规格之后的实施阶段。
