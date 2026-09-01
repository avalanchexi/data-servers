# 阿里云 Dataphin：逻辑表创建、管理与数据资产页面调研

> 调研对象：阿里云智能数据建设与治理 Dataphin（以 `fullmanaged` 官方帮助文档为主）  
> 访问日期：2026-08-31（Asia/Shanghai）  
> 一手来源边界：仅使用阿里云官网、阿里云帮助中心正文及帮助中心内嵌的官方产品截图。未使用社区文章、媒体稿或第三方产品分析。  
> 版本提示：官方帮助页的页头显示“更新时间：”，但本次取得的服务端 HTML 未在该位置渲染日期；附录记录同页 HTML 中的 `lastModifiedTime`。截图来自官方文档，页面样式和字段可能与具体租户、版本、已购模块不同。

## 1. 结论摘要

1. **[官方正文] Dataphin 把“逻辑表”作为正式产品对象。**“规范建模”下的核心研发对象是维度逻辑表、事实逻辑表和汇总逻辑表；资产清单还明确把标签逻辑表列为逻辑表类型。它不是一个只有名称和字段的轻量元数据对象，而是同时承载业务实体/业务活动、表结构、计算逻辑、质量约束、调度、提交发布和运维的建模任务。来源：[规范建模](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/research-and-development-of-data-modeling/)、[逻辑表和字段详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/logical-tables-and-fields-details)。
2. **[官方正文] 维度/事实逻辑表的标准链路是**：先建业务实体 → 在 `研发 > 数据研发 > 规范建模` 新建逻辑表 → 配表结构与治理属性 → 配计算来源与字段映射 → 配字段约束 → 配调度与参数 → 保存并提交 → Dev-Prod 模式进入待发布列表并发布 → 运维中心管理任务/实例；Basic 模式提交后直接进入生产环境。来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)、[管理发布任务](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-publishing-tasks-1)。
3. **[官方正文] 汇总逻辑表不是维度/事实逻辑表创建器中的一种选项。**它有两条生成路径：派生指标按相同统计粒度自动汇聚成汇总表；或先新建无派生指标的空汇总逻辑表，再添加派生指标、衍生指标或注册上挂指标。来源：[规范建模](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/research-and-development-of-data-modeling/)、[新建汇总逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-summary-table)、[汇总数据层（DWS）](https://help.aliyun.com/zh/dataphin/fullmanaged/getting-started/summary-data-layer)。
4. **[官方正文] “资产清单”和“资产目录”是两套不同页面。**`治理 > 资产清单` 是元数据/治理检索入口，可查看逻辑表的技术、治理、血缘、质量、使用等信息；`资产 > 资产目录` 只展示已上架资产，面向发现和消费，上架前要补充专题/目录、可见范围等资产属性。来源：[查看资产清单](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/assets-directory)、[手动上架](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manual-shelf-assets)、[查看资产目录](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-asset-catalog)。
5. **[推断] 产品边界可概括为“研发对象 → 生产任务 → 治理元数据对象 → 可上架消费资产”。**这是根据四套官方页面之间的跳转、状态和字段关系做出的流程归纳，不是阿里云发布的统一架构术语。

## 2. Dataphin 中“逻辑表”的正式对象与模块

### 2.1 类型体系

| 正式对象 | 官方定义/生成依据 | 创建或进入模块 | 关键边界 |
|---|---|---|---|
| 普通维度逻辑表 | 描述实体对象及其属性 | `研发 > 数据研发 > 规范建模 > 维度逻辑表` | 前置对象为普通业务对象 |
| 层级维度逻辑表 | 描述具有层级结构的维度，如国家/省/市/区 | 同上 | 前置对象为层级业务对象 |
| 枚举维度逻辑表 | 标准化可枚举值的 k-v 代码表 | 同上 | 与有来源、可调度的普通维度表不是同一配置链 |
| 虚拟维度逻辑表 | 规范无具体业务实体承载、无固化数据范围的维度对象 | 同上 | 与有来源、可调度的普通维度表不是同一配置链 |
| 事件/快照/流程事实逻辑表 | 业务活动添加属性后形成，包含主键、度量和事实属性 | `研发 > 数据研发 > 规范建模 > 事实逻辑表` | 表类型由业务事件、业务快照、业务流程决定 |
| 汇总逻辑表 | 派生指标归属表；一个汇总逻辑表有且仅有一个统计粒度 | `研发 > 数据开发 > 规范建模 > 汇总逻辑表` | 可自动汇聚生成，也可先建空表再挂指标 |
| 标签逻辑表 | 当前资产清单把它列为逻辑表类型 | `治理 > 资产清单 > 表` 可筛选 | 当前全托管官方资料未给出与前三类等价的新建向导 |

维度类型和定义来源：[维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/specification-defines-dimension/)。事实与汇总定义来源：[规范建模](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/research-and-development-of-data-modeling/)。资产类型来源：[逻辑表和字段详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/logical-tables-and-fields-details)。

### 2.2 前置条件和版本/模块条件

- **[官方正文] 项目条件**：仅绑定数据板块的项目支持规范建模；项目创建时选择的默认功能菜单也会影响是否可用。Basic 项目若绑定 Dev-Prod 模式数据板块，不支持规范建模。来源：[规范建模](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/research-and-development-of-data-modeling/)。
- **[官方正文] 业务对象条件**：普通维度逻辑表要求先建业务实体；事实逻辑表要求先建业务活动对象；空汇总逻辑表要求先完成业务对象的逻辑表创建。来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)、[新建汇总逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-summary-table)。
- **[官方正文] 增值模块条件**：未购买数据标准、资产安全、资产质量模块时，分别不能配置字段标准、数据分类/分级、主键唯一与非空质量校验。来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)。
- **[官方正文] 环境差异**：Dev-Prod 模式需要选环境，并在提交后另行发布；Basic 模式提交后直接进入生产环境。来源：[管理发布任务](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-publishing-tasks-1)。

## 3. 创建、提交、发布、管理全过程

### 3.1 维度/事实逻辑表主流程

```text
业务实体（业务对象/业务活动）
  → 新建维度或事实逻辑表
  → 表结构与资产治理字段
  → 关联维度/模型关系
  → 计算逻辑（来源、主键映射、字段表达式）
  → 字段约束与质量规则强度
  → 调度、依赖、参数、运行配置
  → 保存并提交（开发环境血缘解析 + 前置检查）
  → Dev-Prod：任务发布（生产环境血缘解析）
  → 运维中心（任务、实例、补数据、生产/消费链路）
  → 资产清单（治理元数据）
  → 准资产完善信息并上架
  → 资产目录（发现、权限申请、使用）
```

#### 步骤 1：新建表级对象

- **维度表入口**：`研发 > 数据研发 > 规范建模 > 维度逻辑表 > 新建`。
- **事实表入口**：`研发 > 数据研发 > 规范建模 > 事实逻辑表 > 新建`。
- **维度表新建字段**：业务对象、表类型（随业务对象确定）、数据板块、主题域、数据时效、逻辑表名、中文名称、描述信息。
- **事实表新建字段**：业务活动、表类型（事件/快照/流程）、数据板块、主题域、数据时效、逻辑表名、中文名称、描述信息。
- **命名**：普通维度表默认 `{数据板块名称}.dim_{业务对象编码}_{数据时效}`；事实表默认 `{数据板块名称}.fct_{业务对象编码}_{数据时效}`。逻辑表名只允许字母、数字、下划线且首位为字母，`label_` 是系统保留前缀。

直接来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)。

#### 步骤 2：配置表结构与字段治理信息

维度/事实逻辑表的结构向导均明确展示以下字段：

| 字段配置 | 含义/约束 |
|---|---|
| 序号 | 新增字段时递增 |
| 字段名称 | 可按名称或中文关键词匹配标准预置字段名 |
| 说明 | 官方上限 512 字符 |
| 数据类型 | string、bigint、double、timestamp、decimal 等，随计算引擎而异 |
| 字段类别 | 主键、分区、属性；仅允许一个主键 |
| 关联维度 | 将字段关联到已建维度逻辑表/业务实体 |
| 字段标准 | 依赖数据标准模块 |
| 字段约束 | 唯一、非空；依赖资产质量模块 |
| 数据分类/数据分级 | 依赖资产安全模块；分级可随分类识别 |
| 备注 | 官方上限 2048 字符 |

字段可手工添加，也可“从建表语句引入”或“从表引入”；来源可包括有读取权限的物理表、逻辑表和非参数化视图。来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)。

#### 步骤 3：配置关联维度和计算逻辑

- **[官方正文] 关联维度**：选择关联实体与维度逻辑表；配置当前字段与被关联维度表主键的关系、维表版本策略、缺联策略和维度角色。事实表的事实属性外键可通过此关系关联维度。
- **[官方正文] 来源类型**：物理表、自定义 SQL、逻辑表。使用逻辑表作为另一逻辑表来源会增加计算与运维复杂度，官方明确提示谨慎使用。
- **[官方正文] 来源配置字段**：来源对象、对象别名、对象描述、过滤条件、与逻辑表主键对应的关联字段。
- **[官方正文] 字段计算**：将来源字段拖入字段计算逻辑，可同名快速映射，也可写表达式并做有效性校验和预览 SQL；该表达式不支持 `sum`、`count`、`min` 等聚合函数。

来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)。

#### 步骤 4：配置约束、调度和运行

- 基于字段约束设置强规则/弱规则，系统在质量模块为逻辑表创建质量规则。
- 调度与参数配置至少包括：数据延迟、调度属性、上游依赖、参数配置、运行配置；维度表文档还明确列出资源配置。
- 保存并提交前，系统检查表结构、计算逻辑、调度依赖、运行参数；提交时解析开发环境的表/字段血缘，识别变更类型/内容并做权限校验。单次解析超过 10 万条血缘时不予记录。

来源：[新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table)、[新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table)、[规范建模任务提交说明](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/submit-a-specification-modeling-task)。

#### 步骤 5：提交与发布

- **提交**：提交内容可查看对象名称、对象类型、变更类型，以及基本信息、对象信息、表结构、物理信息、表关系、计算逻辑、调度、依赖、运行配置和字段约束；提交备注不超过 128 字符。
- **Dev-Prod 发布**：提交对象进入 `研发 > 任务发布 > 发布对象管理 > 待发布对象`；支持单个/批量发布，填写发布名称、发布备注、依赖对象和发布范围。系统按依赖顺序发布。
- **审批与校验**：项目可开启发布审批；审批通过后再进入发布校验。发布详情可查看发布审批、管控规则检查、执行条件检查、售卖检查。
- **生产血缘**：官方明确“提交时解析开发环境血缘、发布时解析生产环境血缘”。
- **Basic 模式**：提交后直接进入生产环境，不经过单独待发布动作。

来源：[规范建模任务提交说明](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/submit-a-specification-modeling-task)、[管理发布任务](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-publishing-tasks-1)。

### 3.2 汇总逻辑表的两条路径

#### 路径 A：派生指标自动汇聚

**[官方正文]** 派生指标由原子指标、业务限定、统计周期和统计粒度组成；同一统计时效下、统计粒度相同的派生指标归入同一汇总逻辑表。旧版但仍在 `fullmanaged` 路径下的 DWS 入门页明确说明：派生指标提交后，系统自动生成新的汇总表。来源：[规范建模](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/research-and-development-of-data-modeling/)、[汇总数据层（DWS）](https://help.aliyun.com/zh/dataphin/fullmanaged/getting-started/summary-data-layer)。

#### 路径 B：新建空汇总逻辑表

入口为 `研发 > 数据开发 > 规范建模 > 汇总逻辑表 > 新建`，配置：

- 统计时效：天（T+1）、小时（T+h）、分钟（T+m）；
- 统计粒度：当前板块下已上线逻辑表对应的业务对象；同一统计粒度已存在汇总逻辑表时不能重复创建；
- 表名称：默认以所选业务对象编码和时效后缀 `_dd/_hh/_mm` 连接，可修改；
- 描述。

完成后再添加派生指标、衍生指标或注册上挂指标。来源：[新建汇总逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-summary-table)。

### 3.3 标签逻辑表边界

- **[官方正文，当前资产页]** 当前 `逻辑表和字段详情` 把标签逻辑表列为可在资产清单筛选和查看的逻辑表类型。来源：[逻辑表和字段详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/logical-tables-and-fields-details)。
- **[历史官方资料]** 一个 2020 年更新、无 `fullmanaged` 版本路径的官方页面称：标签逻辑表在“萃取项目初始化时自动创建”，以 `id_type` 和 `id_value` 为统计粒度，英文名固定，不支持修改。来源：[标签逻辑表](https://help.aliyun.com/zh/dataphin/label-logical-table)。
- **[未证实]** 公开的当前全托管文档没有证明上述旧版“萃取项目”自动创建规则仍适用于 2026 年所有 Dataphin 版本，也没有给出与维度/事实/汇总逻辑表等价的当前创建向导。因此，本报告只确认“标签逻辑表是当前资产类型”，不把旧版创建方式当作当前统一流程。

## 4. 研发侧管理页面：显示字段与操作

### 4.1 维度/事实逻辑表列表

入口：`研发 > 数据开发 > 规范建模 > 维度逻辑表/事实逻辑表 > 维度/事实逻辑表列表`。

**[官方正文] 列表显示**：逻辑表名、主题域/业务实体、数据时效、开发状态、最近提交状态、当前锁定人、开发负责人等。可按逻辑表类型、主题域、调度类型、是否已发布、开发负责人、创建人、数据时效、开发状态、最近提交状态、条件调度、运维负责人、标签筛选。来源：[管理维度/事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-logical-dimension-fact-tables)。

**[官方正文] 单表操作**：打开逻辑表、获取锁、转交开发负责人、去发布、去运维、下线、删除、下线并删除。仅已发布逻辑表可“去运维”；草稿表可删除；存在下游依赖时下线/删除会受阻。

**[官方正文] 批量操作**：锁定、提交、下线、下线并删除、批量修改标签、转交开发负责人、运行配置、参数配置、依赖配置。

### 4.2 基本信息属性抽屉

逻辑表编辑器的属性抽屉展示/配置：表类型、业务对象、数据板块、主题域、数据时效、逻辑表名、中文名称、描述信息、表负责人、开发负责人、运维负责人、标签。其中前五项不可修改，逻辑表名提交后不可修改。来源：[配置逻辑表基本信息](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/configure-basic-information-about-a-logical-table)。

### 4.3 相关对象与运维字段

- **相关对象**：关联逻辑表、输入表、依赖对象和下游任务。关联逻辑表信息包括逻辑表名、中文名、类型、开发状态；输入表信息包括表名、中文名、表类型。来源：[查看及管理逻辑表相关对象](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-and-manage-logical-table-related-objects)。
- **运维字段**：维度/事实逻辑表字段列表显示字段名称、字段说明、字段类型，可补数据、查看生产链路、查看消费链路；汇总逻辑表显示指标名称、指标说明、调度周期、最近更新时间、运维负责人、所属项目、字段类型，且支持单字段补数据和修改指标运维负责人。来源：[管理建模任务字段](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-detail-and-summary-task-fields)。

## 5. 数据资产页面：关于逻辑表展示哪些信息

### 5.1 `治理 > 资产清单`：治理/元数据视角

#### 列表页

**[官方正文] 筛选/视角**：数据板块/主题域视角、项目视角；可按负责人/我负责的、资产标签、项目、环境、数据板块、主题域、表类型、存储格式、湖表格式筛选。项目视角下，汇总逻辑表不归属任何项目，单列“汇总逻辑表”。来源：[查看资产清单](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/assets-directory)。

**[官方正文] 表列表显示**：

- 表名；
- 描述；
- 数据板块/主题域（仅智能研发版）；
- 项目（定位在汇总逻辑表目录时不展示）；
- 最高涉密等级（需资产安全）；
- 资产标签；
- 负责人；
- 操作：申请权限、查看详情。

**[官方正文] 鼠标悬停/快速详情对逻辑表显示**：名称、描述、数据板块、主题域、项目、字段总数、表类型、存储格式、收藏数量、浏览次数、创建时间、数据变更信息。

#### 逻辑表详情页

**[官方正文] 概要**：类型、环境、名称、标签、描述；支持搜索其他对象、开发/生产对象切换、收藏、去分析、申请权限、反馈质量问题、生成 select、查看对应物理表 DDL、导出字段、查看转交记录、查看权限列表等。逻辑表本身不支持 DDL 操作，页面展示的是与逻辑表结构相同的物理表 DDL。来源：[逻辑表和字段详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/logical-tables-and-fields-details)。

| 详情区域 | 展示内容 |
|---|---|
| 明细信息/表详情 | 数据板块、主题域、项目、最高涉密等级、是否分区表、是否分析平台手工表、是否湖表、湖表格式、表存储模式、存储格式、存储量、生命周期、Location |
| 字段信息 | 字段名称（主键图标）、描述、数据类型、关联标准、样例数据、数据分类、数据分级、热度；支持搜索、筛选、看字段血缘 |
| 分区信息 | 选定字段与日期区间的近 30 个分区有无记录 |
| 关联资产 | 当前表关联维度，可跳转关联表详情 |
| 血缘&影响 | 表/字段血缘；下游数据表影响和集成同步影响，最多展示 15 层，可导出 |
| 质量概况 | 规则校验概览、质量监控规则列表；依赖数据质量模块 |
| 数据探查 | 配置探查任务，评估概况、可用性和风险；依赖数据质量模块 |
| 数据预览 | 样例数据；有权限时可预览前 50 条 select 结果 |
| 产出信息 | 数据写入任务、以当前表为输出的血缘任务、节点输出名等于项目名.表名的任务；可去运维 |
| 使用说明 | 面向浏览者/消费者的说明标题与内容 |
| 资产信息 | 基础信息、变更信息、使用信息；包括创建/负责人、数据变更、最近访问、DDL 变更、收藏数、浏览量、近 30 天访问次数等 |

重要边界：官方说明“创建逻辑表时系统可能自动生成多张物化表”，湖表格式/存储模式等物理信息取第一张物化表；因此资产详情的部分物理属性不能简单等同于“逻辑定义本身”。

### 5.2 `资产 > 目录管理`：上架运营视角

从数据源采集或从数据中台获取的对象先成为“准资产”。上架前要完善属性、目标专题/目录、可见范围等；只有已上架状态的资产能在资产目录搜索、查看。来源：[手动上架](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manual-shelf-assets)。

**[官方正文] 已上架资产管理列表**可显示：资产名称、指标类型、关联技术指标、资产来源、归属目录、最新状态、信息是否完善、需重新上架、变更类型、最近上架时间、最新数据时间、最近更新时间等。该页是多资产类型的通用列表，因此“指标类型/关联技术指标”不一定适用于表资产。表资产可查看、编辑基本/字段信息及可见权限、上架、下架、设置维护权限。来源：[管理已上架资产](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-and-manage-on-shelf-assets)。

### 5.3 `资产 > 资产目录`：已上架资产发现/消费视角

#### 列表页

- **[官方正文] 搜索**：按名称、展示名称、描述全局模糊搜索；数据表还能按字段名称或描述搜索。
- **[官方正文] 目录/筛选**：按专题目录树浏览；可用部分系统属性和所有“可见于资产目录”的自定义属性筛选。
- **[官方正文] 表资产列表默认信息**：名称、资产类型、标签、描述、最高涉密等级，以及用户所选属性；列表可配置最多 16 个属性并排序。

来源：[查看资产目录](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-asset-catalog)。

#### 数据表资产详情页

**[官方正文] 概要**：名称、类型、最高涉密等级、标签、统计粒度、描述。统计粒度只在汇总逻辑表存在业务类型为维度的字段时展示，可看到统计粒度名称、编码、描述、所属板块、主题域。来源：[查看数据表资产详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-asset-details)。

| 详情区域 | 展示内容 |
|---|---|
| 属性信息 | 业务属性（主题域）、管理属性、技术属性（资产来源、板块/项目空间/数据源类型、数据库类型、所属项目、表类型/子类型等）及自定义属性 |
| 字段信息 | 序号、名称、数据类型、描述/备注、业务类型/关联实体、关联标准、样例数据、质量分、数据分类、数据分级、自定义属性 |
| 关联实体 | 维度/事实逻辑表可查看角色名称、实体名称/编码、描述、所属板块、主题域，并跳转实体详情/关系图 |
| 数据预览/探查 | 权限范围内的样例与最多 50 条预览；质量模块开启后可探查 |
| 使用说明 | 上架编辑时开启后展示 |
| 血缘关系 | 上架编辑时开启后展示系统、表、字段血缘 |
| 质量概况 | 上架编辑时开启且购买数据质量模块后展示 |
| 元数据变更 | 同时开启相关配置后展示近两个版本、字段变化与下游影响 |
| 资产信息 | 浏览量、收藏数；初次上架时间、最近上架时间、发布人、归属目录 |

### 5.4 两个资产页面不能混为一谈

| 对比项 | 资产清单 | 资产目录 |
|---|---|---|
| 官方入口 | `治理 > 资产清单` | `资产 > 资产目录` |
| 对象门槛 | Dataphin/其他系统元数据对象 | 仅已上架资产 |
| 核心用途 | 元数据检索、治理、血缘、质量、运维影响 | 面向消费者的发现、目录浏览、使用与申请 |
| 列表主字段 | 表名、描述、板块/主题域、项目、密级、标签、负责人 | 名称、资产类型、标签、描述、密级、所选属性 |
| 详情侧重点 | 技术属性、字段、分区、血缘影响、产出任务、变更/访问 | 业务/管理/技术属性、使用说明、上架信息、目录归属、消费可见信息 |
| 相互跳转 | 已上架对象可“查看资产详情” | 可“查看元数据”回到资产清单 |

## 6. 下游使用与权限

- **[官方正文] 权限对象名**：权限申请页把维度/事实/汇总等归为“建模逻辑表”。选择表时可按所属板块/项目、表类型筛选；可申请表级或字段级权限，并可叠加行级规则。来源：[申请、续期和交还表权限](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/authority-to-apply-renew-and-return-forms)。
- **[官方正文] 权限类型**：建模逻辑表默认只能申请“查表数据”，不支持在该申请页改为改表数据、删表、改表结构；字段级申请会忽略不可申请字段。
- **[官方正文] 资产使用**：资产清单详情支持生成 select、去 Notebook 分析、数据预览；有查表权限时最多预览 50 条。资产目录详情也按权限展示预览，并可查看血缘、质量、使用说明。
- **[官方正文] 运维使用**：已发布逻辑表可去运维，执行补数据、查看生产链路与消费链路；汇总逻辑表指标支持单字段补数据，但官方提示可能影响下游一致性，应谨慎操作。
- **[官方正文] 数据服务使用**：Dataphin 的 API 开发支持以维度、事实或汇总逻辑表为来源，通过 SQL 模式或可视化向导模式创建 API。SQL 模式的官方前置链为：逻辑表已创建并产出符合预期的数据 → 按受支持的数据源配置并发布同步任务 → `服务 > API开发 > API服务 > 新建API` → 选择“逻辑表API-SQL模式（Dataphin表）” → 选择业务板块和逻辑表 → 参考逻辑表字段编写 SQL、解析请求/返回参数 → 保存、测试、提交并发布 API。请求参数与返回参数必须来自同一张逻辑表。这里的提交/发布是 API 生命周期，不应反写成逻辑表自身的创建步骤。来源：[通过 SQL 模式创建 API（Dataphin 表）](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/sql-mode)、[创建 API](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-api/)。

## 7. 官方页面截图观察

以下仅记录官方文档截图中可见的页面布局和字段。截图可见而官方正文未明确说明的内容标为“页面观察”，不外推到所有版本。

### 图 1：维度/事实逻辑表研发管理列表

[官方截图原图](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/7773048471/p935537.png)

![Dataphin 维度/事实逻辑表管理列表](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/7773048471/p935537.png)

- **[页面观察]** 列表列头可见：逻辑表名、主题域/业务实体、数据时效、开发状态、最近提交状态、当前锁定人、开发负责人（右侧部分被截图裁切）、操作。
- **[页面观察]** 单行开发状态同时呈现“草稿/未发布”“开发中/已发布 Vn 版本”“已提交/未发布”等组合；最近提交状态显示成功/失败和“提交详情”。这证明截图中的“开发状态”与“最近提交状态”是两个维度，但具体状态枚举应以当前租户为准。

### 图 2：事实逻辑表表结构配置

[官方截图原图](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/7303190171/p767672.png)

![Dataphin 事实逻辑表表结构配置](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/7303190171/p767672.png)

- **[页面观察]** 向导顶部按“表结构 → 计算逻辑 → 约束配置 → 调度&参数配置”推进。
- **[页面观察]** 字段区分数据字段与分区字段；列表可见序号、字段名称、说明、数据类型、字段类别、关联维度、字段标准、操作，并提供添加数据字段、从建表语句引入、从表引入。
- 截图与正文列出的创建步骤相互印证，但截图未展示后续提交和发布结果。

### 图 3：资产清单表列表

[官方截图原图](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/2980809771/p1063570.png)

![Dataphin 资产清单表列表](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/2980809771/p1063570.png)

- **[页面观察]** 左侧项目视角目录可见“中间层项目”“通用层项目”“汇总逻辑表”；筛选区可见负责人/我负责的、资产标签、主题域及展开更多。
- **[页面观察]** 列表可见表名、描述、数据板块/主题域、项目、最高涉密等级、资产标签、操作，与正文一致。

### 图 4：资产清单中的逻辑表详情

[官方截图原图](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4876343671/p1016076.png)

![Dataphin 资产清单逻辑表详情](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4876343671/p1016076.png)

- **[页面观察]** 示例为生产环境汇总逻辑表；顶部可见收藏、去分析、申请权限、反馈质量问题和更多。
- **[页面观察]** 主区标签为明细信息、血缘&影响、质量概况、数据探查、数据预览、产出信息、使用说明；右侧资产信息展示基础信息、变更信息、使用信息。
- **[页面观察]** 字段信息列可见字段、描述、数据类型、关联标准、样例数据、数据分类、数据分级、热度、操作；主键以钥匙图标标识。

### 图 5：资产目录列表

[官方截图原图](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4296847571/p991326.png)

![Dataphin 资产目录列表](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/4296847571/p991326.png)

- **[页面观察]** 截图可见全局搜索、资产类型页签、目录树、标签/资产来源筛选、设置列表字段、申请权限与加入申请篮。
- **[版本差异提示]** 当前正文已将列表字段描述为“名称、资产类型、标签、描述、最高涉密等级及所选属性”，且未在该段正文明确“加入申请篮”。因此“加入申请篮”只作为截图观察，不作为当前所有版本的确定能力。

### 图 6：资产目录中的表资产详情

[官方截图原图](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/8793529371/p890864.png)

![Dataphin 资产目录表资产详情](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/8793529371/p890864.png)

- **[页面观察]** 顶部可见逻辑表名称/中文名、普通维度逻辑表类型、密级标签、描述、收藏。
- **[页面观察]** 标签页可见属性信息、字段信息、数据预览、数据探查、使用说明、血缘关系、质量概况、元数据变更；右侧为浏览量/收藏数和初次上架、最近上架、发布人、归属目录。

## 8. 未证实项与使用限制

1. **[未证实] 实际租户当前 UI**：没有用户租户账号，本次“实际浏览原网站”指浏览阿里云官方帮助中心原页并检查其官方静态截图，未登录 Dataphin 控制台实际创建一张表。因此不能声称截图中的每个按钮在用户租户都存在。
2. **[未证实] 标签逻辑表当前创建方式**：只确认当前资产页承认该类型；旧版自动创建规则不可直接外推。
3. **[未证实] 所有逻辑表自动上架**：官方只说明中台对象先形成准资产、仅已上架对象进入资产目录；未说明每张逻辑表都会自动完成目录属性或自动上架。
4. **[未证实] 资产目录自定义字段集合**：页面只说明可选择“部分系统属性和所有可见于资产目录的自定义属性”，具体属性取决于租户在数仓规划中的配置。
5. **[未证实] 物化实现细节**：官方确认可能生成多张物化表，但未在公开页面披露每类逻辑表的固定物化数量、物化 SQL、引擎内表映射或存储拓扑。
6. **[版本/购买差异]** 数据标准、资产安全、数据质量、资产运营、X-资产问答等模块会改变可见字段和可执行操作；官方也明确“不同逻辑表展示的信息可能有所差异，具体以实际页面为准”。

## 9. 对三产品横向比较的可用抽象

后续与华为、火山比较时，建议固定使用以下列，避免只比页面名字：

| 比较维度 | Dataphin 已核实答案 |
|---|---|
| 逻辑对象来源 | 业务对象/业务活动驱动；汇总表由统计粒度与指标驱动 |
| 逻辑表类型 | 维度、事实、汇总；资产页另含标签逻辑表 |
| 创建入口 | 研发 > 数据研发/数据开发 > 规范建模 |
| 设计内容 | 表级定义、字段与治理属性、关联维度、来源与计算、质量约束、调度运行 |
| 生命周期 | 草稿/开发 → 提交 → Dev-Prod 发布或 Basic 直达生产 → 运维 → 下线/删除 |
| 研发列表信息 | 名称、主题域/业务实体、数据时效、开发/提交状态、锁、人 |
| 治理清单信息 | 板块/主题域/项目、密级/标签/负责人、字段/分区/血缘/质量/产出/使用 |
| 消费目录信息 | 已上架资产的类型、标签、描述、密级、自定义属性、目录、上架与用数信息 |
| 使用控制 | 建模逻辑表查表权限，可表级/字段级并叠加行级规则 |
| 关键产品边界 | 资产清单不等于资产目录；逻辑定义不等于单张物化表 |

## 附录 A：主要官方来源与页面更新时间

下表“页面源更新时间”来自官方帮助页 HTML 的 `lastModifiedTime`，转换为 UTC+08:00；页面页头本次未渲染具体日期，因此不把该值表述为截图可见文本。

| 编号 | 官方页面 | 页面源更新时间 | 用途 |
|---|---|---:|---|
| S1 | [规范建模](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/research-and-development-of-data-modeling/) | 2024-11-29 14:35:14 | 对象体系、汇总表定义、前置条件 |
| S2 | [维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/specification-defines-dimension/) | 2026-01-27 14:16:49 | 维度类型与入口 |
| S3 | [新建普通维度逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-dimension-table) | 2026-01-27 14:16:52 | 维度表全创建链、字段、计算、调度、提交 |
| S4 | [新建事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-fact-table) | 2026-01-27 14:17:05 | 事实表全创建链与字段 |
| S5 | [新建汇总逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-logical-summary-table) | 2025-09-18 14:34:30 | 空汇总逻辑表创建 |
| S6 | [管理维度/事实逻辑表](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-logical-dimension-fact-tables) | 2026-03-13 13:53:08 | 研发列表字段、筛选、单表/批量操作 |
| S7 | [配置逻辑表基本信息](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/configure-basic-information-about-a-logical-table) | 2026-03-13 13:52:59 | 属性抽屉字段与可修改性 |
| S8 | [规范建模任务提交说明](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/submit-a-specification-modeling-task) | 2024-04-16 14:18:17 | 提交内容、检查、开发/生产血缘 |
| S9 | [管理发布任务](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-publishing-tasks-1) | 2026-07-21 13:40:19 | Dev-Prod 发布、依赖、审批、记录 |
| S10 | [查看及管理逻辑表相关对象](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-and-manage-logical-table-related-objects) | 2024-05-16 13:52:52 | 关联表、输入表、下游任务 |
| S11 | [管理建模任务字段](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manage-detail-and-summary-task-fields) | 2026-05-19 13:38:40 | 运维字段、补数据、生产/消费链路 |
| S12 | [查看资产清单](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/assets-directory) | 2026-07-21 13:43:53 | 治理清单列表与筛选字段 |
| S13 | [逻辑表和字段详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/logical-tables-and-fields-details) | 2026-03-13 13:34:53 | 逻辑表资产详情全部区域 |
| S14 | [手动上架](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/manual-shelf-assets) | 2026-05-19 13:28:37 | 准资产、上架、资产目录门槛 |
| S15 | [管理已上架资产](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-and-manage-on-shelf-assets) | 2026-07-21 13:24:33 | 上架管理列表与操作 |
| S16 | [查看资产目录](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-asset-catalog) | 2026-07-21 13:24:50 | 消费目录搜索、列表字段 |
| S17 | [查看数据表资产详情](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/view-asset-details) | 2026-07-21 13:24:46 | 已上架表资产详情 |
| S18 | [申请、续期和交还表权限](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/authority-to-apply-renew-and-return-forms) | 2026-03-13 14:06:21 | 建模逻辑表权限与字段信息 |
| S19 | [汇总数据层（DWS）](https://help.aliyun.com/zh/dataphin/fullmanaged/getting-started/summary-data-layer) | 2021-10-25 10:04:46 | 派生指标自动汇聚的历史官方说明 |
| S20 | [标签逻辑表](https://help.aliyun.com/zh/dataphin/label-logical-table) | 2020-05-25 18:28:53 | 旧版标签逻辑表自动创建说明，仅作历史证据 |
| S21 | [通过 SQL 模式创建 API（Dataphin 表）](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/sql-mode) | 2026-08-31 复核 | 逻辑表作为 API 来源的前置条件、入口、字段绑定与 API 生命周期 |
| S22 | [创建 API](https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-api/) | 2026-08-31 复核 | 逻辑表 API 的 SQL／向导两种方式及与其他 API 来源的边界 |

## 附录 B：证据强度说明

| 标记 | 含义 |
|---|---|
| 官方正文 | 阿里云官方帮助页正文直接说明，可作为当前公开产品能力证据 |
| 页面观察 | 阿里云官方帮助页内嵌产品截图可见，但正文没有逐字说明或可能随版本变化 |
| 推断 | 基于多个官方页面之间的关系进行的产品结构归纳，不是官方命名 |
| 历史官方资料 | 阿里云官方页面，但更新时间较早或路径属于旧产品形态，不直接外推当前版本 |
| 未证实 | 当前公开官方资料没有足够证据，需要登录实际租户或向阿里云确认 |
