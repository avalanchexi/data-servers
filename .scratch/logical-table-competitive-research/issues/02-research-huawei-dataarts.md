# 调研华为云 DataArts Studio 的逻辑表流程与资产信息

Type: research
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

基于华为云官网和官方文档，确认 DataArts Studio 中与“逻辑表”最接近的正式对象及其所在模块；按页面入口、前置条件、创建步骤、创建表单字段、审核发布或同步、管理操作、权限申请与下游使用还原全过程，并盘点 DataArts Catalog／数据资产列表与详情页展示的相关信息和字段。保留官网原词、直接 URL、访问日期与页面／官方截图证据，区分正文事实、截图观察和无法证实项。研究结果写入 `docs/research/sources/huawei-dataarts-logical-table.md`。

## Answer

华为云的正式对象就是 DataArts Architecture（数据架构）中的“逻辑实体”，官网明确写明“逻辑实体即逻辑表”。创建链路为：工作空间内配置审核人/功能项 → 数据调研 > 逻辑建模 > 逻辑模型 → 新建逻辑实体 → 配置基本信息、属性、关系、映射 → 发布并选择审核人 → 审核中心全员通过 → 已发布 → 默认或手工同步为 DataArts Catalog 的业务/逻辑资产。后续支持同步、发布、下线、修改主题、删除、标签、编辑/质量规则、发布历史/版本对比、预览 SQL、导入导出和逆向数据库。

资产页面必须区分逻辑实体“业务资产”和落库表“技术资产”：前者围绕业务对象、逻辑实体、业务属性及关联表，后者展示库表列、权限、血缘、概要、数据预览、变更等。当前官网没有公开枚举逻辑实体业务资产列表/详情的完整 UI 字段；报告已把官网正文事实、官方截图观察、API 可用字段和公开资料未证实项分开记录。

权限方面，资产可见不等于能查询数据：当前区域主要通过 DataArts Security 对物理库/表/列发起申请、审批并回收，细粒度认证会把获批权限带入数据开发脚本、测试和调度执行；公开资料未证明逻辑实体业务资产可一次授权其全部关联物理表。

报告：[`docs/research/sources/huawei-dataarts-logical-table.md`](../../../docs/research/sources/huawei-dataarts-logical-table.md)
