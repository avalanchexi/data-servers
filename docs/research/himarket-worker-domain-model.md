# HiMarket Worker 领域模型与源码边界核验

> 核验日期：2026-09-02  
> HiMarket 源码目录：`D:\cursor\himarket`  
> 核验提交：`a352157ba406eecc93ebac7a52babe9500c26950`

## 1. 结论

HiMarket 中的 Worker 不是 Java Worker Thread、后台任务、定时调度器，也不是已经运行并可直接调用的 Agent 实例。它是以 Nacos `AgentSpec` 为底层制品模型，由 HiMarket 作为 `WORKER` 产品进行编目、版本治理、审核发布、浏览、下载和安装分发的 **Agent Worker 规格包或模板制品**。

更准确的领域链路是：

```text
Worker ZIP / AgentSpec 草稿
    ↓ 上传或编辑
HiMarket WORKER 产品
    ├─ 保存产品信息、Nacos 引用、标签和本地镜像元数据
    └─ 提供版本治理、门户发布、下载和安装入口
    ↓
Nacos AgentSpec Registry
    ├─ 保存 AgentSpec 内容与资源
    └─ 管理版本、审核、上下线和 latest 标签
    ↓ 下载或导入
HiClaw / AgentTeams 等 Agent 运行环境
    ↓
按该运行环境的契约创建 Worker Agent 实例并执行任务
```

本结论由以下一手来源共同支持：

- HiMarket 官方 README 将 Worker Marketplace 定义为“打包、版本化和分发可装载 Skills 的 Agent Worker”，并说明支持 Nacos 批量导入和 CLI 安装：`D:\cursor\himarket\README.md:44-50`、`D:\cursor\himarket\README_zh.md:44-50`。
- HiMarket Worker Controller 只暴露包上传、文件浏览、版本、草稿、下载、CLI 信息和 Nacos 导入接口，没有运行实例、任务派发或停止执行接口：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:49-176`。
- Nacos 官方文档明确区分“可被发现和调用的 Agent 入口”与“描述 Agent 能力、行为和资源的 AgentSpec 规格包”： [Nacos AgentSpecs Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)。
- HiClaw 官方文档把 Worker 创建、销毁、任务派发、进度监控、独立凭据和 MCP 权限控制归入 Manager Agent 和 HiClaw 运行环境： [HiClaw](https://higress.ai/en/hiclaw/)。

因此，“Worker 是 Agent 的一类”在口语上可以接受，但在系统设计中必须继续区分：

1. `WORKER`：HiMarket 产品类型。
2. `AgentSpec`：Nacos 中的规格包和版本化制品。
3. `Worker Agent 实例`：运行环境依据规格包创建的实际执行主体。

## 2. 证据范围与仓库状态

本文只采用以下来源作为概念和事实依据：

1. `D:\cursor\himarket` 当前官方源码及该提交中的官方 README。
2. Nacos 官方 AgentSpec Registry、AI Registry 和 CLI 文档。
3. Higress/HiClaw 官方产品文档。

本文没有把 `D:\cursor\Data servers` 中既有产品文档或设计文档作为 Worker 概念来源。

只读 Git 核验结果：

```text
origin = https://github.com/higress-group/himarket.git
branch = main
local HEAD = a352157ba406eecc93ebac7a52babe9500c26950
origin/main = a352157ba406eecc93ebac7a52babe9500c26950
```

核验命令为 `git rev-parse HEAD`、`git remote -v` 和 `git ls-remote origin refs/heads/main`。本地 HEAD 与官方远端 `main` 一致。

但 HiMarket 工作树不是干净状态：`README.md`、`README_zh.md` 有本地修改，`docs/` 下有未跟踪文件和目录。本文引用 README 定义时核对的是 `git show HEAD:README.md` 和 `git show HEAD:README_zh.md` 中上述提交的内容；本次涉及的 Worker Java/TypeScript 源文件未显示为本地修改。

## 3. 对先前六个问题的来源回答

### 问题一：Worker 是什么

**来源可以确定的回答：** Worker 是 HiMarket 中一种 `ProductType.WORKER` 产品，其实际包内容和版本生命周期由 Nacos AgentSpec 承载。它是可分发的 Agent Worker 规格或模板，而非运行线程和已启动实例。

证据：

- README 的 Worker Marketplace 定义：`D:\cursor\himarket\README.md:44-50`。
- Worker 上传服务将包提交给 Nacos `uploadAgentSpecFromZip`：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:76-110`。
- Worker 导入从 Nacos `listAgentSpecAdminItems` 读取 AgentSpec，并创建 `ProductType.WORKER` 产品：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:1170-1229`。
- Nacos 对 Agent 与 AgentSpec 的官方区分：[AgentSpecs Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)。

**来源不能决定的产品选择：** 是否在 AgenticOS 中继续使用“Worker”、改名为“Agent 模板”或增加新的业务层级，是本项目术语和产品设计决策，不能伪装成 HiMarket 或 Nacos 已规定的事实。

### 问题二：Worker、Agent/Agent API、Skill 的关系是什么

**来源可以确定的回答：**

- AgentSpec 描述 Agent 的能力、行为和资源；Agent Registry 关注可发现、可调用的 Agent 入口。两者可以配合，但不是同一对象。[Nacos AI Registry Overview](https://nacos.io/en/docs/latest/manual/user/ai/ai-registry-overview/)、[Nacos AgentSpecs Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)。
- HiMarket 把 `AGENT_SKILL` 和 `WORKER` 作为不同产品类型处理，并分别保存 `skillConfig` 和 `workerConfig`：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\ProductFeature.java:31-37`；默认来源初始化也有独立分支：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\ProductServiceImpl.java:184-223`。
- README 只明确说 Worker 可以装载 Skills，并未把 Worker 等同于单个 Skill：`D:\cursor\himarket\README.md:49-50`。

可采用的严谨术语是：

- Agent/Agent API：可发现或可调用的 Agent 服务入口。
- Skill：Agent 可装载和复用的单项能力包。
- Worker：组合角色、行为约束和资源的 Agent Worker 规格或模板；被运行环境实例化后才成为 Worker Agent。

### 问题三：HiMarket 持久化和允许编辑哪些 Worker 配置

**来源可以确定的回答：** 后端权威 `WorkerConfig` 有七个字段：

| 字段 | 已证实含义 | 一手源码 |
| --- | --- | --- |
| `nacosId` | 所引用的 Nacos 实例 ID | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:35-38` |
| `namespace` | Nacos namespace，注释说明默认 `public` | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:40-43` |
| `agentSpecName` | AgentSpec 名称 | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:45-48` |
| `tags` | Worker 分类和检索标签 | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:50-53` |
| `versionInfos` | 版本补充信息映射；当前值类型只保存作者 | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:55-58`；`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\VersionInfo.java:31-36` |
| `latestVersion` | Nacos `latest` 标签的本地镜像 | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:60-63`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\task\SkillWorkerMetadataSyncTask.java:207-215` |
| `downloadCount` | Nacos AgentSpec 下载量的本地镜像 | `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:65-68`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\task\SkillWorkerMetadataSyncTask.java:201-205` |

该对象通过 `Product.feature.workerConfig` 存入产品表 JSON 字段：

- `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\ProductFeature.java:31-37`
- `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\entity\Product.java:96-98`
- `D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\converter\ProductFeatureConverter.java:25-30`

管理端 Worker 专属产品表单目前只直接编辑 `tags`：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\WorkerConfigForm.tsx:7-25`。

Nacos 来源切换表单只选择 `nacosId` 和 `namespace`：

- 前端保存请求：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:457-477`。
- 前端表单字段：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:1427-1458`。
- 后端来源参数没有 `agentSpecName`：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\product\UpdateProductSourceParam.java:8-20`。
- Worker 使用 AI Registry 会被拒绝，Nacos 分支保存 `nacosId + namespace`：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\ProductServiceImpl.java:694-759`。

`agentSpecName` 来自首次上传的 Nacos 返回值或 Nacos 导入项，而不是来源表单中的第三个选择字段：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:89-99,1193-1223`。

产品名称、描述、类型、分类和图标属于通用产品信息：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductFormModal.tsx:322-388,423-447`。通用后端实体虽有 `autoApprove`：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\entity\Product.java:93-98`，但当前管理表单对 `WORKER` 和 `AGENT_SKILL` 隐藏该控件：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductFormModal.tsx:390-421`。

### 问题四：Worker ZIP 有哪些已证实约束，能携带什么

**当前生产上传链路可以确定的约束：**

- 上传端点接收 multipart Worker ZIP：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:49-60`。
- HiMarket 明确拒绝空文件和超过 30 MB 的文件：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:68,76-80`。
- 通过后，原始 ZIP 被直接交给 Nacos SDK `uploadAgentSpecFromZip`：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:82-110`。

仓库中另有 `AgentSpecZipParser`，其代码要求 `manifest.json` 和 `worker.suggested_name`，并实现文本 UTF-8、二进制 Base64 的资源转换：

- manifest 读取和名称校验：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\core\agentspec\AgentSpecZipParser.java:20-70`。
- ZIP 文件提取：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\core\agentspec\AgentSpecZipParser.java:74-114`。
- 资源编码：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\core\agentspec\AgentSpecZipParser.java:116-160`。

但在本次核验提交上执行仓库级 `rg -n "AgentSpecZipParser" D:\cursor\himarket`，只命中该类自身的声明 `AgentSpecZipParser.java:20`，没有生产调用方或测试调用方。因此，这些规则只能表述为“仓库中未接入当前上传链路的解析器所实现的规则”，不能表述为“HiMarket 当前上传服务必然执行的全部规则”。Nacos SDK 或服务端实际追加哪些 ZIP 校验，应以所用 Nacos 版本的 SDK/服务端契约为准。

Nacos 官方只在通用层面确认 AgentSpec 包含规格内容和资源文件、可以 ZIP 上传、可以通过草稿 API 更新：[Nacos AgentSpecs Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)。

HiMarket 对具体文件名唯一可直接确认的 UI 约定是优先读取根目录 `AGENTS.md`，其次读取 `config/AGENTS.md` 作为概览：

- 管理端：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:193-219`。
- 开发者门户：`D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\WorkerDetail.tsx:146-157`。

因此可以说 AgentSpec 资源能够承载 `SOUL.md`、`MEMORY.md`、Skills、MCP 配置、脚本和其他文件，但不能说 HiMarket 已为这些文件建立运行 Schema或会解释其语义。具体结构由下游运行时契约决定。

### 问题五：Worker 如何版本化、审核、发布、下载和安装

**来源可以确定的回答：**

- 列出版本并从 Nacos 元数据解析状态：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:180-268`。
- 提交审核：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:277-292`。
- 发布批准版本：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:294-310`。
- `status/latest/author` 三种版本更新操作：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:390-458`。
- 基于已有版本创建草稿：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:461-488`。
- 更新完整 AgentSpec 草稿：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:513-555`。
- 设置 Nacos `latest` 标签并保存本地镜像：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:778-806`。
- 下载指定版本或 `latest` 指向的版本，并在 HiMarket 本地重建 ZIP：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:312-387`。
- HiMarket 产品发布到门户前，Worker 必须至少存在一个 `online` 版本：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\ProductServiceImpl.java:470-483`。

版本操作 DTO 必须分开理解：

- `PATCH /workers/{productId}/versions/{version}` 只接受 `status`、`latest`、`author`，且一次只能指定一种操作：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\worker\UpdateWorkerVersionParam.java:10-52`。
- `baseVersion` 属于创建草稿请求：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\worker\CreateWorkerDraftParam.java:8-12`。
- `agentSpecCard` 属于更新草稿请求：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\worker\UpdateWorkerDraftParam.java:8-15`。
- 三类路由分别定义于：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:95-141`。

Nacos 官方 CLI 文档确认 AgentSpec 支持 list、describe、get/download、upload、review 和 release 生命周期：[Nacos CLI User Guide](https://nacos.io/en/docs/latest/manual/admin/nacos-cli/)。

HiMarket 生成的安装信息包含 Nacos Host、Port、Namespace、Resource Name，并把 Resource Type 固定为 `worker`：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:1129-1160`。门户据此生成 HiClaw 导入脚本和 `nacos-cli agentspec-get` 命令：`D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\WorkerDetail.tsx:689-843,851-900`。

### 问题六：Worker 实际在哪里运行，谁负责任务和权限

**来源可以确定的回答：** HiMarket 本身没有 Worker 实例运行或调度 API。`WorkerController` 的完整公开职责只覆盖制品和版本管理：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:40-176`。

HiMarket 确实存在一个每五分钟执行的 `SkillWorkerMetadataSyncTask`，但它只从 Registry 同步 `downloadCount` 和 `latestVersion` 并写回产品元数据：

- 调度入口：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\task\SkillWorkerMetadataSyncTask.java:45-67`。
- Worker 元数据同步：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\task\SkillWorkerMetadataSyncTask.java:165-215`。

这个后台任务不是“Worker 的运行”，二者不得混淆。

HiClaw 官方文档明确把下列职责放在 Manager Agent 和运行环境：

- 按需创建和销毁 Worker。
- 任务派发和执行进度监控。
- 每个 Worker 的独立模型访问凭据。
- MCP 工具凭据托管及 Worker 级动态权限控制。

来源：[HiClaw](https://higress.ai/en/hiclaw/)、[HiClaw Introduction](https://higress.ai/en/docs/hiclaw/hiclaw-introduction/)。

但 HiMarket 与 Nacos 官方来源不能证明 AgentTeams、OpenClaw 或所有其他运行时都采用与 HiClaw 完全相同的实例模型、调度策略和权限隔离实现；这些必须逐一查阅对应运行时的官方契约。

## 4. 已证实事实

1. Worker 是 HiMarket 的独立产品类型，并以 Nacos AgentSpec 作为包和版本的底层对象：`D:\cursor\himarket\README.md:44-50`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:76-110,1170-1229`。
2. HiMarket 管理 Worker 的产品信息、Nacos 引用、标签、本地作者信息、latest/downloadCount 镜像、版本工作流、门户发布、下载和安装信息：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:33-68`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:49-176`。
3. AgentSpec 的内容、资源、版本状态和标签以 Nacos 为外部权威来源；HiMarket 调用 Nacos AgentSpec Maintainer Service：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:180-243,277-310,778-855`。
4. Worker 当前只支持 Nacos 来源，不能切换到 AI Registry：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\ProductServiceImpl.java:694-759`。
5. HiMarket 没有 Worker 实例执行和任务调度接口：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:40-176`。
6. HiClaw 是源码门户直接生成安装脚本的一个下游运行目标：`D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\WorkerDetail.tsx:689-843`。

## 5. 可据此推导的本项目边界

以下是对已证实事实的直接架构推导，不是官方逐字定义：

1. 在本项目领域模型中，应把 Worker 放在“Agent 模板/规格制品”一侧，而不是放在“数据任务实例”“后台线程”或“定时调度任务”一侧。推导依据是 HiMarket 完整 Worker API 仅管理制品和版本：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:49-176`。
2. “发布 Worker 产品”只代表产品和至少一个 online AgentSpec 版本可被市场发现和安装，不代表已启动常驻 Worker 进程。推导依据是产品发布校验只检查 online 版本：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\ProductServiceImpl.java:470-483`，实际运行职责由 HiClaw 官方文档放在 Manager Agent。
3. 本项目如果需要表示运行中的 Worker，应另建“Worker 实例/Agent 实例/运行任务”等运行态对象，并显式关联 Worker 产品、AgentSpec 名称和版本；不能把 `WorkerConfig` 当成实例状态。推导依据是 `WorkerConfig` 只有 Registry 引用和市场元数据：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:33-68`。
4. 模型、凭据、并发、超时、调度和资源配额应由选定运行时契约决定；HiMarket 当前模型不能充当这些字段的权威 Schema。推导依据是 `WorkerConfig` 的完整字段集不包含它们：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:33-68`。

是否让本项目未来承担 Worker 实例编排、是否复用现有任务调度模块、是否新增运行时适配器，都是待作出的产品和架构选择，不能从 HiMarket 当前实现自动得出。

## 6. 官方未定义、不得假设

1. **不得假设 HiMarket 已定义完整的 Worker manifest Schema。** 当前生产上传链路直接调用 Nacos SDK：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:76-110`；仓库中的本地解析器没有调用方：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\core\agentspec\AgentSpecZipParser.java:20`。
2. **不得假设所有 ZIP 更新都由 HiMarket 本地强制校验 `worker.suggested_name` 不变。** 该校验只出现在未接入的解析器：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\core\agentspec\AgentSpecZipParser.java:44-61`。草稿编辑另有前端名称保护和后端 `AgentSpecCard.name` 校验：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:129-139`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:513-529`，但这不能替代 ZIP 上传链路证据。
3. **不得假设 `versionInfos` 保存状态。** 它当前只保存作者：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\VersionInfo.java:31-36`；状态来自 Nacos：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:180-243`。
4. **不得假设 `SOUL.md`、`MEMORY.md`、Skills 或 MCP 配置是 HiMarket 强制字段。** HiMarket 只明确特殊展示 `AGENTS.md`：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:193-219`。
5. **不得假设模型、System Prompt、并发、超时、重试、Cron、环境变量、实例数、CPU 或内存限制都必须放进 `manifest.json`。** HiMarket 没有相应一等字段：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:33-68`。存放位置和解释方式由具体运行时定义。
6. **不得假设安装完成等于 Worker 已经运行。** 门户只生成导入/下载命令：`D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\WorkerDetail.tsx:689-900`；HiMarket 没有运行接口：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:40-176`。
7. **不得假设 AgentTeams 等所有运行环境与 HiClaw 的权限模型完全一致。** HiClaw 的创建、调度、凭据和 MCP 控制只由 HiClaw 官方文档证明：[HiClaw](https://higress.ai/en/hiclaw/)。
8. **不得把“是否在本项目实现 Worker 调度”写成现状事实。** 这是产品和架构决策；当前 HiMarket 证据只证明市场与制品管理边界。

## 7. 对用户初始总结的必要修正

### 修正一：保留核心结论，但收紧术语

原总结“Worker 指的是 Agent 的一类”方向正确，但易把模板和实例混在一起。建议改为：

> HiMarket Worker 是一种可版本化、可审核、可发布和可安装的 Agent Worker 规格/模板制品；下游运行环境依据它创建 Worker Agent 实例。

证据：`D:\cursor\himarket\README.md:44-50`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\controller\WorkerController.java:49-176`；[Nacos AgentSpecs Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)。

### 修正二：不能把 `AgentSpecZipParser` 写成当前上传解析链路

当前生产服务只做非空/30 MB 校验并调用 Nacos SDK：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:68,76-110`。`AgentSpecZipParser` 的 manifest、名称和编码规则虽然存在：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\core\agentspec\AgentSpecZipParser.java:20-160`，但仓库级搜索没有发现调用方。

### 修正三：版本 PATCH 只有三个字段

`UpdateWorkerVersionParam` 只有 `status/latest/author`，且三者一次只能选一个：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\worker\UpdateWorkerVersionParam.java:10-52`。`baseVersion` 和 `agentSpecCard` 分别属于创建草稿与更新草稿 DTO：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\worker\CreateWorkerDraftParam.java:8-12`；`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\worker\UpdateWorkerDraftParam.java:8-15`。

### 修正四：`versionInfos` 目前不保存版本状态

`VersionInfo` 只有 `author`：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\VersionInfo.java:31-36`。状态、Pipeline 信息和单版本下载量由 Nacos 元数据构造：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:180-243`。

### 修正五：数据源表单不选择 AgentSpec 名称

来源表单只选择 Nacos 实例和 Namespace：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:1427-1458`；后端来源参数也只有 Registry、Nacos/AI Registry ID 和 Namespace：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\dto\params\product\UpdateProductSourceParam.java:8-20`。`agentSpecName` 在首次上传或导入时获得：`D:\cursor\himarket\himarket-server\src\main\java\com\alibaba\himarket\service\impl\WorkerServiceImpl.java:89-99,1193-1223`。

### 修正六：自动审批不是 Worker 表单中的可编辑项

`autoApprove` 是通用产品实体字段：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\entity\Product.java:93-98`，但当前管理端在 Worker/Agent Skill 类型下隐藏该控件：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductFormModal.tsx:390-421`。

### 修正七：前端字段是契约错位；“遗留/兼容”只是推断

管理端类型当前声明 `workerName/currentVersion/latestVersion`，却没有后端的 `agentSpecName`：`D:\cursor\himarket\himarket-web\himarket-admin\src\types\api-product.ts:324-333`。`currentVersion` 还被用于初始化预览版本：`D:\cursor\himarket\himarket-web\himarket-admin\src\components\api-product\ApiProductWorkerPackage.tsx:78-80`。后端权威字段则是 `agentSpecName/latestVersion`：`D:\cursor\himarket\himarket-dal\src\main\java\com\alibaba\himarket\support\product\WorkerConfig.java:45-63`。

因此可以确认前后端字段契约存在错位，并可称其“疑似历史字段”；但没有一手证据证明其设计目的就是兼容，不能把“遗留或兼容性类型”写成已证实事实。

## 8. 可直接采用的最终定义

> **Worker 产品**：HiMarket 中以 Nacos AgentSpec 为制品载体的 Agent Worker 规格或模板。HiMarket 负责产品编目、来源绑定、版本治理、审核发布、门户展示、下载和安装信息；Nacos AgentSpec Registry 负责规格内容、资源、版本及标签；HiClaw、AgentTeams 等下游运行环境按各自契约下载或导入该规格，创建 Worker Agent 实例并承担任务调度、执行和权限隔离。HiMarket 当前不定义统一的 Worker 运行参数 Schema，也不运行 Worker 实例。

## 9. 官方网页来源

- [HiMarket GitHub README](https://github.com/higress-group/himarket/blob/main/README.md)
- [Nacos AgentSpecs Registry](https://nacos.io/en/docs/latest/manual/user/ai/agentspec-registry/)
- [Nacos AI Registry Overview](https://nacos.io/en/docs/latest/manual/user/ai/ai-registry-overview/)
- [Nacos CLI User Guide](https://nacos.io/en/docs/latest/manual/admin/nacos-cli/)
- [HiClaw](https://higress.ai/en/hiclaw/)
- [HiClaw Introduction](https://higress.ai/en/docs/hiclaw/hiclaw-introduction/)
