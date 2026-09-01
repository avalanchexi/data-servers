# 轻量化 DevOps 开发工作台与生产发布平台选型调研

> 调研日期：2026-08-31  
> 目标：寻找一个带管理界面／管理 API，既支持开发工作，又支持版本、测试、多环境和生产发版的轻量 DevOps 产品  
> 资料边界：只使用项目官方 GitHub 仓库、仓库内许可证和官方文档；GitHub 活跃度取调研当日 GitHub REST API 快照  
> 重要说明：GitHub stars 只代表生态关注度，本报告不按 stars 排名；“轻量”同时考察最小硬件、外部依赖、是否强制 Kubernetes、控制面组件数量和上线后的运维负担

## 1. 结论摘要

### 1.1 先确定“生产制品”是什么

本次不是简单寻找“部署工具”，而是在选择一个开发到生产的一体化工作台。决定主选的关键是平台最终发布什么：

| 生产制品 | 单产品主选 | 原因 |
|---|---|---|
| script、function、Flow、Worker、可调用 API endpoint | **Windmill** | 这些对象在同一个工作台中完成编辑、测试、版本、编排、部署、触发和运行观测 |
| 普通 Git 仓库、Docker image、Helm/package、任意应用代码 | **OneDev** | Git、PR/code review、浏览器 Workspace、CI/CD、package registry、build promotion 和生产部署在同一个 DevOps 产品中 |

因此，**用户所说的“接口、函数、编排开发上线”如果是平台原生制品，Windmill 是主选；如果实际是开发任意代码仓库并把容器应用发到生产，OneDev 才更像真正的单体 DevOps 主选。**

### 1.2 Windmill 主选结论与边界

Windmill 是与“接口／函数／流程制品”重合度最高的候选：脚本可以作为函数／后台任务执行，脚本和 Flow 自动获得 Webhook／HTTP 调用入口，内置可视化 Flow、管理 UI、REST/OpenAPI、版本、草稿与部署、CLI 和 Git 同步；单机自托管只需要 PostgreSQL、Windmill server 和 worker，官方提供 Docker Compose。[项目仓库](https://github.com/windmill-labs/windmill)、[脚本与语言](https://www.windmill.dev/docs/script_editor)、[Flow/Webhook](https://www.windmill.dev/docs/core_concepts/webhooks)、[自托管架构](https://www.windmill.dev/docs/advanced/self_host)

但 Windmill 不是完整 PaaS，也不是完整 API 网关：

- 它擅长把内部脚本、任务、工作流变成可调用能力，不负责像 Coolify 一样从任意 Git 仓库构建并长期运行普通 Web 应用；
- 它能暴露 HTTP routes／webhooks，但不等价于具备服务发现、消费者认证、细粒度路由、流量治理和 Wasm 插件体系的 API 网关；
- 源码许可证是 AGPLv3／Apache-2.0／专有代码混合。官方 Community Edition 镜像还包含不可修改、不可包装、不可作为托管服务出售的非公开代码；如果要嵌入本项目或对外提供平台服务，必须先做许可证方案评审。[Windmill LICENSE](https://github.com/windmill-labs/windmill/blob/main/LICENSE)
- Community Edition 可以做生产发布，但不能照搬 Enterprise 的 UI promotion：Git sync 只对不超过 2 用户的 workspace 开放；Git→Windmill 自动拉取和 UI “Deploy to prod” 属于 Enterprise。可行 CE 路径是用 Git PR 作为审核门、在 CI 中执行 `wmill sync push` 分别发布到 staging/prod workspace。[CE Git sync 公告](https://www.windmill.dev/changelog/git-sync-community-edition)、[CLI sync](https://www.windmill.dev/docs/advanced/cli/sync)、[UI deploy edition](https://www.windmill.dev/docs/core_concepts/staging_prod)

### 1.3 OneDev：普通仓库／容器制品的单产品主选

OneDev 同时提供 Git server、代码搜索与评审、issue、浏览器开发 Workspace、CI/CD、构建产物、内置 package/container registry、build promotion、REST API 和生产部署。Workspace 可从任意 branch/tag/commit 启动并使用 Codex 等 coding agent；Community Edition 可在 OneDev server 上运行 Workspace。CI 的 job dependency graph 形成 pipeline，已验证 build 可以携带原制品 promotion 到 deploy job，避免重新构建未验证制品。[项目仓库](https://github.com/theonedev/onedev)、[核心概念](https://docs.onedev.io/concepts)、[Workspace](https://docs.onedev.io/tutorials/workspace/working-with-workspaces)、[Build promotion](https://docs.onedev.io/tutorials/cicd/build-promotion)

OneDev 单 Docker 容器可运行，默认内嵌数据库，官方基线为 2 核/2 GB；REST API 文档随实例发布在 `/~help/api`，核心仓库为 MIT。[Docker installation](https://docs.onedev.io/installation-guide/run-as-docker-container)、[REST API](https://docs.onedev.io/restful-api)、[LICENSE](https://github.com/theonedev/onedev/blob/main/license.txt)

它的边界也很明确：OneDev 的一等开发对象是 repository、commit、PR、build、package 和 deployment job，不是 script/function/Flow/API endpoint。可以在仓库里开发并发布函数服务，但函数版本、输入 schema、调用 endpoint、step 级运行记录不会自动成为 OneDev 的领域对象。

### 1.4 何时需要组合产品

对“管理接口 + 函数 + 编排 + 开发上线”这个复合目标，建议采用清晰分层，而不是要求一个项目承担所有职责：

```text
开发者 / Git / CI
        │
        ├── 函数、后台任务、业务编排 ── Windmill
        │
        ├── 普通 API、Web 服务、Compose 应用 ── Coolify
        │
        └── 流量入口、认证、限流、路由、审计 ── Higress
```

只有单产品无法覆盖网关治理或普通应用长期运行时，才建议分层：

1. **函数／流程产品需要额外托管普通 Web 服务时：Windmill + Coolify。** Windmill 管函数和工作流，Coolify 管 Git→构建→容器→域名→上线；两者都有 Web UI 和 HTTP API。[Coolify Applications/API](https://coolify.io/docs/applications/index)、[Coolify GitHub 集成](https://coolify.io/docs/applications/ci-cd/github/overview)
2. **第二阶段：确有统一 API 治理需求时再加 Higress。** Higress 管路由、域名、服务来源、认证／限流插件和观测；不要把它当作函数或工作流运行时。[Higress 仓库](https://github.com/higress-group/higress)、[插件配置](https://higress.cn/en/docs/latest/user/plugins/intro/)
3. 如果必须使用宽松许可证构建内部平台，优先验证 **Coolify + Nuclio + Higress**；它们的核心代码分别是 Apache-2.0、Apache-2.0、Apache-2.0，但 Nuclio 不提供通用 DAG 工作流，需要自研编排或再接 Kestra。[Nuclio LICENSE](https://github.com/nuclio/nuclio/blob/development/LICENSE)、[Kestra LICENSE](https://github.com/kestra-io/kestra/blob/develop/LICENSE)

### 1.5 为什么其他项目不能单独满足

- **Dokku** 很轻，Git push 上线也成熟，但核心交互是 CLI/SSH，没有第一方 Web 管理台和稳定 REST 管理 API，也没有函数／DAG 工作流，因此不符合本次“管理接口”要求。[官方快速开始](https://dokku.com/docs/getting-started/installation/)
- **CapRover** 上手轻，UI 和 Git webhook 部署完整，但官方 API SDK仍标记为 experimental，工作流与函数不是一等资源；更适合小团队托管普通应用。[官方 API SDK](https://github.com/caprover/caprover-api)、[部署方式](https://caprover.com/docs/deployment-methods.html)
- **OpenFaaS/faasd** 的函数体验和函数网关很好，但当前 CE EULA 只允许个人非商业使用，商业评估仅 60 天；企业内部生产使用需要商业许可，而且它没有通用 DAG 编排。[OpenFaaS CE 说明](https://github.com/openfaas/faas)、[faasd EULA](https://github.com/openfaas/faasd/blob/master/EULA.md)
- **KubeVela** 的交付工作流、环境和多集群能力很强，但强制依赖 Kubernetes，VelaUX 还是可选附加控制面；它是应用交付控制面，不是轻量函数平台。官方 v1.11 安装文档目前声明 Kubernetes 支持范围为 1.19–1.31，采用较新集群前必须再核验兼容性。[安装要求](https://kubevela.io/docs/installation/kubernetes/)
- **Higress** 是网关补位，不是主开发平台。官方明确提示 Docker Compose standalone 主要用于本地测试、未大规模生产验证，生产更建议 Helm/Kubernetes。[Standalone 部署说明](https://higress.cn/docs/latest/ops/deploy-by-docker-compose/)
- **Restate** 是 durable execution runtime，UI 主要用于运行状态观察，业务代码仍需由 Docker/Kubernetes/Lambda 等外部系统部署；它不提供 Git、PR、CI、package 和多环境 release 工作台。[Restate workflows](https://docs.restate.dev/tour/workflows)、[Restate README](https://github.com/restatedev/restate)
- **Hatchet** 是 task/workflow engine，任务、worker 和 durable workflow 以代码定义，Dashboard/API 管运行；代码仓库、测试流水线、worker image 构建和生产部署仍需外部 DevOps。[Hatchet overview](https://docs.hatchet.run/v1)、[Hatchet repository](https://github.com/hatchet-dev/hatchet)

## 2. 评价口径

本报告把需求拆成六个可验证能力，避免把“反向代理”“容器任务”误称为完整网关或函数平台：

| 能力 | 本报告认定标准 |
|---|---|
| 管理界面／API | 第一方 Web UI，以及可供外部系统使用的 REST/OpenAPI/Kubernetes API；只有 CLI/SSH 不计为完整管理 API |
| 函数 | 代码或 handler 是一等资源，平台负责构建／执行／版本／触发／日志；“把函数代码做成普通容器”只记为间接支持 |
| 工作流编排 | 有可持久化的多步骤流程、分支／循环／失败处理／暂停或审批；单纯部署队列、cron 或事件触发不等于 DAG 工作流 |
| 开发到上线 | 至少覆盖版本、Git/CI、构建、环境或部署、日志／回滚中的主要链路 |
| API 网关 | 除转发和 TLS 外，还应具备路由、认证／授权、限流、插件／策略和观测中的主要能力 |
| 轻量化 | 可单机运行、无强制 Kubernetes、依赖和组件少、最低资源明确、升级与备份边界简单 |

表中“部分”表示能完成相邻能力，但不是该项目的一等产品对象。

## 3. 总体比较

| 项目 | 管理 UI / API | 一等函数 | 多步骤工作流 | Git/CI 到上线 | API 网关 | 最小部署形态 | 本次定位 |
|---|---|---:|---:|---:|---:|---|---|
| [Windmill](https://github.com/windmill-labs/windmill) | Web UI + REST/OpenAPI | 强 | 强 | 强，但制品限 Windmill 资源；CE 需 CLI/CI 发布 | 部分：HTTP routes/webhooks | PostgreSQL + server + worker；Docker Compose | **函数/流程制品主选** |
| [OneDev](https://github.com/theonedev/onedev) | Web UI + 随实例 REST API | 间接：仓库代码 | 强：CI job DAG，不是业务 Flow | **强：Workspace/Git/PR/build/package/promotion/deploy** | 无 | 单 Docker + 内嵌 DB；2 核/2 GB | **普通仓库/容器制品主选** |
| [Coolify](https://github.com/coollabsio/coolify) | Web UI + REST API | 间接：普通应用/容器 | 弱：部署队列，不是业务 DAG | 强 | 部分：Traefik/Caddy 反代 | Linux + Docker；2 核/2 GB/30 GB | **应用发布主选** |
| [Dokploy](https://github.com/Dokploy/dokploy) | Web UI + Swagger/OpenAPI | 间接 | 弱 | 强 | 部分：Traefik 反代 | Linux + Docker；2 GB/30 GB | Coolify 替代，先审许可证 |
| [CapRover](https://github.com/caprover/caprover) | Web UI + experimental TS SDK | 间接 | 无 | 强 | 部分：Nginx 反代 | Docker + Swarm；建议至少 1 GB | 很轻的应用 PaaS |
| [Dokku](https://github.com/dokku/dokku) | CLI/SSH；无第一方 Web UI/REST | 间接 | 无 | 强 | 部分：Nginx 反代 | Ubuntu/Debian + Docker；1 GB | 最轻 Git-push PaaS，接口不符 |
| [OpenFaaS/faasd](https://github.com/openfaas/faasd) | UI + Swagger REST | 强 | 部分：事件、队列、cron，不是 DAG | 中 | 中强：函数专用 Gateway | 单 Linux + containerd/CNI；1 GB 推荐 | 函数专用；商业许可证阻断 |
| [Nuclio](https://github.com/nuclio/nuclio) | Web UI + Dashboard REST | 强 | 部分：触发器/事件映射，不是 DAG | 中 | 部分：函数入口/API Gateway 资源 | 本地单 Docker Dashboard；生产可 K8s | 宽松许可证 FaaS 备选 |
| [KubeVela](https://github.com/kubevela/kubevela) | Kubernetes API + CLI；VelaUX 可选 | 间接：部署容器 | 强：交付 workflow/pipeline | 强 | 无 | Kubernetes + 可选 VelaUX/插件 | 强交付编排，但不轻 |
| [Higress](https://github.com/higress-group/higress) | Console + Swagger/K8s API | 不是通用函数；支持 Wasm/MCP 插件 | 无 | 弱 | **强** | standalone 多组件仅宜测试；生产 K8s | **网关补位主选** |
| [Kestra](https://github.com/kestra-io/kestra) | Web UI + REST API | 部分：脚本任务，不是低延迟函数服务 | **强** | 中：Flow Git/CI/CD | 部分：Webhook，不是网关 | 单 JVM + PostgreSQL；Docker Compose | 工作流优先时的替代 |
| [Restate](https://github.com/restatedev/restate) | 运行观察 UI + CLI/API | 强：SDK handler | 强：durable workflow-as-code | 弱：业务 service 需外部部署 | 部分：自身 ingress，不是 API 治理网关 | 单 binary/container；生产需持久盘 | 耐久执行 runtime，不是 DevOps 工作台 |
| [Hatchet](https://github.com/hatchet-dev/hatchet) | Dashboard + REST/gRPC SDK | 强：task | 强：DAG/durable workflow | 弱：worker 制品需外部部署 | 无 | engine + PostgreSQL；可 embedded | 任务编排 runtime，不是 DevOps 工作台 |

## 4. 活跃度与许可证快照

下表的“最后推送”和“最新 release”来自 2026-08-31 调用 GitHub REST API 的结果；所有列出的仓库当日均为 `archived=false`。这只是活跃度信号，不替代版本兼容性和维护质量评估。

| 项目 | 最后推送（UTC） | GitHub latest release | 许可证判断 | 风险提示 |
|---|---:|---|---|---|
| Windmill | 2026-08-31 | [v1.799.0，2026-08-28](https://github.com/windmill-labs/windmill/releases/latest) | AGPLv3 + Apache-2.0 + proprietary 混合 | CE 镜像不可修改、包装、转售或作为托管服务，嵌入前法务评审 |
| OneDev | 2026-08-30 | [v16.5.9，2026-08-30](https://github.com/theonedev/onedev/releases/latest) | [MIT](https://github.com/theonedev/onedev/blob/main/license.txt) | CE 单机功能完整；HA/横向集群等有 EE 边界 |
| Coolify | 2026-08-30 | [v4.3.14，2026-08-28](https://github.com/coollabsio/coolify/releases/latest) | [Apache-2.0](https://github.com/coollabsio/coolify/blob/main/LICENSE) | 许可证清晰；主要边界是没有一等函数和业务工作流 |
| Dokploy | 2026-08-31 | [v0.30.3，2026-08-30](https://github.com/Dokploy/dokploy/releases/latest) | `/proprietary` 外 Apache-2.0；目录内 DSAL | proprietary 代码生产使用需要商业协议；版本仍低于 1.0 |
| CapRover | 2026-08-30 | [v1.15.4，2026-08-30](https://github.com/caprover/caprover/releases/latest) | Apache-2.0 文本附加额外条款 | GitHub 无法判定标准 SPDX；不能简单写成“纯 Apache-2.0” |
| Dokku | 2026-08-30 | [v0.38.27，2026-08-12](https://github.com/dokku/dokku/releases/latest) | [MIT](https://github.com/dokku/dokku/blob/master/LICENSE) | 宽松清晰，但管理面能力不足 |
| OpenFaaS core | 2026-07-02 | [0.27.13，2025-08-29](https://github.com/openfaas/faas/releases/latest) | OpenFaaS CE EULA + 第三方贡献 MIT | 企业内部生产需要商业许可 |
| faasd | 2025-11-18 | [0.19.7，2025-03-18](https://github.com/openfaas/faasd/releases/latest) | faasd CE EULA + 第三方贡献 MIT | 公开仓库 release/推送节奏明显慢于本表多数项目 |
| Nuclio | 2026-08-26 | [1.16.10，2026-08-26](https://github.com/nuclio/nuclio/releases/latest) | [Apache-2.0](https://github.com/nuclio/nuclio/blob/development/LICENSE) | 默认 Dashboard 生产安全配置需主动加固 |
| KubeVela | 2026-08-28 | [v1.11.0，2026-07-20](https://github.com/kubevela/kubevela/releases/latest) | [Apache-2.0](https://github.com/kubevela/kubevela/blob/master/LICENSE) | Kubernetes 版本兼容和附加控制面成本 |
| Higress | 2026-08-30 | [v2.2.4，2026-08-13](https://github.com/higress-group/higress/releases/latest) | [Apache-2.0](https://github.com/higress-group/higress/blob/main/LICENSE) | `alibaba/higress` 已迁移到 `higress-group/higress`；生产推荐 K8s |
| Kestra | 2026-08-30 | [v1.3.30，2026-07-28](https://github.com/kestra-io/kestra/releases/latest) | [Apache-2.0](https://github.com/kestra-io/kestra/blob/develop/LICENSE) | Git 同步／应用等部分能力有版本或企业版边界 |
| Restate | 2026-08-28 | [v1.7.8，2026-08-27](https://github.com/restatedev/restate/releases/latest) | BSL-1.1；单版本 4 年后转 Apache-2.0 | 内部使用允许；禁止直接提供 Public Restate Platform Service |
| Hatchet | 2026-08-30 | [v0.105.2，2026-08-25](https://github.com/hatchet-dev/hatchet/releases/latest) | [MIT](https://github.com/hatchet-dev/hatchet/blob/main/LICENSE) | 版本仍为 v0.x；生产升级兼容需固定版本验证 |

许可证原文中特别需要保留的事实：

- Windmill 官方 LICENSE 明确区分源码构建的 AGPL Community binary 与官方发布的 Community Edition 镜像；后者含 proprietary/non-public code，并限制修改、包装、转售和 managed service。[原文](https://raw.githubusercontent.com/windmill-labs/windmill/main/LICENSE)
- Dokploy 当前许可证明确：`/proprietary` 目录外为 Apache-2.0，目录内 DSAL 只允许开发测试，生产使用要有商业协议。[主许可证](https://github.com/Dokploy/dokploy/blob/canary/LICENSE.MD)、[DSAL](https://github.com/Dokploy/dokploy/blob/canary/LICENSE_PROPRIETARY.md)
- CapRover 的 LICENSE 在 Apache-2.0 后加入 appendix，限制 paid features 的修改／再分发，并要求 free features 的修改继续免费开源，因此不能按标准 Apache-2.0 无保留处理。[原文](https://github.com/caprover/caprover/blob/master/LICENSE)
- OpenFaaS/faasd CE 不是传统 MIT 开源许可：个人非商业可用，商业环境仅单次 60 天评估，继续使用要购买许可。[OpenFaaS LICENSE](https://github.com/openfaas/faas/blob/master/LICENSE)、[faasd EULA](https://github.com/openfaas/faasd/blob/master/EULA.md)
- Restate 是 BSL-1.1，不是 OSI 开源许可证；许可明确允许组织内部生产和内部平台，但禁止让第三方直接使用 Restate API 注册/调用其部署的“Public Restate Platform Service”，每个版本四年后转 Apache-2.0。[Restate LICENSE](https://github.com/restatedev/restate/blob/main/LICENSE)

## 5. 候选逐项分析

### 5.1 Windmill：函数与工作流重合度最高

**可验证能力**

- 脚本是一等资源，支持 TypeScript、Python、Go、Bash、PowerShell、SQL、Rust、Java 等，多数语言自动生成锁文件；脚本可单独执行，也可成为 Flow step。[Script editor](https://www.windmill.dev/docs/script_editor)
- 每个 script/flow 自动生成同步、异步和流式 webhook；Flow 还可生成固定版本 endpoint，并支持 Bearer token 和细粒度 webhook token。[Webhooks](https://www.windmill.dev/docs/core_concepts/webhooks)
- Flow 支持重试、错误处理、for-loop、分支、审批／暂停等编排语义；UI、可调用 API 和运行观测在同一平台。[Why Windmill](https://www.windmill.dev/docs/misc/why_windmill)
- 有 draft/deployed 状态、部署历史和测试；CLI 可拉取／推送 workspace；Git Sync 可双向同步，官方也给出 dev/staging/prod 的 promotion 模式。[Draft and deploy](https://www.windmill.dev/docs/core_concepts/draft_and_deploy)、[Git Sync](https://www.windmill.dev/docs/advanced/git_sync)、[部署阶段](https://www.windmill.dev/docs/advanced/canonical_deployment_setups)
- 自托管基本组件为 PostgreSQL、server 和 worker。server 同时提供前端与 API；官方建议 worker 按约 1 vCPU、1–2 GB RAM 配置。[Self-host](https://www.windmill.dev/docs/advanced/self_host)

**边界与采用条件**

- Community Edition 的 Git Sync 目前只允许最多 2 用户的 workspace；多 workspace、UI promotion 等也有 edition 边界，不能把官网所有功能默认当作免费自托管能力。[Git Sync edition 说明](https://www.windmill.dev/docs/advanced/git_sync)、[Deploy to prod](https://www.windmill.dev/docs/advanced/deploy_to_prod)
- Windmill 的 HTTP route/webhook 解决“如何调用函数”，不解决平台级 API 消费者管理、路由策略、全局认证、限流和插件治理；这些仍应交给 Higress 之类的网关。
- 如果平台准备二次开发、白标、嵌入或对外托管，必须明确使用“从 AGPL 源码自行构建”还是“官方 CE 镜像”，两者权利边界不同。

**结论**：最适合作为本项目的“函数／Worker 开发 + 编排 + 测试 + 版本 + 运行管理”参考或 PoC 底座；不应独自承担普通应用 PaaS 和统一 API 网关。

### 5.2 Coolify：普通应用从 Git 到上线的主选

**可验证能力**

- 支持公共／私有 Git 仓库、Dockerfile、Docker Compose、Docker image、Nixpacks；Git push 自动部署、GitHub Actions、PR preview 和回滚均有官方流程。[Applications](https://coolify.io/docs/applications/index)、[GitHub integration](https://coolify.io/docs/applications/ci-cd/github/overview)
- 官方 Applications 文档列出 create/list/get/update/delete 等管理 API；部署可以由 UI、Git event 或 API request 触发。[Applications API](https://coolify.io/docs/applications/index)、[Build and deployment model](https://next.coolify.io/docs/core/build-deployment-model)
- 单机最低建议 2 核、2 GB RAM、30 GB 空间，依赖 Linux、SSH 和 Docker 24+；官方安装脚本会配置 Docker、目录、SSH key 和 Coolify 服务。[Installation](https://coolify.io/docs/get-started/installation)
- Compose 文件可作为部署 source of truth，Coolify 负责网络、域名、环境变量和反向代理。[Docker Compose](https://coolify.io/docs/knowledge-base/docker/compose)

**边界**

- 官方资源模型是 applications、databases 和 Compose services；没有把 handler、函数版本或 DAG flow 定义为一等资源。函数可以作为普通 Web 应用／容器部署，但函数调度、step 级重试、输入输出追踪和审批需要 Windmill/Kestra 等执行层。
- Traefik/Caddy 解决域名、TLS 和反向代理，不等于完整 API 产品治理网关。

**结论**：若目标包含“任意 API/服务从 Git 开发到容器上线”，Coolify 是本报告首选发布层；许可证比 Windmill、Dokploy、CapRover 更清晰。

### 5.3 Dokploy：Swagger-first 的轻量 PaaS 替代

**可验证能力**

- 管理 API 有内置 Swagger UI，管理员可直接访问；可授权普通用户生成 API token，默认 base URL 为 `/api`。[Dokploy API](https://docs.dokploy.com/docs/api)
- 支持 GitHub/GitLab/Bitbucket/Gitea、任意 Git、Docker image、zip 和 raw Compose；应用和 Compose 都能从管理台部署。[Providers](https://docs.dokploy.com/docs/core/providers)
- 单机从 Dokploy server 起步，无额外 remote node 配置；官方建议至少 2 GB RAM 和 30 GB 磁盘，安装基于 Docker。[Installation](https://docs.dokploy.com/docs/core/installation)、[Deployment options](https://docs.dokploy.com/docs/core/deployment-options)
- Traefik 和域名配置集成完整，Compose 部署可自动加路由标签。[Compose domains](https://docs.dokploy.com/docs/core/docker-compose/domains)

**边界与风险**

- 与 Coolify 相同，它管理的是应用、Compose 和数据库，不提供一等函数或业务 DAG。
- 当前 release 仍是 v0.x，默认分支为 `canary`；API/内部对象变化风险应通过 PoC 固定版本验证。
- 2026 年许可证已改成 Apache-2.0 + `/proprietary` 目录 DSAL 混合；采用前必须扫描实际构建产物是否包含 proprietary 目录，并确认生产许可。

**结论**：如果最看重 Swagger 管理 API 和 Compose/Traefik 体验，可与 Coolify 对做 PoC；在许可证与版本稳定性审查完成前不作为默认主选。

### 5.4 CapRover：轻量应用托管，功能覆盖不足

**可验证能力**

- 单条 `docker run` 可启动管理台；支持 amd64/arm64，官方建议 Docker 25+，至少约 1 GB 内存。[Getting started](https://caprover.com/docs/get-started.html)
- 可通过 CLI 上传当前 Git commit、从 Git 仓库 webhook 自动构建，或直接部署预构建 image，并保留部署历史/回滚入口。[Deployment methods](https://caprover.com/docs/deployment-methods.html)
- 支持域名、HTTPS、环境变量、实例数和持久卷；新版可在 Dashboard 导入 Compose 的受限子集。[App configuration](https://caprover.com/docs/app-configuration)、[Compose 支持范围](https://caprover.com/docs/docker-compose)

**边界与风险**

- 第一方 TypeScript API SDK 明确标注 experimental，无法把它视为稳定管理契约。[caprover-api](https://github.com/caprover/caprover-api)
- Compose 只支持部分字段；`build`、custom networks、secrets、configs、deploy 等仍可能被忽略。[Compose 支持字段](https://caprover.com/docs/docker-compose)
- 没有一等函数和 DAG 编排；Docker Swarm/Nginx 的服务编排与业务流程编排不是同一件事。
- 许可证含非标准 appendix，需要法务确认二次分发和修改义务。

**结论**：适合“尽可能简单地把少量普通服务上线”，不适合做统一函数与编排管理底座。

### 5.5 Dokku：最轻 Git-push PaaS，但没有目标所需管理面

**可验证能力**

- 单服务器 PaaS，支持 Ubuntu/Debian、amd64/arm64，Docker scheduler 最低 1 GB；Git push 后用 Buildpacks/Dockerfile 构建并运行容器。[Installation](https://dokku.com/docs/getting-started/installation/)
- 官方支持 Git sync、GitHub Action 和通用 CI Docker image，部署链路成熟。[Git deployment](https://dokku.com/docs/deployment/methods/git/)、[GitHub Actions](https://dokku.com/docs/deployment/continuous-integration/github-actions/)
- MIT 许可证、插件生态和远程 SSH 命令使自动化很直接。[仓库](https://github.com/dokku/dokku)

**边界**

- 核心接口是本机/SSH `dokku` 命令，不提供第一方 Web 控制台或稳定 HTTP 管理 API。
- cron/background process 是应用运行能力，不等于函数生命周期或多步骤工作流。

**结论**：若用户只要“最小化 Git 上线”，它非常好；但本次明确要管理接口、函数和编排，所以剔除主选。

### 5.6 OpenFaaS/faasd：函数能力强，许可证与编排边界明显

**可验证能力**

- OpenFaaS Gateway 有内置 UI 和 Swagger REST API，可部署、列出和调用函数，并收集 Prometheus 指标。[Gateway README](https://github.com/openfaas/faas/blob/master/gateway/README.md)、[Gateway docs](https://docs.openfaas.com/architecture/gateway/)
- 函数以 OCI/Docker image 发布，可用任何语言模板；支持同步/异步调用、队列、事件 connector、cron、metrics 和自动扩缩。[OpenFaaS 仓库](https://github.com/openfaas/faas)
- faasd 抛开 Kubernetes，作为 systemd 管理的 Go binary 运行在单 Linux 主机上，底层用 containerd 和 CNI；当前 Edge 文档建议 2–4 vCPU、1 GB RAM、10–25 GB 磁盘。[faasd 仓库](https://github.com/openfaas/faasd)、[Edge/faasd requirements](https://docs.openfaas.com/deployment/edge/)
- `faas-cli` 提供模板、build、push、deploy，官方资料也给出 GitHub Actions 部署方式。[faas-cli](https://github.com/openfaas/faas-cli)

**边界与风险**

- cron、event connector、queue 解决触发与异步执行，不是带分支、循环、审批、补偿的通用 DAG engine。
- faasd 是单机执行面；要集群扩缩需 OpenFaaS Kubernetes 产品线，基础设施复杂度随之上升。
- CE 商业使用限制是硬门槛，不应因为仓库公开或含 MIT 文本就误判为可自由商用。

**结论**：个人实验或已购买商业许可时可作为轻量 FaaS；面向企业内部平台默认不选。

### 5.7 Nuclio：Apache-2.0 的函数平台备选，但生产安全要前置

**可验证能力**

- Dashboard 是 Web UI，也暴露管理 functions、projects、events、API gateways 的 HTTP API；代码可通过 UI、`nuctl` 或 REST 提交。[项目 README](https://github.com/nuclio/nuclio)、[Dashboard HTTP API](https://github.com/nuclio/nuclio/blob/development/docs/reference/api/README.md)
- 本地最简方式只需一个挂载 Docker socket 的 Dashboard 容器，函数各自部署为本地 Docker container；生产可部署到 Kubernetes。[Quick start](https://github.com/nuclio/nuclio)
- 支持多种语言、event source/trigger、函数 spec、构建和部署分离、函数版本与别名。[Architecture](https://docs.nuclio.io/en/stable/concepts/architecture.html)
- Apache-2.0，当前 release/commit 均活跃。

**边界与风险**

- 官方生产文档明确警告：默认 Helm Dashboard API 没有认证；trigger credentials 可能未掩码地存入 CRD 并由 API 明文返回。上线前必须在网络层加认证代理／授权策略，并启用 sensitive field masking。[生产加固](https://github.com/nuclio/nuclio/blob/development/docs/setup/k8s/running-in-production-k8s.md)
- Nuclio 的 event mapping 和 trigger 是函数触发模型，不是通用工作流 DAG。
- Dashboard 挂 Docker socket 的最简形态适合开发，不应不加隔离地当作多租户生产方案。

**结论**：若许可证必须宽松且函数是核心，Nuclio 比 OpenFaaS CE 更适合进入 PoC；必须配套 Windmill/Kestra 编排和 Higress 网关，并单列控制面安全加固任务。

### 5.8 KubeVela：应用交付工作流强，但不是轻量函数平台

**可验证能力**

- KubeVela 基于 Kubernetes API/OAM Application，支持多环境、多集群、策略、版本、回滚、暂停和人工批准；workflow 可按顺序部署不同集群。[多集群交付教程](https://kubevela.io/docs/tutorials/k8s-object/)
- `WorkflowRun` 是 pipeline 的 Kubernetes API，复用 Application Workflow engine，支持 suspend、通知、HTTP request 等步骤。[WorkflowRun](https://kubevela.io/docs/end-user/pipeline/workflowrun/)
- VelaUX 可选管理台提供 project、environment、delivery target 和应用生命周期 UI。[VelaUX](https://kubevela.io/docs/v1.7/reference/addons/velaux)
- Apache-2.0，当前发布活跃。

**边界**

- 必须先有 Kubernetes 控制面，Dashboard、GitOps/Flux、workflow 等又通过 addon 增加组件；这与本次“轻量”优先级冲突。
- Kubernetes workload/component 可以承载函数容器，但 KubeVela 自身不提供 handler build、函数 trigger、函数调用 API 等 FaaS 语义。
- 它的 API gateway 要通过 ingress/gateway addon 或外部 Higress 实现。

**结论**：只有在组织已经标准化 Kubernetes、且核心诉求是多环境交付编排时选；不是第一阶段轻量方案。

### 5.9 Higress：完整网关补位，不是开发编排主平台

**可验证能力**

- 基于 Envoy/Istio，提供路由、服务来源、域名、Wasm 插件、认证、限流和可观测能力；Console 可在全局、域名和路由三级配置插件。[项目仓库](https://github.com/higress-group/higress)、[Plugin Usage Guide](https://higress.cn/en/docs/latest/user/plugins/intro/)
- Console 前后端随 Spring Boot 部署，可开启 Swagger UI 查看管理 API。[higress-console](https://github.com/higress-group/higress-console)
- 支持 Go/Rust/JS Wasm 插件以及托管 MCP Server；这属于网关扩展／协议适配，不是普通函数计算运行时。[MCP Server guide](https://github.com/higress-group/higress/blob/main/plugins/wasm-go/mcp-servers/README.md)
- Apache-2.0，当前仓库和 release 活跃。

**边界**

- Docker Compose standalone 虽能带 apiserver、controller、pilot、gateway、console 启动，但官方明确定位为本地测试，生产建议 Kubernetes/Helm。
- 没有业务 DAG、函数 build/deploy、Git promotion 等开发平台能力。

**结论**：把 Windmill/Nuclio/Coolify 产出的服务纳入统一入口时选 Higress；不要用 Higress 替代执行和交付平台。

### 5.10 Kestra：工作流优先的补充候选

**可验证能力**

- Webserver 同时提供 UI 和 API；Scheduler、Executor、Worker 负责触发、编排和任务执行。最简 Docker Compose 可把全部 server component 放入一个 JVM，并配 PostgreSQL。[Architecture](https://kestra.io/docs/architecture)、[Docker Compose](https://kestra.io/docs/installation/docker-compose)
- Flow 以 YAML 定义，支持丰富 task/plugin、事件、schedule、webhook、脚本和子流程；Webhook 可从外部触发 execution。[Executions](https://kestra.io/docs/workflow-components/execution)
- 官方 GitHub Actions 可验证和部署 Flow，Git plugin 可把 flow/namespace file 从 Git 同步到 Kestra。[CI/CD](https://kestra.io/docs/version-control-cicd/cicd)、[Git sync](https://kestra.io/docs/version-control-cicd/git)
- Apache-2.0，当前发布活跃。

**边界**

- Script task 是工作流内的任务，不等于带独立版本、低延迟调用和弹性伸缩的函数产品。
- Git SyncApps、SyncUnitTests 等能力有 Enterprise 边界；采用时需逐项核对 OSS/EE 矩阵。
- 不能替代普通应用 PaaS 或 API 网关。

**结论**：如果流程编排比“函数变 API”更重要，Kestra 可替代 Windmill 的编排层；本次综合需求仍优先 Windmill。

## 6. 推荐落地方案

### 6.1 方案 A：最快验证，Windmill 单体 PoC

适用：先验证“开发一个函数／Worker → 组合 Flow → 测试 → 部署 → API 调用 → 查看运行记录”的产品闭环。

PoC 只验证以下最小闭环：

1. Docker Compose 启动 PostgreSQL、server、1 个 worker；
2. 用 Python/TypeScript 各创建一个 script，生成 schema 和 webhook；
3. 用 Flow 组合两个 script，验证分支、失败重试和人工暂停；
4. 用 CLI 将 workspace 内容导出到 Git，并通过 CI 推回测试 workspace；
5. 验证 script/flow 的版本固定调用、token scope、日志和重跑；
6. 单独记录 CE 对用户数、workspace、Git sync、promotion 和许可证的限制。

停止条件：如果白标/嵌入权利无法满足，或 Community Edition 的用户／环境限制与目标产品冲突，不继续把 Windmill 当作可直接内嵌底座，转为架构参考。

### 6.2 方案 B：核心产品确定后的可选扩展，不替代单产品主选

| 层 | 组件 | 责任 | 不承担 |
|---|---|---|---|
| 开发执行层 | Windmill | script、flow、Worker、调度、运行记录、函数 endpoint | 任意普通应用托管、全局 API 策略 |
| 构建发布层 | Coolify | Git/CI、buildpack/Dockerfile/Compose、环境变量、部署、域名、日志、回滚 | 业务 DAG、函数 step 语义 |
| 流量治理层 | Higress | 服务入口、路由、认证、限流、插件、观测、MCP/API 适配 | 函数构建、业务工作流、应用发布 |
| 统一产品层 | 本项目自研管理面 | 统一项目/租户/权限/审批/目录/版本映射，调用三者 API | 重复实现执行器、PaaS、网关数据面 |

这套组合的关键不是把三个控制台简单 iframe 到一起，而是由本项目定义唯一的领域对象和状态机，再通过 API 适配：

- `Function/Flow` 映射 Windmill path/version；
- `Application/Deployment` 映射 Coolify application/deployment UUID；
- `Route/Consumer/Policy` 映射 Higress route/service/plugin 配置；
- 本项目只在全部下游动作和验证证据完成后把版本标记为“已上线”。

### 6.3 方案 C：宽松许可证优先，Coolify + Nuclio + Higress + 自研/ Kestra 编排

适用：必须避开 AGPL、EULA 和 proprietary binary 限制，并接受更多集成工作。

优点是三大运行组件核心均为 Apache-2.0；缺点是没有一个统一产品同时管理 Nuclio function、Coolify deployment 和 Higress route，且业务 DAG 需要 Kestra 或自研。Nuclio Dashboard 的认证、secret masking、网络隔离必须列为上线硬门禁。

## 7. PoC 评估清单

不建议再用 stars 做下一轮筛选。对 Windmill、Coolify、Higress（以及许可证备选 Nuclio）各部署固定版本，使用同一组场景做实测：

| 维度 | 必测问题 | 通过标准 |
|---|---|---|
| 管理 API | 能否创建、读取、更新、发布、回滚、查询运行状态；API 是否有稳定 schema | OpenAPI/Swagger 可生成 client；关键对象有稳定 ID 和幂等策略 |
| 函数 | 多语言、依赖锁定、secret、同步/异步、超时、重试、并发、日志 | 同一版本可重复部署并固定调用；失败证据可追溯 |
| 编排 | 分支、循环、并行、暂停/审批、补偿、子流程、长任务恢复 | worker 重启后流程不丢；step 输入输出和重跑边界明确 |
| 开发上线 | dev/test/prod、Git commit、PR/审批、构建制品、版本、回滚 | 线上版本能追到 commit、image digest、配置和审批记录 |
| 网关 | route、consumer、auth、rate limit、timeout、灰度、审计 | 策略可 API 化；敏感配置不明文返回；配置失败能回滚 |
| 多租户安全 | RBAC、namespace/workspace 隔离、token scope、secret 存储 | 跨租户读写均被拒绝；控制面不直接暴露 Docker socket/K8s admin |
| 运维 | 备份、升级、HA、资源基线、监控、告警 | 固定版本升级演练成功，数据库与配置恢复时间可接受 |
| 许可证 | 镜像和构建产物究竟包含哪些 license/enterprise code | 法务确认可内部使用、修改、嵌入和对外提供的边界 |

## 8. 最终推荐

1. **本次按“接口、函数、编排是平台原生开发制品”理解，核心产品选 Windmill。** 它对管理界面、脚本/函数、Flow、测试、版本和部署的交集覆盖最大。
2. **如果后续确认生产制品其实是普通 Git 仓库、Docker image 或任意应用代码，则核心产品改选 OneDev。** 它是一体化 Git + Workspace + CI/CD + package/deployment 平台，但不会原生建模函数、Flow 和 API endpoint。
3. **Coolify、Higress、Restate、Hatchet 均不作为本次核心产品。** 它们分别是应用部署层、网关层或执行内核；只有 Windmill/OneDev 已确定且出现明确能力缺口时才作为扩展。
4. **Windmill 进入生产 PoC 前先确认版本路线与许可证。** 单 workspace 的 Draft → Test → Deploy 可直接验证；受保护的多环境 promotion、Git Sync 用户数和 UI Deploy to Prod 要按实际 edition 核验。若白标、嵌入或对外托管权利不满足，停止把它当作可直接嵌入底座。
5. **不选 Dokku/CapRover 作为主底座**，因为它们解决轻量应用上线，没有解决本次要求的函数和工作流开发管理面；不选 KubeVela 作为轻量起点，因为生产形态依赖 Kubernetes。
6. **OpenFaaS/faasd 只在商业许可已接受时进入候选**，不要把公开仓库误当作可自由企业商用。

## 9. 一手来源索引

- Windmill：[GitHub](https://github.com/windmill-labs/windmill) · [Self-host](https://www.windmill.dev/docs/advanced/self_host) · [Webhooks](https://www.windmill.dev/docs/core_concepts/webhooks) · [Git Sync](https://www.windmill.dev/docs/advanced/git_sync) · [License](https://github.com/windmill-labs/windmill/blob/main/LICENSE)
- Coolify：[GitHub](https://github.com/coollabsio/coolify) · [Installation](https://coolify.io/docs/get-started/installation) · [Applications/API](https://coolify.io/docs/applications/index) · [GitHub CI/CD](https://coolify.io/docs/applications/ci-cd/github/overview) · [License](https://github.com/coollabsio/coolify/blob/main/LICENSE)
- Dokploy：[GitHub](https://github.com/Dokploy/dokploy) · [Installation](https://docs.dokploy.com/docs/core/installation) · [API](https://docs.dokploy.com/docs/api) · [Providers](https://docs.dokploy.com/docs/core/providers) · [License](https://github.com/Dokploy/dokploy/blob/canary/LICENSE.MD)
- CapRover：[GitHub](https://github.com/caprover/caprover) · [Getting started](https://caprover.com/docs/get-started.html) · [Deployment methods](https://caprover.com/docs/deployment-methods.html) · [API SDK](https://github.com/caprover/caprover-api) · [License](https://github.com/caprover/caprover/blob/master/LICENSE)
- Dokku：[GitHub](https://github.com/dokku/dokku) · [Installation](https://dokku.com/docs/getting-started/installation/) · [Git deployment](https://dokku.com/docs/deployment/methods/git/) · [GitHub Actions](https://dokku.com/docs/deployment/continuous-integration/github-actions/)
- OpenFaaS/faasd：[OpenFaaS](https://github.com/openfaas/faas) · [faasd](https://github.com/openfaas/faasd) · [Gateway](https://docs.openfaas.com/architecture/gateway/) · [Edge/faasd](https://docs.openfaas.com/deployment/edge/) · [EULA](https://github.com/openfaas/faasd/blob/master/EULA.md)
- Nuclio：[GitHub](https://github.com/nuclio/nuclio) · [Architecture](https://docs.nuclio.io/en/stable/concepts/architecture.html) · [Dashboard API](https://github.com/nuclio/nuclio/blob/development/docs/reference/api/README.md) · [Production hardening](https://github.com/nuclio/nuclio/blob/development/docs/setup/k8s/running-in-production-k8s.md)
- KubeVela：[GitHub](https://github.com/kubevela/kubevela) · [Installation](https://kubevela.io/docs/installation/kubernetes/) · [WorkflowRun](https://kubevela.io/docs/end-user/pipeline/workflowrun/) · [VelaUX](https://kubevela.io/docs/v1.7/reference/addons/velaux)
- Higress：[GitHub](https://github.com/higress-group/higress) · [Standalone](https://higress.cn/docs/latest/ops/deploy-by-docker-compose/) · [Console/API](https://github.com/higress-group/higress-console) · [Plugins](https://higress.cn/en/docs/latest/user/plugins/intro/) · [License](https://github.com/higress-group/higress/blob/main/LICENSE)
- Kestra：[GitHub](https://github.com/kestra-io/kestra) · [Architecture](https://kestra.io/docs/architecture) · [Docker Compose](https://kestra.io/docs/installation/docker-compose) · [CI/CD](https://kestra.io/docs/version-control-cicd/cicd) · [License](https://github.com/kestra-io/kestra/blob/develop/LICENSE)
