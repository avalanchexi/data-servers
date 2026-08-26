# 确认既有领域与范围基线

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

是否将当前 `CONTEXT.md`、已经确认的产品边界和两份流式服务调研作为本路线图的前置领域基线，使后续决策不再重复讨论已确认事项？

## Answer

确认。后续以 [`CONTEXT.md`](../../../CONTEXT.md) 为领域语言的唯一基线，并同时参考：

- [数据流服务与流式传输设计调研](../../../docs/research/data-stream-service-research.md)
- [湖仓一体架构中的流式数据资产分层研究](../../../docs/research/lakehouse-streaming-asset-layering.md)

关键边界包括：多租户和租户级隔离；管理者、开发者、消费者三类岗位视角；一个角色化平台而非三个门户；七个一级模块；统一使用上线／下线；API 仅使用 ADS；数据流不受数仓层级限制但必须使用受治理且获授权的流式数据资产；服务授权绑定消费应用、服务产品、环境和权限范围；AI 产品通过统一网关注册并参考 HiMarket 管理逻辑。

## Comments

- 本工单用于把正式路线图创建前已经完成的长对话决策纳入地图，不重复搬运 `CONTEXT.md` 的全部内容。

