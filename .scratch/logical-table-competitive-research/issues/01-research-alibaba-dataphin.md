# 调研阿里云 Dataphin 的逻辑表流程与资产信息

Type: research
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

基于阿里云官网和官方文档，确认 Dataphin 中“逻辑表”的正式定义、类型及所在模块；按页面入口、前置条件、创建步骤、创建表单字段、提交／发布、管理操作、权限申请与下游使用还原全过程，并盘点资产清单／资产目录／数据资产列表与详情页展示的逻辑表信息和字段。保留官网原词、直接 URL、访问日期与页面／官方截图证据，区分正文事实、截图观察和无法证实项。研究结果写入 `docs/research/sources/alibaba-dataphin-logical-table.md`。

## Answer

已完成。Dataphin 将逻辑表作为“规范建模”正式研发对象：维度逻辑表由业务对象驱动，事实逻辑表由业务活动驱动，汇总逻辑表由统计粒度与指标驱动；当前资产清单还把标签逻辑表列为资产类型，但公开的当前全托管文档未证明旧版“萃取项目初始化自动创建”规则仍普遍适用。

维度/事实逻辑表的官方链路为：新建表级对象 → 配置字段及标准/分类/分级/约束 → 配置关联维度、来源与计算逻辑 → 配置调度/依赖/参数/运行 → 保存并提交（解析开发血缘并前置检查）→ Dev-Prod 发布（解析生产血缘）或 Basic 直达生产 → 运维、下线/删除。研发列表、资产清单、已上架资产管理、资产目录列表及详情字段已分别盘点；报告明确区分官方正文、官方截图观察、推断和未证实项。

完整报告：[`docs/research/sources/alibaba-dataphin-logical-table.md`](../../../docs/research/sources/alibaba-dataphin-logical-table.md)
