# 运行管理配置页面本地源码参考

> 调研日期：2026-08-27
>
> 一手源码：`/mnt/d/cursor/himarket`（`a352157ba406eecc93ebac7a52babe9500c26950`）、`/mnt/d/cursor/higress`（`c55d9825c90868f50edbff9764a6b3cf2eb13162`）
>
> 用途：支持 Data servers 项目的“网关概览、注册与路由、策略管理、配置发布、运行监控、异常事件、审计日志”桌面 Web 原型设计
>
> 约束：源项目只读；项目名只用于技术溯源。不得复制 Logo、品牌文案、主题、遥测、依赖或实现代码到目标原型。

## 结论摘要

1. **HiMarket 是实际页面交互的主要参考。**它的管理端真实路由包含网关实例页、模型监控和 MCP 监控，分别为 `/consoles/gateway`、`/observability/model-dashboard`、`/observability/mcp-monitor`；同一路由表中没有路由管理、策略管理、配置发布、异常事件或审计日志页面。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/routes/index.tsx:18-121`）
2. **Higress 当前本地目录不是控制台前端仓库。**核心仓库文档说明控制台负责路由和插件配置，同时明确真实控制台位于另一个独立仓库。因此，本次不能把 `/mnt/d/cursor/higress` 当作“可复刻页面”的证据，只能用其配置对象和表单 Schema 校准字段与作用域。（来源：`/mnt/d/cursor/higress/docs/architecture.md:10-17`；`/mnt/d/cursor/higress/README_ZH.md:251-256`）
3. **可直接借鉴的骨架只有四类：**实例清单与健康检查、来源到能力的级联选择、草稿—审核—生效的版本状态、筛选—指标—趋势—分布的监控结构。其余三类页面需要按本项目领域模型补齐，不能假装源项目已经提供完整方案。
4. **已确认的参考优先级：**HiMarket 是主要产品交互参考；Higress 只补充注册来源、路由匹配、策略作用域和 Schema 校验等网关配置细节；审批、发布差异、回滚、异常闭环和运行审计以 Data servers 已确认的领域规则为准。首版原型保持轻量，不展开厂商或基础设施深层参数。

## 一、证据边界

### 1. HiMarket 中确实存在的管理页面

管理端路由把“实例管理”拆为网关、注册中心、AI 注册中心和沙箱，把“可观测性”拆为模型监控与 MCP 监控；左侧分组可展开，活动子项会使父组保持高亮。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/Layout.tsx:102-168`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/Layout.tsx:207-234`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/Layout.tsx:281-335`）

这一层级可证明“二级菜单展开三级页面”是可工作的交互模式，但 Data servers 已确认顶栏只有“数据服务”产品域，不能复制 HiMarket 的品牌标题、一级导航命名或整套壳层。

### 2. Higress 中不存在可核验的前端路由

Higress 核心文档把控制台描述为路由、插件等配置的管理界面，并列出服务来源、服务、路由、域名、证书和插件等管理能力。（来源：`/mnt/d/cursor/higress/docs/architecture.md:10-17`）

但是本地仓库的关联仓库清单把控制台指向独立的 `higress-console` 仓库，本地源码并未包含该前端工程。（来源：`/mnt/d/cursor/higress/README_ZH.md:251-256`）

因此，下文凡是来自 Higress 的内容均标为“配置语义参考”，不把底层 CRD、注解或插件 Schema 描述成已验证的控制台页面。

## 二、可复用的页面与交互模式

### 1. 实例清单、导入和健康状态

HiMarket 网关页采用“页面标题与主操作 → 网关类型切换 → 当前类型说明 → 分页表格”的结构；表格按网关类型切换字段，并保留编辑、删除操作。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/GatewayConsoles.tsx:115-181`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/GatewayConsoles.tsx:252-346`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/GatewayConsoles.tsx:350-433`）

网关实例的可见字段包括名称、ID、控制端地址、运行端地址和创建时间，但类型模型本身不包含健康状态、最后检查时间、当前配置版本或漂移状态。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/types/gateway.ts:1-24`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/GatewayConsoles.tsx:252-300`）

同一管理端的沙箱实例页提供了更适合“网关概览”的运行状态模式：状态为运行、停止、异常，异常可显示状态消息，并记录最后检查时间；用户可对单个实例发起健康检查并原位刷新该行。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/SandboxConsoles.tsx:27-39`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/SandboxConsoles.tsx:137-160`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/SandboxConsoles.tsx:280-378`）

**可复用：**类型或用途筛选、实例表格、状态标签、失败摘要、最后检查时间、逐行刷新。

**不可照搬：**厂商分类、外部控制台登录字段、品牌名称，以及在浏览器中直接保存管理凭证的做法。HiMarket 的导入表单直接要求控制端地址、用户名、密码和运行端地址；Data servers 的运行管理原型应改为“适配器／密钥引用 + 脱敏状态”，不显示或编辑秘密原文。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/console/ImportHigressModal.tsx:51-145`）

### 2. 来源—实例—命名空间—能力的级联选择

HiMarket 的能力关联弹窗先选择来源类型，再按来源选择网关实例或注册中心；选择注册中心后继续加载命名空间，最后才允许选择 API、Agent、模型或 MCP 等能力。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/link-api-modal/LinkApiModal.tsx:42-76`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/link-api-modal/LinkApiModal.tsx:92-133`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/link-api-modal/LinkApiModal.tsx:297-487`）

能力选项按产品类型过滤可用网关类型，并在选项中同时展示名称、标识、类型与描述。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/link-api-modal/LinkApiModal.tsx:318-364`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/link-api-modal/LinkApiModal.tsx:423-483`）

Higress 的服务发现配置进一步证明注册来源的底层配置会因来源而不同：通用字段包括类型、名称、域名、端口和协议，特定来源另有命名空间、分组、刷新间隔、服务允许列表和代理设置。（来源：`/mnt/d/cursor/higress/api/networking/v1/mcp_bridge.proto:47-99`）

**可复用：**逐步揭示字段、上游选择变化时清空下游值、远程加载状态、可搜索的对象选项。

**不可照搬：**把注册中心连接参数、访问密钥、底层协议和代理参数全部平铺在“注册与路由”主表单。Data servers 首期应选择已配置的来源适配器，只在高级详情显示脱敏技术信息。

### 3. 策略作用域与动态表单

Higress 的插件对象把插件配置、执行阶段、优先级、失败策略、全局默认配置和匹配规则分开；匹配规则可以作用到路由、域名、服务，并区分 HTTP 和 GRPC。（来源：`/mnt/d/cursor/higress/api/extensions/v1alpha1/wasmplugin.proto:84-127`；`/mnt/d/cursor/higress/api/extensions/v1alpha1/wasmplugin.proto:129-154`；`/mnt/d/cursor/higress/api/extensions/v1alpha1/wasmplugin.proto:208-217`）

控制台发布元数据中的策略表单使用 OpenAPI Schema 描述字段类型、必填项、枚举、范围、默认值及敏感格式，并分别给出全局配置和路由级覆盖。例如认证策略把密钥标记为 `password`，并声明路由级配置 Schema。（来源：`/mnt/d/cursor/higress/plugins/release/console/simple-jwt-auth/spec.yaml:22-57`）

缓存策略 Schema 展示了嵌套对象、端口范围、超时、TTL、必填字段和路由级覆盖等校验信息。（来源：`/mnt/d/cursor/higress/plugins/release/console/response-cache/spec.yaml:22-104`）

**可复用：**策略分类、作用范围、绑定对象、默认值与覆盖值、结构化校验、启停状态。

**不可照搬：**插件镜像 URL、拉取密钥、Wasm 阶段、CRD 名称、原始 JSON/YAML 和插件自身品牌信息。这些属于适配器层或高级诊断，不应成为业务策略主表单。

### 4. 草稿、审核、生效与版本状态

HiMarket 的 Skill 制品页包含 `draft / reviewing / approved / rejected / online / offline` 等状态投影，并按状态控制提交审核、发布已批准版本、上线、下线、创建草稿、删除草稿及强制发布等操作。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ApiProductSkillPackage.tsx:478-535`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ApiProductSkillPackage.tsx:1302-1379`）

创建草稿时要求选择基线版本并填写更高的新版本；提交审核后刷新版本和内容。审批流水线状态会显示通过、驳回或执行进度，驳回详情列出失败节点、消息、耗时和执行时间。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ApiProductSkillPackage.tsx:665-680`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ApiProductSkillPackage.tsx:833-891`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ApiProductSkillPackage.tsx:1406-1499`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/ApiProductSkillPackage.tsx:1554-1592`）

**可复用：**运行版本与开发草稿并存、基线版本、新版本、审批状态、失败节点详情、危险动作确认。

**不可照搬：**该页面管理的是 Skill 制品，不是网关配置；它没有结构化配置差异、发布步骤、配置哈希、漂移或“以旧快照创建新回滚发布”。“强制发布驳回版本”也不应成为 Data servers 的常规发布动作。

### 5. 筛选—指标—趋势—分布的监控结构

模型监控支持时间范围、查询粒度、实例、API、模型、消费方、路由和服务筛选；查询后并行刷新 KPI、趋势图与统计表。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:87-105`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:452-500`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:540-667`）

模型监控的指标覆盖请求量、消费方数量、降级、输入／输出／总 Token；趋势覆盖 QPS、成功率、Token 速率、整体／流式／非流式／首 Token 延迟、限流和缓存；统计表覆盖模型、消费方、服务 Token、错误请求、限流消费方和风险类型。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:210-245`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:251-411`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:418-446`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:669-840`）

MCP 监控沿用同一骨架，筛选实例、消费方、服务、MCP Server 和 Tool，展示请求量、流量、成功率、QPS、延迟分位数，以及方法、网关状态、后端状态和请求分布。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/McpMonitor.tsx:88-112`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/McpMonitor.tsx:220-298`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/McpMonitor.tsx:328-383`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/McpMonitor.tsx:408-657`）

**可复用：**公共筛选器、摘要卡、两列趋势区、状态／错误分布表、空数据态。对于 AI 多目标路由策略，只借鉴模型、路由、服务和消费方的对象维度，以及运行状态、降级次数、QPS、成功率、错误率和响应时间等生效结果摘要。

**不可照搬：**日志产品专用查询参数、PV／UV 或 Token 用量作为健康核心指标、模型与 MCP 完全分裂的两个页面。该页面是监控页，不提供多目标权重、优先级或降级顺序的配置证据，不能据此推导路由表单。Data servers 应按“数据应用、服务产品、固定版本和能力类型”统一筛选，并根据对象类型显示首 Token 延迟等健康指标；Token 用量仅可作为次级使用统计。

## 三、映射到七个三级页面

本映射统一遵循“**HiMarket 定交互骨架，Higress 只校准必要的网关配置细节**”。七页首版均以轻量列表、必要表单和详情为主；Higress 的 CRD、插件运行参数和基础设施配置不得反向扩大页面范围。

| Data servers 页面 | 本地源码中最接近的证据 | 原型应采用 | 明确不采用 |
|---|---|---|---|
| 网关概览 | HiMarket 网关类型页签与实例表；沙箱页的健康检查、失败摘要、最后检查时间 | 当前环境只读说明、服务健康摘要、逻辑入口表、数据面健康、最近检查、刷新状态 | 配置版本与漂移、厂商页签、控制台用户名／密码、基础设施实例管理 |
| 注册与路由 | HiMarket 来源—实例—命名空间—能力级联；Higress 注册来源字段和路由／服务匹配范围 | 当前逻辑入口筛选、服务端口、调用协议、QPS、成功率、P95、最近异常和只读技术映射 | 注册中心原始凭据、CRD/YAML、来源与同步参数、权重配置、新建流程 |
| 策略管理 | Higress 插件作用域、优先级和 OpenAPI Schema | 策略列表 + 新建／编辑抽屉；分类、作用范围、自动分配摘要、结构化字段、校验结果、启停与配置状态 | 插件镜像、Wasm 阶段、拉取密钥、原始插件 JSON、人工数据应用绑定 |
| 配置发布 | HiMarket 草稿、审核、批准、上线及失败节点详情 | 待发布摘要、发布历史、审批中／待发布／发布中／已生效／失败／已回滚、失败重试与回滚结果 | Skill 文件树、技术版本号、完整差异、执行步骤、配置哈希与快照 |
| 运行监控 | HiMarket 模型与 MCP 监控 | 公共筛选器、核心 KPI、成功率与延迟趋势、AI 条件指标、状态和错误分布；筛选到数据应用／服务／版本 | 两套割裂页面、全部指标一次性堆满、直接暴露日志查询语法 |
| 异常事件 | 源项目仅有行内异常状态、错误请求表和审批失败节点，没有独立事件页 | 按已确认范围提供简表：事件类型、影响对象、严重程度、状态、发生／恢复时间和基础筛选 | 详情抽屉、告警规则编辑、通知编排、把每条 4xx/5xx 请求直接当事件 |
| 审计日志 | 两个仓库都没有可核验的统一运行审计页面；Higress 的请求／响应日志插件只证明流量内容日志存在，不提供管理操作、中台数据加工或本项目治理关联（来源：`/mnt/d/cursor/higress/plugins/release/console/log-request-response/spec.yaml:22-97`） | 按项目领域规则提供管理操作、系统运行日志、外部数据调用和中台数据加工四类不可修改记录；使用分类筛选和类型化详情 | 请求／响应正文、秘密值、访问或基础设施日志全文检索、审计策略编辑、日志删除或修改 |

## 四、七页的建议页面契约

以下内容是基于上述一手事实形成的 **Data servers 原型建议**，不是对源项目现状的描述。

### 1. 网关概览

- 页头：标题、只读“当前环境”、最近刷新时间、刷新状态按钮。
- 摘要：正常服务、异常服务、近 15 分钟请求量和请求成功率。
- 访问状态表：逻辑实例、能力范围、访问入口、数据面健康、影响服务、最近检查时间和查看操作。
- 底部信息：左侧为近 15 分钟请求量与成功率双指标趋势，右侧为最近异常，包含级别、影响对象、时间和状态。
- 详情抽屉：基本信息、能力范围、访问入口、数据面健康、近 15 分钟 QPS／成功率／P95、配置一致性、最近异常，以及注册与路由／运行监控跳转。
- 技术架构明确前不展示配置版本号；不显示厂商或凭据原文，也不在此页直接编辑实例、路由、策略或凭据。
- 页面不设新增或编辑主操作，只以次级按钮手动刷新页面状态；首版不提供自动轮询或刷新频率设置。

### 2. 注册与路由

- 列表筛选：关键字、能力类型、来源、同步状态、健康状态。
- 表格统一展示服务产品及固定版本、能力类型、调用协议、入口摘要、后端目标和运行状态；详情按能力类型展开入口字段，API 使用 Method／Host／Path，模型使用模型调用标识，Agent／Skill／Worker 使用调用标识与执行入口，MCP 使用传输协议与服务入口，数据流使用订阅协议与主题或端点。
- 首版暂不设计新建流程；后续如增加编辑，保存只能产生配置草稿，不能绕过“配置发布”直接影响当前运行流量。
- 主列表突出运行状态，部署、同步和技术注册过程状态降为详情中的辅助信息，不以多个同权状态列增加阅读负担。
- 主运行状态统一为正常、降级、异常、已停流和未知。主表只保留识别运行对象、定位调用链和判断健康所需的信息；能力类型、固定版本和协议可作为名称或入口的次级文本，不分别占用同权列。
- 主表命名为“网关服务运行清单”，一行代表一个后端服务及端口；关联服务产品、固定版本和调用路由进入详情，一个产品连接多个后端目标时形成多条运行项。

运行中的本地参考实例还提供了一个 Grafana Dashboard。2026-08-27 通过容器内只读 API 获取的 Dashboard 定义采用顶部网关／命名空间变量、通用流量摘要、请求趋势、服务 Top 表和基础设施分区，其中服务排名查询按后端 `service + port` 聚合，而不是按单条路由聚合。原型采用单页分区，只借鉴请求量、成功率、响应时间、上下游 QPS、QPS Top、失败请求 Top 和慢响应 Top 等网关流量内容；活跃连接、CPU／内存、工作负载、WAF、XDS、TCP 字节量等低层诊断、基础设施或相邻安全指标不进入“注册与路由”，Grafana 外壳、搜索层和参考产品名称也不得出现在生成界面。

确认后的单页顺序为当前网关实例与运行状态筛选、下游 QPS／上游 QPS／成功率／P95 摘要、上下游 QPS 趋势、网关服务运行清单、失败请求 Top 5 和慢响应 Top 5。即时指标统一使用近 15 分钟窗口并手动刷新，长时间范围留给运行监控。

运行清单一次只选择一个网关实例，不聚合全部实例；主表字段为后端服务与端口、调用协议、运行状态、近 15 分钟 QPS、成功率、P95、最近异常和查看操作。只读详情抽屉补充关联服务产品及固定版本、关联调用路由及入口摘要、最近异常和折叠的技术注册映射，并提供运行监控入口。

紧急停流只作用于详情中的具体调用路由，不直接停止共享后端服务；交互必须二次确认、展示影响摘要并反馈审计编号。默认演示采用三条正常、一条降级、一条异常和一条已停流运行项。QPS 趋势只读，失败请求与慢响应 Top 5 可打开对应运行项详情。

### 3. 策略管理

- 页面采用单一策略列表，不拆分策略定义与绑定关系标签；列表筛选策略名称、分类、启用状态、配置状态和最近变更人，自动分配结果进入详情抽屉。
- 表格展示名称、分类、作用范围摘要、自动分配数量、启用状态、配置状态和更新时间；策略不设置私有／共有范围。
- 页面保留“新建策略”唯一主操作，右侧抽屉先选择策略分类，再按分类 Schema 生成厂商中立的结构化领域字段；不使用多步骤向导，不显示插件代码、原始 JSON 或适配器实现字段。
- 首版分类为认证投影、限流与配额、超时／重试／熔断、CORS／IP 访问、AI 多目标路由和外部安全策略引用；WAF 与内容安全规则编辑器排除。
- 一个策略可自动分配给多个获准对象。修改策略定义只产生配置草稿，发布成功后全部已分配对象统一采用新配置，不允许静默修改部分对象。
- 启用状态为已启用、已停用；配置状态为已生效、存在草稿、待发布、校验失败。
- 策略页只定义适用资源类型、资源范围和策略参数，不提供数据应用绑定选择器。数据应用创建或更新并审核成功后，系统根据批准结果自动绑定和分配所需策略；详情只读显示已分配对象数量。
- 首版弱化继承顺序与冲突算法，只显示校验通过或存在冲突；详情只保留基本信息、当前配置摘要、自动分配摘要和校验结果，保存后只提示草稿已保存。
- 列表字段为策略名称、分类、作用范围摘要、自动分配数量、启用状态、配置状态、更新时间和操作；默认八条数据覆盖六类策略、四种配置状态及两种启用状态。
- 首版完整设计“限流与配额”的新建和保存草稿，以及“AI 多目标路由”的目标模型、权重、降级顺序和近 15 分钟健康摘要；摘要只显示运行状态、降级次数、QPS、成功率、错误率和 P95，不以 Token 用量或 PV／UV 判断健康。其他分类只提供列表数据和只读详情。
- 保存前以数量摘要提示受影响的路由、服务版本和数据应用，范围较大时显示风险提示。只有从未发布且没有自动分配记录的草稿可以物理删除；已发布策略只能停用并经配置发布生效，历史永久保留。
- 限流与配额表单只保留名称、适用资源、计量指标、限制值、统计周期、突发额度、超限处理和启用状态；AI 多目标路由只配置目标模型固定版本、优先级和权重，不扩展成本、地域、语义路由或自定义健康阈值。
- 策略自动分配属于数据应用新版本发版执行的一部分。审核通过后计算并下发，只有分配成功新版本才整体生效；分配失败或冲突时保留旧运行版本，不允许部分生效。
- 策略详情不设计趋势图，只显示近 15 分钟运行状态、QPS、成功率、错误率和 P95，AI 策略增加降级次数。自动分配只显示数据应用、服务产品和调用路由数量及最近一次分配结果。

### 4. 配置发布

- 页面只读当前环境，顶部以待发布变更数量、影响对象数量、基础校验状态和“发起发布”构成最小摘要；不展示技术配置版本号。
- 历史表仅展示发布编号、变更摘要、生命周期状态、发起人、创建时间和查看操作。状态统一为审批中、待发布、发布中、已生效、失败和已回滚。
- 详情只展示变更数量摘要、影响对象摘要、校验结果、审批编号、当前状态和失败原因；不展开结构化差异、风险算法、执行步骤、配置哈希或快照。
- 普通路由与策略修改进入当前待发布集合，发起后冻结为发布记录；审批或发布失败时旧配置继续运行。失败重试和回滚只保留确认与结果状态，回滚仍形成新的发布编号。
- 紧急停流不进入普通集合，而是自动形成独立紧急发布记录和审计编号。

### 5. 运行监控

- 统一单页覆盖 API 与 AI，不拆两个页面；结构为基础筛选、健康摘要、请求量与成功／错误率两张趋势图、服务健康清单。
- 默认近 15 分钟，并提供 1 小时和 24 小时快捷范围；不设计任意时间查询。筛选只保留数据应用、服务产品、能力类型和运行状态，固定版本作为次级条件。
- 摘要展示正常服务数量、异常服务数量、成功率和 P95。公共指标为 QPS、成功率、错误率和 P95；模型、Agent 等 AI 能力追加首 Token 延迟和降级次数。
- 健康状态统一为正常、降级、异常和无数据。详情抽屉只展示当前指标、当前时间范围的趋势摘要、最近异常和异常事件入口。
- 不建设阈值规则、调用日志、Trace、告警规则、原始查询语言或基础设施筛选。

### 6. 异常事件

- 页面只采用简要统计和只读列表，不设计详情抽屉。顶部统计持续异常数、近 24 小时已恢复数、高严重异常数和受影响服务数。
- 列表展示异常类型、影响的数据应用或服务产品、严重程度、状态和发生或恢复时间；默认近 24 小时，只提供状态、严重程度和关键字筛选。
- 事件类型只覆盖服务不可用、成功率下降、响应延迟升高、路由或模型降级异常、配置发布失败；严重程度为高、中、低，状态为持续中、已恢复。
- 不提供人工处置、日志全文、基础设施事件、手工创建事件、告警阈值或通知策略。

### 7. 审计日志

- 页面采用分类统计、只读明细和类型化详情。顶部统计近 24 小时审计记录、外部数据调用、中台数据加工和系统运行日志。
- 列表展示时间、审计类型、执行主体、审计事项、关联对象、执行结果、结果摘要和关联编号；默认近 24 小时，只提供审计类型、执行结果和关键字筛选。
- 记录范围覆盖管理操作、系统运行日志、外部数据调用和中台数据加工；执行结果为成功、失败、进行中和已拒绝。
- 外部调用详情关联数据应用、外部消费场景、服务固定版本、认证方式、服务授权、数据权限、字段范围、结果数量与耗时；中台加工详情关联加工任务、来源与目标资产、调度批次、读写行数、耗时和失败原因。
- 管理操作详情保留审批和运行影响；系统运行日志详情只显示数据服务事件摘要。所有记录不可修改或删除，不保存请求参数值、响应正文或秘密值，也不提供主机、容器等基础设施日志全文、全文检索、导出或审计策略配置。

## 五、各项目缺失能力与不能照搬之处

### HiMarket

**缺失：**

- 管理端路由中没有独立的路由管理、策略管理、网关配置发布／回滚、异常事件和审计日志页。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/routes/index.tsx:18-121`）
- 网关实例类型没有健康、最后检查、配置版本或漂移字段，不能直接承担“网关概览”。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/types/gateway.ts:1-46`）
- 版本审批交互来自 Skill 制品管理，不提供网关配置差异、配置哈希、逐项下发和回滚发布。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/components/api-product/package-management/types.ts:17-33`）
- 监控只覆盖模型与 MCP 两个专用页面，未统一覆盖 API、Agent、Skill、Worker、数据应用及其固定版本。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/routes/index.tsx:103-113`）

**不能照搬：**

- 硬编码的网关厂商类型、品牌说明、图标和主题。
- 在运行管理中直接录入用户名、密码、Access Key 或 Secret Key。
- 把“实例导入”当作“注册与路由”的完整业务流程。
- 把制品的 `online/offline/latest/force publish` 操作直接套到网关配置发布。
- 把日志后端的参数名、PV／UV 以及所有模型指标同时暴露给普通运维用户。

### Higress

**缺失：**

- 当前本地核心仓库没有实际控制台前端、页面路由和组件代码；真实控制台是独立仓库。（来源：`/mnt/d/cursor/higress/README_ZH.md:251-256`）
- 本轮可核验的核心对象只提供注册来源、代理和插件运行配置；这些对象中没有 Data servers 所需的数据应用、平台审批、运行／开发版本、配置发布单、回滚发布、异常处置和运行审计页面模型。（来源：`/mnt/d/cursor/higress/api/networking/v1/mcp_bridge.proto:47-99`；`/mnt/d/cursor/higress/api/extensions/v1alpha1/wasmplugin.proto:50-127`）
- 请求／响应日志配置面向流量内容记录，不等于本项目关联管理操作、系统事件、外部调用治理和中台加工过程的运行审计。（来源：`/mnt/d/cursor/higress/plugins/release/console/log-request-response/spec.yaml:22-97`）

**不能照搬：**

- Kubernetes 命名空间、CRD、注解、Wasm 镜像、拉取策略、镜像密钥、插件阶段和原始 YAML／JSON。
- 把服务发现的所有来源参数平铺给业务用户；这些应进入适配器设置或高级诊断。
- 把插件自身的全局／路由配置直接等同于本平台的策略版本、审批和发布流程。
- 任何项目名称、Logo、社区链接、推广文案或厂商专属默认值。

## 六、设计采用顺序

1. 先用 HiMarket 的“页头 + 筛选／类型切换 + 状态表格”骨架完成网关概览和注册与路由。
2. 用 Higress 的作用域与 Schema 概念校准策略管理字段，但将技术配置收进厂商中立的领域表单。
3. 用 HiMarket 的版本状态与审批失败详情作为配置发布的交互参考，只表达待发布摘要、审批状态、旧运行配置保护和回滚结果，不补绘技术差异或执行步骤。
4. 用 HiMarket 的监控骨架制作统一运行监控，根据能力类型渐进显示 AI 或 MCP 指标。
5. 异常事件和审计日志按本项目已确认的轻量表格范围独立设计，不从流量日志或行内错误状态推导出不存在的完整功能。
