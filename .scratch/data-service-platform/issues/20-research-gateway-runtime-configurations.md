# 调研统一网关运行管理的必要配置

Type: research
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

面向同时承载数据 API 与 AI 流量的统一网关，运行管理中哪些配置属于数据服务平台必须管理的产品级配置？需要对照本地 HiMarket 源码以及主流 API／AI 网关的一手官方资料，覆盖网关实例与环境、入口域名和证书、服务与路由、上游与健康检查、认证与消费者、流量与安全策略、AI 提供方和模型路由、配置发布与回滚、观测审计等方面，并明确哪些底层集群、节点或厂商专属参数不应进入首期平台界面。

调研产出应形成：

1. 厂商中立的必要配置清单与分层；
2. HiMarket 已覆盖、部分覆盖和缺失的能力矩阵；
3. 其他网关产品的共性与 AI 网关特有能力；
4. “运行管理”和“设置”的配置归属建议；
5. 首期原型必显、可模拟和暂不展示的配置建议。

## Answer

已完成统一网关运行管理必要配置调研，报告见 [gateway-runtime-configurations.md](../../../docs/research/gateway-runtime-configurations.md)。

核心结论：

- 运行管理应作为“统一网关期望配置控制面＋运行观测”，管理入口、路由、后端、策略、配置发布和运行状态，而不是复刻厂商控制台。
- 平台产品级配置归一为 `GatewayRuntimeBinding`、`IngressEndpoint`、`RuntimeRoute`、`BackendPool`、`RuntimePolicySet` 和 `ConfigRelease` 六类对象；AI 流量在通用路由骨架上补充模型路由、Token 预算、流式响应、安全与降级。
- 环境定义、适配器连接与管理凭证归“设置”；服务版本归“数据服务”；消费应用、授权和凭证主数据归“应用与授权”；运行管理只呈现其网关投影和下发状态。
- HiMarket 可参考网关导入、资源发现、Consumer 授权适配及 Model/MCP 监控交互，但缺少厂商中立的入口、路由写管理、后端池、通用策略和配置发布／回滚模型，不能直接作为完整运行配置基线。
- 首期原型必须展示概览、注册与路由、策略、配置发布、监控、异常和审计；可模拟发布失败、灰度、模型降级和安全事件；不展示节点、Pod、etcd/xDS、原始插件配置、Secret 明文和厂商安装运维参数。

## Comments

