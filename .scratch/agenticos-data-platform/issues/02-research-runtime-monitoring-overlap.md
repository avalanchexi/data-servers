# 调研数据服务运行管理与 AgenticOS 运行监控重叠

Type: research
Status: resolved
Claimed by: background research agent
Parent: ../map.md
Blocked by: none

## Question

基于 `prototypes/runtime-management.html`、既有运行管理决策、AgenticOS 前端源码和最新 Playwright 系统监控／系统审计证据，比较数据服务运行管理、服务运监与 AgenticOS 公共运行监控的职责边界。

输出必须区分基础设施与系统健康、网关和路由控制面、服务产品运行健康、数据应用消费观测、异常事件和审计，并对网关概览、注册与路由、策略管理、配置发布、运行监控、异常事件、审计日志以及 AgenticOS 的 Dashboard、定时任务、日志监控、缓存、向量表、SQLite 数据库、系统审计逐项给出重叠等级与建议归属。

用户已经确定两个模块因定位不同而不合并。本调研需要验证这一边界，并指出可以复用的原始指标、统一标识、关联跳转和审计上下文，不再把合并作为候选方案。

## Answer

已完成调研，报告见 [数据服务运行管理与 AgenticOS 运行监控重叠研究](../../../docs/research/agenticos-runtime-monitoring-overlap.md)。

核心结论：

- 两个模块职责定位不同，应保留两个入口：数据服务运行管理面向网关期望配置、服务固定版本健康和数据应用消费观测；AgenticOS 系统监控面向公共组件、调度器、原始日志、缓存、向量库和 SQLite 的系统诊断与维护。
- 页面职责重叠低，原始指标／日志／执行事件重叠中等，审计事实源重叠高；应采用“两个领域视图、一个公共遥测与审计底座”，不复制原始日志、破坏性系统操作、审计存储、保留策略或导出管线。
- 数据服务保留网关概览、运行情况、策略管理、配置发布、服务运监、异常事件和领域审计视图；AgenticOS 保留 Dashboard、Cron 控制、日志、缓存、向量／SQLite 诊断与公共审计。
- 两边应统一租户、环境、公共组件、网关绑定、服务／应用版本、路由／后端／策略、请求／Trace、任务运行、配置发布、异常和审计标识，并通过 `incident_id`、`audit_event_id` 和原时间窗口双向下钻。
- 当前前端源码与 Playwright 证据没有证明这些统一关联字段和公共事件 Schema 已实现；报告将其明确列为需要补强的接口契约，而非现有能力。

## Comments

- 2026-09-01：用户确认数据服务运行管理与 AgenticOS 系统监控定位不同，可以不合并。
