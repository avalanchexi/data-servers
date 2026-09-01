# Seabox AI 前端设计系统现场研究

> 生成时间：2026/08/31 17:48:53
>
> 研究范围：https://ai.seaboxdata.com 当前账号可访问的同源只读页面
>
> 重要边界：本报告只采用目标网站的现场渲染与计算样式证据，明确忽略仓库既有 `enterprise-prototype-design`、`DESIGN-SPEC.md` 和旧设计 tokens。

## 1. 结论摘要

- 成功采集 **142** 个唯一页面模板，失败 **0** 个。
- 发现 **189** 个根级 CSS 自定义属性、**0** 条 FontFaceSet 已加载字体记录、**395** 个唯一图标签名；实际计算字体栈另见第 6 节。
- 统计 **12211** 个可交互控件、**19** 类组件模式和 **1621** 组默认/Hover/Focus 状态证据。
- 所有已采页面在 `1200×900` 视口下均未检测到页面级横向溢出。
- 抓取采用单页面、单并发、页面间随机等待 1500～3500ms；没有提交表单、调用写操作或枚举隐藏接口。

## 2. 研究方法与安全边界

1. 使用独立可见 Playwright 浏览器，由用户手动登录。登录凭据不进入脚本或报告。
2. 只发现和访问页面 DOM 中公开呈现的同源链接；按路由模板去重，同一布局下的不同业务 ID 只取一个代表实例。
3. 只执行页面导航、Hover、Focus 和带 `aria-expanded` 的可恢复展开操作；跳过新建、编辑、删除、审批执行、导出、上传、发送等动作。
4. 每个页面模板在 `1440×900` 与 `1200×900` 下采集布局；在主视口提取 CSS 变量、计算样式、标题、字体、图标、素材和交互状态。
5. 登录状态与 Trace 仅保存在 `.tmp` 临时目录；最终文档不包含 Cookie、Token、Local Storage、HAR 或原始业务数据。

## 3. 页面地图与覆盖范围

### 3.1 左侧导航与页内标签覆盖

- 左侧导航叶子页：**38** 个；页内安全标签状态：**103** 个。
- 下表按现场左侧导航分组列出全部已采叶子页；父级分组仅用于展开，不单独计为页面。

| 左侧导航分组 | 已采叶子页 | 数量 |
| --- | --- | ---: |
| 智能体 | 通用智能体 | 1 |
| 能力中心 | 智能体管理、技能管理、记忆管理、MCP 服务 | 4 |
| OA | 工时管理、研发项目、产品目录、审批管理、OKR、周报、Token服务 | 7 |
| 数据中心 | 数据源、数据集、语义模型、本体模型、上下文图谱、数据同步 | 6 |
| 资产中心 | 资产总览、数据地图、资产目录、数据标准、数据质量、数据安全、数据生命周期、数据服务、治理评估 | 9 |
| 知识中心 | 知识库、知识向量、知识图谱 | 3 |
| 系统管理 | 系统监控、系统配置、权限管理、消息管理、安全合规、风险监管、系统审计、反馈回测 | 8 |

### 3.2 完整页面模板清单

| # | 页面模板 | 页面标题 | H1 | 1440 页面尺寸 | 1200 横向溢出 |
| ---: | --- | --- | --- | --- | --- |
| 1 | `/#/home/index-qa/agent/:uuid/task/:uuid` | 东方金信 | — | 1440×900 | 否 |
| 2 | `/#/home/index-qa/task/:uuid` | 东方金信 | — | 1440×900 | 否 |
| 3 | `/#/home/agent-list` | 东方金信 | — | 1440×900 | 否 |
| 4 | `/#/home/skills-list` | 东方金信 | — | 1440×900 | 否 |
| 5 | `/#/home/system-memory` | 东方金信 | — | 1440×900 | 否 |
| 6 | `/#/home/mcp-list` | 东方金信 | — | 1440×900 | 否 |
| 7 | `/#/home/oa-work-hours` | 东方金信 | — | 1440×900 | 否 |
| 8 | `/#/home/oa-work-hours::tab=工时填报` | 东方金信 | — | 1440×900 | 否 |
| 9 | `/#/home/oa-project-management` | 东方金信 | — | 1440×900 | 否 |
| 10 | `/#/home/oa-products` | 东方金信 | 产品目录 | 1440×900 | 否 |
| 11 | `/#/home/oa-approval-management` | 东方金信 | — | 1440×900 | 否 |
| 12 | `/#/home/oa-approval-management::tab=待审批-0` | 东方金信 | — | 1440×900 | 否 |
| 13 | `/#/home/oa-approval-management::tab=已通过` | 东方金信 | — | 1440×900 | 否 |
| 14 | `/#/home/oa-approval-management::tab=已驳回` | 东方金信 | — | 1440×900 | 否 |
| 15 | `/#/home/oa-approval-management::tab=已作废` | 东方金信 | — | 1440×900 | 否 |
| 16 | `/#/home/oa-okr` | 东方金信 | — | 1440×900 | 否 |
| 17 | `/#/home/oa-weekly-report` | 东方金信 | 我的周报 | 1440×900 | 否 |
| 18 | `/#/home/oa-token-management` | 东方金信 | — | 1440×900 | 否 |
| 19 | `/#/home/oa-token-management::tab=Token服务` | 东方金信 | — | 1440×900 | 否 |
| 20 | `/#/home/oa-token-management::tab=API调用` | 东方金信 | — | 1440×900 | 否 |
| 21 | `/#/home/oa-token-management::tab=用量分析` | 东方金信 | — | 1440×900 | 否 |
| 22 | `/#/home/knowledge-datasource` | 东方金信 | — | 1440×900 | 否 |
| 23 | `/#/home/knowledge-dataset` | 东方金信 | — | 1440×900 | 否 |
| 24 | `/#/home/data-center-semantic` | 东方金信 | — | 1440×900 | 否 |
| 25 | `/#/home/data-center-semantic::tab=语义图谱` | 东方金信 | — | 1440×900 | 否 |
| 26 | `/#/home/data-center-semantic::tab=校验中心` | 东方金信 | — | 1440×900 | 否 |
| 27 | `/#/home/data-center-ontology` | 东方金信 | — | 1440×900 | 否 |
| 28 | `/#/home/data-center-ontology::tab=领域管理` | 东方金信 | — | 1440×900 | 否 |
| 29 | `/#/home/data-center-ontology::tab=Schema-管理` | 东方金信 | — | 1440×900 | 否 |
| 30 | `/#/home/data-center-ontology::tab=实体管理` | 东方金信 | — | 1440×900 | 否 |
| 31 | `/#/home/data-center-ontology::tab=关系管理` | 东方金信 | — | 1440×900 | 否 |
| 32 | `/#/home/data-center-ontology::tab=指标管理` | 东方金信 | — | 1440×900 | 否 |
| 33 | `/#/home/data-center-ontology::tab=可视化` | 东方金信 | — | 1440×900 | 否 |
| 34 | `/#/home/data-center-ontology::tab=完整性诊断` | 东方金信 | — | 1440×900 | 否 |
| 35 | `/#/home/data-center-datacontext` | 东方金信 | — | 1440×900 | 否 |
| 36 | `/#/home/data-center-datacontext::tab=图谱同步` | 东方金信 | — | 1440×900 | 否 |
| 37 | `/#/home/data-center-datacontext::tab=图谱浏览` | 东方金信 | — | 1440×900 | 否 |
| 38 | `/#/home/data-center-datacontext::tab=血缘影响` | 东方金信 | — | 1440×900 | 否 |
| 39 | `/#/home/data-center-datacontext::tab=指标概览` | 东方金信 | — | 1440×900 | 否 |
| 40 | `/#/home/data-center-datacontext::tab=Schema-目录` | 东方金信 | — | 1440×900 | 否 |
| 41 | `/#/home/data-center-sync` | 东方金信 | — | 1440×900 | 否 |
| 42 | `/#/home/asset-overview` | 东方金信 | — | 1440×900 | 否 |
| 43 | `/#/home/asset-overview::tab=全景大屏` | 东方金信 | — | 1440×900 | 否 |
| 44 | `/#/home/asset-overview::tab=治理驾驶舱` | 东方金信 | — | 1440×900 | 否 |
| 45 | `/#/home/asset-overview::tab=治理排行榜` | 东方金信 | — | 1440×900 | 否 |
| 46 | `/#/home/asset-overview::tab=问题大盘` | 东方金信 | — | 1440×900 | 否 |
| 47 | `/#/home/asset-map` | 东方金信 | — | 1440×900 | 否 |
| 48 | `/#/home/asset-map::tab=数据检索` | 东方金信 | — | 1440×900 | 否 |
| 49 | `/#/home/asset-map::tab=采集任务` | 东方金信 | — | 1440×900 | 否 |
| 50 | `/#/home/asset-map::tab=血缘分析` | 东方金信 | — | 1440×900 | 否 |
| 51 | `/#/home/asset-map::tab=类目管理` | 东方金信 | — | 1440×900 | 否 |
| 52 | `/#/home/asset-map::tab=我的数据` | 东方金信 | — | 1440×900 | 否 |
| 53 | `/#/home/asset-catalog` | 东方金信 | — | 1440×900 | 否 |
| 54 | `/#/home/asset-catalog::tab=资产盘点` | 东方金信 | — | 1440×900 | 否 |
| 55 | `/#/home/asset-catalog::tab=目录浏览` | 东方金信 | — | 1440×900 | 否 |
| 56 | `/#/home/asset-catalog::tab=权属管理` | 东方金信 | — | 1440×900 | 否 |
| 57 | `/#/home/asset-catalog::tab=价值评估` | 东方金信 | — | 1440×900 | 否 |
| 58 | `/#/home/asset-catalog::tab=资产运营` | 东方金信 | — | 1440×900 | 否 |
| 59 | `/#/home/asset-catalog::tab=使用统计` | 东方金信 | — | 1440×900 | 否 |
| 60 | `/#/home/asset-standard` | 东方金信 | — | 1440×900 | 否 |
| 61 | `/#/home/asset-standard::tab=标准集` | 东方金信 | — | 1440×900 | 否 |
| 62 | `/#/home/asset-standard::tab=标准代码` | 东方金信 | — | 1440×900 | 否 |
| 63 | `/#/home/asset-standard::tab=命名词典` | 东方金信 | — | 1440×900 | 否 |
| 64 | `/#/home/asset-standard::tab=落标映射` | 东方金信 | — | 1440×900 | 否 |
| 65 | `/#/home/asset-standard::tab=贯标统计` | 东方金信 | — | 1440×900 | 否 |
| 66 | `/#/home/asset-quality` | 东方金信 | — | 1440×900 | 否 |
| 67 | `/#/home/asset-quality::tab=规则模板库` | 东方金信 | — | 1440×900 | 否 |
| 68 | `/#/home/asset-quality::tab=监控任务` | 东方金信 | — | 1440×900 | 否 |
| 69 | `/#/home/asset-quality::tab=校验记录` | 东方金信 | — | 1440×900 | 否 |
| 70 | `/#/home/asset-quality::tab=质量评分` | 东方金信 | — | 1440×900 | 否 |
| 71 | `/#/home/asset-quality::tab=问题工单` | 东方金信 | — | 1440×900 | 否 |
| 72 | `/#/home/asset-quality::tab=质量报告` | 东方金信 | — | 1440×900 | 否 |
| 73 | `/#/home/asset-security` | 东方金信 | — | 1440×900 | 否 |
| 74 | `/#/home/asset-security::tab=分类分级` | 东方金信 | — | 1440×900 | 否 |
| 75 | `/#/home/asset-security::tab=脱敏策略` | 东方金信 | — | 1440×900 | 否 |
| 76 | `/#/home/asset-security::tab=行列权限` | 东方金信 | — | 1440×900 | 否 |
| 77 | `/#/home/asset-security::tab=审计日志` | 东方金信 | — | 1440×900 | 否 |
| 78 | `/#/home/asset-security::tab=风险识别` | 东方金信 | — | 1440×900 | 否 |
| 79 | `/#/home/asset-lifecycle` | 东方金信 | — | 1440×900 | 否 |
| 80 | `/#/home/asset-lifecycle::tab=分层策略` | 东方金信 | — | 1440×900 | 否 |
| 81 | `/#/home/asset-lifecycle::tab=归档管理` | 东方金信 | — | 1440×900 | 否 |
| 82 | `/#/home/asset-lifecycle::tab=退役管理` | 东方金信 | — | 1440×900 | 否 |
| 83 | `/#/home/asset-service` | 东方金信 | — | 1440×900 | 否 |
| 84 | `/#/home/asset-service::tab=服务注册` | 东方金信 | — | 1440×900 | 否 |
| 85 | `/#/home/asset-service::tab=API-商城` | 东方金信 | — | 1440×900 | 否 |
| 86 | `/#/home/asset-service::tab=授权管理` | 东方金信 | — | 1440×900 | 否 |
| 87 | `/#/home/asset-service::tab=调用统计` | 东方金信 | — | 1440×900 | 否 |
| 88 | `/#/home/asset-service::tab=外部数据台账` | 东方金信 | — | 1440×900 | 否 |
| 89 | `/#/home/asset-dcmm` | 东方金信 | — | 1440×900 | 否 |
| 90 | `/#/home/asset-dcmm::tab=指标台账` | 东方金信 | — | 1440×900 | 否 |
| 91 | `/#/home/asset-dcmm::tab=自评估` | 东方金信 | — | 1440×900 | 否 |
| 92 | `/#/home/asset-dcmm::tab=证据库` | 东方金信 | — | 1440×900 | 否 |
| 93 | `/#/home/asset-dcmm::tab=制度库` | 东方金信 | — | 1440×900 | 否 |
| 94 | `/#/home/asset-dcmm::tab=九域看板` | 东方金信 | — | 1440×900 | 否 |
| 95 | `/#/home/knowledge-kb` | 东方金信 | — | 1440×900 | 否 |
| 96 | `/#/home/knowledge-vector` | 东方金信 | — | 1440×900 | 否 |
| 97 | `/#/home/knowledge-vector::tab=Chunk` | 东方金信 | — | 1440×900 | 否 |
| 98 | `/#/home/knowledge-vector::tab=实体` | 东方金信 | — | 1440×900 | 否 |
| 99 | `/#/home/knowledge-vector::tab=关系` | 东方金信 | — | 1440×900 | 否 |
| 100 | `/#/home/knowledge-graph` | 东方金信 | — | 1440×900 | 否 |
| 101 | `/#/home/knowledge-graph::tab=图谱可视化` | 东方金信 | — | 1440×900 | 否 |
| 102 | `/#/home/config-system-monitor` | 东方金信 | — | 1440×900 | 否 |
| 103 | `/#/home/config-system-monitor::tab=Dashboard` | 东方金信 | — | 1440×900 | 否 |
| 104 | `/#/home/config-system-monitor::tab=定时任务` | 东方金信 | — | 1440×900 | 否 |
| 105 | `/#/home/config-system-monitor::tab=日志监控` | 东方金信 | — | 1440×900 | 否 |
| 106 | `/#/home/config-system-monitor::tab=应用缓存` | 东方金信 | — | 1440×900 | 否 |
| 107 | `/#/home/config-system-monitor::tab=LLM缓存` | 东方金信 | — | 1440×900 | 否 |
| 108 | `/#/home/config-system-monitor::tab=向量表` | 东方金信 | — | 1440×900 | 否 |
| 109 | `/#/home/config-system-monitor::tab=SQLite-数据库` | 东方金信 | — | 1440×900 | 否 |
| 110 | `/#/home/config-system-config` | 东方金信 | — | 1440×900 | 否 |
| 111 | `/#/home/config-system-config::tab=环境配置` | 东方金信 | — | 1440×900 | 否 |
| 112 | `/#/home/config-system-config::tab=应用配置` | 东方金信 | — | 1440×900 | 否 |
| 113 | `/#/home/config-system-config::tab=分析报告模板` | 东方金信 | — | 1440×900 | 否 |
| 114 | `/#/home/config-system-config::tab=字典配置` | 东方金信 | — | 1440×900 | 否 |
| 115 | `/#/home/config-permission` | 东方金信 | — | 1440×900 | 否 |
| 116 | `/#/home/config-permission::tab=用户管理` | 东方金信 | — | 1440×900 | 否 |
| 117 | `/#/home/config-permission::tab=组织管理` | 东方金信 | — | 1440×900 | 否 |
| 118 | `/#/home/config-permission::tab=角色管理` | 东方金信 | — | 1440×900 | 否 |
| 119 | `/#/home/config-permission::tab=功能菜单` | 东方金信 | — | 1440×900 | 否 |
| 120 | `/#/home/config-permission::tab=功能权限` | 东方金信 | — | 1440×900 | 否 |
| 121 | `/#/home/config-permission::tab=IM用户映射` | 东方金信 | — | 1440×900 | 否 |
| 122 | `/#/home/config-messages` | 东方金信 | 消息管理 | 1440×900 | 否 |
| 123 | `/#/home/config-messages::tab=消息列表` | 东方金信 | 消息管理 | 1440×900 | 否 |
| 124 | `/#/home/config-messages::tab=消息模板` | 东方金信 | 消息管理 | 1440×900 | 否 |
| 125 | `/#/home/config-content-compliance` | 东方金信 | — | 1440×900 | 否 |
| 126 | `/#/home/config-content-compliance::tab=概览` | 东方金信 | — | 1440×900 | 否 |
| 127 | `/#/home/config-content-compliance::tab=合规事件` | 东方金信 | — | 1440×900 | 否 |
| 128 | `/#/home/config-content-compliance::tab=策略配置` | 东方金信 | — | 1440×900 | 否 |
| 129 | `/#/home/config-content-compliance::tab=安全回答` | 东方金信 | — | 1440×900 | 否 |
| 130 | `/#/home/config-content-compliance::tab=LLM安全` | 东方金信 | — | 1440×900 | 否 |
| 131 | `/#/home/config-risk-governance` | 东方金信 | — | 1440×900 | 否 |
| 132 | `/#/home/config-risk-governance::tab=风险模型构建` | 东方金信 | — | 1440×900 | 否 |
| 133 | `/#/home/config-risk-governance::tab=风险预警` | 东方金信 | — | 1440×900 | 否 |
| 134 | `/#/home/config-risk-governance::tab=风险闭环处置` | 东方金信 | — | 1440×900 | 否 |
| 135 | `/#/home/config-system-audit` | 东方金信 | — | 1440×900 | 否 |
| 136 | `/#/home/config-system-audit::tab=审计日志` | 东方金信 | — | 1440×900 | 否 |
| 137 | `/#/home/config-system-audit::tab=用量统计` | 东方金信 | — | 1440×900 | 否 |
| 138 | `/#/home/config-system-audit::tab=日志管理` | 东方金信 | — | 1440×900 | 否 |
| 139 | `/#/home/config-feedback-backtest` | 东方金信 | — | 1440×900 | 否 |
| 140 | `/#/home/config-feedback-backtest::tab=反馈中心` | 东方金信 | — | 1440×900 | 否 |
| 141 | `/#/home/config-feedback-backtest::tab=评测集管理` | 东方金信 | — | 1440×900 | 否 |
| 142 | `/#/home/config-feedback-backtest::tab=回归测试` | 东方金信 | — | 1440×900 | 否 |

## 4. 页面布局系统

### 4.1 Landmarks 与主区域

| 结构签名 | 常见位置与尺寸 | 出现页面数 |
| --- | --- | ---: |
| header.flex.items-center.justify-between.px-6.flex-shrink-0 | x=0, y=0, 1440×56；x=0, y=0, 1440×56；x=0, y=0, 1440×56；x=0, y=0, 1440×56 | 142 |
| aside.transition-all.duration-300.ease-in-out.border-r.w-60.flex-shrink-0 | x=0, y=56, 240×844；x=0, y=56, 240×844；x=0, y=56, 240×844；x=0, y=56, 240×844 | 142 |
| nav.flex-1.overflow-y-auto.scrollbar-thin.px-2.5.py-3 | x=0, y=56, 239.2×844；x=0, y=56, 239.2×844；x=0, y=56, 239.2×844；x=0, y=56, 239.2×844 | 142 |
| main.min-h-0.min-w-0.flex-1.overflow-x-hidden.overflow-y-auto | x=240, y=56, 1200×844；x=240, y=56, 1200×844；x=240, y=56, 1200×844；x=240, y=56, 1200×844 | 139 |
| aside.w-44.shrink-0.border-r.p-4.flex.flex-col | x=260.8, y=182.2, 176×697；x=260.8, y=182.2, 176×697；x=260.8, y=182.2, 176×697；x=260.8, y=182.2, 176×697 | 6 |
| main.flex-1.min-w-0.flex.flex-col.overflow-hidden | x=436.8, y=182.2, 982.4×697；x=436.8, y=182.2, 982.4×697；x=436.8, y=182.2, 982.4×697；x=436.8, y=182.2, 982.4×697 | 6 |
| main.min-h-0.min-w-0.flex-1.overflow-x-hidden.overflow-y-hidden | x=240, y=56, 1200×844；x=240, y=56, 1200×844；x=240, y=56, 1200×844 | 3 |
| aside.weekly-report-team-panel.flex.w-14.shrink-0.flex-col.border-r | x=240, y=104, 272×796 | 1 |
| nav.shrink-0.border-b.p-3 | x=240, y=104, 256×204.78 | 1 |
| main.weekly-report-main.flex.min-w-0.flex-1.flex-col | x=512, y=104, 928×796 | 1 |

### 4.2 固定与吸附区域

| 页面模板 | 元素 | 定位 | z-index | 位置与尺寸 |
| --- | --- | --- | --- | --- |
| `/#/home/oa-project-management` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1251.2, y=628.4, 160×157.6 |
| `/#/home/oa-products` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1243.2, y=629.2, 160×157.6 |
| `/#/home/oa-weekly-report` | div.weekly-report-toolbar.border-b.bg-[var(--color-card)].px-6.py-4 | sticky | 10 | x=512, y=104, 928×104.8 |
| `/#/home/oa-weekly-report` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=555.2, y=198, 224×49.6 |
| `/#/home/oa-token-management::tab=用量分析` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1223.2, y=628.56, 160×157.6 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=285.6, y=214.4, 180×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=465.6, y=214.4, 120×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=585.6, y=214.4, 100×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=685.6, y=214.4, 220×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=905.6, y=214.4, 220×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=1125.6, y=214.4, 100×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=1225.6, y=214.4, 120×44.8 |
| `/#/home/knowledge-datasource` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 4 | x=1244.4, y=214.4, 150×44.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=259.2, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=312, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=364.8, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=417.6, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=470.4, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=523.2, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=576, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=628.8, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=681.6, 150×52.8 |
| `/#/home/knowledge-datasource` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1244.4, y=734.4, 150×52 |
| `/#/home/knowledge-datasource` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1065.6, y=154.8, 160×157.6 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=285.6, y=194.4, 180×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=465.6, y=194.4, 150×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=615.6, y=194.4, 220×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=835.6, y=194.4, 220×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=1055.6, y=194.4, 90×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=1145.6, y=194.4, 100×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=1245.6, y=194.4, 100×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 3 | x=1345.6, y=194.4, 120×44.8 |
| `/#/home/knowledge-dataset` | th.group.relative.border-b.px-4.py-3.text-sm | sticky | 4 | x=1274.4, y=194.4, 120×44.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=239.2, 120×52.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=292, 120×52.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=344.8, 120×52.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=397.6, 120×52.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=450.4, 120×52.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=503.2, 120×52.8 |
| `/#/home/knowledge-dataset` | td.px-4.py-3.text-sm.align-middle.group-hover:!bg-[var(--color-bg-hover)].text-left | sticky | 2 | x=1274.4, y=556, 120×52 |
| `/#/home/data-center-semantic` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=279.4, 160×280 |
| `/#/home/data-center-semantic::tab=校验中心` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1052.4, y=300.2, 224×280 |
| `/#/home/data-center-ontology::tab=实体管理` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1215.2, y=616.5, 160×157.6 |
| `/#/home/data-center-ontology::tab=关系管理` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1215.2, y=616.5, 160×157.6 |
| `/#/home/data-center-ontology::tab=指标管理` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1230.4, y=507.7, 160×157.6 |
| `/#/home/data-center-datacontext::tab=血缘影响` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=468.8, y=299.39, 160×229.6 |
| `/#/home/data-center-sync` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=1077.6, y=144.8, 160×280 |
| `/#/home/asset-overview::tab=治理排行榜` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=352.8, y=287.4, 160×85.6 |
| `/#/home/asset-map` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=814.53, y=287.4, 160×265.6 |
| `/#/home/asset-map::tab=数据检索` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=814.53, y=287.4, 160×265.6 |
| `/#/home/asset-map::tab=采集任务` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×157.6 |
| `/#/home/asset-map::tab=我的数据` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×229.6 |
| `/#/home/asset-catalog` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×193.6 |
| `/#/home/asset-catalog::tab=资产盘点` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×193.6 |
| `/#/home/asset-catalog::tab=目录浏览` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=660.26, y=287.4, 160×280 |
| `/#/home/asset-standard` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×229.6 |
| `/#/home/asset-standard::tab=标准集` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×229.6 |
| `/#/home/asset-standard::tab=命名词典` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×193.6 |
| `/#/home/asset-quality` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×265.6 |
| `/#/home/asset-quality::tab=规则模板库` | div.fixed.z-[100].overflow-hidden.rounded-xl.border.border-[var(--color-border)] | fixed | 100 | x=284.8, y=287.4, 160×265.6 |

## 5. 配色与视觉令牌

### 5.1 高频颜色

| 排名 | 颜色 | 主要来源 | 样本次数 |
| ---: | --- | --- | ---: |
| 1 | `rgb(226, 228, 238)` | backgroundColor、borderTopColor、fill、stroke | 122961 |
| 2 | `rgb(0, 0, 0)` | color、fill | 75686 |
| 3 | `rgb(139, 143, 163)` | color、borderTopColor、fill、stroke | 72985 |
| 4 | `rgb(26, 29, 46)` | color、borderTopColor、fill、stroke | 47664 |
| 5 | `rgb(85, 91, 110)` | color、backgroundColor、borderTopColor、fill、stroke | 32614 |
| 6 | `rgb(91, 108, 240)` | color、backgroundColor、borderTopColor、fill、stroke | 10429 |
| 7 | `rgb(255, 255, 255)` | color、backgroundColor、borderTopColor、fill、stroke | 4461 |
| 8 | `rgb(239, 68, 68)` | color、backgroundColor、borderTopColor、stroke | 3047 |
| 9 | `rgb(16, 185, 129)` | color、backgroundColor、stroke | 1083 |
| 10 | `rgb(155, 139, 236)` | stroke | 1003 |
| 11 | `rgb(240, 242, 248)` | backgroundColor | 975 |
| 12 | `rgb(245, 243, 255)` | backgroundColor | 672 |
| 13 | `rgb(240, 237, 255)` | backgroundColor | 653 |
| 14 | `rgb(255, 107, 157)` | color、backgroundColor、borderTopColor、fill、stroke | 367 |
| 15 | `color(srgb 0.886274 0.894118 0.933333 / 0.82)` | borderTopColor | 358 |
| 16 | `rgba(139, 92, 246, 0.9)` | color、stroke | 353 |
| 17 | `rgb(189, 214, 49)` | color、backgroundColor、borderTopColor、fill、stroke | 325 |
| 18 | `rgba(59, 130, 246, 0.9)` | color、stroke | 259 |
| 19 | `rgb(153, 153, 153)` | color、backgroundColor、fill、stroke | 233 |
| 20 | `rgb(254, 226, 226)` | backgroundColor | 195 |
| 21 | `rgb(245, 158, 11)` | color、backgroundColor、borderTopColor、stroke | 184 |
| 22 | `rgb(34, 197, 94)` | color、stroke | 182 |
| 23 | `rgb(148, 163, 184)` | color、stroke | 168 |
| 24 | `rgb(245, 63, 63)` | color、stroke | 160 |
| 25 | `rgb(22, 163, 74)` | color、backgroundColor、stroke | 147 |
| 26 | `rgb(37, 99, 235)` | color、backgroundColor、borderTopColor、stroke | 145 |
| 27 | `rgb(107, 114, 128)` | color、fill、stroke | 144 |
| 28 | `rgb(250, 250, 254)` | backgroundColor | 142 |
| 29 | `rgba(91, 108, 240, 0.15)` | borderTopColor | 142 |
| 30 | `rgb(232, 235, 245)` | backgroundColor | 105 |
| 31 | `rgba(139, 92, 246, 0.08)` | backgroundColor | 96 |
| 32 | `rgb(255, 157, 77)` | stroke | 85 |
| 33 | `rgba(22, 163, 74, 0.08)` | backgroundColor | 77 |
| 34 | `rgb(139, 92, 246)` | color、stroke | 72 |
| 35 | `rgba(255, 255, 255, 0.2)` | fill | 71 |
| 36 | `rgb(209, 250, 229)` | backgroundColor | 70 |
| 37 | `rgb(99, 102, 241)` | color、backgroundColor、stroke | 69 |
| 38 | `rgb(38, 154, 153)` | color、backgroundColor、borderTopColor、fill、stroke | 67 |
| 39 | `rgb(20, 184, 166)` | color、stroke | 60 |
| 40 | `rgb(0, 168, 112)` | color、stroke | 56 |

### 5.2 CSS 自定义属性

| 变量 | 现场值 | 一致性 |
| --- | --- | --- |
| `--animate-pulse` | `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite` × 142 | 一致 |
| `--animate-spin` | `spin 1s linear infinite` × 142 | 一致 |
| `--blur-3xl` | `64px` × 142 | 一致 |
| `--color-accent` | `#7c3aed` × 142 | 一致 |
| `--color-accent-bg` | `#ddd6fe` × 142 | 一致 |
| `--color-bg` | `#f0f2f8` × 142 | 一致 |
| `--color-bg-hover` | `#e8ebf5` × 142 | 一致 |
| `--color-black` | `#000` × 142 | 一致 |
| `--color-blue-200` | `oklch(88.2% 0.059 254.128)` × 142 | 一致 |
| `--color-blue-300` | `oklch(80.9% 0.105 251.813)` × 142 | 一致 |
| `--color-blue-400` | `oklch(70.7% 0.165 254.624)` × 142 | 一致 |
| `--color-blue-50` | `oklch(97% 0.014 254.604)` × 142 | 一致 |
| `--color-blue-500` | `oklch(62.3% 0.214 259.815)` × 142 | 一致 |
| `--color-blue-600` | `oklch(54.6% 0.245 262.881)` × 142 | 一致 |
| `--color-blue-700` | `oklch(48.8% 0.243 264.376)` × 142 | 一致 |
| `--color-border` | `#e2e4ee` × 142 | 一致 |
| `--color-bubble-user-bg` | `linear-gradient(135deg, #f0edff 0%, #e8e5ff 100%)` × 142 | 一致 |
| `--color-bubble-user-border` | `#d4cff5` × 142 | 一致 |
| `--color-bubble-user-text` | `#2d2a5e` × 142 | 一致 |
| `--color-card` | `#ffffff` × 142 | 一致 |
| `--color-card-border` | `#dfe1ec` × 142 | 一致 |
| `--color-card-elevated` | `#f5f3ff` × 142 | 一致 |
| `--color-chat-assistant` | `#f5f3ff` × 142 | 一致 |
| `--color-chat-system` | `#f0edff` × 142 | 一致 |
| `--color-chat-user` | `#f0edff` × 142 | 一致 |
| `--color-code-bg` | `#f3f4f6` × 142 | 一致 |
| `--color-error` | `#ef4444` × 142 | 一致 |
| `--color-error-bg` | `#fee2e2` × 142 | 一致 |
| `--color-error-light` | `#fee2e2` × 142 | 一致 |
| `--color-gray-100` | `#f3f4f6` × 142 | 一致 |
| `--color-gray-200` | `#e5e7eb` × 142 | 一致 |
| `--color-gray-300` | `#d1d5db` × 142 | 一致 |
| `--color-gray-400` | `#9ca3af` × 142 | 一致 |
| `--color-gray-50` | `#f9fafb` × 142 | 一致 |
| `--color-gray-500` | `#6b7280` × 142 | 一致 |
| `--color-gray-600` | `#4b5563` × 142 | 一致 |
| `--color-gray-700` | `#374151` × 142 | 一致 |
| `--color-gray-800` | `#1f2937` × 142 | 一致 |
| `--color-gray-900` | `#111827` × 142 | 一致 |
| `--color-green-100` | `oklch(96.2% 0.044 156.743)` × 142 | 一致 |
| `--color-green-400` | `oklch(79.2% 0.209 151.711)` × 142 | 一致 |
| `--color-green-700` | `oklch(52.7% 0.154 150.069)` × 142 | 一致 |
| `--color-icon-ai` | `#8b5cf6` × 142 | 一致 |
| `--color-icon-data` | `#059669` × 142 | 一致 |
| `--color-icon-output` | `#6b7280` × 142 | 一致 |
| `--color-icon-route` | `#6366f1` × 142 | 一致 |
| `--color-info` | `#5b6cf0` × 142 | 一致 |
| `--color-info-bg` | `#e8e5ff` × 142 | 一致 |
| `--color-info-light` | `#e8e5ff` × 142 | 一致 |
| `--color-modal-overlay` | `rgba(15, 23, 42, 0.55)` × 142 | 一致 |
| `--color-primary` | `#5b6cf0` × 142 | 一致 |
| `--color-primary-glow` | `rgba(91, 108, 240, 0.3)` × 142 | 一致 |
| `--color-primary-glow-sm` | `rgba(91, 108, 240, 0.15)` × 142 | 一致 |
| `--color-primary-glow-xs` | `rgba(91, 108, 240, 0.08)` × 142 | 一致 |
| `--color-primary-hover` | `#4a5ad4` × 142 | 一致 |
| `--color-primary-light` | `#f0edff` × 142 | 一致 |
| `--color-purple-300` | `oklch(82.7% 0.119 306.383)` × 142 | 一致 |
| `--color-purple-50` | `oklch(97.7% 0.014 308.299)` × 142 | 一致 |
| `--color-purple-500` | `oklch(62.7% 0.265 303.9)` × 142 | 一致 |
| `--color-purple-700` | `oklch(49.6% 0.265 301.924)` × 142 | 一致 |
| `--color-red-50` | `oklch(97.1% 0.013 17.38)` × 142 | 一致 |
| `--color-red-500` | `oklch(63.7% 0.237 25.331)` × 142 | 一致 |
| `--color-red-600` | `oklch(57.7% 0.245 27.325)` × 142 | 一致 |
| `--color-scroll-thumb` | `#c4c0d6` × 142 | 一致 |
| `--color-scroll-thumb-hover` | `#9e99b8` × 142 | 一致 |
| `--color-shadow-effect` | `rgba(91, 108, 240, 0.25)` × 142 | 一致 |
| `--color-shadow-effect-sm` | `rgba(91, 108, 240, 0.14)` × 142 | 一致 |
| `--color-shadow-effect-xs` | `rgba(91, 108, 240, 0.10)` × 142 | 一致 |
| `--color-shadow-fixed` | `rgba(0, 0, 0, 0.08)` × 142 | 一致 |
| `--color-sidebar-active` | `#5b6cf0` × 142 | 一致 |
| `--color-sidebar-bg` | `#fafafe` × 142 | 一致 |
| `--color-sidebar-hover` | `#f0edff` × 142 | 一致 |
| `--color-sidebar-text` | `#555b6e` × 142 | 一致 |
| `--color-sidebar-text-dim` | `#8b8fa3` × 142 | 一致 |
| `--color-state-default` | `#8b8fa3` × 142 | 一致 |
| `--color-state-error` | `#ef4444` × 142 | 一致 |
| `--color-state-info` | `#5b6cf0` × 142 | 一致 |
| `--color-state-success` | `#10b981` × 142 | 一致 |
| `--color-success` | `#10b981` × 142 | 一致 |
| `--color-success-bg` | `#d1fae5` × 142 | 一致 |
| `--color-success-light` | `#d1fae5` × 142 | 一致 |
| `--color-suggestion-btn-border` | `#d0d0e0` × 142 | 一致 |
| `--color-suggestion-text` | `#4a4a6a` × 142 | 一致 |
| `--color-sync` | `#3b82f6` × 142 | 一致 |
| `--color-sync-bg` | `#dbeafe` × 142 | 一致 |
| `--color-table-header-bg` | `#f9fafb` × 142 | 一致 |
| `--color-text` | `#1a1d2e` × 142 | 一致 |
| `--color-text-inverse` | `#ffffff` × 142 | 一致 |
| `--color-text-secondary` | `#555b6e` × 142 | 一致 |
| `--color-text-tertiary` | `#8b8fa3` × 142 | 一致 |
| `--color-warning` | `#f59e0b` × 142 | 一致 |
| `--color-warning-bg` | `#fef3c7` × 142 | 一致 |
| `--color-warning-light` | `#fef3c7` × 142 | 一致 |
| `--color-white` | `#fff` × 142 | 一致 |
| `--container-2xl` | `42rem` × 142 | 一致 |
| `--container-3xl` | `48rem` × 142 | 一致 |
| `--container-4xl` | `56rem` × 142 | 一致 |
| `--container-5xl` | `64rem` × 142 | 一致 |
| `--container-7xl` | `80rem` × 142 | 一致 |
| `--container-lg` | `32rem` × 142 | 一致 |
| `--container-md` | `28rem` × 142 | 一致 |
| `--container-sm` | `24rem` × 142 | 一致 |
| `--container-xl` | `36rem` × 142 | 一致 |
| `--container-xs` | `20rem` × 142 | 一致 |
| `--default-font-family` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` × 142 | 一致 |
| `--default-mono-font-family` | `ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace` × 142 | 一致 |
| `--default-transition-duration` | `150ms` × 142 | 一致 |
| `--default-transition-timing-function` | `cubic-bezier(0.4, 0, 0.2, 1)` × 142 | 一致 |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` × 142 | 一致 |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` × 142 | 一致 |
| `--font-mono` | `ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace` × 142 | 一致 |
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` × 142 | 一致 |
| `--font-weight-bold` | `700` × 142 | 一致 |
| `--font-weight-medium` | `500` × 142 | 一致 |
| `--font-weight-normal` | `400` × 142 | 一致 |
| `--font-weight-semibold` | `600` × 142 | 一致 |
| `--glow-border` | `0 0 0 1px rgba(91, 108, 240, 0.3)` × 142 | 一致 |
| `--glow-primary` | `0 0 20px rgba(91, 108, 240, 0.3), 0 0 40px rgba(139, 92, 246, 0.15)` × 142 | 一致 |
| `--glow-primary-sm` | `0 0 12px rgba(91, 108, 240, 0.25)` × 142 | 一致 |
| `--gradient-header` | `linear-gradient(90deg, #5b6cf0 0%, #7c3aed 50%, #06b6d4 100%)` × 142 | 一致 |
| `--gradient-header-bg` | `linear-gradient(135deg, rgba(91, 108, 240, 0.04) 0%, rgba(139, 92, 246, 0.02) 50%, rgba(6, 182, 212, 0.03) 100%)` × 142 | 一致 |
| `--gradient-primary` | `linear-gradient(135deg, #5b7cfa 0%, #8b5cf6 100%)` × 142 | 一致 |
| `--gradient-primary-subtle` | `linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)` × 142 | 一致 |
| `--gradient-sidebar-active` | `linear-gradient(90deg, rgba(91, 108, 240, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%)` × 142 | 一致 |
| `--leading-relaxed` | `1.625` × 142 | 一致 |
| `--leading-snug` | `1.375` × 142 | 一致 |
| `--leading-tight` | `1.25` × 142 | 一致 |
| `--radius-2xl` | `1rem` × 142 | 一致 |
| `--radius-3xl` | `1.5rem` × 142 | 一致 |
| `--radius-lg` | `14px` × 142 | 一致 |
| `--radius-md` | `10px` × 142 | 一致 |
| `--radius-sm` | `4px` × 142 | 一致 |
| `--radius-xl` | `22px` × 142 | 一致 |
| `--shadow-card` | `0 8px 24px rgba(91, 108, 240, 0.055)` × 142 | 一致 |
| `--shadow-card-lg` | `0 14px 36px rgba(91, 108, 240, 0.09)` × 142 | 一致 |
| `--shadow-card-xl` | `0 24px 60px rgba(91, 108, 240, 0.12)` × 142 | 一致 |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` × 142 | 一致 |
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.04)` × 142 | 一致 |
| `--shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.04)` × 142 | 一致 |
| `--space-1` | `4px` × 142 | 一致 |
| `--space-10` | `40px` × 142 | 一致 |
| `--space-12` | `48px` × 142 | 一致 |
| `--space-16` | `64px` × 142 | 一致 |
| `--space-2` | `8px` × 142 | 一致 |
| `--space-3` | `12px` × 142 | 一致 |
| `--space-4` | `16px` × 142 | 一致 |
| `--space-5` | `20px` × 142 | 一致 |
| `--space-6` | `24px` × 142 | 一致 |
| `--space-8` | `32px` × 142 | 一致 |
| `--spacing` | `0.25rem` × 142 | 一致 |
| `--text-2xl` | `1.5rem` × 142 | 一致 |
| `--text-2xl--line-height` | `calc(2 / 1.5)` × 142 | 一致 |
| `--text-6xl` | `3.75rem` × 142 | 一致 |
| `--text-6xl--line-height` | `1` × 142 | 一致 |
| `--text-base` | `1rem` × 142 | 一致 |
| `--text-base--line-height` | `calc(1.5 / 1)` × 142 | 一致 |
| `--text-lg` | `1.125rem` × 142 | 一致 |
| `--text-lg--line-height` | `calc(1.75 / 1.125)` × 142 | 一致 |
| `--text-sm` | `0.875rem` × 142 | 一致 |
| `--text-sm--line-height` | `calc(1.25 / 0.875)` × 142 | 一致 |
| `--text-xl` | `1.25rem` × 142 | 一致 |
| `--text-xl--line-height` | `calc(1.75 / 1.25)` × 142 | 一致 |
| `--text-xs` | `0.75rem` × 142 | 一致 |
| `--text-xs--line-height` | `calc(1 / 0.75)` × 142 | 一致 |
| `--tracking-tight` | `-0.025em` × 142 | 一致 |
| `--tracking-wider` | `0.05em` × 142 | 一致 |
| `--tw-border-spacing-x` | `0px` × 142 | 一致 |
| `--tw-border-spacing-y` | `0px` × 142 | 一致 |
| `--tw-border-style` | `solid` × 142 | 一致 |
| `--tw-divide-x-reverse` | `0` × 142 | 一致 |
| `--tw-divide-y-reverse` | `0` × 142 | 一致 |
| `--tw-drop-shadow-alpha` | `100%` × 142 | 一致 |
| `--tw-inset-ring-shadow` | `0 0 #0000` × 142 | 一致 |
| `--tw-inset-shadow` | `0 0 #0000` × 142 | 一致 |
| `--tw-inset-shadow-alpha` | `100%` × 142 | 一致 |
| `--tw-outline-style` | `solid` × 142 | 一致 |
| `--tw-ring-offset-color` | `#fff` × 142 | 一致 |
| `--tw-ring-offset-shadow` | `0 0 #0000` × 142 | 一致 |
| `--tw-ring-offset-width` | `0px` × 142 | 一致 |
| `--tw-ring-shadow` | `0 0 #0000` × 142 | 一致 |
| `--tw-scale-x` | `1` × 142 | 一致 |
| `--tw-scale-y` | `1` × 142 | 一致 |
| `--tw-scale-z` | `1` × 142 | 一致 |
| `--tw-shadow` | `0 0 #0000` × 142 | 一致 |
| `--tw-shadow-alpha` | `100%` × 142 | 一致 |
| `--tw-space-y-reverse` | `0` × 142 | 一致 |
| `--tw-translate-x` | `0` × 142 | 一致 |
| `--tw-translate-y` | `0` × 142 | 一致 |
| `--tw-translate-z` | `0` × 142 | 一致 |

### 5.3 边框、圆角与阴影

| 属性 | 现场值 | 样本次数 |
| --- | --- | ---: |
| `borderTopWidth` | `0px` | 121764 |
| `borderTopWidth` | `0.8px` | 2517 |
| `borderTopWidth` | `1.6px` | 27 |
| `borderTopWidth` | `2.4px` | 4 |
| `borderRadius` | `0px` | 104441 |
| `borderRadius` | `6px` | 6450 |
| `borderRadius` | `2px` | 4234 |
| `borderRadius` | `14px` | 2724 |
| `borderRadius` | `4px` | 1558 |
| `borderRadius` | `8px` | 1293 |
| `borderRadius` | `2.68435e+07px` | 968 |
| `borderRadius` | `22px` | 820 |
| `borderRadius` | `10px` | 735 |
| `borderRadius` | `16px` | 546 |
| `borderRadius` | `50%` | 368 |
| `borderRadius` | `999px` | 82 |
| `borderRadius` | `24px` | 45 |
| `borderRadius` | `5px` | 33 |
| `borderRadius` | `20px` | 6 |
| `borderRadius` | `18px` | 5 |
| `borderRadius` | `12px` | 4 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px` | 1496 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(91, 108, 240, 0.055) 0px 8px 24px 0px` | 538 |
| `boxShadow` | `rgba(91, 108, 240, 0.15) 0px 0px 12px 0px` | 142 |
| `boxShadow` | `rgba(91, 108, 240, 0.08) 0px 0px 8px 0px` | 142 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(240, 237, 255) 0px 0px 0px 4px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px` | 65 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(91, 108, 240, 0.12) 0px 24px 60px 0px` | 64 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px` | 58 |
| `boxShadow` | `rgba(139, 92, 246, 0.15) 0px 0px 0px 1px` | 47 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | 26 |
| `boxShadow` | `rgba(0, 0, 0, 0.08) -8px 0px 12px -12px` | 19 |
| `boxShadow` | `rgba(91, 108, 240, 0.055) 0px 8px 24px 0px` | 11 |
| `boxShadow` | `rgba(33, 73, 117, 0.067) 0px 12px 34px 0px` | 2 |
| `boxShadow` | `rgba(63, 115, 232, 0.22) 0px 8px 18px 0px` | 2 |
| `boxShadow` | `color(srgb 0.101961 0.113725 0.180392 / 0.06) 0px 1px 2px 0px` | 1 |
| `boxShadow` | `color(srgb 0.886275 0.894118 0.933333 / 0.72) 0px 0px 0px 1px inset` | 1 |
| `boxShadow` | `color(srgb 0.780392 0.8 0.934902) 0px 0px 0px 1px inset` | 1 |
| `boxShadow` | `color(srgb 0.356863 0.423529 0.941176 / 0.1) 0px 0px 0px 2px` | 1 |
| `boxShadow` | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(226, 228, 238) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 0px 0px 0px` | 1 |
| `boxShadow` | `color(srgb 0.101961 0.113725 0.180392 / 0.05) 0px 1px 3px 0px` | 1 |
| `opacity` | `1` | 121403 |
| `opacity` | `0.45` | 1963 |
| `opacity` | `0.85` | 370 |
| `opacity` | `0.7` | 247 |
| `opacity` | `0.5` | 147 |
| `opacity` | `0.6` | 77 |
| `opacity` | `0.95` | 31 |
| `opacity` | `0.3` | 23 |
| `opacity` | `0.72` | 23 |
| `opacity` | `0.88` | 19 |
| `opacity` | `0.4` | 5 |
| `opacity` | `0.2` | 2 |
| `opacity` | `0.55` | 1 |
| `opacity` | `0.8` | 1 |

## 6. 字体与标题层级

### 6.1 已加载字体

| 字体族 | 字形 | 字重 | 拉伸 | 加载状态 | 页面出现次数 |
| --- | --- | ---: | --- | --- | ---: |
| 浏览器未暴露 FontFaceSet 明细 | — | — | — | — | — |

### 6.2 排版频率

| 属性 | 现场值 | 样本次数 |
| --- | --- | ---: |
| `fontFamily` | `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | 117475 |
| `fontFamily` | `ui-monospace, "SF Mono", "Cascadia Code", "JetBrains Mono", "Fira Code", Menlo, Monaco, "Courier New", monospace` | 4419 |
| `fontFamily` | `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | 1093 |
| `fontFamily` | `ui-monospace, SFMono-Regular, monospace` | 883 |
| `fontFamily` | `monospace` | 400 |
| `fontFamily` | `Inter, -apple-system, BlinkMacSystemFont, sans-serif` | 42 |
| `fontSize` | `14px` | 69898 |
| `fontSize` | `16px` | 26293 |
| `fontSize` | `12px` | 19582 |
| `fontSize` | `13px` | 2057 |
| `fontSize` | `9px` | 1840 |
| `fontSize` | `10px` | 1679 |
| `fontSize` | `11px` | 1550 |
| `fontSize` | `8px` | 1137 |
| `fontSize` | `20px` | 134 |
| `fontSize` | `18px` | 82 |
| `fontSize` | `24px` | 57 |
| `fontSize` | `34px` | 2 |
| `fontSize` | `15px` | 1 |
| `fontWeight` | `400` | 104959 |
| `fontWeight` | `500` | 13121 |
| `fontWeight` | `600` | 4556 |
| `fontWeight` | `450` | 1440 |
| `fontWeight` | `550` | 192 |
| `fontWeight` | `700` | 34 |
| `fontWeight` | `650` | 10 |
| `lineHeight` | `21px` | 51357 |
| `lineHeight` | `24px` | 26291 |
| `lineHeight` | `20px` | 18524 |
| `lineHeight` | `16px` | 15098 |
| `lineHeight` | `19.5px` | 6115 |
| `lineHeight` | `13.5px` | 1840 |
| `lineHeight` | `15px` | 1471 |
| `lineHeight` | `16.5px` | 1326 |
| `lineHeight` | `12px` | 1137 |
| `lineHeight` | `28px` | 223 |
| `lineHeight` | `17.1429px` | 175 |
| `lineHeight` | `16.25px` | 142 |
| `lineHeight` | `15.7143px` | 133 |
| `lineHeight` | `13.75px` | 84 |
| `lineHeight` | `18.5714px` | 82 |
| `lineHeight` | `13.3333px` | 75 |
| `lineHeight` | `18px` | 63 |
| `lineHeight` | `32px` | 59 |
| `lineHeight` | `14.2857px` | 53 |
| `lineHeight` | `10px` | 33 |
| `lineHeight` | `22.4px` | 7 |
| `lineHeight` | `14.6667px` | 7 |
| `lineHeight` | `22px` | 6 |
| `lineHeight` | `42.5px` | 2 |
| `lineHeight` | `22.5px` | 1 |
| `letterSpacing` | `-0.14px` | 220 |
| `letterSpacing` | `-0.16px` | 151 |
| `letterSpacing` | `0.5px` | 143 |
| `letterSpacing` | `-0.5px` | 115 |
| `letterSpacing` | `-0.18px` | 48 |
| `letterSpacing` | `-0.12px` | 10 |
| `letterSpacing` | `-0.2px` | 8 |
| `letterSpacing` | `-0.13px` | 6 |
| `letterSpacing` | `-0.34px` | 2 |
| `letterSpacing` | `-0.15px` | 1 |

### 6.3 标题证据

| 页面 | 层级 | 标题 | 字体 | 字号/字重/行高 | 颜色 |
| --- | ---: | --- | --- | --- | --- |
| `/#/home/index-qa/agent/:uuid/task/:uuid` | H2 | Data Agentic OS | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 34px / 600 / 42.5px | `rgb(26, 29, 46)` |
| `/#/home/index-qa/task/:uuid` | H2 | Data Agentic OS | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 34px / 600 / 42.5px | `rgb(26, 29, 46)` |
| `/#/home/agent-list` | H2 | 智能体管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H2 | 技能管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | segment-anything-model | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | huggingface-hub | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | llama-cpp | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | obliteratus | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | serving-llms-vllm | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | weights-and-biases | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | audiocraft-audio-generation | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | evaluating-llms-harness | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | pytorch-fsdp | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | clip | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | gguf-quantization | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | vector-db-mcp | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | grpo-rl-training | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | whisper | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | guidance | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | modal-serverless-gpu | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | peft-fine-tuning | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | stable-diffusion-image-generation | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | sparse-autoencoder-training | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | pytorch-lightning | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | pinecone | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | huggingface-accelerate | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | peft-fine-tuning | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | lambda-labs-gpu-cloud | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | fine-tuning-with-trl | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | qdrant-vector-search | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | chroma | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | tensorrt-llm | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | pytorch-fsdp | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | dspy | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | faiss | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | huggingface-tokenizers | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | guidance | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | llava | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | axolotl | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | optimizing-attention-flash | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | nemo-curator | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | simpo-training | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | clip | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | instructor | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | slime-rl-training | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | unsloth | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | distributed-llm-pretraining-torchtitan | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | whisper | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | outlines | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | stable-diffusion-image-generation | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/skills-list` | H4 | modal-serverless-gpu | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/system-memory` | H2 | 记忆管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/system-memory` | H3 | 存储统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 16px / 500 / 24px | `rgb(26, 29, 46)` |
| `/#/home/system-memory` | H3 | Provider 状态 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 16px / 500 / 24px | `rgb(26, 29, 46)` |
| `/#/home/system-memory` | H3 | Holographic 全息记忆统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 16px / 500 / 24px | `rgb(26, 29, 46)` |
| `/#/home/system-memory` | H3 | 系统路径 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 16px / 500 / 24px | `rgb(26, 29, 46)` |
| `/#/home/mcp-list` | H2 | MCP 服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-products` | H1 | 产品目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management` | H3 | 审批类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=待审批-0` | H3 | 审批类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=待审批-0` | H3 | 暂无审批数据 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=已通过` | H3 | 审批类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=已通过` | H3 | 暂无审批数据 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=已驳回` | H3 | 审批类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=已驳回` | H3 | 暂无审批数据 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=已作废` | H3 | 审批类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/oa-approval-management::tab=已作废` | H3 | 暂无审批数据 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-okr` | H2 | [当前用户] | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 16px / 600 / 24px | `rgb(26, 29, 46)` |
| `/#/home/oa-weekly-report` | H1 | 我的周报 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-weekly-report` | H4 | 本周总结 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 13px / 600 / 22px | `rgb(85, 91, 110)` |
| `/#/home/oa-weekly-report` | H4 | 下周计划 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 13px / 600 / 22px | `rgb(85, 91, 110)` |
| `/#/home/oa-weekly-report` | H4 | 需要协调和帮助 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 13px / 600 / 22px | `rgb(85, 91, 110)` |
| `/#/home/oa-token-management` | H2 | Token服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-token-management::tab=Token服务` | H2 | Token服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-token-management::tab=API调用` | H2 | Token服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/oa-token-management::tab=用量分析` | H2 | Token服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/knowledge-datasource` | H2 | 数据源管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/knowledge-dataset` | H2 | 数据集 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-semantic` | H2 | 语义模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-semantic::tab=语义图谱` | H2 | 语义模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-semantic::tab=校验中心` | H2 | 语义模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=领域管理` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=Schema-管理` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=Schema-管理` | H3 | Schema 管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 15px / 600 / 22.5px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=实体管理` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=关系管理` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=指标管理` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=可视化` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-ontology::tab=完整性诊断` | H2 | 本体模型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext` | H2 | 上下文图谱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext` | H3 | 数据集&语义模型同步状态 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext` | H3 | 本体模型同步状态 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext` | H3 | 定时增量同步（CRON） | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=图谱同步` | H2 | 上下文图谱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=图谱同步` | H3 | 数据集&语义模型同步状态 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=图谱同步` | H3 | 本体模型同步状态 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=图谱同步` | H3 | 定时增量同步（CRON） | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=图谱浏览` | H2 | 上下文图谱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=血缘影响` | H2 | 上下文图谱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=血缘影响` | H3 | 数据血缘追踪 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=指标概览` | H2 | 上下文图谱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-datacontext::tab=Schema-目录` | H2 | 上下文图谱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/data-center-sync` | H2 | 数据同步 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview` | H2 | 资产总览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview` | H3 | 三视图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=全景大屏` | H2 | 资产总览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=全景大屏` | H3 | 三视图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=治理驾驶舱` | H2 | 资产总览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=治理驾驶舱` | H3 | 健康分体系 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=治理驾驶舱` | H3 | 五健康度明细 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=治理排行榜` | H2 | 资产总览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-overview::tab=问题大盘` | H2 | 资产总览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map` | H2 | 数据地图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=数据检索` | H2 | 数据地图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=采集任务` | H2 | 数据地图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=采集任务` | H3 | 暂无采集任务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=血缘分析` | H2 | 数据地图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=类目管理` | H2 | 数据地图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=类目管理` | H4 | 类目树 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=我的数据` | H2 | 数据地图 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-map::tab=我的数据` | H3 | 暂无热门数据 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog` | H3 | 暂无盘点资产 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=资产盘点` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=资产盘点` | H3 | 暂无盘点资产 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=目录浏览` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=目录浏览` | H4 | 资产目录树 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=权属管理` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=权属管理` | H3 | 暂无权属登记 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=价值评估` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=价值评估` | H3 | 暂无估值记录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=资产运营` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=资产运营` | H3 | 暂无已上架资产 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=资产运营` | H4 | 交易订单（交付/结算记录） | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=使用统计` | H2 | 资产目录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-catalog::tab=使用统计` | H3 | 暂无使用统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard` | H2 | 数据标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard` | H3 | 暂无标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=标准集` | H2 | 数据标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=标准集` | H3 | 暂无标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=标准代码` | H2 | 数据标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=标准代码` | H3 | 暂无标准代码 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=命名词典` | H2 | 数据标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=命名词典` | H3 | 命名词典为空 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=落标映射` | H2 | 数据标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=落标映射` | H3 | 暂无落标映射 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=贯标统计` | H2 | 数据标准 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-standard::tab=贯标统计` | H4 | 未落标清单（0） | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality` | H4 | 自定义规则（SQL 规则 + AI 推荐） | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality` | H3 | 暂无自定义规则 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=规则模板库` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=规则模板库` | H4 | 自定义规则（SQL 规则 + AI 推荐） | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=规则模板库` | H3 | 暂无自定义规则 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=监控任务` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=监控任务` | H3 | 暂无监控任务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=校验记录` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=校验记录` | H3 | 暂无校验记录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=质量评分` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=质量评分` | H3 | 暂无质量评分 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=问题工单` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=问题工单` | H3 | 暂无问题工单 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=质量报告` | H2 | 数据质量 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-quality::tab=质量报告` | H3 | 点击「生成报告」输出质量报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security` | H2 | 数据安全 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security` | H3 | 暂无分类分级记录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=分类分级` | H2 | 数据安全 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=分类分级` | H3 | 暂无分类分级记录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=脱敏策略` | H2 | 数据安全 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=脱敏策略` | H3 | 暂无脱敏策略 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=行列权限` | H2 | 数据安全 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=行列权限` | H3 | 暂无行列权限规则 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=审计日志` | H2 | 数据安全 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=审计日志` | H3 | 暂无审计日志 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=风险识别` | H2 | 数据安全 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-security::tab=风险识别` | H3 | 暂无风险预警规则 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle` | H2 | 数据生命周期 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle` | H3 | 暂无分层策略 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle::tab=分层策略` | H2 | 数据生命周期 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle::tab=分层策略` | H3 | 暂无分层策略 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle::tab=归档管理` | H2 | 数据生命周期 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle::tab=归档管理` | H3 | 暂无归档任务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle::tab=退役管理` | H2 | 数据生命周期 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-lifecycle::tab=退役管理` | H3 | 暂无退役任务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service` | H2 | 数据服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service` | H3 | 暂无注册服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=服务注册` | H2 | 数据服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=服务注册` | H3 | 暂无注册服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=API-商城` | H2 | 数据服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=API-商城` | H3 | 商城暂无上架服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=授权管理` | H2 | 数据服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=授权管理` | H3 | 暂无服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=调用统计` | H2 | 数据服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=调用统计` | H3 | 暂无调用统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=外部数据台账` | H2 | 数据服务 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-service::tab=外部数据台账` | H3 | 暂无外部数据登记 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm` | H2 | 治理评估 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm` | H3 | 指标台账为空 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=指标台账` | H2 | 治理评估 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=指标台账` | H3 | 指标台账为空 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=自评估` | H2 | 治理评估 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=自评估` | H3 | 暂无评估指标 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=证据库` | H2 | 治理评估 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=证据库` | H3 | 证据库为空 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=制度库` | H2 | 治理评估 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/asset-dcmm::tab=九域看板` | H2 | 治理评估 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=Dashboard` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=定时任务` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=日志监控` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=应用缓存` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=应用缓存` | H3 | LLM 缓存表 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=LLM缓存` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=LLM缓存` | H3 | LLM 缓存表 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=LLM缓存` | H4 | Embedding 缓存 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=LLM缓存` | H4 | 双语 Schema 缓存 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=LLM缓存` | H4 | 精确匹配缓存 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=LLM缓存` | H4 | 语义相似缓存 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=向量表` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-monitor::tab=SQLite-数据库` | H2 | 系统监控 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H2 | 系统配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H3 | 配置分类 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 模型配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | fast_model | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 嵌入配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | rerank | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 审批策略 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | terminal | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 代码执行 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 日志配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | Agent 配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 检查点配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 显示配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | compression | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | context | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 记忆配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 技能配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 会话重置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 流式输出 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | Hermes 引擎 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | 工具配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | security | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | tool_output | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | tool_loop_guardrails | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | prompt_caching | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config` | H4 | network | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H2 | 系统配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H3 | 配置分类 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 模型配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | fast_model | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 嵌入配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | rerank | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 审批策略 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | terminal | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 代码执行 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 日志配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | Agent 配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 检查点配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 显示配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | compression | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | context | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 记忆配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 技能配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 会话重置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 流式输出 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | Hermes 引擎 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | 工具配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | security | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | tool_output | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | tool_loop_guardrails | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | prompt_caching | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=环境配置` | H4 | network | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H2 | 系统配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H3 | 应用配置分类 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | 系统信息 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | encryption | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | api | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | litellm | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | 数据库 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | 数据库连接池 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | DocQA 存储 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | DocQA RAGFlow | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | DocQA LightRAG | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | DocQA 运行时 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | 本地登录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | OAuth 登录 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | login/wecom | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | login/demo | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | CRM 接口 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | CRM 端点 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | sys_log | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | file | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | file/key | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | file/upload | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | file/delete | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | file/minio | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | datacontext/storage | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | datacontext/data_sync | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | datacontext/bilingual | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | semantic_model | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | llm_cache/cache_exact | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | llm_cache/cache_semantic | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | analysis_loop | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | smtp | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | risk_monitor | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=应用配置` | H4 | external_api | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H2 | 系统配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H3 | 报告模板 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 异常诊断分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 预算执行与差异分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 业务预测分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 业务洞察分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | Cohort留存分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 竞品与市场竞争分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 商机分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 线索分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 客户全生命周期分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 客户服务分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 数据分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 电商/零售运营分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 财务分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 人力资源分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 库存分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 营销效果分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | NPS客户满意度分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 经营分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 采购与供应商合规报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 产品运营分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 项目月度汇报报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 项目周报 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 质量保障分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | RFM客户价值分层报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | SaaS经营分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 销售业绩分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 供应链分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 用户行为分析报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=分析报告模板` | H4 | 工作总结报告 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H2 | 系统配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H3 | 字典类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 产品版本类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 合同类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 审批类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 产品规模 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 产品收费单位 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 转售后依据 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 普通项目工时类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-config::tab=字典配置` | H4 | 综合类项目工时类型 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 500 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-permission` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=用户管理` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=组织管理` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=角色管理` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=功能菜单` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=功能菜单` | H2 | 功能菜单 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=功能权限` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=功能权限` | H2 | 功能权限 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 18px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=功能权限` | H3 | 系统管理员 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 16px / 600 / 24px | `rgb(26, 29, 46)` |
| `/#/home/config-permission::tab=IM用户映射` | H2 | 权限管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-messages` | H1 | 消息管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-messages::tab=消息列表` | H1 | 消息管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-messages::tab=消息模板` | H1 | 消息管理 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance` | H2 | 安全合规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance` | H4 | 合规运营指标 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance` | H4 | LLM 安全统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance` | H4 | 各方向拦截统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance` | H4 | 风险等级分布 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance` | H4 | 每日事件趋势 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance::tab=概览` | H2 | 安全合规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=概览` | H4 | 合规运营指标 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance::tab=概览` | H4 | LLM 安全统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance::tab=概览` | H4 | 各方向拦截统计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance::tab=概览` | H4 | 风险等级分布 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance::tab=概览` | H4 | 每日事件趋势 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 12px / 600 / 16px | `rgb(85, 91, 110)` |
| `/#/home/config-content-compliance::tab=合规事件` | H2 | 安全合规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=策略配置` | H2 | 安全合规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=策略配置` | H3 | 策略规则 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H2 | 安全合规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H3 | 攻击与越狱 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H3 | 数据导出 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H3 | 通用违规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H3 | 隐私脱敏 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H3 | 隐私查询拦截 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=安全回答` | H3 | 专业提示 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=LLM安全` | H2 | 安全合规 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=LLM安全` | H3 | LLM 安全保障概览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=LLM安全` | H3 | 注入防护配置 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-content-compliance::tab=LLM安全` | H3 | 安全架构 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-risk-governance` | H2 | 风险监管 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-risk-governance::tab=风险模型构建` | H2 | 风险监管 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-risk-governance::tab=风险预警` | H2 | 风险监管 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-risk-governance::tab=风险闭环处置` | H2 | 风险监管 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit` | H2 | 系统审计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=审计日志` | H2 | 系统审计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=用量统计` | H2 | 系统审计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=用量统计` | H4 | 会话明细 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=日志管理` | H2 | 系统审计 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=日志管理` | H3 | 存储概览 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=日志管理` | H3 | 保留策略 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-system-audit::tab=日志管理` | H3 | 清理操作 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 14px / 600 / 20px | `rgb(26, 29, 46)` |
| `/#/home/config-feedback-backtest` | H2 | 反馈回测 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-feedback-backtest::tab=反馈中心` | H2 | 反馈回测 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-feedback-backtest::tab=评测集管理` | H2 | 反馈回测 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |
| `/#/home/config-feedback-backtest::tab=回归测试` | H2 | 反馈回测 | Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 20px / 600 / 28px | `rgb(26, 29, 46)` |

## 7. 间距与尺寸尺度

| 属性 | 现场值 | 样本次数 |
| --- | --- | ---: |
| `paddingTop` | `6px` | 6417 |
| `paddingTop` | `12px` | 4364 |
| `paddingTop` | `8px` | 2658 |
| `paddingTop` | `2px` | 1550 |
| `paddingTop` | `10px` | 659 |
| `paddingTop` | `20px` | 646 |
| `paddingTop` | `16px` | 624 |
| `paddingTop` | `4px` | 276 |
| `paddingTop` | `1px` | 254 |
| `paddingTop` | `3px` | 179 |
| `paddingTop` | `7px` | 142 |
| `paddingTop` | `24px` | 141 |
| `paddingTop` | `64px` | 47 |
| `paddingTop` | `14px` | 17 |
| `paddingTop` | `32px` | 5 |
| `paddingTop` | `5px` | 5 |
| `paddingTop` | `40px` | 5 |
| `paddingTop` | `48px` | 3 |
| `paddingTop` | `18px` | 3 |
| `paddingTop` | `11px` | 3 |
| `paddingTop` | `22px` | 1 |
| `paddingTop` | `80px` | 1 |
| `paddingRight` | `8px` | 8155 |
| `paddingRight` | `16px` | 5350 |
| `paddingRight` | `4px` | 4444 |
| `paddingRight` | `12px` | 2239 |
| `paddingRight` | `10px` | 2013 |
| `paddingRight` | `6px` | 1990 |
| `paddingRight` | `20px` | 545 |
| `paddingRight` | `24px` | 529 |
| `paddingRight` | `2px` | 148 |
| `paddingRight` | `3px` | 84 |
| `paddingRight` | `36px` | 81 |
| `paddingRight` | `32px` | 50 |
| `paddingRight` | `44px` | 46 |
| `paddingRight` | `14px` | 21 |
| `paddingRight` | `112px` | 3 |
| `paddingRight` | `9px` | 3 |
| `paddingRight` | `28px` | 2 |
| `paddingRight` | `40px` | 2 |
| `paddingRight` | `56px` | 2 |
| `paddingRight` | `43.2px` | 1 |
| `paddingRight` | `26px` | 1 |
| `paddingRight` | `48px` | 1 |
| `paddingBottom` | `6px` | 6417 |
| `paddingBottom` | `12px` | 4369 |
| `paddingBottom` | `8px` | 2666 |
| `paddingBottom` | `2px` | 1548 |
| `paddingBottom` | `10px` | 660 |
| `paddingBottom` | `20px` | 642 |
| `paddingBottom` | `16px` | 612 |
| `paddingBottom` | `4px` | 273 |
| `paddingBottom` | `1px` | 254 |
| `paddingBottom` | `3px` | 178 |
| `paddingBottom` | `7px` | 142 |
| `paddingBottom` | `24px` | 141 |
| `paddingBottom` | `64px` | 47 |
| `paddingBottom` | `14px` | 16 |
| `paddingBottom` | `5px` | 6 |
| `paddingBottom` | `32px` | 5 |
| `paddingBottom` | `40px` | 5 |
| `paddingBottom` | `48px` | 3 |
| `paddingBottom` | `11px` | 3 |
| `paddingBottom` | `18px` | 2 |
| `paddingBottom` | `80px` | 2 |
| `paddingBottom` | `36px` | 1 |
| `paddingLeft` | `8px` | 7680 |
| `paddingLeft` | `16px` | 5394 |
| `paddingLeft` | `4px` | 4437 |
| `paddingLeft` | `12px` | 2149 |
| `paddingLeft` | `10px` | 2013 |
| `paddingLeft` | `6px` | 1990 |
| `paddingLeft` | `28px` | 1001 |
| `paddingLeft` | `24px` | 634 |
| `paddingLeft` | `20px` | 590 |
| `paddingLeft` | `44px` | 279 |
| `paddingLeft` | `32px` | 220 |
| `paddingLeft` | `2px` | 147 |
| `paddingLeft` | `3px` | 84 |
| `paddingLeft` | `59px` | 79 |
| `paddingLeft` | `36px` | 42 |
| `paddingLeft` | `14px` | 21 |
| `paddingLeft` | `21px` | 14 |
| `paddingLeft` | `40px` | 14 |
| `paddingLeft` | `22px` | 13 |
| `paddingLeft` | `56px` | 11 |
| `paddingLeft` | `42px` | 8 |
| `paddingLeft` | `51px` | 5 |
| `paddingLeft` | `9px` | 3 |
| `paddingLeft` | `29px` | 1 |
| `paddingLeft` | `30px` | 1 |
| `paddingLeft` | `43.2px` | 1 |
| `paddingLeft` | `26px` | 1 |
| `paddingLeft` | `48px` | 1 |
| `marginTop` | `4px` | 1370 |
| `marginTop` | `6px` | 856 |
| `marginTop` | `8px` | 477 |
| `marginTop` | `1px` | 392 |
| `marginTop` | `2px` | 331 |
| `marginTop` | `12px` | 20 |
| `marginTop` | `16px` | 17 |
| `marginTop` | `63px` | 2 |
| `marginTop` | `14px` | 1 |
| `marginTop` | `20px` | 1 |
| `marginRight` | `-4px` | 4229 |
| `marginRight` | `8px` | 857 |
| `marginRight` | `4px` | 755 |
| `marginRight` | `12px` | 143 |
| `marginRight` | `20px` | 4 |
| `marginRight` | `9.6px` | 2 |
| `marginBottom` | `2px` | 5058 |
| `marginBottom` | `4px` | 1293 |
| `marginBottom` | `6px` | 861 |
| `marginBottom` | `-1px` | 612 |
| `marginBottom` | `8px` | 596 |
| `marginBottom` | `1px` | 391 |
| `marginBottom` | `12px` | 194 |
| `marginBottom` | `16px` | 82 |
| `marginBottom` | `20px` | 69 |
| `marginBottom` | `24px` | 56 |
| `marginBottom` | `3px` | 1 |
| `marginBottom` | `2.8px` | 1 |
| `marginLeft` | `-4px` | 4229 |
| `marginLeft` | `8px` | 861 |
| `marginLeft` | `4px` | 427 |
| `marginLeft` | `1.175px` | 6 |
| `marginLeft` | `20px` | 4 |
| `marginLeft` | `12px` | 3 |
| `marginLeft` | `9.6px` | 2 |
| `marginLeft` | `928px` | 2 |
| `marginLeft` | `235.2px` | 1 |
| `marginLeft` | `204.938px` | 1 |
| `gap` | `8px` | 9449 |
| `gap` | `4px` | 1334 |
| `gap` | `6px` | 1136 |
| `gap` | `12px` | 593 |
| `gap` | `10px` | 434 |
| `gap` | `7px` | 392 |
| `gap` | `14px` | 257 |
| `gap` | `32px` | 129 |
| `gap` | `16px` | 70 |
| `gap` | `2px` | 28 |
| `gap` | `6px 12px` | 3 |
| `gap` | `3px` | 2 |
| `gap` | `9px` | 1 |
| `gap` | `20px` | 1 |
| `gap` | `24px` | 1 |
| `rowGap` | `8px` | 9449 |
| `rowGap` | `4px` | 1334 |
| `rowGap` | `6px` | 1139 |
| `rowGap` | `12px` | 593 |
| `rowGap` | `10px` | 434 |
| `rowGap` | `7px` | 392 |
| `rowGap` | `14px` | 257 |
| `rowGap` | `32px` | 129 |
| `rowGap` | `16px` | 70 |
| `rowGap` | `2px` | 28 |
| `rowGap` | `3px` | 2 |
| `rowGap` | `9px` | 1 |
| `rowGap` | `20px` | 1 |
| `rowGap` | `24px` | 1 |
| `columnGap` | `8px` | 9449 |
| `columnGap` | `4px` | 1334 |
| `columnGap` | `6px` | 1136 |
| `columnGap` | `12px` | 596 |
| `columnGap` | `10px` | 434 |
| `columnGap` | `7px` | 392 |
| `columnGap` | `14px` | 257 |
| `columnGap` | `32px` | 129 |
| `columnGap` | `16px` | 70 |
| `columnGap` | `2px` | 28 |
| `columnGap` | `3px` | 2 |
| `columnGap` | `9px` | 1 |
| `columnGap` | `20px` | 1 |
| `columnGap` | `24px` | 1 |

## 8. 组件目录

| 组件模式 | 样本数 | 页面数 | 代表类名/标签 | 代表文本 |
| --- | ---: | ---: | --- | --- |
| Button | 11261 | 142 | button.flex.items-center.gap-2.5.cursor-pointer.bg-transparent.border-none；button.relative.hidden.md:flex.items-center.border.text-left；button.relative.p-2.transition-colors；button.p-2.transition-colors；button.flex.items-center.gap-2.5.px-2.py-1.5.transition-all | 东方金信；搜索菜单...⌘K；1；[当前用户] |
| Form | 1041 | 142 | span.flex-shrink-0.transition-transform.duration-200；span.inline-block.h-3.5.w-3.5.transform.rounded-full.bg-white | — |
| Card | 773 | 134 | button.inline-flex.items-center.justify-center.border.border-[var(--color-border)].bg-[var(--color-card)]；button.inline-flex.items-center.justify-center.border.bg-[var(--color-card)].transition-colors；input.w-full.rounded-xl.border.border-[var(--color-border)].bg-[var(--color-card)].text-[var(--color-text)]；div.rounded-2xl.border.bg-[var(--color-card)].shadow-[var(--shadow-card)].p-0.shrink-0；div.rounded-2xl.border.bg-[var(--color-card)].shadow-[var(--shadow-card)].p-0.h-full | 上一页；1；2；下一页 |
| Tabs / Tab | 613 | 129 | button[role=tab].inline-flex.shrink-0.items-center.justify-center.gap-2.whitespace-nowrap；div.weekly-report-tabs.flex.h-12.shrink-0.items-center.gap-1 | 工时填报；待审批 0；已通过；已驳回 |
| Sidebar | 362 | 1 | div.okr-context-sidebar.flex.shrink-0.flex-col.overflow-hidden；button.okr-sidebar-item.mx-2.flex.h-9.w-[calc(100%-1rem)].items-center；button.okr-org-row.okr-sidebar-item | 我的 OKR；@我的；冯晋艳；姚伟 |
| Avatar | 359 | 1 | span.okr-org-avatar | — |
| Input (checkbox) | 210 | 3 | input.cursor-pointer；input；input.w-[18px].h-[18px].rounded.cursor-pointer.disabled:cursor-not-allowed | — |
| Input (text) | 65 | 53 | input.pl-9.pr-3.py-2.text-sm.rounded-lg.border；input.w-full.rounded-xl.border.border-[var(--color-border)].bg-[var(--color-card)].text-[var(--color-text)]；input.min-w-0.flex-1.bg-transparent.p-0.text-inherit.outline-none；input.flex-1.bg-transparent.outline-none；input.w-48.px-2.5.py-1.5.text-sm.rounded-lg.border | 搜索智能体...；搜索技能...；搜索名称 / 描述 / URL / 命令；搜索项目 |
| Select | 23 | 5 | select.pointer-events-none.absolute.h-px.w-px.opacity-0；select.text-xs.rounded.px-1.py-0.border-none.outline-none | 综合类工时项目；DEBUGINFOWARNINGERRORCRITICAL；状态草稿启用归档；分类每日回归NL2SQL 专项对话质量安全审计工具调用全量回归自定义 |
| Input (date) | 18 | 9 | input.w-full.rounded-xl.border.border-[var(--color-border)].bg-[var(--color-card)].text-[var(--color-text)] | — |
| Input (number) | 9 | 7 | input.w-full.rounded-xl.border.border-[var(--color-border)].bg-[var(--color-card)].text-[var(--color-text)] | — |
| Table | 5 | 5 | table.w-full.text-sm.table-fixed；table.w-full.table-fixed.text-sm | — |
| Input (password) | 4 | 2 | input.w-48.px-2.5.py-1.5.text-sm.rounded-lg.border | — |
| Search | 3 | 3 | button.search-toggle-button.flex.h-10.w-10.items-center.justify-center；input.weekly-report-search.h-8.min-w-0.flex-1.rounded-md.border | — |
| Input | 2 | 1 | input.min-w-0.flex-1.bg-transparent.text-sm.outline-none；input.weekly-report-search.h-8.min-w-0.flex-1.rounded-md.border | 搜索组织或成员；搜索汇报内容 |
| Input (radio) | 2 | 1 | input.h-4.w-4 | — |
| Input (range) | 2 | 2 | input.mt-1.w-full；input.w-full.rounded-xl.border.border-[var(--color-border)].bg-[var(--color-card)].text-[var(--color-text)] | — |
| Textarea | 2 | 2 | textarea.min-h-[58px].w-full.resize-none.overflow-hidden.bg-transparent.py-[18px] | 输入你的问题或指令，Data Agentic OS 将为你分析数据、生成报告... |
| Link / Navigation Item | 1 | 1 | a.mt-3.inline-block.text-xs.text-primary.hover:underline | 查看 Trae 官方配置示例 |

## 9. 交互状态

### 9.1 默认、Hover 与 Focus 差异

| 控件签名 | 代表标签 | Hover 变化 | Focus 变化 | 页面数 | 样本数 |
| --- | --- | --- | --- | ---: | ---: |
| `button||flex.items-center.gap-2.5.cursor-pointer` | 东方金信 | 无可见计算样式差异 | 无可见计算样式差异 | 142 | 142 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | 69 | 69 |
| `select||pointer-events-none.absolute.h-px.w-px` | 工作周报；全部 Token；全部分类关系型数据库API 数据源文件/云存储；全部数据集阳光消金长安集团公司员工CRM数据集ccgp电影库电商；选择数据集阳光消金长安集团公司员工CRM数据集ccgp电影库电商；10 条/页20 条/页50 条/页100 条/页；列表语义模型指标本体类实体；全部数据集CRM数据集公司员工电商电影库长安集团阳光消金 | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) auto 0.8px | 61 | 61 |
| `button||relative.p-2.transition-colors` | 1 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | 55 | 55 |
| `button||p-2.transition-colors` | — | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | 53 | 53 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 工时填报；待审批 0；Token服务；模型概览；领域管理；图谱同步；全景大屏；数据检索 | 无可见计算样式差异 | 无可见计算样式差异 | 49 | 49 |
| `button|option|flex.w-full.items-center.gap-3` | 工作周报；全部分类；列；全部数据集；全部状态；按域排行；全部类型；八类资产对象 | 无可见计算样式差异 | 无可见计算样式差异 | 40 | 40 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 待审批 0；模型概览；领域管理；图谱同步；全景大屏；数据检索；资产盘点；标准集 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(86, 94, 133)；outline: rgb(85, 91, 110) none 2.4px → rgb(86, 94, 133) none 2.4px | 35 | 35 |
| `button||inline-flex.items-center.justify-center.font-medium` | 新建根类目；刷新；初始化内置模板 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | 34 | 34 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | 29 | 29 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | 29 | 29 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170194px | 27 | 27 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170194px | 26 | 26 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | Token服务；领域管理；图谱同步；数据检索；资产盘点；标准集；规则模板库；分类分级 | color: rgb(85, 91, 110) → rgb(85, 92, 114)；outline: rgb(85, 91, 110) none 2.4px → rgb(85, 92, 114) none 2.4px | color: rgb(85, 91, 110) → rgb(86, 94, 133)；outline: rgb(85, 91, 110) none 2.4px → rgb(86, 94, 133) none 2.4px | 26 | 26 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索申请人/部门/项目；搜索名称/描述；搜索名称/数据源/说明；搜索...；输入关键词检索表/列/指标/资产（支持中文全文+模糊）；输入表名/字段名，如 orders；搜索用户名、姓名、手机号或邮箱...；搜索标题或内容... | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(222, 224, 238)；outline: rgb(26, 29, 46) none 2.4px → rgb(26, 29, 45) none 0.8px | 20 | 20 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | 无可见计算样式差异 | 无可见计算样式差异 | 18 | 18 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新；检索；分析血缘；生成报告；导出 CSV | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(253, 253, 254) | 17 | 17 |
| `button||relative.p-2.transition-colors` | 1 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | 15 | 15 |
| `button||inline-flex.items-center.justify-center.border` | 上一页 | 无可见计算样式差异 | 无可见计算样式差异 | 14 | 14 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索...；搜索节点...；搜索名称/描述；按角色 ID 过滤；搜索知识库名称或描述；搜索内容...；搜索名称...；搜索实体... | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(26, 29, 46) none 0.8px | 14 | 14 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | 13 | 13 |
| `button||group.flex.w-full.items-center` | 全部 Token；全部类型；五类标准；全部级别（L1-L5）；全部模式；全部服务；全部状态；全部生效状态 | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238) | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(214, 218, 238) | 13 | 13 |
| `button||group.flex.w-full.items-center` | 20 条/页；全部类型；全部状态；五类标准；六维全部；全部结果；全部级别（L1-L5）；全部平台 | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(214, 218, 238) | 13 | 13 |
| `button||inline-flex.items-center.justify-center.font-medium` | 批量审核；运行校验；全量同步；探索；创建组织；创建角色；新增菜单；新建消息 | 无可见计算样式差异 | 无可见计算样式差异 | 12 | 12 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | 11 | 11 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新；查询 | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(253, 253, 254)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 11 | 11 |
| `button||p-2.transition-colors` | — | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | 11 | 11 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | 无可见计算样式差异 | 10 | 10 |
| `button||group.flex.w-full.items-center` | 工作周报；全部分类；阳光消金；20 条/页；全部状态；全部制度；中石油；全部类型 | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238) | backgroundColor: rgb(255, 255, 255) → rgb(253, 252, 255)；borderColor: rgb(226, 228, 238) → rgb(194, 200, 238) | 10 | 10 |
| `button||group.flex.w-full.items-center` | 列；质量周报；全部事件；全部服务；中石油；10 条/页；全部领域；全部分类 | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238) | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(215, 218, 238) | 9 | 9 |
| `button||p-1.rounded.transition-colors.hover:opacity-70` | — | opacity: 1 → 0.7 | opacity: 1 → 0.7 | 8 | 8 |
| `button||p-2.transition-colors` | — | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.173) | 8 | 8 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170619px | 8 | 8 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | 8 | 8 |
| `button||group.flex.w-full.items-center` | 全部状态；按域排行；八类资产对象；全部类型 | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(215, 218, 238) | 7 | 7 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0346895px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170619px | 7 | 7 |
| `button|option|flex.w-full.items-center.gap-3` | 10 条/页 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176) | 7 | 7 |
| `button||inline-flex.items-center.justify-center.font-medium` | 一键初始化；认证渠道▼；刷新；导出 CSV | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253) | 6 | 6 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | 6 | 6 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 填写工作内容；项目名称/编号；如 customer_id、total_amount；用户名 | 无可见计算样式差异 | 无可见计算样式差异 | 6 | 6 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 5 | 5 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.171044px | 5 | 5 |
| `button||relative.p-2.transition-colors` | 1 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.173) | 5 | 5 |
| `button||w-full.flex.items-center.gap-2.5` | 工时审批 | 无可见计算样式差异 | 无可见计算样式差异 | 5 | 5 |
| `button||` | 阳光消金；关系图 | 无可见计算样式差异 | 无可见计算样式差异 | 4 | 4 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.235) | 4 | 4 |
| `button||inline-flex.items-center.gap-1.px-3` | 刷新；新建技能；新增条目 | 无可见计算样式差异 | 无可见计算样式差异 | 4 | 4 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473127px | 4 | 4 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170219px | 4 | 4 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170219px | 4 | 4 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 待审批 0；Token服务；领域管理；用户管理 | color: rgb(85, 91, 110) → rgb(85, 92, 114)；outline: rgb(85, 91, 110) none 2.4px → rgb(85, 92, 114) none 2.4px | color: rgb(85, 91, 110) → rgb(88, 99, 169)；outline: rgb(85, 91, 110) none 2.4px → rgb(88, 99, 169) none 2.4px | 4 | 4 |
| `select||pointer-events-none.absolute.h-px.w-px` | 综合类工时项目；状态草稿启用归档；50%60%70%80%90% | 无可见计算样式差异 | 无可见计算样式差异 | 4 | 4 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.647) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 3 | 3 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0665206, 0) | 3 | 3 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 3 | 3 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345939, 0) | 3 | 3 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348629, 0) | 3 | 3 |
| `button||flex.items-center.justify-center.w-6` | — | 无可见计算样式差异 | 无可见计算样式差异 | 3 | 3 |
| `button||inline-flex.items-center.gap-1.5.px-4` | 编辑 | 无可见计算样式差异 | 无可见计算样式差异 | 3 | 3 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新；筛选 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.235) | 3 | 3 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.082) | 3 | 3 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.92) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 3 | 3 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.035) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | 3 | 3 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473174px | 3 | 3 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.84) | 3 | 3 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.84) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 3 | 3 |
| `button||w-full.text-left.px-3.py-2` | access25.5 MB· 08-31 17:39DEBUGINFOWARNINGERRORCRITICAL；dataset_vdb_schema1018 行；memory_store.db76.0 KB全息记忆存储（Holographic Memory），持久化短期记忆向量与条目 | 无可见计算样式差异 | 无可见计算样式差异 | 3 | 3 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 领域管理；审计日志；反馈中心 | color: rgb(85, 91, 110) → rgb(85, 92, 114)；outline: rgb(85, 91, 110) none 2.4px → rgb(85, 92, 114) none 2.4px | color: rgb(85, 91, 110) → rgb(88, 99, 170)；outline: rgb(85, 91, 110) none 2.4px → rgb(88, 99, 170) none 2.4px | 3 | 3 |
| `input||w-48.px-2.5.py-1.5.text-sm` | ${VAR} | 无可见计算样式差异 | 无可见计算样式差异 | 3 | 3 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.776) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 2 | 2 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 2 | 2 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.647) | 2 | 2 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.02) | 2 | 2 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0666199, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.35424, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0659448, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0661784, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663584, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0656492, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0659179, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0655955, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0667012, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663764, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663854, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0658193, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0659807, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0668459, 0) | 2 | 2 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0658551, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.035078, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0352158, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349498, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348903, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.035179, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0350093, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347579, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348035, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345848, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349269, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351882, 0) | 2 | 2 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0350872, 0) | 2 | 2 |
| `button||flex.items-center.justify-center.rounded` | — | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||group.flex.w-full.items-center` | 中石油；全部 | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238) | backgroundColor: rgb(255, 255, 255) → rgb(253, 252, 255)；borderColor: rgb(226, 228, 238) → rgb(194, 199, 238) | 2 | 2 |
| `button||group.flex.w-full.items-center` | 状态；70% | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255) | 2 | 2 |
| `button||inline-flex.items-center.gap-1.px-2` | 编辑；刷新缓存 | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||inline-flex.items-center.gap-1.px-2` | 日志监控 | opacity: 1 → 0.7 | opacity: 1 → 0.7 | 2 | 2 |
| `button||inline-flex.items-center.justify-center.font-medium` | — | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 2 | 2 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 2 | 2 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | 2 | 2 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.24) | 2 | 2 |
| `button||min-w-0.flex-1.text-left` | zhaomengchen | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||p-0.5.hover:bg-[var(--color-border)].rounded` | — | backgroundColor: rgba(0, 0, 0, 0) → rgb(226, 228, 238) | backgroundColor: rgba(0, 0, 0, 0) → rgb(226, 228, 238) | 2 | 2 |
| `button||p-1.5.rounded.transition-colors.hover:opacity-70` | — | opacity: 1 → 0.7 | opacity: 1 → 0.7 | 2 | 2 |
| `button||p-1.rounded.transition-colors.hover:opacity-70` | — | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.694) | 2 | 2 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.92) | 2 | 2 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.455) | 2 | 2 |
| `button||p-2.transition-colors` | — | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.035) | 2 | 2 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.694) | 2 | 2 |
| `button||p-2.transition-colors` | — | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170194px | borderColor: rgb(226, 228, 238) → rgb(139, 150, 239)；boxShadow: none → rgba(91, 108, 240, 0.05) 0px 0px 0px 1.29243px | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.470783px | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473989px | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0346895px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.171044px | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.167317px | 2 | 2 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170619px | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.992) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.992) | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.92) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.035) | 2 | 2 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.173) | 2 | 2 |
| `button||rounded-md.px-2.py-0.5.text-xs` | 今日 | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||text-xs.flex.items-start.gap-1` | 同步完成: tables=11 columns=291 embeddings=291(583) | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||truncate.max-w-[100px].text-left.hover:underline` | dataset_vdb_schema | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||truncate.max-w-[120px].text-left.hover:underline` | access | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||w-full.mb-3.inline-flex.items-center` | 新增分析报告模板；新增字典类型 | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button||w-full.text-left.p-3.rounded-xl` | Embedding 缓存全局 Embedding 文本去重，MD5 键，所有调用方共享91974 条369.8 MB；异常诊断分析报告专注于业务数据异常预警和根因排查的专业诊断型报告，系统性地识别异动指标、追溯变化源头、评估影响范围，并提供修复和预防建议。适用于异常排查、问题诊断、根因分析等场景。anomaly_diagnosis.yaml5.7KB | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0983932px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0655955px -0.0327977px | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.016) 0px 0.17515px 0.525451px 0px, rgba(0, 0, 0, 0.016) 0px 0.17515px 0.350301px -0.17515px | 2 | 2 |
| `button|option|flex.w-full.items-center.gap-3` | 选择数据集；10 条/页 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.173) | 2 | 2 |
| `button|option|flex.w-full.items-center.gap-3` | 10 条/页；选择知识库 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46) | 2 | 2 |
| `button|option|flex.w-full.items-center.gap-3` | 选择知识库；10 条/页 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176) | 2 | 2 |
| `button|switch|relative.inline-flex.h-6.w-11` | — | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 领域管理；数据检索 | color: rgb(85, 91, 110) → rgb(85, 92, 115)；outline: rgb(85, 91, 110) none 2.4px → rgb(85, 92, 115) none 2.4px | color: rgb(85, 91, 110) → rgb(86, 94, 133)；outline: rgb(85, 91, 110) none 2.4px → rgb(86, 94, 133) none 2.4px | 2 | 2 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | Chunk | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(85, 92, 114)；outline: rgb(85, 91, 110) none 2.4px → rgb(85, 92, 114) none 2.4px | 2 | 2 |
| `input||min-w-0.flex-1.bg-transparent.p-0` | 搜索项目 | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `input||w-full.border.outline-none.transition-colors` | 操作人 | 无可见计算样式差异 | 无可见计算样式差异 | 2 | 2 |
| `textarea||min-h-[58px].w-full.resize-none.overflow-hidden` | 输入你的问题或指令，Data Agentic OS 将为你分析数据、生成报告... | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 2 | 2 |
| `a||mt-3.inline-block.text-xs.text-primary` | 查看 Trae 官方配置示例 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||block.max-w-full.truncate.text-left` | 中石油 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||cursor-pointer` | 已发布 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.h-12.items-center.gap-2` | 周报 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.1) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.537) | 1 | 1 |
| `button||flex.h-6.w-6.shrink-0` | 收起下级 | color: rgb(139, 143, 163) → rgb(131, 137, 177)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(139, 143, 163) none 2.4px → rgb(131, 137, 177) none 2.4px | color: rgb(139, 143, 163) → rgb(99, 114, 227)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.84)；outline: rgb(139, 143, 163) none 2.4px → rgb(99, 114, 227) none 2.4px | 1 | 1 |
| `button||flex.h-7.w-7.items-center` | 新增团队分组 | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px | 1 | 1 |
| `button||flex.h-7.w-7.shrink-0` | 收起产品组 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.h-8.w-8.items-center` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.84)；outline: rgb(139, 143, 163) none 2.4px → rgb(135, 139, 158) auto 0.8px | 1 | 1 |
| `button||flex.h-8.w-8.items-center` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.698) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255) | 1 | 1 |
| `button||flex.items-center.gap-1.5.font-medium` | 数据战略规划制度 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.items-center.gap-1.border-l` | 卡片列表 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.items-center.gap-1.px-2` | 全部 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.items-center.gap-1.px-3` | 关系图 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.984)；outline: rgb(26, 29, 46) none 2.4px → rgb(24, 26, 40) auto 1.6px | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.96) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.776) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.235) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.92) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.68) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.863) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.863) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.24) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.863) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.082) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.24) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.996) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.24) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.92) | 1 | 1 |
| `button||flex.items-center.gap-2.5.px-2` | [当前用户] | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.02) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.086) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(57, 61, 79)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.48)；outline: rgb(85, 91, 110) none 2.4px → rgb(57, 61, 79) none 2.4px；transform: none → matrix(1, 0, 0, 1, 0.954861, 0) | color: rgb(85, 91, 110) → rgb(28, 31, 48)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.97)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 28, 42) auto 1.6px；transform: none → matrix(1, 0, 0, 1, 1.9366, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(44, 48, 65)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.694)；outline: rgb(85, 91, 110) none 2.4px → rgb(44, 48, 65) none 2.4px | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.992)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.98606, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(58, 63, 81)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；outline: rgb(85, 91, 110) none 2.4px → rgb(58, 63, 81) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.914363, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.992)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.98598, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(44, 48, 65)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.698)；outline: rgb(85, 91, 110) none 2.4px → rgb(44, 48, 65) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.39339, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(28, 31, 48)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.97)；outline: rgb(85, 91, 110) none 2.4px → rgb(28, 31, 48) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.93787, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(36, 39, 56)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.84)；outline: rgb(85, 91, 110) none 2.4px → rgb(36, 39, 56) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.67503, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.992)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.98603, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(58, 62, 81)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；outline: rgb(85, 91, 110) none 2.4px → rgb(58, 62, 81) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.921002, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(31, 34, 51)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；outline: rgb(85, 91, 110) none 2.4px → rgb(31, 34, 51) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84278, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(36, 39, 56)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.835)；outline: rgb(85, 91, 110) none 2.4px → rgb(36, 39, 56) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.67426, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(58, 63, 81)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；outline: rgb(85, 91, 110) none 2.4px → rgb(58, 63, 81) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.916917, 0) | color: rgb(85, 91, 110) → rgb(28, 31, 48)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.97)；outline: rgb(85, 91, 110) none 2.4px → rgb(28, 31, 48) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.93787, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.352402, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.353942, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.354565, 0) | color: rgb(85, 91, 110) → rgb(31, 34, 51)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；outline: rgb(85, 91, 110) none 2.4px → rgb(31, 34, 51) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84225, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0658731, 0) | color: rgb(85, 91, 110) → rgb(44, 48, 65)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.694)；outline: rgb(85, 91, 110) none 2.4px → rgb(44, 48, 65) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.39109, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0659, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0658462, 0) | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351054, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.354267, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0656581, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351189, 0) | color: rgb(85, 91, 110) → rgb(31, 34, 51)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；outline: rgb(85, 91, 110) none 2.4px → rgb(31, 34, 51) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.8418, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(31, 34, 51)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；outline: rgb(85, 91, 110) none 2.4px → rgb(31, 34, 51) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84235, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(36, 39, 56)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.84)；outline: rgb(85, 91, 110) none 2.4px → rgb(36, 39, 56) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.67602, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662863, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.353699, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662053, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.352915, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0669092, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0655418, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0657745, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.352996, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0666831, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0661065, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(44, 48, 65)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.698)；outline: rgb(85, 91, 110) none 2.4px → rgb(44, 48, 65) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.39274, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0664214, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(58, 62, 81)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；outline: rgb(85, 91, 110) none 2.4px → rgb(58, 62, 81) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.91999, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351566, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0660436, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663133, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662143, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0665748, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0661334, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0664755, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0670905, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662773, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0672175, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0658462, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.067027, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0667193, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0666922, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0671086, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0661244, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0653275, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0671449, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663494, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0649447, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0658372, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662953, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0660166, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351862, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663043, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663403, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0661604, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0669364, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0668006, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0659897, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662323, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0660705, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0672448, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351916, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.065685, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | color: rgb(85, 91, 110) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(85, 91, 110) none 2.4px → rgb(26, 29, 46) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.065891, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.349683, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0665567, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0670179, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0667464, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0663944, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.353834, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0671358, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.352591, 0) | color: rgb(85, 91, 110) → rgb(36, 39, 56)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.84)；outline: rgb(85, 91, 110) none 2.4px → rgb(36, 39, 56) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.67532, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351243, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.065676, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0659628, 0) | color: rgb(85, 91, 110) → rgb(58, 63, 81)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；outline: rgb(85, 91, 110) none 2.4px → rgb(58, 63, 81) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.915938, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351889, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0662683, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0651048, 0) | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.173)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.348824, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.066638, 0) | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.353482, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.065882, 0) | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351162, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.351054, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.352078, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0660885, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.35527, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0664304, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0654882, 0) | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.349978, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0661514, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(75, 80, 99)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.176)；outline: rgb(85, 91, 110) none 2.4px → rgb(75, 80, 99) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.350193, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.03)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0660795, 0) | 1 | 1 |
| `button||flex.items-center.gap-2.w-full` | 通用智能体 | 无可见计算样式差异 | color: rgb(85, 91, 110) → rgb(83, 89, 108)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.035)；outline: rgb(85, 91, 110) none 2.4px → rgb(83, 89, 108) none 2.4px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0668278, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | outline: rgb(91, 108, 240) none 2.4px → rgb(85, 100, 221) auto 1.6px | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170594, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.863)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.72497, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84191, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.66)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.31931, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.235)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.474349, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.984)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.96682, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.776)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.55273, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171783, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.647)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.29482, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.65)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.29883, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84241, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.172538, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.647)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.29594, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171232, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170856, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171332, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.776)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.55222, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348172, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.917004, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345757, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348995, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171194, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171169, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.17137, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170282, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.647)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.2926, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.647)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.29628, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.647)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.29446, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 2, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347898, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171608, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.24)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.474948, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0352848, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171319, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351193, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170095, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0352572, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.24)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.474852, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84193, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346121, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.235)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.474109, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.92)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.84214, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346166, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170419, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348995, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.033911, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0350185, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349635, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347761, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349772, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.02)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0353216, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349681, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346075, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351698, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348492, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345621, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349223, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346531, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349406, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348766, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0350322, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345212, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351285, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345348, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345984, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346986, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351607, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345575, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349864, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347077, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345802, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347214, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.034299, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348583, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170669, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0350918, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347989, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.02)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0353078, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346485, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346622, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346576, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347123, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0349452, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0352112, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351515, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171595, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346804, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346849, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.035101, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0343669, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170569, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351148, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348949, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.24)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.47502, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171244, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.17211, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.02)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0354923, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.172815, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170244, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347533, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0345439, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170931, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.647)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 1.29482, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.034991, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.24)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.476413, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.035046, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.24)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.475812, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171345, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348218, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170981, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170369, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351836, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347488, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170781, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.034872, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171119, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.17216, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170981, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348309, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0351469, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0347077, 0) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.170669, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171382, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0348857, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.016)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.0346348, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171194, 0) | 1 | 1 |
| `button||flex.items-center.justify-between.w-full` | 智能体 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.086)；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1, 0, 0, 1, 0.171846, 0) | 1 | 1 |
| `button||flex.min-w-0.flex-1.items-center` | 收起团队分组 | color: rgb(139, 143, 163) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；outline: rgb(139, 143, 163) none 2.4px → rgb(26, 29, 46) none 2.4px | color: rgb(139, 143, 163) → rgb(26, 29, 46)；backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；outline: rgb(139, 143, 163) none 2.4px → rgb(26, 29, 46) none 2.4px | 1 | 1 |
| `button||flex.w-full.items-center.gap-2` | 田沛霖 | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||font-medium.text-left.cursor-pointer.bg-transparent` | AI Lakehouse数据湖仓系统 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||group.flex.w-full.items-center` | 请先选项目 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255) | backgroundColor: rgb(255, 255, 255) → rgb(247, 246, 255) | 1 | 1 |
| `button||group.flex.w-full.items-center` | 请先选项目 | backgroundColor: rgb(255, 255, 255) → rgb(249, 247, 255) | backgroundColor: rgb(255, 255, 255) → rgb(245, 243, 255) | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部数据集 | backgroundColor: rgb(255, 255, 255) → rgb(250, 249, 255)；borderColor: rgb(226, 228, 238) → rgb(164, 173, 239) | backgroundColor: rgb(255, 255, 255) → rgb(245, 243, 255)；borderColor: rgb(226, 228, 238) → rgb(92, 108, 240)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(240, 237, 255, 0.46) 0px 0px 0px 1.82887px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部数据集 | backgroundColor: rgb(255, 255, 255) → rgb(253, 252, 255)；borderColor: rgb(226, 228, 238) → rgb(194, 200, 238) | backgroundColor: rgb(255, 255, 255) → rgb(246, 244, 255)；borderColor: rgb(226, 228, 238) → rgb(102, 118, 240)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(240, 237, 255, 0.235) 0px 0px 0px 0.947978px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部状态 | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238) | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部状态 | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238) | backgroundColor: rgb(255, 255, 255) → rgb(253, 252, 255)；borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(240, 237, 255, 0.016) 0px 0px 0px 0.0690696px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部板块 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(214, 218, 238) | backgroundColor: rgb(255, 255, 255) → rgb(249, 247, 255)；borderColor: rgb(226, 228, 238) → rgb(139, 150, 239)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(240, 237, 255, 0.016) 0px 0px 0px 0.0690696px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部分类 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(214, 218, 238) | backgroundColor: rgb(255, 255, 255) → rgb(253, 252, 255)；borderColor: rgb(226, 228, 238) → rgb(194, 200, 238) | 1 | 1 |
| `button||group.flex.w-full.items-center` | 全部 | backgroundColor: rgb(255, 255, 255) → rgb(254, 254, 255)；borderColor: rgb(226, 228, 238) → rgb(215, 218, 238) | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 255)；borderColor: rgb(226, 228, 238) → rgb(164, 173, 239)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(240, 237, 255, 0.016) 0px 0px 0px 0.0690696px, rgba(15, 23, 42, 0.04) 0px 1px 2px 0px | 1 | 1 |
| `button||hidden.h-8.w-8.shrink-0` | 收起关注人 | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||hidden.md:inline-flex.items-center.gap-1` | 东方金信问答智能体 | 无可见计算样式差异 | outline: rgb(255, 255, 255) none 2.4px → rgb(213, 213, 213) auto 1.6px | 1 | 1 |
| `button||hidden.md:inline-flex.items-center.gap-1` | 通用智能体 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||inline-flex.h-9.items-center.gap-1.5` | 注入防护 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||inline-flex.items-center.gap-0.5.px-2` | 恢复 | opacity: 1 → 0.7 | opacity: 1 → 0.7 | 1 | 1 |
| `button||inline-flex.items-center.gap-1.px-2.5` | 编辑类型 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||inline-flex.items-center.gap-1.rounded-full` | 启用 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||inline-flex.items-center.gap-1.rounded-md` | 展开全部 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||inline-flex.items-center.gap-1.text-xs` | 展开 | 无可见计算样式差异 | opacity: 1 → 0.965112 | 1 | 1 |
| `button||inline-flex.items-center.gap-1.text-xs` | 展开 | opacity: 1 → 0.993461 | opacity: 1 → 0.965032 | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 新建任务 | backgroundColor: rgb(255, 255, 255) → rgb(244, 246, 250) | backgroundColor: rgb(255, 255, 255) → rgb(232, 235, 245)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.24) 0px 0px 0px 0.476389px, rgba(91, 108, 240, 0.24) 0px 0px 0px 0.952778px, rgba(0, 0, 0, 0) 0px 0px 0px 0px；outline: rgb(26, 29, 46) none 2.4px → rgb(24, 26, 39) none 1.6px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 新建任务 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253) | backgroundColor: rgb(255, 255, 255) → rgb(232, 235, 245)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.235) 0px 0px 0px 0.473127px, rgba(91, 108, 240, 0.235) 0px 0px 0px 0.946253px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 新建智能体 | 无可见计算样式差异 | boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.46) 0px 0px 0px 0.915431px, rgba(255, 255, 255, 0.46) 0px 0px 0px 1.83086px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 扫描系统初始化 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253) | backgroundColor: rgb(255, 255, 255) → rgb(232, 235, 245)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.773) 0px 0px 0px 1.54605px, rgba(91, 108, 240, 0.773) 0px 0px 0px 3.09211px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 上一月 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.24) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.96)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.235) 0px 0px 0px 0.473127px, rgba(91, 108, 240, 0.235) 0px 0px 0px 0.946253px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 上一月 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.863) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.792) 0px 0px 0px 1.58292px, rgba(91, 108, 240, 0.792) 0px 0px 0px 3.16584px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgb(255, 255, 255) → rgb(240, 242, 249) | backgroundColor: rgb(255, 255, 255) → rgb(232, 235, 245)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.627) 0px 0px 0px 1.2585px, rgba(91, 108, 240, 0.627) 0px 0px 0px 2.51701px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.016) 0px 0px 0px 0.0345439px, rgba(91, 108, 240, 0.016) 0px 0px 0px 0.0690877px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgb(255, 255, 255) → rgb(253, 253, 254) | backgroundColor: rgb(255, 255, 255) → rgb(240, 242, 249)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.016) 0px 0px 0px 0.0348446px, rgba(91, 108, 240, 0.016) 0px 0px 0px 0.0696892px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgb(255, 255, 255) → rgb(253, 253, 254) | backgroundColor: rgb(255, 255, 255) → rgb(240, 242, 249)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.016) 0px 0px 0px 0.0345348px, rgba(91, 108, 240, 0.016) 0px 0px 0px 0.0690696px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.647) 0px 0px 0px 1.29311px, rgba(91, 108, 240, 0.647) 0px 0px 0px 2.58621px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.647) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.92) 0px 0px 0px 1.84152px, rgba(91, 108, 240, 0.92) 0px 0px 0px 3.68304px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 查询 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253) | backgroundColor: rgb(255, 255, 255) → rgb(234, 237, 246)；boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.086) 0px 0px 0px 0.170194px, rgba(91, 108, 240, 0.086) 0px 0px 0px 0.340389px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.082) | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | 无可见计算样式差异 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.016) | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 刷新 | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.016) 0px 0px 0px 0.0345348px, rgba(91, 108, 240, 0.016) 0px 0px 0px 0.0690696px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.font-medium` | 认证渠道▼ | 无可见计算样式差异 | backgroundColor: rgb(255, 255, 255) → rgb(250, 250, 253)；boxShadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.016) 0px 0px 0px 0.0351469px, rgba(91, 108, 240, 0.016) 0px 0px 0px 0.0702938px, rgba(0, 0, 0, 0) 0px 0px 0px 0px | 1 | 1 |
| `button||inline-flex.items-center.justify-center.w-12` | 启用 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||mt-3.flex.w-full.items-center` | 关注的人 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||okr-org-row` | 北京东方金信375 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||okr-org-row.okr-sidebar-item` | 冯晋艳 | backgroundColor: rgba(0, 0, 0, 0) → oklab(0.940679 0.000691444 -0.0138019 / 0.290538) | backgroundColor: rgba(0, 0, 0, 0) → oklab(0.940679 0.000691444 -0.0138019 / 0.670358) | 1 | 1 |
| `button||okr-sidebar-item.mx-2.flex.h-9` | 我的 OKR | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||p-0.5.hover:bg-[var(--color-border)].rounded.shrink-0` | — | backgroundColor: rgba(0, 0, 0, 0) → rgb(226, 228, 238) | backgroundColor: rgba(0, 0, 0, 0) → rgb(226, 228, 238) | 1 | 1 |
| `button||p-0.5.rounded.transition-colors.hover:opacity-70` | — | opacity: 1 → 0.7 | opacity: 1 → 0.7 | 1 | 1 |
| `button||p-1.5.rounded-lg.border.transition-colors` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||p-1.hover:bg-[var(--color-card-elevated)].rounded.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(245, 243, 255, 0.84) | backgroundColor: rgba(0, 0, 0, 0) → rgb(245, 243, 255) | 1 | 1 |
| `button||p-1.rounded.transition-colors` | — | color: rgb(139, 143, 163) → rgba(239, 68, 68, 0.9)；outline: rgb(139, 143, 163) none 2.4px → rgba(239, 68, 68, 0.9) none 2.4px | color: rgb(139, 143, 163) → rgba(239, 68, 68, 0.9)；outline: rgb(139, 143, 163) none 2.4px → rgba(239, 68, 68, 0.9) none 2.4px | 1 | 1 |
| `button||p-1.transition-colors` | — | color: rgb(139, 143, 163) → rgb(114, 119, 139)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.46)；outline: rgb(139, 143, 163) none 2.4px → rgb(114, 119, 139) none 2.4px | color: rgb(139, 143, 163) → rgb(85, 91, 110)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(139, 143, 163) none 2.4px → rgb(72, 77, 92) auto 0.8px | 1 | 1 |
| `button||p-1.transition-colors` | — | color: rgb(139, 143, 163) → rgb(101, 107, 126)；backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.694)；outline: rgb(139, 143, 163) none 2.4px → rgb(101, 107, 126) none 2.4px | color: rgb(139, 143, 163) → rgb(85, 91, 110)；backgroundColor: rgba(0, 0, 0, 0) → rgb(240, 237, 255)；outline: rgb(139, 143, 163) none 2.4px → rgb(85, 91, 110) none 2.4px | 1 | 1 |
| `button||p-2.hover:bg-gray-100/50.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → oklab(0.96695 -0.000229478 -0.00284159 / 0.419022) | backgroundColor: rgba(0, 0, 0, 0) → oklab(0.96695 -0.000229478 -0.00284159 / 0.5) | 1 | 1 |
| `button||p-2.hover:bg-gray-100/50.transition-colors.border-l` | — | backgroundColor: rgba(0, 0, 0, 0) → oklab(0.96695 -0.000229478 -0.00284159 / 0.418503) | backgroundColor: rgba(0, 0, 0, 0) → oklab(0.96695 -0.000229478 -0.00284159 / 0.5) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.698) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.992)；outline: rgb(26, 29, 46) none 2.4px → rgb(24, 27, 41) auto 0.8px | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.97) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.84) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.843) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.835) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.698) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.84) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.698) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.46) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.992) | 1 | 1 |
| `button||p-2.transition-colors` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||p-2.transition-colors` | — | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.173) | 1 | 1 |
| `button||px-2.py-1.5.text-xs.rounded-lg` | 更多 (20) | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||px-3.py-1.5.text-xs.rounded-lg` | 全部 (196) | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||px-3.py-1.5.text-xs.rounded-md` | 全部 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||px-4.py-1.5.text-sm.rounded-md` | 按角色配置 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||px-4.py-2.text-sm.font-medium` | 📊 概览 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(165, 173, 239)；boxShadow: none → rgba(91, 108, 240, 0.035) 0px 0px 0px 0.910125px | borderColor: rgb(226, 228, 238) → rgb(92, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 1.99204px；outline: rgb(26, 29, 46) none 2.4px → rgb(22, 24, 34) auto 1.6px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473174px | borderColor: rgb(226, 228, 238) → rgb(121, 135, 240)；boxShadow: none → rgba(91, 108, 240, 0.063) 0px 0px 0px 1.55238px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(92, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 1.99248px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(194, 199, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.475572px | borderColor: rgb(226, 228, 238) → rgb(93, 110, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 1.96699px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(102, 117, 240)；boxShadow: none → rgba(91, 108, 240, 0.07) 0px 0px 0px 1.84194px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(96, 113, 240)；boxShadow: none → rgba(91, 108, 240, 0.075) 0px 0px 0px 1.91885px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.474756px | borderColor: rgb(226, 228, 238) → rgb(96, 113, 240)；boxShadow: none → rgba(91, 108, 240, 0.075) 0px 0px 0px 1.91898px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(102, 118, 240)；boxShadow: none → rgba(91, 108, 240, 0.07) 0px 0px 0px 1.84156px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473174px | borderColor: rgb(226, 228, 238) → rgb(110, 124, 240)；boxShadow: none → rgba(91, 108, 240, 0.067) 0px 0px 0px 1.72555px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(109, 124, 240)；boxShadow: none → rgba(91, 108, 240, 0.067) 0px 0px 0px 1.72695px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(122, 136, 240)；boxShadow: none → rgba(91, 108, 240, 0.06) 0px 0px 0px 1.53361px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170194px | borderColor: rgb(226, 228, 238) → rgb(121, 135, 240)；boxShadow: none → rgba(91, 108, 240, 0.063) 0px 0px 0px 1.55112px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(121, 135, 240)；boxShadow: none → rgba(91, 108, 240, 0.063) 0px 0px 0px 1.55153px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170619px | borderColor: rgb(226, 228, 238) → rgb(121, 135, 240)；boxShadow: none → rgba(91, 108, 240, 0.063) 0px 0px 0px 1.5515px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170219px | borderColor: rgb(226, 228, 238) → rgb(164, 173, 239)；boxShadow: none → rgba(91, 108, 240, 0.035) 0px 0px 0px 0.914486px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0346895px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.172299px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(164, 173, 239)；boxShadow: none → rgba(91, 108, 240, 0.035) 0px 0px 0px 0.917109px | borderColor: rgb(226, 228, 238) → rgb(93, 110, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 1.96692px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(121, 135, 240)；boxShadow: none → rgba(91, 108, 240, 0.063) 0px 0px 0px 1.5515px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.170219px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473174px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.03349px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.468397px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(139, 150, 239)；boxShadow: none → rgba(91, 108, 240, 0.05) 0px 0px 0px 1.29371px | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；boxShadow: none → rgba(91, 108, 240, 0.08) 0px 0px 0px 2px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(194, 199, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.475572px | borderColor: rgb(226, 228, 238) → rgb(102, 117, 240)；boxShadow: none → rgba(91, 108, 240, 0.07) 0px 0px 0px 1.8421px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.171871px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.172299px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0357654px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.167737px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.168975px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.17147px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.169795px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.167317px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.167737px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0353907px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0342356px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.169372px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.168975px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.033938px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.469971px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(214, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.171044px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.168553px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0337853px | borderColor: rgb(226, 228, 238) → rgb(215, 218, 238)；boxShadow: none → rgba(91, 108, 240, 0.008) 0px 0px 0px 0.169795px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0346895px | borderColor: rgb(226, 228, 238) → rgb(194, 200, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.473941px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(164, 173, 239)；boxShadow: none → rgba(91, 108, 240, 0.035) 0px 0px 0px 0.914486px | 1 | 1 |
| `button||relative.hidden.md:flex.items-center` | 搜索菜单...⌘K | borderColor: rgb(226, 228, 238) → rgb(224, 226, 238)；boxShadow: none → rgba(91, 108, 240, 0) 0px 0px 0px 0.0345348px | borderColor: rgb(226, 228, 238) → rgb(194, 199, 238)；boxShadow: none → rgba(91, 108, 240, 0.02) 0px 0px 0px 0.475572px | 1 | 1 |
| `button||relative.inline-flex.h-5.w-9` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.43) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 1)；outline: rgb(26, 29, 46) none 2.4px → rgb(24, 27, 41) auto 0.8px | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.91) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.97) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.97) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.83) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.92) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.176) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.835) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.694) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.694) | backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245) | 1 | 1 |
| `button||relative.p-2.transition-colors` | 1 | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.03) | backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.455) | 1 | 1 |
| `button||search-toggle-button.flex.h-10.w-10` | — | backgroundColor: rgb(255, 255, 255) → rgb(251, 251, 255)；boxShadow: none → rgba(91, 108, 240, 0.035) 0px 1.92415px 4.32934px 0px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1.00481, 0, 0, 1.00481, 0, -0.240519)；width: 40 → 40.19；height: 40 → 40.19 | backgroundColor: rgb(255, 255, 255) → rgb(241, 238, 255)；boxShadow: none → rgba(91, 108, 240, 0.13) 0px 7.36761px 16.5771px 0px；outline: rgb(139, 143, 163) none 2.4px → rgb(128, 132, 150) auto 1.6px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1.01842, 0, 0, 1.01842, 0, -0.920951)；width: 40 → 40.74；height: 40 → 40.74 | 1 | 1 |
| `button||search-toggle-button.flex.h-10.w-10` | — | backgroundColor: rgb(255, 255, 255) → rgb(248, 247, 255)；boxShadow: none → rgba(91, 108, 240, 0.063) 0px 3.66309px 8.24195px 0px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1.00916, 0, 0, 1.00916, 0, -0.457886)；width: 40 → 40.37；height: 40 → 40.37 | backgroundColor: rgb(255, 255, 255) → rgb(241, 238, 255)；boxShadow: none → rgba(91, 108, 240, 0.137) 0px 7.67569px 17.2703px 0px；transform: matrix(1, 0, 0, 1, 0, 0) → matrix(1.01919, 0, 0, 1.01919, 0, -0.959461)；width: 40 → 40.77；height: 40 → 40.77 | 1 | 1 |
| `button||text-xs.font-medium.hover:underline` | 停用 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||w-full.flex.items-center.gap-2` | 电影库23 张表 | opacity: 1 → 0.99329 | opacity: 1 → 0.964519 | 1 | 1 |
| `button||w-full.flex.items-center.justify-between` | 全部部门 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||w-full.mt-2.inline-flex.items-center` | 清空全部 LLM 缓存 | color: rgb(239, 68, 68) → rgb(255, 255, 255)；backgroundColor: rgba(0, 0, 0, 0) → rgb(91, 108, 240)；borderColor: rgba(239, 68, 68, 0.3) → rgb(226, 228, 238)；borderWidth: 0.8px → 0px 0px 0.8px；borderRadius: 14px → 0px；outline: rgb(239, 68, 68) none 2.4px → rgb(255, 255, 255) none 2.4px；fontSize: 12px → 14px；lineHeight: 16px → 20px | color: rgb(239, 68, 68) → rgb(255, 255, 255)；backgroundColor: rgba(0, 0, 0, 0) → rgb(91, 108, 240)；borderColor: rgba(239, 68, 68, 0.3) → rgb(226, 228, 238)；borderWidth: 0.8px → 0px 0px 0.8px；borderRadius: 14px → 0px；outline: rgb(239, 68, 68) none 2.4px → rgb(255, 255, 255) none 2.4px；fontSize: 12px → 14px；lineHeight: 16px → 20px | 1 | 1 |
| `button||w-full.mt-2.inline-flex.items-center` | 清空全部 LLM 缓存 | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `button||w-full.text-left.p-3.rounded-xl` | 模型配置模型 Provider、API 密钥与参数model5 项 | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0983932px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0655955px -0.0327977px | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.016) 0px 0.175608px 0.526823px 0px, rgba(0, 0, 0, 0.016) 0px 0.175608px 0.351216px -0.175608px | 1 | 1 |
| `button||w-full.text-left.p-3.rounded-xl` | 模型配置模型 Provider、API 密钥与参数model5 项 | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.004) 0px 0.0331027px 0.099308px 0px, rgba(0, 0, 0, 0.004) 0px 0.0331027px 0.0662053px -0.0331027px | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.016) 0px 0.176066px 0.528198px 0px, rgba(0, 0, 0, 0.016) 0px 0.176066px 0.352132px -0.176066px | 1 | 1 |
| `button||w-full.text-left.p-3.rounded-xl` | 系统信息系统名称与基本信息system_profile1 项 | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0983932px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0655955px -0.0327977px | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.016) 0px 0.175177px 0.525532px 0px, rgba(0, 0, 0, 0.016) 0px 0.175177px 0.350355px -0.175177px | 1 | 1 |
| `button||weekly-report-card__collapse.flex.items-center.gap-1` | 收起[当前用户]的汇报 | color: rgb(139, 143, 163) → rgb(91, 108, 240)；outline: rgb(139, 143, 163) none 2.4px → rgb(91, 108, 240) none 2.4px | color: rgb(139, 143, 163) → rgb(91, 108, 240)；backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.38)；outline: rgb(139, 143, 163) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button||weekly-report-card__edit.flex.items-center.gap-1` | 编辑周报 | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button||weekly-report-card__link.text-xs.text-[var(--color-primary)]` | 查看详情 | color: rgb(139, 143, 163) → rgb(91, 108, 240)；backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.125)；outline: rgb(139, 143, 163) none 2.4px → rgb(91, 108, 240) none 2.4px | color: rgb(139, 143, 163) → rgb(91, 108, 240)；backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.38)；outline: rgb(139, 143, 163) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button||weekly-report-card__title-button.text-sm.font-semibold` | 工作周报 · 2026年第35周 | color: rgb(26, 29, 46) → rgb(91, 108, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(91, 108, 240) none 2.4px | color: rgb(26, 29, 46) → rgb(91, 108, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button||weekly-report-period-picker__step.grid.h-8.w-8` | 上一周 | color: rgb(85, 91, 110) → rgb(91, 108, 240)；backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 240)；backgroundColor: rgba(0, 0, 0, 0) → rgb(232, 235, 245)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button||weekly-report-primary-action.flex.h-8.shrink-0` | 写周报 | boxShadow: none → oklab(0.590272 0.011159 -0.196923 / 0.0226426) 0px 0.566065px 1.58498px 0px；transform: none → matrix(1, 0, 0, 1, 0, -0.113213) | boxShadow: none → oklab(0.590272 0.011159 -0.196923 / 0.115294) 0px 2.88234px 8.07055px 0px；transform: none → matrix(1, 0, 0, 1, 0, -0.576468) | 1 | 1 |
| `button||weekly-report-team-group-row` | 我的团队7 | backgroundColor: rgb(240, 237, 255) → rgb(239, 237, 254) | backgroundColor: rgb(240, 237, 255) → rgb(235, 236, 249) | 1 | 1 |
| `button||weekly-report-workspace-nav.flex.min-w-0.flex-1` | 我的关注0 | color: rgb(85, 91, 110) → rgb(78, 83, 102)；backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.125)；outline: rgb(85, 91, 110) none 2.4px → rgb(78, 83, 102) none 2.4px | color: rgb(85, 91, 110) → rgb(49, 53, 70)；backgroundColor: rgba(0, 0, 0, 0) → rgba(232, 235, 245, 0.616)；outline: rgb(85, 91, 110) none 2.4px → rgb(49, 53, 70) none 2.4px | 1 | 1 |
| `button||weekly-report-workspace-nav.flex.w-full.items-center` | 我的周报 | color: rgb(91, 108, 240) → rgb(83, 98, 215)；backgroundColor: rgb(240, 237, 255) → rgb(239, 237, 254)；outline: rgb(91, 108, 240) none 2.4px → rgb(83, 98, 215) none 2.4px | color: rgb(91, 108, 240) → rgb(51, 59, 120)；backgroundColor: rgb(240, 237, 255) → rgb(235, 236, 249)；outline: rgb(91, 108, 240) none 2.4px → rgb(51, 59, 120) none 2.4px | 1 | 1 |
| `button|option|flex.w-full.items-center.gap-3` | 全部状态 | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.97) | backgroundColor: rgba(0, 0, 0, 0) → rgba(240, 237, 255, 0.992) | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 待审批 0 | color: rgb(85, 91, 110) → rgb(88, 99, 170)；outline: rgb(85, 91, 110) none 2.4px → rgb(88, 99, 170) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 239)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 239) none 2.4px | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 模型概览 | color: rgb(85, 91, 110) → rgb(91, 107, 230)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 107, 230) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 图谱同步 | color: rgb(85, 91, 110) → rgb(91, 107, 236)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 107, 236) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 图谱同步 | color: rgb(85, 91, 110) → rgb(89, 103, 200)；outline: rgb(85, 91, 110) none 2.4px → rgb(89, 103, 200) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | Dashboard | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 108, 240)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 108, 240) none 2.4px | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | Dashboard | color: rgb(85, 91, 110) → rgb(85, 92, 114)；outline: rgb(85, 91, 110) none 2.4px → rgb(85, 92, 114) none 2.4px | 无可见计算样式差异 | 1 | 1 |
| `button|tab|inline-flex.shrink-0.items-center.justify-center` | 用户管理 | color: rgb(85, 91, 110) → rgb(86, 94, 133)；outline: rgb(85, 91, 110) none 2.4px → rgb(86, 94, 133) none 2.4px | color: rgb(85, 91, 110) → rgb(91, 107, 230)；outline: rgb(85, 91, 110) none 2.4px → rgb(91, 107, 230) none 2.4px | 1 | 1 |
| `div|button|group.relative.w-full.text-left` | 产品版本类型内置product_version_type13 条目 | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0983932px 0px, rgba(0, 0, 0, 0.004) 0px 0.0327977px 0.0655955px -0.0327977px | boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.016) 0px 0.17515px 0.525451px 0px, rgba(0, 0, 0, 0.016) 0px 0.17515px 0.350301px -0.17515px | 1 | 1 |
| `input||` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `input||cursor-pointer` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `input||flex-1.bg-transparent.outline-none` | 搜索员工... | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |
| `input||h-4.w-4` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `input||min-w-0.flex-1.bg-transparent.text-sm` | 搜索组织或成员 | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |
| `input||mt-1.w-full` | — | 无可见计算样式差异 | 无可见计算样式差异 | 1 | 1 |
| `input||pl-9.pr-3.py-2.text-sm` | 搜索智能体... | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(17, 17, 18) none 0.8px | 1 | 1 |
| `input||pl-9.pr-3.py-2.text-sm` | 搜索技能... | 无可见计算样式差异 | outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索名称 / 描述 / URL / 命令 | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(91, 108, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索申请人/部门/项目 | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(95, 112, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 17) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索申请人/部门/项目 | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(92, 109, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索申请人/部门/项目 | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(113, 127, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(18, 18, 21) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索模型名称、描述... | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(113, 128, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(18, 18, 21) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索表名、列名、指标、实体… | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(102, 117, 240)；outline: rgb(26, 29, 46) none 2.4px → rgb(17, 17, 18) none 0.8px | 1 | 1 |
| `input||w-full.rounded-xl.border.border-[var(--color-border)]` | 搜索标题或内容... | 无可见计算样式差异 | borderColor: rgb(226, 228, 238) → rgb(202, 207, 238)；outline: rgb(26, 29, 46) none 2.4px → rgb(24, 27, 41) none 0.8px | 1 | 1 |
| `input||weekly-report-search.h-8.min-w-0.flex-1` | 搜索汇报内容 | 无可见计算样式差异 | boxShadow: none → rgba(240, 237, 255, 0.114) 0px 0px 0px 0.339071px；outline: rgb(26, 29, 46) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |
| `select||text-xs.rounded.px-1.py-0` | DEBUGINFOWARNINGERRORCRITICAL | 无可见计算样式差异 | outline: rgb(255, 255, 255) none 2.4px → rgb(16, 16, 16) none 0.8px | 1 | 1 |

### 9.2 可恢复展开状态

| 页面 | 控件 | 展开结果 | 视觉变化 | 新发现链接数 |
| --- | --- | --- | --- | ---: |
| `/#/home/oa-work-hours` | 请先选项目 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-work-hours::tab=工时填报` | 请先选项目 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-project-management` | 10 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/oa-products` | 20 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 安全部 3 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 智慧金融事业部 18 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 智慧城市事业部 104 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 销售部 41 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 售前 11 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 渠道市场 1 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 南区 6 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 北西区 6 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 质量管理部 3 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 法务部 2 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 财务部 6 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 技术部 102 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 平台研发部 18 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-okr` | 数据库研发部 37 | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-weekly-report` | 工作周报 | false | width: 224 → 230.8 | 0 |
| `/#/home/oa-token-management::tab=用量分析` | 全部 Token | false | 无可见计算样式差异 | 0 |
| `/#/home/oa-token-management::tab=用量分析` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 213.6；height: 40 → 32 | 0 |
| `/#/home/knowledge-datasource` | 全部分类 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-semantic` | 全部数据集 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-semantic::tab=校验中心` | 阳光消金 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-ontology::tab=实体管理` | 20 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-ontology::tab=关系管理` | 20 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-ontology::tab=指标管理` | 20 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-datacontext::tab=血缘影响` | 列 | false | width: 112 → 96 | 0 |
| `/#/home/data-center-datacontext::tab=指标概览` | 全部数据集 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/data-center-sync` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-overview::tab=治理排行榜` | 按域排行 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-map` | 全部类型 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-map::tab=数据检索` | 全部类型 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-map::tab=采集任务` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-map::tab=我的数据` | 全部类型 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-catalog` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-catalog::tab=资产盘点` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-catalog::tab=目录浏览` | 八类资产对象 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-standard` | 五类标准 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-standard::tab=标准集` | 五类标准 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-standard::tab=命名词典` | 全部类型 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-quality` | 六维全部 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-quality::tab=规则模板库` | 六维全部 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-quality::tab=校验记录` | 全部结果 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-quality::tab=问题工单` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-quality::tab=质量报告` | 质量周报 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-security` | 全部级别（L1-L5） | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-security::tab=分类分级` | 全部级别（L1-L5） | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-security::tab=脱敏策略` | 全部模式 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-security::tab=审计日志` | 全部事件 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-service` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-service::tab=服务注册` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-service::tab=授权管理` | 全部服务 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-service::tab=调用统计` | 全部服务 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-service::tab=外部数据台账` | 全部状态 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-dcmm::tab=证据库` | 全部类型 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/asset-dcmm::tab=制度库` | 全部制度 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/knowledge-kb` | 全部生效状态 | false | width: 128 → 144 | 0 |
| `/#/home/knowledge-kb` | 10 条/页 | false | width: 128 → 144 | 0 |
| `/#/home/knowledge-vector` | 中石油 | false | width: 192 → 160 | 0 |
| `/#/home/knowledge-vector` | 20 条/页 | false | width: 128 → 160 | 0 |
| `/#/home/knowledge-vector::tab=Chunk` | 中石油 | false | width: 192 → 160 | 0 |
| `/#/home/knowledge-vector::tab=Chunk` | 20 条/页 | false | width: 128 → 160 | 0 |
| `/#/home/knowledge-vector::tab=实体` | 中石油 | false | width: 192 → 160 | 0 |
| `/#/home/knowledge-vector::tab=实体` | 20 条/页 | false | width: 128 → 160 | 0 |
| `/#/home/knowledge-vector::tab=关系` | 中石油 | false | width: 192 → 160 | 0 |
| `/#/home/knowledge-vector::tab=关系` | 20 条/页 | false | width: 128 → 160 | 0 |
| `/#/home/knowledge-graph` | 中石油 | false | width: 192 → 128 | 0 |
| `/#/home/knowledge-graph::tab=图谱可视化` | 中石油 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/config-permission` | 全部状态 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-permission` | 全部角色 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-permission` | 全部组织 | false | width: 144 → 128 | 0 |
| `/#/home/config-permission` | 10 条/页 | false | width: 128 → 144 | 0 |
| `/#/home/config-permission::tab=用户管理` | 全部状态 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-permission::tab=用户管理` | 全部角色 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-permission::tab=用户管理` | 全部组织 | false | width: 144 → 128 | 0 |
| `/#/home/config-permission::tab=用户管理` | 10 条/页 | false | width: 128 → 144 | 0 |
| `/#/home/config-permission::tab=角色管理` | 10 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/config-permission::tab=功能菜单` | 全部板块 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/config-permission::tab=IM用户映射` | 全部平台 | false | width: 144 → 112 | 0 |
| `/#/home/config-messages` | 全部类型 | false | width: 120 → 97.6 | 0 |
| `/#/home/config-messages` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 97.6；height: 40 → 32 | 0 |
| `/#/home/config-messages::tab=消息列表` | 全部类型 | false | width: 120 → 97.6 | 0 |
| `/#/home/config-messages::tab=消息列表` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 97.6；height: 40 → 32 | 0 |
| `/#/home/config-messages::tab=消息模板` | 全部类型 | false | fontSize: 12px → 14px；lineHeight: 16px → 20px；width: 120 → 144；height: 32 → 40 | 0 |
| `/#/home/config-content-compliance::tab=合规事件` | 全部风险 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-content-compliance::tab=合规事件` | 全部处置 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-content-compliance::tab=合规事件` | 20 条/页 | false | width: 132 → 164 | 0 |
| `/#/home/config-risk-governance` | 全部领域 | false | width: 144 → 128 | 0 |
| `/#/home/config-risk-governance` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 128；height: 40 → 32 | 0 |
| `/#/home/config-risk-governance::tab=风险模型构建` | 全部领域 | false | width: 144 → 128 | 0 |
| `/#/home/config-risk-governance::tab=风险模型构建` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 128；height: 40 → 32 | 0 |
| `/#/home/config-risk-governance::tab=风险预警` | 全部状态 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-risk-governance::tab=风险预警` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 128；height: 40 → 32 | 0 |
| `/#/home/config-risk-governance::tab=风险闭环处置` | 全部状态 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-risk-governance::tab=风险闭环处置` | 20 条/页 | false | fontSize: 14px → 12px；lineHeight: 20px → 16px；width: 144 → 128；height: 40 → 32 | 0 |
| `/#/home/config-system-audit` | 全部分类 | false | width: 110 → 140 | 0 |
| `/#/home/config-system-audit` | 全部结果 | false | width: 100 → 140 | 0 |
| `/#/home/config-system-audit` | 全部平台 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-system-audit` | 20 条/页 | false | width: 132 → 100 | 0 |
| `/#/home/config-system-audit::tab=审计日志` | 全部分类 | false | width: 110 → 140 | 0 |
| `/#/home/config-system-audit::tab=审计日志` | 全部结果 | false | width: 100 → 140 | 0 |
| `/#/home/config-system-audit::tab=审计日志` | 全部平台 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-system-audit::tab=审计日志` | 20 条/页 | false | width: 132 → 100 | 0 |
| `/#/home/config-system-audit::tab=用量统计` | 20 条/页 | 未展开 | 无可见计算样式差异 | 0 |
| `/#/home/config-feedback-backtest` | 全部 | false | width: 100 → 120 | 0 |
| `/#/home/config-feedback-backtest` | 全部 | false | width: 100 → 120 | 0 |
| `/#/home/config-feedback-backtest` | 全部 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-feedback-backtest` | 20 条/页 | false | width: 96 → 100 | 0 |
| `/#/home/config-feedback-backtest::tab=反馈中心` | 全部 | false | width: 100 → 120 | 0 |
| `/#/home/config-feedback-backtest::tab=反馈中心` | 全部 | false | width: 100 → 120 | 0 |
| `/#/home/config-feedback-backtest::tab=反馈中心` | 全部 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-feedback-backtest::tab=反馈中心` | 20 条/页 | false | width: 96 → 100 | 0 |
| `/#/home/config-feedback-backtest::tab=评测集管理` | 状态 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-feedback-backtest::tab=评测集管理` | 分类 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-feedback-backtest::tab=评测集管理` | 20 条/页 | false | 无可见计算样式差异 | 0 |
| `/#/home/config-feedback-backtest::tab=回归测试` | 70% | false | 无可见计算样式差异 | 0 |

## 10. 图标系统

| 签名 | 类型/类名 | 尺寸 | viewBox 或 use | 图形复杂度 | 可访问名称 | aria-hidden | 样本数 |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| `5539e74a0bc3` | svg | 12×12 | 0 0 24 24 | path 1 / shape 1 | — | — | 994 |
| `acf69d112ba5` | svg | 15×15 | 0 0 24 24 | path 5 / shape 6 | — | — | 854 |
| `25e3db441970` | svg | 15×15 | 0 0 24 24 | path 5 / shape 5 | — | — | 490 |
| `02b191fe25a6` | svg | 16×16 | 0 0 24 24 | path 4 / shape 4 | — | — | 465 |
| `ec996dee5bbc` | svg | 15×15 | 0 0 24 24 | path 0 / shape 5 | — | — | 397 |
| `e738034e1c53` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 383 |
| `76eec4be5394` | svg | 15×15 | 0 0 24 24 | path 0 / shape 4 | — | — | 312 |
| `814c42919133` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 310 |
| `ada9389f7bd9` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 293 |
| `69894a351862` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 290 |
| `7853b824ff25` | text | 6.54×1.6 | — | path 0 / shape 0 | — | — | 180 |
| `f22931e6b259` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 178 |
| `36a4f27cfcca` | svg | 15×15 | 0 0 24 24 | path 3 / shape 5 | — | — | 173 |
| `ee7281008a0e` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 171 |
| `426509b58444` | svg | 15×15 | 0 0 24 24 | path 9 / shape 9 | — | — | 166 |
| `35823f9215b6` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 162 |
| `6c1ed6fcdd4f` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 158 |
| `627e75639da9` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 157 |
| `1d3fe741f4c9` | svg | 15×15 | 0 0 24 24 | path 0 / shape 2 | — | — | 156 |
| `24fa517e0fae` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 155 |
| `b897a109fe74` | svg | 15×15 | 0 0 24 24 | path 5 / shape 6 | — | — | 153 |
| `4da7e4b04d57` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 152 |
| `23ac6983d3b8` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 150 |
| `7bd1328a6177` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 149 |
| `02c1d5248158` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 149 |
| `95a79b3a4932` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 148 |
| `05394e706872` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 148 |
| `11d934bbb36f` | svg | 15×15 | 0 0 24 24 | path 0 / shape 3 | — | — | 146 |
| `9865243c084c` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 146 |
| `dc9cc1666fac` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 146 |
| `f1544e90b1e5` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 145 |
| `3affc7d225d9` | svg | 15×15 | 0 0 24 24 | path 2 / shape 5 | — | — | 144 |
| `8e7937970ce1` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 142 |
| `d8adc0693138` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 142 |
| `77dfc92e6221` | svg | 18×18 | 0 0 24 24 | path 1 / shape 1 | — | — | 142 |
| `5a16fabc6311` | svg | 15×15 | 0 0 24 24 | path 9 / shape 11 | — | — | 142 |
| `a15004869dbb` | svg | 15×15 | 0 0 24 24 | path 9 / shape 9 | — | — | 142 |
| `8d695ffdc9e5` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 142 |
| `350afde1332b` | svg | 15×15 | 0 0 24 24 | path 9 / shape 13 | — | — | 142 |
| `6a168e00335f` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 142 |
| `a5fe0edeae40` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 142 |
| `cd37e2a4ab9c` | svg | 15×15 | 0 0 24 24 | path 5 / shape 5 | — | — | 142 |
| `1a65e046fd72` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 142 |
| `30d80cbabc61` | svg | 15×15 | 0 0 24 24 | path 5 / shape 5 | — | — | 142 |
| `ce2b45045006` | svg | 14×14 | 0 0 24 24 | path 3 / shape 5 | — | — | 114 |
| `49d12c471e30` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 100 |
| `0d3432f944b4` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 100 |
| `c7bbf2aab0bc` | svg | 10×10 | 0 0 24 24 | path 1 / shape 2 | — | — | 90 |
| `6388440867bd` | svg | 10×10 | 0 0 24 24 | path 1 / shape 1 | — | — | 78 |
| `dc14798f848e` | svg | 14×14 | 0 0 24 24 | path 4 / shape 4 | — | — | 66 |
| `dd0d174c00cc` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 65 |
| `8a3e9d65afe0` | svg | 12×12 | 0 0 24 24 | path 1 / shape 2 | — | — | 59 |
| `7bc5ff437c66` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 59 |
| `8df5eeb4d2ef` | svg | 13×13 | 0 0 24 24 | path 3 / shape 5 | — | — | 57 |
| `cbed2c489e4a` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 56 |
| `019f3caffe68` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 55 |
| `5f2e86eb0f77` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 55 |
| `42bf85718097` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 52 |
| `96f5ddc2badc` | svg | 12×12 | 0 0 24 24 | path 9 / shape 9 | — | — | 50 |
| `1a8bd7cc9112` | svg | 12×12 | 0 0 24 24 | path 2 / shape 3 | — | — | 50 |
| `da14f5498db1` | svg | 12×12 | 0 0 24 24 | path 4 / shape 4 | — | — | 50 |
| `82e9c3700b0d` | svg | 13×13 | 0 0 24 24 | path 3 / shape 3 | — | — | 50 |
| `af88f2ce1a2a` | svg | 18×18 | 0 0 24 24 | path 8 / shape 10 | — | — | 48 |
| `b31815be0b16` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 48 |
| `f93d60f75f12` | svg | 15×15 | 0 0 24 24 | path 0 / shape 9 | — | — | 47 |
| `05d55fef3a9f` | svg | 12×12 | 0 0 24 24 | path 1 / shape 2 | — | — | 42 |
| `184a45171fe0` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 40 |
| `2faf414ea2aa` | svg | 14×14 | 0 0 24 24 | path 3 / shape 5 | — | — | 40 |
| `c6beb3af9d8b` | svg | 16×16 | 0 0 24 24 | path 1 / shape 1 | — | — | 40 |
| `2468825ea9c7` | svg | 12×12 | 0 0 24 24 | path 3 / shape 3 | — | — | 38 |
| `53aba9e57545` | svg | 12×12 | 0 0 24 24 | path 2 / shape 2 | — | — | 38 |
| `948e4da7a9a6` | svg | 12×12 | 0 0 24 24 | path 3 / shape 3 | — | — | 38 |
| `e4747c0c8c69` | svg | 32×32 | 0 0 24 24 | path 1 / shape 1 | — | — | 32 |
| `a0fad2ec1db1` | svg | 12×12 | 0 0 24 24 | path 3 / shape 3 | — | — | 32 |
| `8dc8c9a96587` | svg | 16×16 | 0 0 24 24 | path 2 / shape 2 | — | — | 28 |
| `5598f1b4b520` | svg | 15×15 | 0 0 24 24 | path 0 / shape 1 | — | — | 26 |
| `5757f7d788c4` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 25 |
| `65d84cf97bc5` | svg | 13×13 | 0 0 24 24 | path 1 / shape 1 | — | — | 25 |
| `090a963fc794` | svg | 16×16 | 0 0 24 24 | path 0 / shape 1 | — | — | 25 |
| `d8bf540e0846` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 23 |
| `b55a8804bb8c` | svg | 11×11 | 0 0 24 24 | path 3 / shape 5 | — | — | 23 |
| `be3671a0ff6f` | svg | 12×12 | 0 0 24 24 | path 3 / shape 5 | — | — | 22 |
| `25eb5f1d7187` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 22 |
| `d24a7f7fbe16` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 21 |
| `c7560df68272` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 21 |
| `621f547610bc` | svg | 12×12 | 0 0 24 24 | path 2 / shape 2 | — | — | 20 |
| `9310886a14a1` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 20 |
| `a843fdaa3580` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 20 |
| `b3b73c77db9d` | svg | 14×14 | 0 0 24 24 | path 2 / shape 3 | — | — | 20 |
| `ba082d0c845f` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 20 |
| `ac55b17d6186` | svg | 14×14 | 0 0 24 24 | path 9 / shape 11 | — | — | 20 |
| `156eb1518712` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 19 |
| `3bd4eadeded6` | svg | 13×13 | 0 0 24 24 | path 1 / shape 1 | — | — | 18 |
| `f39d1b19fe81` | svg | 14×14 | 0 0 24 24 | path 4 / shape 4 | — | — | 17 |
| `95c133bee5c9` | svg | 15×15 | 0 0 24 24 | path 0 / shape 4 | — | — | 16 |
| `689f396c327c` | svg | 16×16 | 0 0 24 24 | path 1 / shape 1 | — | — | 15 |
| `a6433cf2b811` | svg | 16×16 | 0 0 24 24 | path 1 / shape 1 | — | — | 15 |
| `f1226d024bf9` | svg | 13×13 | 0 0 24 24 | path 1 / shape 1 | — | — | 15 |
| `39b841fe69c3` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 15 |
| `5b0531e42f11` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 15 |
| `44b17ab17d2b` | svg | 13×13 | 0 0 24 24 | path 5 / shape 5 | — | — | 15 |
| `38ca0bbb52d7` | svg | 15×15 | 0 0 24 24 | path 0 / shape 2 | — | — | 14 |
| `d93eace41efa` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 14 |
| `889eb537f39d` | svg | 14×14 | 0 0 24 24 | path 0 / shape 1 | — | — | 13 |
| `90529d812b73` | svg | 15×15 | 0 0 24 24 | path 5 / shape 5 | — | — | 13 |
| `201bb2800d9e` | svg | 15×15 | 0 0 24 24 | path 5 / shape 5 | — | — | 13 |
| `049144be8778` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 13 |
| `c1947a0ba4f2` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 13 |
| `fa5481fefc0c` | svg | 12×12 | 0 0 24 24 | path 2 / shape 2 | — | — | 13 |
| `8d4d62e05d83` | svg | 19×19 | 0 0 24 24 | path 2 / shape 2 | — | — | 12 |
| `6651a0e40569` | svg | 16×16 | 0 0 24 24 | path 2 / shape 2 | — | — | 12 |
| `27ab6aae8cd3` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 11 |
| `924598844865` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 11 |
| `2ddb89c7e7aa` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 10 |
| `83d502f6fabe` | svg | 14×14 | 0 0 24 24 | path 1 / shape 4 | — | — | 10 |
| `f4ab611a66f9` | svg | 14×14 | 0 0 24 24 | path 2 / shape 4 | — | — | 10 |
| `831a3ee4611c` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 10 |
| `013063a5a762` | svg | 14×14 | 0 0 24 24 | path 3 / shape 5 | — | — | 10 |
| `aa46e45007b9` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 10 |
| `f991511705d4` | svg | 12×12 | 0 0 24 24 | path 1 / shape 2 | — | — | 10 |
| `e06cec857acb` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 10 |
| `af9da690bb4c` | svg | 13×13 | 0 0 24 24 | path 1 / shape 2 | — | — | 10 |
| `55c13f7d7006` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 10 |
| `013f228b61d3` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 9 |
| `8f23b0594417` | svg | 15×15 | 0 0 24 24 | path 3 / shape 4 | — | — | 9 |
| `2a3a63ac6ca8` | svg | 10×10 | 0 0 24 24 | path 1 / shape 2 | — | — | 8 |
| `5376b822cbad` | svg | 12×12 | 0 0 24 24 | path 1 / shape 1 | — | — | 8 |
| `f9874fb51b87` | svg | 20×20 | 0 0 24 24 | path 0 / shape 2 | — | — | 8 |
| `83eb9b848631` | i.w-2.5.h-2.5.rounded-sm.inline-block | 10×10 | — | path 0 / shape 0 | — | — | 8 |
| `47f75b9943a7` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 8 |
| `79cc0472d446` | svg | 19×19 | 0 0 24 24 | path 9 / shape 9 | — | — | 8 |
| `408759c7d67c` | svg | 32×32 | 0 0 24 24 | path 2 / shape 3 | — | — | 8 |
| `d6c64ec51efe` | svg | 14×14 | 0 0 24 24 | path 0 / shape 3 | — | — | 8 |
| `a0d7bc78b863` | svg | 19×19 | 0 0 24 24 | path 1 / shape 1 | — | — | 8 |
| `34f68b907015` | svg | 12×12 | 0 0 24 24 | path 5 / shape 6 | — | — | 8 |
| `234458d1c63a` | svg | 14×14 | 0 0 24 24 | path 4 / shape 4 | — | — | 7 |
| `0c648d4172b3` | svg | 12×12 | 0 0 24 24 | path 1 / shape 1 | — | — | 7 |
| `90e0fe6c843f` | svg | 15×15 | 0 0 24 24 | path 0 / shape 1 | — | — | 7 |
| `9adbc1381ec6` | svg | 12×12 | 0 0 24 24 | path 2 / shape 3 | — | — | 7 |
| `1acfe112de13` | svg | 12×12 | 0 0 24 24 | path 2 / shape 3 | — | — | 7 |
| `aa4edfcf7d3f` | svg | 19×19 | 0 0 24 24 | path 4 / shape 4 | — | — | 7 |
| `9efe205c8acc` | svg | 15×15 | 0 0 24 24 | path 0 / shape 4 | — | — | 7 |
| `52023bcef083` | svg | 15×15 | 0 0 24 24 | path 3 / shape 4 | — | — | 7 |
| `ee267d8afe84` | svg | 19×19 | 0 0 24 24 | path 2 / shape 2 | — | — | 7 |
| `52ff5db00936` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 7 |
| `e897264d6b10` | svg | 12×12 | 0 0 24 24 | path 1 / shape 1 | — | — | 7 |
| `72e382c5caef` | svg | 12×12 | 0 0 24 24 | path 0 / shape 2 | — | — | 7 |
| `bca2d37bc3c6` | svg | 10.01×11 | 0 0 24 24 | path 1 / shape 1 | — | — | 7 |
| `694db8b2bd15` | svg | 10.01×11 | 0 0 24 24 | path 5 / shape 5 | — | — | 7 |
| `5e812c145ca5` | svg | 19×19 | 0 0 24 24 | path 1 / shape 1 | — | — | 7 |
| `31c3cd252e03` | svg | 15×15 | 0 0 24 24 | path 7 / shape 7 | — | — | 7 |
| `29518910f2bb` | svg | 12×12 | 0 0 24 24 | path 4 / shape 4 | — | — | 6 |
| `63a774915104` | svg | 16×16 | 0 0 24 24 | path 1 / shape 1 | — | — | 6 |
| `3b8c2b58ef9d` | svg | 19×19 | 0 0 24 24 | path 2 / shape 5 | — | — | 6 |
| `06e927caeafb` | svg | 15×15 | 0 0 24 24 | path 2 / shape 5 | — | — | 6 |
| `4dc605a7ba78` | svg | 19×19 | 0 0 24 24 | path 3 / shape 3 | — | — | 6 |
| `1035bcfce1cf` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 6 |
| `5adf312e8251` | svg | 19×19 | 0 0 24 24 | path 5 / shape 5 | — | — | 6 |
| `b7ff4fa49af1` | svg | 15×15 | 0 0 24 24 | path 0 / shape 4 | — | — | 6 |
| `bb378fd84116` | svg | 15×15 | 0 0 24 24 | path 0 / shape 3 | — | — | 6 |
| `0cabce0beb76` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 6 |
| `aec6634db1c8` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 6 |
| `b11a89a6292a` | svg | 19×19 | 0 0 24 24 | path 0 / shape 4 | — | — | 6 |
| `0fa199bbb999` | svg | 15×15 | 0 0 24 24 | path 5 / shape 5 | — | — | 6 |
| `4a80ff4aec4b` | svg | 19×19 | 0 0 24 24 | path 1 / shape 2 | — | — | 6 |
| `9645c23c87db` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 6 |
| `8a41750e4924` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 6 |
| `c63ce1d77b8e` | svg | 15×15 | 0 0 24 24 | path 0 / shape 5 | — | — | 6 |
| `d6499cb0bbc4` | svg | 11×11 | 0 0 24 24 | path 3 / shape 3 | — | — | 6 |
| `9c95112c3131` | svg | 15×15 | 0 0 24 24 | path 8 / shape 10 | — | — | 6 |
| `50a141d7757d` | svg | 15×15 | 0 0 24 24 | path 0 / shape 9 | — | — | 6 |
| `3abe9e3b7dd3` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 6 |
| `772085702da0` | svg | 12×12 | 0 0 24 24 | path 0 / shape 2 | — | — | 5 |
| `83d95728da2c` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 5 |
| `3abae59cc59a` | svg | 32×32 | 0 0 24 24 | path 1 / shape 2 | — | — | 5 |
| `c0329b0d9d8e` | svg | 19×19 | 0 0 24 24 | path 0 / shape 4 | — | — | 5 |
| `75303a6c3965` | svg | 15×15 | 0 0 24 24 | path 6 / shape 6 | — | — | 5 |
| `2896c98ddc8d` | svg | 18×18 | 0 0 24 24 | path 4 / shape 4 | — | — | 5 |
| `61227cecf91f` | svg | 10.01×11 | 0 0 24 24 | path 0 / shape 1 | — | — | 5 |
| `1cf2a9f892c3` | svg | 19×19 | 0 0 24 24 | path 1 / shape 2 | — | — | 5 |
| `84c3fc00c05e` | svg | 11×11 | 0 0 24 24 | path 3 / shape 3 | — | — | 5 |
| `ef6cdae7678d` | svg | 16×16 | 0 0 24 24 | path 5 / shape 6 | — | — | 4 |
| `86b21378e9b5` | svg | 16×16 | 0 0 24 24 | path 7 / shape 7 | — | — | 4 |
| `d54633e681b8` | svg | 16×16 | 0 0 24 24 | path 3 / shape 4 | — | — | 4 |
| `73e458b30b50` | svg | 16×16 | 0 0 24 24 | path 2 / shape 3 | — | — | 4 |
| `bd2cfe5d6e21` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 4 |
| `6a284c06e51f` | svg | 19×19 | 0 0 24 24 | path 2 / shape 3 | — | — | 4 |
| `744c1da5f684` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 4 |
| `f36308baba73` | svg | 15×15 | 0 0 24 24 | path 1 / shape 3 | — | — | 4 |
| `bd42ffeb840d` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 4 |
| `135718bef53b` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 4 |
| `94a3fb3adb55` | svg | 13×13 | 0 0 24 24 | path 3 / shape 5 | — | — | 4 |
| `58722409a64f` | svg | 15×15 | 0 0 24 24 | path 0 / shape 3 | — | — | 4 |
| `e8cd59039c26` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 4 |
| `fb709ce212b1` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 4 |
| `d00a9899f0aa` | svg | 18×18 | 0 0 24 24 | path 3 / shape 3 | — | — | 4 |
| `70d0980760d1` | svg | 19×19 | 0 0 24 24 | path 3 / shape 3 | — | — | 4 |
| `1e09f6650694` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 4 |
| `f2b2b1ea1a56` | svg | 19×19 | 0 0 24 24 | path 5 / shape 6 | — | — | 4 |
| `1aabb9d166cc` | svg | 19×19 | 0 0 24 24 | path 1 / shape 1 | — | — | 4 |
| `5cbae1000753` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 4 |
| `8e733fda5ede` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 3 |
| `3e610e7668bd` | svg | 12×12 | 0 0 24 24 | path 2 / shape 3 | — | — | 3 |
| `f571a16fb7a2` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 3 |
| `211d737a8d29` | svg | 18×18 | 0 0 24 24 | path 1 / shape 3 | — | — | 3 |
| `cebb40ac8eb4` | svg | 19×19 | 0 0 24 24 | path 9 / shape 13 | — | — | 3 |
| `99786330c4e0` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 3 |
| `8c5882599a95` | svg | 14×14 | 0 0 24 24 | path 2 / shape 3 | — | — | 3 |
| `6f70417be5cf` | svg | 16×16 | 0 0 24 24 | path 2 / shape 2 | — | — | 3 |
| `c0f83297660d` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 3 |
| `db872af20856` | svg | 12×12 | 0 0 24 24 | path 1 / shape 2 | — | — | 3 |
| `6feb6f871bc4` | svg | 16×16 | 0 0 24 24 | path 1 / shape 2 | — | — | 3 |
| `6dfea1d42818` | svg | 19×19 | 0 0 24 24 | path 2 / shape 2 | — | — | 3 |
| `8bc3ae9db78c` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 3 |
| `ce702f24906e` | svg | 10×10 | 0 0 24 24 | path 0 / shape 2 | — | — | 3 |
| `a66dba885604` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `3a6c262f87d3` | svg | 16×16 | 0 0 24 24 | path 1 / shape 2 | — | — | 2 |
| `4a8ef4cbf923` | svg | 16×16 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `ceaf0bed2b94` | svg | 14×14 | 0 0 24 24 | path 0 / shape 3 | — | — | 2 |
| `060667b7fe16` | svg | 16×16 | 0 0 24 24 | path 2 / shape 3 | — | — | 2 |
| `a66290770de8` | svg | 20×20 | 0 0 24 24 | path 5 / shape 6 | — | — | 2 |
| `411b2bd6b0ec` | svg | 12×12 | 0 0 24 24 | path 5 / shape 6 | — | — | 2 |
| `6c504fdb2944` | svg | 10×10 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `9b989f67be1a` | svg | 16×16 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `fd852caf150a` | svg | 12×12 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `5e5c03b5126b` | svg | 16×16 | 0 0 24 24 | path 5 / shape 5 | — | — | 2 |
| `94abad0fdaca` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 2 |
| `ac5d739a7f16` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `038fce75186d` | svg | 14×14 | 0 0 24 24 | path 1 / shape 4 | — | — | 2 |
| `26fb580fa37d` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `8c086084fa0e` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `17503cd95aa2` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 2 |
| `97903f6d0087` | button.okr-icon-button.okr-optional-action | 32×32 | — | path 0 / shape 0 | 评论 | — | 2 |
| `80945a471752` | svg | 15×15 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `1294157218bf` | svg | 13×13 | 0 0 24 24 | path 0 / shape 4 | — | — | 2 |
| `ec64e325c30a` | svg | 13×13 | 0 0 24 24 | path 0 / shape 3 | — | — | 2 |
| `e6eb26cad2ba` | svg | 13×13 | 0 0 24 24 | path 0 / shape 4 | — | — | 2 |
| `3ac989d3ee45` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `4126edf301af` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `14ececf06dd4` | svg | 14×14 | 0 0 24 24 | path 0 / shape 2 | — | — | 2 |
| `47c56f6f29f0` | svg | 12×12 | 0 0 24 24 | path 0 / shape 3 | — | — | 2 |
| `698bee33b169` | svg | 14×14 | 0 0 24 24 | path 0 / shape 2 | — | — | 2 |
| `6b94ebc8d036` | svg | 14×14 | 0 0 24 24 | path 0 / shape 1 | — | — | 2 |
| `00e91d8d5413` | svg | 18×6 | — | path 0 / shape 1 | — | — | 2 |
| `17ace6f3b857` | svg | 14×14 | 0 0 24 24 | path 1 / shape 4 | — | — | 2 |
| `daf7124c2b9b` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `e471a3cdd507` | svg | 14×14 | 0 0 24 24 | path 12 / shape 12 | — | — | 2 |
| `a094c5ce4174` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `f6aacaf57a54` | svg | 14×14 | 0 0 24 24 | path 4 / shape 4 | — | — | 2 |
| `d5202736bb8a` | svg | 15×15 | 0 0 24 24 | path 3 / shape 4 | — | — | 2 |
| `8755ab90ae50` | svg | 18×18 | 0 0 24 24 | path 5 / shape 6 | — | — | 2 |
| `0f2c31b6a4ed` | svg | 18×18 | 0 0 24 24 | path 2 / shape 3 | — | — | 2 |
| `c4b756b5e057` | svg | 18×18 | 0 0 24 24 | path 3 / shape 3 | — | — | 2 |
| `a27fb7e3b550` | svg | 18×18 | 0 0 24 24 | path 0 / shape 2 | — | — | 2 |
| `c93c5df22847` | svg | 18×18 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `d13d25efa4d9` | svg | 10.01×11 | 0 0 24 24 | path 0 / shape 2 | — | — | 2 |
| `d90a023541c8` | svg | 13×13 | 0 0 24 24 | path 0 / shape 4 | — | — | 2 |
| `0d1f348f779a` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 2 |
| `b0992a1f9147` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `d19e5446ef94` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `df1643738e8e` | svg | 16×16 | 0 0 24 24 | path 9 / shape 11 | — | — | 2 |
| `ab6bfec9c798` | svg | 16×16 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `95ce0093332d` | svg | 16×16 | 0 0 24 24 | path 0 / shape 2 | — | — | 2 |
| `bdc7cada5018` | svg | 16×16 | 0 0 24 24 | path 0 / shape 3 | — | — | 2 |
| `fabc6cf4fbc5` | svg | 12×12 | 0 0 24 24 | path 1 / shape 2 | — | — | 2 |
| `f338c1572030` | svg | 12×12 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `85dbde3cf013` | svg | 18×18 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `78cafb335726` | svg | 18×18 | 0 0 24 24 | path 1 / shape 2 | — | — | 2 |
| `43fc32141328` | svg | 18×18 | 0 0 24 24 | path 0 / shape 9 | — | — | 2 |
| `697b2bebc886` | svg | 18×18 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `33990fe75239` | svg | 18×18 | 0 0 24 24 | path 3 / shape 3 | — | — | 2 |
| `aeb65ca14dfa` | svg | 15×15 | 0 0 24 24 | path 6 / shape 6 | — | — | 2 |
| `e2293d07eb09` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 2 |
| `2c9c2d9674b0` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 2 |
| `eb6bf76ec2ee` | svg | 14×14 | 0 0 24 24 | path 0 / shape 1 | — | — | 2 |
| `2b34298a7fa1` | svg | 14×14 | 0 0 24 24 | path 1 / shape 3 | — | — | 2 |
| `f57e1dbacc9f` | svg | 16×16 | 0 0 24 24 | path 3 / shape 4 | — | — | 2 |
| `d0cfd4122b70` | svg | 18×18 | 0 0 24 24 | path 3 / shape 4 | — | — | 2 |
| `ac79f0180eb3` | svg | 18×18 | 0 0 24 24 | path 0 / shape 3 | — | — | 2 |
| `5823e08ab184` | svg | 18×18 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `adb20997eac5` | svg | 18×18 | 0 0 24 24 | path 2 / shape 2 | — | — | 2 |
| `6ecee7a65c37` | svg | 12×12 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `f1c76f3bc627` | svg | 12×12 | 0 0 24 24 | path 4 / shape 5 | — | — | 1 |
| `b69e81920ea1` | svg | 18×18 | 0 0 24 24 | path 1 / shape 5 | — | — | 1 |
| `164798547f90` | svg | 18×18 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `d2fa79188f4b` | svg | 18×18 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `6ed38a4771a3` | svg | 18×18 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `89e2e97f7c66` | svg | 18×18 | 0 0 24 24 | path 5 / shape 5 | — | — | 1 |
| `9c59e4d06333` | svg | 18×18 | 0 0 24 24 | path 0 / shape 4 | — | — | 1 |
| `87f3fcadb93d` | svg | 18×18 | 0 0 24 24 | path 0 / shape 2 | — | — | 1 |
| `22e43eaa7f19` | svg | 18×18 | 0 0 24 24 | path 1 / shape 4 | — | — | 1 |
| `c43fe4fff74f` | svg | 18×18 | 0 0 24 24 | path 5 / shape 5 | — | — | 1 |
| `f66cdbf1f7d6` | svg | 12×12 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `5abead665894` | svg | 10×10 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `a97809bcdaac` | svg | 18×18 | 0 0 24 24 | path 2 / shape 3 | — | — | 1 |
| `df494bedf330` | svg | 16×16 | 0 0 24 24 | path 1 / shape 4 | — | — | 1 |
| `13e53e2dbfcf` | svg | 16×16 | 0 0 24 24 | path 8 / shape 10 | — | — | 1 |
| `09e550bd4c18` | svg | 16×16 | 0 0 24 24 | path 2 / shape 3 | — | — | 1 |
| `ad689c3c1fe7` | svg | 16×16 | 0 0 24 24 | path 9 / shape 9 | — | — | 1 |
| `452a0cdf823c` | svg | 15×15 | 0 0 24 24 | path 2 / shape 5 | — | — | 1 |
| `a5e424ada7e7` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `bbdb691118e9` | svg | 14×14 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `37b83325ad79` | svg | 16.06×16.06 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `f561bd28320f` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `6e5d75a4baff` | svg | 14×14 | 0 0 24 24 | path 7 / shape 7 | — | — | 1 |
| `2cfed5ac0d7a` | button.okr-icon-button.hover:!text-[var(--color-primary)] | 32×32 | — | path 0 / shape 0 | 权限设置 | — | 1 |
| `164568216379` | svg | 18×18 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `bf1da5153fbe` | svg | 18×18 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `8a3a27fb7978` | button.okr-icon-button | 32×32 | — | path 0 / shape 0 | 更多 | — | 1 |
| `6e18fa4888f2` | svg | 18×18 | 0 0 24 24 | path 0 / shape 3 | — | — | 1 |
| `d7178cca629e` | span.weekly-report-team-group-row__icon | 18×14 | — | path 0 / shape 0 | — | — | 1 |
| `eb77a8076f1d` | svg | 14×14 | 0 0 24 24 | path 3 / shape 4 | — | — | 1 |
| `c590043b9755` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `a43524fa74d7` | svg | 14×14 | 0 0 24 24 | path 7 / shape 7 | — | — | 1 |
| `2141c2c169bf` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `ef0622f1ff09` | svg | 15×15 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `b4cf66ad775d` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `944eefc8b0a7` | svg | 14×14 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `4072fcc00b76` | svg | 16×16 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `d4dd71278866` | svg | 19×19 | 0 0 24 24 | path 2 / shape 3 | — | — | 1 |
| `4aa7660fa499` | svg | 19×19 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `54216d22cad9` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `efe55275bf90` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `e7a367bab982` | svg | 14×14 | 0 0 24 24 | path 5 / shape 6 | — | — | 1 |
| `c8c870b2a163` | svg | 14×14 | 0 0 24 24 | path 0 / shape 4 | — | — | 1 |
| `6c1707b7ccac` | svg | 14×14 | 0 0 24 24 | path 0 / shape 3 | — | — | 1 |
| `11a639b1d734` | svg | 14×14 | 0 0 24 24 | path 0 / shape 4 | — | — | 1 |
| `601e58ab699a` | svg | 1108.8×568.2 | 0 0 1109 568 | path 179 / shape 899 | — | — | 1 |
| `7a51e5eb9a3a` | svg | 14×14 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `e44ebe16885f` | svg | 14×14 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `b2fa1fe96e42` | svg | 13×13 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `753c243836f2` | svg | 1093.6×620 | 0 0 1094 620 | path 3 / shape 91 | — | — | 1 |
| `c5f09537696b` | svg | 28.48×28.48 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `85a08b215b94` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `3a27fa14fe70` | svg | 14×14 | 0 0 24 24 | path 2 / shape 5 | — | — | 1 |
| `ae2be75f4b02` | svg | 14×14 | 0 0 24 24 | path 6 / shape 6 | — | — | 1 |
| `11c35e490eab` | svg | 12×12 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `d81335bb2cfd` | svg | 12×12 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `fc9f9121762f` | svg | 1108.8×501.6 | 0 0 1109 502 | path 1099 / shape 3285 | — | — | 1 |
| `6ae7cda58428` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `c6b5f8cecc40` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `f9e476d2517b` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `b16d8ef3b92b` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `0445135e3033` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `5ad8e160aaf8` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `3893de2a99ae` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `0a421eb04a0a` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `9d47e6794963` | svg | 18×6 | — | path 0 / shape 1 | — | — | 1 |
| `e3b8cf5bba5c` | svg | 14×14 | 0 0 24 24 | path 2 / shape 5 | — | — | 1 |
| `d4a5f5a71f5a` | svg | 13×13 | 0 0 24 24 | path 2 / shape 5 | — | — | 1 |
| `155246d69780` | svg | 13×13 | 0 0 24 24 | path 6 / shape 6 | — | — | 1 |
| `f2e20654cefd` | svg | 33.89×33.89 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `7e710b141592` | svg | 19×19 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `4797dfcdd8bc` | svg | 14×14 | 0 0 24 24 | path 0 / shape 5 | — | — | 1 |
| `9ffcaf514907` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `c25844d5a20c` | svg | 14×14 | 0 0 24 24 | path 5 / shape 5 | — | — | 1 |
| `2b7f05ae3817` | svg | 14×14 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `6674808c477d` | svg | 15×15 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `939705e865a4` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `c2f08e8a3c85` | svg | 14×14 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `484de81b5c5d` | svg | 13×13 | 0 0 24 24 | path 2 / shape 3 | — | — | 1 |
| `285ff8571d27` | svg | 13×13 | 0 0 24 24 | path 0 / shape 4 | — | — | 1 |
| `d3dd3f73e989` | svg | 14×14 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `732eb92bdc60` | svg | 16×16 | 0 0 24 24 | path 0 / shape 4 | — | — | 1 |
| `e4bb739bb5d9` | svg | 932.8×603.4 | — | path 1 / shape 311 | — | — | 1 |
| `e29a0137e304` | svg | 13×13 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `5c98e6b0b06d` | svg | 12×12 | 0 0 24 24 | path 3 / shape 5 | — | — | 1 |
| `7060a1e65519` | svg | 19.55×19.55 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `a999ab44c739` | svg | 22.35×22.35 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `099ba23c0c24` | svg | 11×11 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `7cb7be531eb4` | svg | 11×11 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `26a4ac07b450` | svg | 24×24 | 0 0 24 24 | path 3 / shape 4 | — | — | 1 |
| `3ec1ae5af868` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `64496af2b19b` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `ff9ef0aa9135` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `2a39d12598db` | svg | 16×16 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `f64b5cf38cca` | svg | 16×16 | 0 0 24 24 | path 0 / shape 2 | — | — | 1 |
| `4fcf50b96e62` | svg | 16×16 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `cdd1b273ddcc` | svg | 14×14 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `971846e11d15` | svg | 15×15 | 0 0 24 24 | path 0 / shape 1 | — | — | 1 |
| `394b0837fc06` | svg | 15×15 | 0 0 24 24 | path 0 / shape 9 | — | — | 1 |
| `7570040b0f34` | svg | 13×13 | 0 0 24 24 | path 5 / shape 6 | — | — | 1 |
| `b7026a160900` | svg | 13×13 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `a11b6efaf962` | svg | 13×13 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `8fc7dcc6e5df` | svg | 13×13 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `de7ae6b91a14` | svg | 13×13 | 0 0 24 24 | path 1 / shape 1 | — | — | 1 |
| `ed900c6842bc` | svg | 13×13 | 0 0 24 24 | path 2 / shape 2 | — | — | 1 |
| `eff4e1a2349d` | svg | 18×18 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `2f485e344611` | svg | 18×18 | 0 0 24 24 | path 6 / shape 6 | — | — | 1 |
| `854cf6a5ebd0` | svg | 15×15 | 0 0 24 24 | path 2 / shape 3 | — | — | 1 |
| `53bb4ec39b29` | svg | 15×15 | 0 0 24 24 | path 1 / shape 2 | — | — | 1 |
| `10dbeb17f13f` | svg | 15×15 | 0 0 24 24 | path 3 / shape 5 | — | — | 1 |
| `57c21885eb77` | svg | 15×15 | 0 0 24 24 | path 4 / shape 4 | — | — | 1 |
| `a589292d9213` | svg | 48×48 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |
| `559f854ac211` | svg | 12×12 | 0 0 24 24 | path 3 / shape 3 | — | — | 1 |

## 11. 图片、样式表与资源

### 11.1 样式表

- 页面没有使用外链 `<link rel="stylesheet">`，样式可能由脚本注入或打包在其他资源中。

### 11.2 图片资源

| 来源 | 原始尺寸 | 渲染尺寸 | Alt | 样本数 |
| --- | --- | --- | --- | ---: |
| `https://ai.seaboxdata.com/logo.png` | 80×78 | 28×28 | 东方金信 | 142 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 1280×1280 | 30.4×30.4 | [当前用户] | 147 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 1125×1125 | 22.4×22.4 | — | 3 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 480×480 | 20×20 | — | 51 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 940×940 | 22.4×22.4 | — | 5 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 1242×1242 | 22.4×22.4 | — | 8 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 828×828 | 20×20 | — | 5 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 1170×1170 | 20×20 | — | 7 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 456×456 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 939×940 | 22.4×22.4 | — | 2 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 585×585 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 800×800 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 664×663 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 937×937 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 640×480 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 750×750 | 22.4×22.4 | — | 9 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 640×640 | 20×20 | — | 5 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 551×557 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 632×640 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 635×640 | 22.4×22.4 | — | 1 |
| `https://wx.qlogo.cn/[第三方业务图片已脱敏]` | 640×640 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 640×638 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 640×619 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 617×640 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 1179×1179 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 631×640 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 639×640 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 0×0 | 22.4×22.4 | — | 234 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 627×640 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 959×960 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 353×350 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 1031×1031 | 22.4×22.4 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 700×700 | 22.4×22.4 | — | 1 |
| `http://wework.qpic.cn/[第三方业务图片已脱敏]` | 0×0 | 22.4×22.4 | — | 10 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 404×404 | 20×20 | — | 1 |
| `https://wework.qpic.cn/[第三方业务图片已脱敏]` | 960×960 | 20×20 | — | 1 |

## 12. 可访问性观察

- 可交互控件总数：**12211**；缺少可见文本或 ARIA 名称的控件：**2131**。
- 图标实例中未标记 `aria-hidden="true"` 且没有可访问名称的数量：**13151**。
- 页面模板中 H1 数量异常（不是恰好一个）的页面：**137**。
- 以上为静态证据检查，不替代键盘全流程、屏幕阅读器或颜色对比度专项测试。

## 13. 可复用设计系统定义

基于本报告复刻时，应按以下优先级使用证据：

1. 页面根级 CSS 自定义属性及其现场值。
2. 同类组件在多个页面上的共同计算样式、尺寸和状态差异。
3. 页面 Landmark、固定区域和两个桌面视口下的实际布局。
4. 字体加载结果、标题层级和字号/字重/行高频率。
5. 图标签名、尺寸、viewBox/use 关系及可访问名称。
6. 当来源证据不一致时，应在复刻前标记为变体或遗留差异，不自行合并为新 token。

## 14. 术语表

| 术语 | 本报告中的精确定义 |
| --- | --- |
| 页面模板 | 路由结构、主要布局和组件集合相同的一类页面；不同业务 ID 不重复计数。 |
| 页面实例 | 页面模板绑定某个具体任务、智能体或业务记录后的实际页面。 |
| 设计令牌 | 可稳定复用的颜色、字体、间距、圆角、阴影、尺寸和动效值；优先来自 CSS 自定义属性。 |
| 组件模式 | 具有共同语义、结构、样式和交互状态的一组可见控件。 |
| 现场证据 | Playwright 在目标网站当前版本中读取的 DOM、计算样式、字体、资源、布局和状态数据。 |
| 安全交互 | 不提交数据、不改变业务状态且可恢复的导航、Hover、Focus 和展开操作。 |

## 15. 局限与置信度

- 报告覆盖当前账号权限内、DOM 可发现的同源页面；权限外页面、无链接隐藏页面和仅通过危险操作才能出现的状态不在范围内。
- Loading、Empty、Error、Disabled 等状态只有在正常只读访问中自然出现时才会被记录，不通过故障注入或修改数据强行触发。
- CSS 伪元素、Canvas/WebGL 内部绘制和跨域受限样式可能无法完整反向解析。
- 网络状态：401=11，403=0，429=0，5xx=0。
- 总体置信度：高：所有发现的安全页面模板均已采集，且未触发限流或服务异常。

