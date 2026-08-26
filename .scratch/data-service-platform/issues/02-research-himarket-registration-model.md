# 调研 HiMarket 注册管理参考模型

Type: research
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

本地 HiMarket 源码如何表达服务产品、消费者、凭证、订阅、网关实例、注册执行和目录展示？哪些领域对象、状态和页面交互适合用于本平台的 Agent、MCP、模型、Skill、Worker 注册管理，哪些属于 HiMarket 或其网关实现的特定假设而不应照搬？

## Answer

HiMarket 可复用的核心是四组职责分离：`Product` 与 `ProductRef` 分离产品身份和技术绑定，`ProductPublication` 独立表达目录展示，`Consumer / ProductSubscription / ConsumerCredential / ConsumerRef` 分离消费应用、授权、凭证和网关执行投影，`GatewayOperator` 以适配器封装资源发现和授权执行。

但 HiMarket 没有统一的 Agent、MCP、模型、Skill、Worker 注册模型：Agent/模型主要导入网关或 Nacos 已有资源，Skill 使用 Nacos/AIRegistry 制品仓库，Worker 使用 Nacos AgentSpec，只有 MCP 具备专用直接注册入口。其同步导入只有当次成功数与逐项失败，没有注册申请、审批、持久化执行、重试和幂等状态；`PENDING / READY / PUBLISHED` 也混合技术就绪与门户展示，不能替代本平台的注册和上线状态机。

本平台应借鉴对象和交互分层，但新增租户、注册者、私有/共享、产品版本、`RegistrationRequest`、`RegistrationExecution`、审批、环境、权限范围和凭证生命周期；不照搬 Portal、管理员所有权、产品级共享 API Key、物理删除凭证、硬编码网关字段以及 Nacos/AIRegistry 特定假设。

完整报告：[HiMarket 注册管理参考模型调研](../../../docs/research/himarket-registration-model.md)

## Comments
