# 统一网关运行管理必要配置研究

> 研究日期：2026-08-27  
> 研究对象：同时承载数据 API、模型、Agent、MCP 等流量的统一网关管理面  
> 研究边界：本地 HiMarket 源码，以及 Apache APISIX、Kong Gateway／Kong AI Gateway、Envoy Gateway、Azure API Management 的官方文档；AWS API Gateway／AWS WAF 仅作补充。本文不以 Higress 作为设计基线，也不承诺采用任何具体网关实现。

## 1. 结论摘要

### 1.1 核心结论

**事实**：主流网关虽然对象名称不同，但运行配置都可归并为以下链路：

```text
环境／网关实例
  └─ 入口（监听、域名、TLS）
      └─ 路由（匹配、版本、流量分配）
          └─ 后端池（端点、负载均衡、健康检查）
              └─ 策略（认证、流控、安全、可观测）
```

APISIX 的 Route 由匹配规则、插件和 Upstream 构成；Kong 的 Route 连接 Gateway Service，再由 Upstream/Target 承载负载均衡和健康检查；Envoy Gateway 用 Gateway/Listener、HTTPRoute、BackendRef 和附加 Policy 分离职责；Azure API Management 则使用 API/operation、backend 和 policy 表达同一组能力。[Apache APISIX Route](https://apisix.apache.org/docs/apisix/terminology/route/)、[Kong Routes](https://developer.konghq.com/gateway/entities/route/)、[Kong Upstreams](https://developer.konghq.com/gateway/entities/upstream/)、[Gateway API 概览](https://gateway-api.sigs.k8s.io/docs/concepts/api-overview/)、[Azure APIM Backends](https://learn.microsoft.com/en-us/azure/api-management/backends)

**事实**：AI 网关不是另一套完全独立的管理模型，而是在上述链路上增加提供方协议转换、逻辑模型到物理模型的路由、Token 限流／配额、流式响应、Prompt 与响应安全、语义缓存和模型降级。APISIX 的 AI Proxy/Multi、Kong AI Proxy/Advanced 和 Azure APIM AI gateway 都采用这种叠加方式。[APISIX AI Proxy](https://apisix.apache.org/docs/apisix/plugins/ai-proxy/)、[APISIX AI Proxy Multi](https://apisix.apache.org/docs/apisix/plugins/ai-proxy-multi/)、[Kong AI Proxy](https://developer.konghq.com/plugins/ai-proxy/)、[Kong AI Proxy Advanced](https://developer.konghq.com/plugins/ai-proxy-advanced/)、[Azure APIM AI gateway](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities)

**推断**：本平台不应把某个厂商的原始 Route、Plugin、CRD 或 XML Policy 直接当作产品模型。否则更换网关时，服务版本、授权和运行状态都会被厂商对象绑死。

**建议**：运行管理应管理六个厂商中立对象：

1. `GatewayRuntimeBinding`：环境与网关适配器实例的运行绑定；
2. `IngressEndpoint`：入口域名、协议、TLS 和网络暴露方式；
3. `RuntimeRoute`：服务版本在环境中的路由与流量分配；
4. `BackendPool`：数据 API、模型、Agent、MCP 等后端端点及健康策略；
5. `RuntimePolicySet`：认证投影、流量、安全、AI 和观测策略；
6. `ConfigRelease`：一次经过校验、差异确认并可回滚的网关配置发布。

### 1.2 对“必要配置”的产品定义

不是底层网关拥有的每个参数都要出现在数据服务平台。只有同时满足以下条件的配置才属于平台产品级必要配置：

- 影响服务是否可达、流量如何路由或消费应用是否可调用；
- 需要由服务版本、环境、服务授权或租户策略解释；
- 变更后需要校验、审批、审计、发布或回滚；
- 可以被两个及以上网关实现映射，或虽为 AI 特有但属于统一网关的业务能力；
- 管理者需要理解其业务后果，而不只是调优底层代理进程。

## 2. 一手资料中的共性

### 2.1 普通 API 网关的共性

#### 入口与 TLS

**事实**：入口至少包含协议、监听端口、主机名／SNI、证书及 TLS 终止关系。Kong 使用 SNI 将多个主机名映射到证书；Gateway API 把协议和 TLS 能力放在 Listener；APISIX 使用 SSL 对象关联证书、私钥和一个或多个 SNI。[Kong SNI](https://developer.konghq.com/gateway/entities/sni/)、[Gateway API 概览](https://gateway-api.sigs.k8s.io/docs/concepts/api-overview/)、[APISIX Certificate](https://apisix.apache.org/docs/apisix/certificate/)

**建议**：产品页面只保存“域名、暴露类型、协议、证书引用、TLS 模式和状态”。私钥原文、底层监听进程和密码套件不进入首期页面。

#### 路由、服务与后端

**事实**：Kong Route 可按协议、Host、Method、Header、Port 和 SNI 匹配，并绑定 Service；Kong Upstream 包含 Targets、负载均衡、健康检查和被动熔断。APISIX Route 同样组合匹配、插件和 Upstream，Upstream 支持负载均衡、重试和主动／被动健康检查。[Kong Routes](https://developer.konghq.com/gateway/entities/route/)、[Kong Upstreams](https://developer.konghq.com/gateway/entities/upstream/)、[Kong 健康检查与熔断](https://developer.konghq.com/gateway/traffic-control/health-checks-circuit-breakers/)、[APISIX Upstream](https://apisix.apache.org/docs/apisix/terminology/upstream/)、[APISIX Health Check](https://apisix.apache.org/docs/apisix/tutorials/health-check/)

**建议**：服务产品和网关路由必须分离。`ServiceProduct + ServiceVersion` 是稳定产品身份；`RuntimeRoute + BackendPool` 是该版本在某环境的可变运行投影。

#### 身份、消费者与策略作用域

**事实**：APISIX Consumer 通过认证插件获得身份，并可绑定差异化插件和 Upstream；Kong Consumer 同样表示外部客户端，限流可以施加到 Route、Service 或 Consumer。Envoy Gateway 则把 JWT、API Key、Basic Auth、OIDC、mTLS、外部鉴权和 CORS 收敛到可附着的 SecurityPolicy。[APISIX Consumer](https://apisix.apache.org/docs/apisix/terminology/consumer/)、[Kong Gateway Entities](https://developer.konghq.com/gateway/entities/)、[Kong Rate Limiting](https://developer.konghq.com/gateway/rate-limiting/)、[Envoy Gateway SecurityPolicy](https://gateway.envoyproxy.io/docs/concepts/gateway_api_extensions/security-policy/)

**推断**：网关中的 Consumer 只是运行时身份投影，不能替代本平台的“消费应用”和“服务授权”。同一个消费应用在不同服务授权、环境或认证方式下，可以对应多个运行时凭证绑定。

#### 流量与安全策略

**事实**：请求速率、配额、并发、重试、超时、熔断、CORS 和 IP 限制是跨产品共性。Envoy Gateway 将入口连接行为、后端行为和安全分别建模为 ClientTrafficPolicy、BackendTrafficPolicy 和 SecurityPolicy；Azure APIM 的 policy 集合覆盖 rate/quota、并发、JWT、CORS 等能力。[Envoy Gateway 扩展](https://gateway.envoyproxy.io/docs/concepts/gateway_api_extensions/)、[Envoy ClientTrafficPolicy](https://gateway.envoyproxy.io/docs/concepts/gateway_api_extensions/client-traffic-policy/)、[Envoy Circuit Breakers](https://gateway.envoyproxy.io/latest/tasks/traffic/circuit-breaker/)、[Azure APIM Policy Reference](https://learn.microsoft.com/en-us/azure/api-management/api-management-policies)

**事实**：WAF 往往是网关外部或相邻的安全服务，而不是通用 API 网关内部插件。Azure 的官方架构把 WAF 放在 Application Gateway 或 Front Door 上；AWS 则将 Web ACL 关联到 API Gateway Stage。[Azure WAF + APIM](https://learn.microsoft.com/en-us/azure/web-application-firewall/afds/protect-api-hosted-apim-by-waf)、[AWS WAF + API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-control-access-aws-waf.html)

**建议**：首期只管理 `WafPolicyRef`、绑定范围和启停状态，不在数据服务平台重做 WAF 规则编辑器。

### 2.2 AI 网关特有共性

#### 提供方与协议归一

**事实**：Kong AI Proxy 可把标准化入口转换成不同模型提供方格式并代为处理上游认证；APISIX AI Proxy 支持多个提供方和 OpenAI-compatible 端点，并允许统一覆盖输出 Token 上限及最大流式响应时长。[Kong AI Proxy](https://developer.konghq.com/plugins/ai-proxy/)、[APISIX AI Proxy](https://apisix.apache.org/docs/apisix/plugins/ai-proxy/)

**建议**：把客户端协议、逻辑模型名与提供方协议／物理模型名分开保存；上游提供方密钥只保存 `SecretRef`。

#### 多模型路由、重试与降级

**事实**：Kong AI Proxy Advanced 支持按轮询、一致性哈希、最少连接、最低延迟、最低 Token／成本使用量、语义和优先级路由，并支持重试、超时和跨模型降级；APISIX AI Proxy Multi 支持实例权重、优先级、健康检查、重试和降级。[Kong AI Proxy Advanced](https://developer.konghq.com/plugins/ai-proxy-advanced/)、[APISIX AI Proxy Multi](https://apisix.apache.org/docs/apisix/plugins/ai-proxy-multi/)

**建议**：首期产品模型支持“权重”和“优先级降级”两种算法；最低延迟、最低成本和语义路由保留为适配器能力，不在原型中承诺实际执行。

#### Token 预算与配额

**事实**：普通请求数不能准确代表 AI 成本。Kong AI Rate Limiting Advanced 根据模型返回的 Token 使用量计费并限流；APISIX 提供基于 Token 的 AI 限流；Azure APIM 支持按消费者标识对 TPM 和周期 Token 配额进行限制，并可预估 Prompt Token。[Kong AI Rate Limiting Advanced](https://developer.konghq.com/plugins/ai-rate-limiting-advanced/)、[APISIX AI Rate Limiting](https://apisix.apache.org/docs/apisix/plugins/ai-rate-limiting/)、[Azure LLM Token Limit](https://learn.microsoft.com/en-us/azure/api-management/llm-token-limit-policy)

**建议**：Token 策略至少包含作用范围、计数键、输入／输出是否合并、窗口、上限、超限动作和响应头；费用只作为可选估算，不把网关统计当作财务结算依据。

#### Prompt、内容和隐私安全

**事实**：Kong Prompt Guard 和 APISIX Prompt Guard 均支持 Prompt allow/deny 模式；Kong 另有响应语义防护和 PII 脱敏；Azure APIM 可接入内容安全，对 Prompt 和响应执行审核。[Kong AI Prompt Guard](https://developer.konghq.com/plugins/ai-prompt-guard/)、[APISIX AI Prompt Guard](https://apisix.apache.org/docs/apisix/plugins/ai-prompt-guard/)、[Kong AI Response Guard](https://developer.konghq.com/plugins/ai-semantic-response-guard/)、[Kong AI PII Sanitizer](https://developer.konghq.com/plugins/ai-sanitizer/)、[Azure APIM AI gateway](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities)

**建议**：首期将安全策略归一为“检查方向、策略提供方、规则或策略引用、执行模式（仅记录／阻断）、故障模式、脱敏级别”。不要把厂商正则、XML 或插件 JSON 暴露为主表单。

#### 流式响应与缓存

**事实**：AI 网关需要单独监控流式请求、首 Token 延迟和最大流持续时间。语义缓存还需要嵌入模型、向量库、相似度阈值和 TTL。Kong 与 Azure APIM 均提供语义缓存能力；APISIX AI Proxy 记录首响应时间和 Token，并提供流式响应时长上限。[Kong AI Semantic Cache](https://developer.konghq.com/plugins/ai-semantic-cache/)、[Azure APIM AI gateway](https://learn.microsoft.com/en-us/azure/api-management/genai-gateway-capabilities)、[APISIX AI Proxy](https://apisix.apache.org/docs/apisix/plugins/ai-proxy/)

**建议**：流式响应是首期必显；语义缓存作为可选策略卡片模拟，不在单 HTML 原型中展开向量数据库底层参数。

### 2.3 配置发布、差异与回滚

**事实**：配置版本能力在不同厂商中并不统一。Azure APIM Revision 可在不影响当前消费者的情况下修改和测试，随后切换为 current，并可把旧 Revision 重新设为 current 完成回滚。Kong decK 提供 validate、diff、sync、dump，回滚依赖保存旧声明配置后重新校验和同步。[Azure APIM Revisions](https://learn.microsoft.com/en-us/azure/api-management/api-management-revisions)、[Kong decK Gateway](https://developer.konghq.com/deck/gateway/)、[Kong 备份与恢复](https://developer.konghq.com/gateway/upgrade/backup-and-restore/)

**事实**：`sync` 类操作可能删除目标中未出现在期望配置里的对象，因此必须有明确的所有权范围和差异预览。[Kong decK Sync](https://developer.konghq.com/deck/gateway/sync/)

**推断**：不能依赖任一网关原生提供完整的“版本、差异、发布、回滚”能力。平台必须自己持久化期望配置快照、配置哈希、差异和适配器逐项执行结果。

**建议**：任何影响生产流量的修改都先产生 `ConfigRelease`，统一经过：

```text
草稿 → 静态校验 → 连接／能力校验 → 差异预览 → 审批
     → 发布中 → 已生效
                ↘ 部分失败／失败 → 重试或回滚
```

回滚不是修改历史版本，而是以某个旧快照为目标创建新的回滚发布，并完整留痕。

### 2.4 观测与审计

**事实**：网关运行观测通常同时包含指标、访问日志和分布式追踪。Envoy Gateway 提供代理指标、访问日志和追踪任务，并可导出 Prometheus／OpenTelemetry；APISIX 提供 Prometheus、OpenTelemetry 和日志插件。[Envoy Gateway Observability](https://gateway.envoyproxy.io/docs/tasks/observability/)、[Envoy Proxy Metrics](https://gateway.envoyproxy.io/docs/tasks/observability/proxy-metric/)、[APISIX Prometheus](https://apisix.apache.org/docs/apisix/plugins/prometheus/)、[APISIX OpenTelemetry](https://apisix.apache.org/docs/apisix/plugins/opentelemetry/)、[APISIX HTTP Logger](https://apisix.apache.org/docs/apisix/plugins/http-logger/)

**事实**：运行访问日志与管理审计不是同一类数据。Kong 审计日志记录 Admin API 请求和数据库配置变更；Azure Activity Log 可回答对 APIM 资源执行写操作的“什么、谁、何时”，Resource Log 则记录网关处理的 API 请求。[Kong Audit Logs](https://developer.konghq.com/gateway/audit-logs/)、[Azure APIM Monitor](https://learn.microsoft.com/en-us/azure/api-management/api-management-howto-use-azure-monitor)

**建议**：运行管理分开呈现“调用日志”“链路追踪”“配置审计”。Prompt 和模型响应默认不得写入日志；只有明确启用、完成脱敏并经过安全策略时才允许采样。

## 3. 厂商中立的信息架构

### 3.1 建议的“运行管理”二级目录

| 二级目录 | 主要对象 | 可写配置 | 只读状态与操作 |
|---|---|---|---|
| 网关概览 | `GatewayRuntimeBinding` | 不在此直接编辑 | 环境、实例、入口地址、能力、健康度、当前配置版本、同步时间、漂移状态；测试连接、刷新状态 |
| 注册与路由 | `IngressEndpoint`、`RuntimeRoute`、`BackendPool`、注册执行 | 域名／TLS 引用、路由、版本流量、后端池、健康检查 | 注册执行进度、路由生效状态、后端健康、传播状态；重试、同步、紧急停流 |
| 策略管理 | `RuntimePolicySet`、策略模板 | 认证投影、限流配额、超时重试、熔断、CORS、IP、WAF 引用、AI 路由／Token／安全 | 命中范围、下发状态、冲突、最近变更；校验、启停、创建新版本 |
| 配置发布 | `ConfigRelease` | 由路由／策略变更生成发布草稿 | 校验、差异、审批引用、发布步骤、结果、当前版本、漂移；发布、重试、回滚 |
| 运行监控 | 指标投影 | 时间范围和过滤条件，不编辑网关 | QPS、成功率、延迟、错误、Token、TTFT、降级、缓存、安全阻断、上游健康 |
| 异常事件 | 运行事件 | 确认、分派、处置备注 | 上游异常、配置失败、证书将过期、限流激增、熔断、漂移、安全事件 |
| 审计日志 | 管理审计、策略决策摘要 | 无 | 谁在何时对哪个对象做了什么、前后版本、结果、请求／发布关联号 |

**建议**：当前 `CONTEXT.md` 中的“网关概览、注册与路由、策略管理、运行监控、异常事件、审计日志”方向正确，但应补充独立的“配置发布”，否则差异确认、逐项执行和回滚会被塞进路由详情或审计日志，难以操作。

### 3.2 运行管理、设置与业务模块的边界

| 信息或动作 | 主数据归属 | 运行管理中的呈现 |
|---|---|---|
| 租户、环境定义 | 设置／租户信息、环境管理 | 只读上下文和过滤条件 |
| 网关适配器地址、管理凭证、厂商类型、能力声明 | 设置／网关适配器 | 只读实例和连接健康；允许测试连接、刷新能力 |
| 证书和上游密钥原文 | 外部密钥／证书系统 | 只显示引用、状态、到期日，不显示私钥或 Secret |
| 服务产品、服务版本 | 数据服务 | 显示其运行路由、部署和版本绑定 |
| 消费应用、服务授权、凭证生命周期 | 应用与授权 | 显示网关运行投影、下发状态和撤销结果，不重复编辑主数据 |
| 路由、后端、运行策略 | 运行管理 | 创建版本、校验、审批后发布 |
| 租户凭证与密钥默认规则 | 设置／凭证与密钥策略 | 显示实际继承值及覆盖来源 |
| 网关原生集群、节点和控制面参数 | 基础设施／运维系统 | 仅汇总健康和容量，不提供原始编辑器 |

## 4. 必要配置字段矩阵

### 4.1 网关、入口、路由与后端

| 对象 | 首期必要字段 | 字段性质 | 归属／说明 |
|---|---|---|---|
| 网关运行绑定 | 租户（上下文）、环境、适配器实例、逻辑名称、用途（API／AI／统一）、区域、内外网类型 | 必填 | 环境与适配器绑定在设置中维护，运行管理只读展示 |
| 网关运行绑定 | 管理端点（脱敏）、运行端点、能力集、连接状态、健康度、当前配置版本、期望／实际配置哈希、最后同步时间 | 运行态 | 管理端点不能暴露凭证 |
| 入口 | 协议、域名、端口、基础路径、暴露类型、TLS 终止方式、证书引用、证书有效期／状态 | 必填或条件必填 | HTTP 生产入口应提示升级 HTTPS；证书只引用 |
| 入口 | WAF 策略引用、客户端 mTLS CA 引用、允许的协议版本 | 可选 | WAF 为外部策略引用；密码套件首期不展开 |
| 路由 | 服务产品、服务版本、环境、入口、Host、Path、Path 匹配类型、Method、Header／Query 条件、优先级 | 必填 | 由服务上线生成，可由管理者在配置发布前审查 |
| 路由 | 路径重写、Header 变换、最大请求体、是否允许流式响应 | 可选 | 原始脚本或插件 JSON 不展示 |
| 版本流量 | 当前版本、候选版本、权重、开始／结束时间、回退版本 | 条件必填 | 首期支持单版本和简单权重灰度 |
| 后端池 | 后端类型、端点／服务发现引用、协议、端口、权重、优先级、上游 TLS 校验、CA 引用、上游凭证引用 | 必填 | 数据 API、模型、Agent、MCP 共用骨架 |
| 负载均衡 | 算法（轮询／权重／一致性等）、会话键、故障转移组 | 可选 | 首期可限制为轮询、权重、优先级 |
| 超时与重试 | 连接、发送、读取／总超时；最大重试次数；仅幂等请求；触发状态码／连接错误 | 必填且有默认值 | AI 流式响应还需要最大持续时间；POST 重试必须显式确认 |
| 健康检查 | 主动／被动、协议、路径、间隔、超时、健康／不健康阈值和状态码 | 生产必填 | 状态和最近检查结果只读展示 |
| 熔断 | 失败阈值或比例、统计窗口、熔断时长、并发／连接／待处理上限、半开策略 | 生产建议必填 | 厂商不能映射时适配器必须报告不支持 |

### 4.2 认证、消费者和安全策略

| 策略 | 首期必要字段 | 主数据位置 | 运行管理职责 |
|---|---|---|---|
| 认证 | 认证方式、授权 ID、消费应用 ID、凭证引用、状态、有效期 | 应用与授权 | 展示下发投影和适配器结果；不编辑凭证原文 |
| OAuth 2.0／OIDC | issuer/discovery、audience、scope、claim 映射、Client 标识（脱敏） | 凭证策略＋服务授权 | 校验支持情况并下发；默认机器调用应映射 Client Credentials |
| API Key | Header 名、前缀、Key 标识、状态、有效期 | 应用与授权 | 只显示掩码及下发状态；禁止物理删除历史 |
| JWT | issuer、audience、JWKS／公钥引用、允许算法、必需 claims | 凭证策略＋授权 | 下发与命中观测 |
| mTLS | 客户端 CA 引用、证书 Subject/SAN 规则、吊销状态引用 | 凭证策略＋授权 | 绑定入口或路由并展示握手错误 |
| 请求限流 | 作用范围、计数键、速率、窗口、突发量、超限状态码／Retry-After | 运行管理／策略管理 | 支持租户基线、服务、路由、授权四级作用域 |
| 请求配额 | 计数键、周期、调用量／流量上限、重置时间 | 数据服务配置或策略管理 | 不与限流混成一个字段 |
| 并发／带宽／载荷 | 最大并发、请求／响应大小、带宽限制 | 策略管理 | 超限动作和事件必须可见 |
| CORS | 允许 Origin、Method、Header、暴露 Header、凭证、预检缓存 | 策略管理 | 仅浏览器场景需要；禁止无提示的 `* + credentials` |
| IP | allow/deny、IPv4/IPv6 CIDR、可信代理链来源 | 策略管理 | 可信代理链属于全局适配配置，列表属于业务策略 |
| WAF | WAF 策略引用、作用入口／域名、模式（检测／阻断）、绑定状态 | 相邻安全平台 | 本平台只绑定和观测，不编辑规则集 |
| 请求校验／变换 | OpenAPI／JSON Schema 引用、Header 变换、错误码 | 策略管理 | 首期可从 API 契约生成，不提供任意代码 |

### 4.3 AI 路由与安全

| 对象／策略 | 首期必要字段 | 首期建议 |
|---|---|---|
| AI 提供方连接 | 提供方类型、协议族、Base URL、区域、上游认证 `SecretRef`、TLS 校验、连接状态 | 必显，Secret 只显示引用和状态 |
| 逻辑模型 | 对外模型名、能力（chat／embedding／image 等）、支持流式、上下文／输出 Token 上限、协议版本 | 必显；能力来自注册数据或适配器发现 |
| 物理模型目标 | 提供方、物理模型／部署名、端点、权重、优先级、启停、健康 | 必显 |
| 模型路由 | 算法、候选目标、权重／优先级、会话键、降级链 | 首期实现权重和优先级；其他算法显示为能力标签 |
| AI 超时／降级 | 首 Token 超时、总／流式最大时长、重试次数、可降级错误、回退模型 | 必显；默认不对任意 POST 自动重试 |
| Token 限流 | 作用范围、计数键、每分钟 Token、周期配额、输入／输出计算、Prompt 预估、超限动作 | 必显 |
| 模型参数约束 | 最大输出 Token、temperature/top_p 是否允许客户端覆盖、系统参数 | 必显最大 Token；高级采样参数可折叠 |
| Prompt 防护 | 检查范围（最后消息／全历史）、allow/deny 规则或策略引用、故障模式 | 可模拟策略卡片 |
| 内容安全 | 输入／输出、策略提供方、类别阈值、仅记录／阻断、故障开闭 | 可模拟；原型展示命中事件 |
| PII／敏感数据 | 检查方向、脱敏类别、替换方式、是否允许恢复 | 可模拟；默认关闭 Payload 记录 |
| 语义缓存 | 启停、嵌入模型引用、缓存／向量库引用、相似度阈值、TTL、按租户／应用隔离 | 可模拟，不展示底层数据库参数 |
| AI 日志 | Token、TTFT、模型、提供方、降级、缓存、安全决策；Prompt／Response 内容采样和脱敏策略 | 元数据必显；内容记录默认关闭 |

### 4.4 配置发布字段

| 字段组 | 必要字段 |
|---|---|
| 身份与范围 | 发布 ID、租户、环境、网关绑定、对象范围、创建者、创建时间、变更原因／关联申请 |
| 版本 | 基础版本、目标版本、期望配置哈希、适配器渲染版本、当前实际版本／哈希 |
| 校验 | 领域校验、OpenAPI／Schema 校验、路由冲突、能力支持、Secret／证书引用、连接检查、风险级别 |
| 差异 | 新增／修改／删除对象数，字段级差异，潜在中断、凭证影响、流量影响 |
| 审批 | 审批实例、状态、审批人、意见；审批和技术执行必须分离 |
| 执行 | 待执行／执行中／成功／部分失败／失败／取消、开始结束时间、适配器任务、逐项结果、重试次数 |
| 回滚 | 回滚目标版本、回滚原因、差异、执行结果；回滚形成新发布记录 |
| 漂移 | 期望与实际是否一致、首次发现时间、影响对象、处理方式（接受／覆盖／人工调查） |

## 5. 运行管理只读状态和允许操作

### 5.1 网关与配置状态

- 连接状态：正常、不可达、认证失败、能力不兼容；
- 数据面健康：正常、降级、异常；
- 当前配置版本、期望配置版本、最后成功发布时间；
- 配置传播进度和失败节点数（适配器能够提供时）；
- 漂移状态和差异摘要；
- 证书到期风险、上游 Secret 引用失效；
- 操作：测试连接、刷新能力、重新同步、查看差异、发起回滚。

### 5.2 路由与后端状态

- 路由是否已下发、当前服务版本、实际入口、流量权重；
- 每个后端端点的健康、最后探测时间、连续失败、熔断状态；
- 重试、降级、限流和 WAF／安全策略的最近命中；
- 操作：重新下发、恢复／暂停路由、摘除／恢复后端、紧急停流。

**建议**：紧急停流属于管理者高风险操作，必须二次确认并写审计，但可绕过普通下线审批以缩短故障处置时间；事后必须补充事件和审批关联。这一建议需要后续产品决策确认。

### 5.3 监控指标和维度

| 类别 | 核心指标 | 核心维度 |
|---|---|---|
| API | 请求数、QPS、成功率、4xx/5xx、P50/P95/P99、上游延迟、流量 | 环境、服务、版本、路由、消费应用、授权、后端 |
| 韧性 | 超时、重试、熔断、降级、无健康后端、配置失败 | 环境、路由、后端池、端点 |
| 策略 | 限流、配额、认证失败、CORS/IP/WAF 拒绝、请求校验失败 | 策略、服务、消费应用、原因 |
| AI | 输入／输出／总 Token、TPM、TTFT、流式／非流式延迟、降级、模型错误 | 提供方、逻辑模型、物理模型、服务、消费应用 |
| AI 安全与缓存 | Prompt／响应阻断、风险类别、PII 脱敏、缓存命中／未命中／跳过 | 安全策略、模型、消费应用；默认不记录原文 |
| 网关容量 | 实例健康、活跃连接、CPU／内存摘要、配置传播 | 网关绑定、实例；首期只做摘要 |

### 5.4 调用日志、追踪与审计字段

**调用日志最小字段**：时间、租户、环境、Request ID、Trace ID、消费应用、授权 ID、服务／版本、路由、后端／模型、状态码、错误分类、耗时、重试／降级、Token、策略决策。禁止记录完整 API Key、OAuth Secret、上游密钥和未脱敏敏感数据。

**追踪入口**：按 Request ID／Trace ID 跳转到外部追踪系统；平台可展示关键 Span 摘要，但首期不重建完整 APM。

**管理审计最小字段**：操作者、租户、角色、时间、来源、动作、对象、变更前后版本、配置发布 ID、审批 ID、结果、失败原因。审计记录不能依赖厂商是否提供原生审计；平台自己的操作必须先落本平台审计。

## 6. HiMarket 覆盖矩阵

### 6.1 已有能力事实

HiMarket 的 `Gateway` 实体保存名称、类型、外部网关 ID、管理员和四组厂商专属配置；新增厂商需要扩实体字段和枚举，而不是一个通用扩展配置。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Gateway.java:60-93`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/GatewayType.java:27-75`）

网关导入参数主要是名称、类型、ID 和厂商连接配置，连接字段包括 Region＋AK/SK、管理地址＋用户名密码、或 Base URL＋端口＋认证头等。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/dto/params/gateway/ImportGatewayParam.java:35-69`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/gateway/APIGConfig.java:26-44`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/gateway/AdpAIGatewayConfig.java:29-74`）

`GatewayOperator` 提供 REST／HTTP API、MCP、Agent、模型发现和配置读取，以及 Consumer 创建、更新、删除、授权和撤销；接口中没有路由／上游／策略的创建更新，也没有配置校验、差异、发布或回滚方法。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/gateway/GatewayOperator.java:50-105`）

`ProductRef` 能保存产品到 gatewayId、厂商引用配置、API/MCP/Agent/Model 配置和 enabled 标记，但没有环境部署、配置版本或发布执行对象。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductRef.java:51-107`）

HiMarket 的凭证在 Consumer 级唯一，可保存 API Key、HMAC 和 JWT 配置；`ConsumerRef` 再保存网关侧 Consumer 标识和一份网关配置快照。这与本平台“每项服务授权独立凭证绑定、OAuth 2.0 默认”的模型不同。（来源：`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerCredential.java:42-75`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/enums/ConsumerAuthType.java:22-28`；`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerRef.java:47-65`）

HiMarket 已有 Model 和 MCP 监控页面。Model 监控查询流式／非流式 QPS、成功率、Token、整体和首 Token 响应时间、限流、缓存以及按模型／消费者／服务／风险的统计；MCP 监控查询 PV/UV、流量、QPS、成功率、P50-P99 及网关／后端状态分布。（来源：`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:251-429`、`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:669-890`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/McpMonitor.tsx:200-322`）

这些监控通过 SLS 查询接口和预置 SQL 实现，SLS 连接、AK/SK、Project、Logstore 及 CR 名称是部署配置；管理端路由只提供 ModelDashboard 和 McpMonitor，没有通用数据 API 监控、追踪或配置审计页面。（来源：`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/config/SlsConfig.java:27-90`；`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/controller/SlsController.java:43-124`；`/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/routes/index.tsx:83-113`）

### 6.2 覆盖判断

| 能力域 | HiMarket 覆盖 | 证据与判断 | 本平台处理 |
|---|---|---|---|
| 网关实例连接 | **部分覆盖** | 可导入、编辑、删除多个厂商实例，显示 ID、类型、区域或地址；没有环境、租户、能力声明、健康、当前配置版本和漂移 | 借鉴实例选择与连接校验交互，重建厂商中立 AdapterInstance |
| 入口／域名／TLS | **缺失** | 仅有部分网关的 gatewayAddress；未形成 Listener、Domain、Certificate 对象 | 新增 IngressEndpoint；证书只引用 |
| API／AI 资源发现 | **已覆盖** | Operator 可发现 API、MCP、Agent、Model 并读取配置 | 复用适配器能力思想，增加标准能力矩阵 |
| 路由写管理 | **缺失** | Operator 没有 create/update route；`GatewayServiceImpl.fetchRoutes` 当前直接返回 null（`/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/GatewayServiceImpl.java:217-220`） | 新增 RuntimeRoute 和配置发布流程 |
| 服务版本与环境部署 | **部分覆盖** | ProductRef 能绑定产品和网关技术引用，但没有环境、服务版本运行投影和部署状态 | 不能直接复用 ProductRef 粒度 |
| 后端池／健康检查 | **缺失** | 核心模型和管理端未见厂商中立 Upstream、Target 或健康策略 | 新增 BackendPool 和 EndpointHealth |
| Consumer／认证／授权 | **部分覆盖** | 有 Consumer、API Key/HMAC/JWT、网关侧 Consumer 和授权执行 | 借鉴执行适配；主模型改为消费应用＋服务授权＋CredentialBinding，补 OAuth 2.0 |
| 通用流量与安全策略 | **缺失** | 未见产品级限流、配额、超时、重试、熔断、CORS、IP、WAF 引用配置面 | 新增 RuntimePolicySet |
| AI 提供方／模型路由 | **部分覆盖** | 可发现模型、保存协议／Route，`ModelFeature` 有 maxTokens 和 streaming（`/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/support/product/ModelFeature.java:31-65`）；无多目标路由、提供方密钥引用和降级策略 | 借鉴协议／Route 展示，补齐 AI Runtime Policy |
| Token／Prompt／内容安全 | **部分覆盖** | 监控可观察 Token、限流和风险标签，但没有统一策略编辑和版本模型 | 监控交互可参考，策略模型新建 |
| 配置发布／校验／差异／回滚 | **缺失** | Operator 和实体无 ConfigRelease 或等价对象 | 必须由平台新增，不依赖网关原生能力 |
| 运行监控 | **部分覆盖** | Model/MCP SLS 仪表盘较丰富；缺数据 API 通用监控、统一对象维度和适配器中立采集 | 复用指标卡、趋势和过滤交互，统一指标语义 |
| 调用日志／追踪 | **部分覆盖** | SLS 接口可查日志聚合，但管理端未见通用调用日志与 Trace 入口 | 新增调用日志列表和 Trace 跳转 |
| 管理审计 | **缺失** | 未发现面向网关配置变更的独立审计对象和页面 | 本平台先写审计，再调用适配器 |

### 6.3 对 HiMarket 的使用结论

**建议参考**：网关实例选择、跨网关资源发现、产品与运行引用分离、Consumer 授权适配、Model/MCP 监控筛选和指标布局。

**不应照搬**：厂商字段硬编码、网关类型枚举扩展、Consumer 级共享凭证、同步导入即完成、缺失环境和租户的 ProductRef、把 SLS 部署配置暴露为产品配置。

## 7. A/B/C/D 四层归属

| 层级 | 定义 | 内容 | 页面处理 |
|---|---|---|---|
| **A 产品级必要配置** | 影响服务运行且需要版本／审批／审计 | 入口引用、路由、版本流量、后端池、健康、认证投影、流控安全、AI 路由／Token／安全、ConfigRelease | 运行管理可见；变更生成配置发布 |
| **B 运行管理只读状态／操作** | 由运行时产生或由适配器读取 | 实例健康、路由下发、后端健康、熔断、配置传播／漂移、指标、调用日志、追踪、异常、审计 | 运行管理展示；只允许受控动作 |
| **C 全局设置** | 跨多个服务复用且不是一次流量变更 | 租户环境、适配器实例连接、适配器能力、租户凭证规则、服务类型；证书／Secret 的外部引用源 | 放在现有设置模块；运行管理只读引用 |
| **D 底层／厂商专属参数** | 基础设施或实现细节 | Pod／节点／副本、etcd／数据库／xDS、Nginx worker、线程／buffer、Redis 计数器、原始 Plugin JSON、CRD YAML、APIM XML、厂商管理端口、日志存储连接 | 首期不展示；由基础设施和适配器默认值管理 |

**边界提醒**：监控采集端点、日志库连接、审计保留期和告警渠道虽然客观存在，但当前产品范围已经明确不在“设置”中设计。首期原型只展示“数据已接入／未接入”和外部跳转，不新增对应设置菜单。

## 8. 首期单 HTML 原型建议

### 8.1 必显

1. **网关概览**
   - 环境、统一网关实例、内／外网入口、连接健康、数据面健康；
   - 当前配置版本、最后发布时间、漂移提示；
   - 今日请求、成功率、P95、AI Token、异常数。
2. **注册与路由**
   - 服务／版本／环境／入口／Host＋Path＋Method；
   - API、模型、Agent、MCP 类型筛选；
   - 后端目标、权重／优先级、健康、当前流量；
   - 抽屉详情展示超时、重试、健康检查、熔断和策略绑定。
3. **策略管理**
   - 通用策略卡：认证、请求限流／配额、超时重试、熔断、CORS、IP、WAF 引用；
   - AI 策略卡：模型路由、Token 预算、流式限制、Prompt／内容安全、降级；
   - 每张卡显示作用范围、继承来源、当前版本、状态、最近变更。
4. **配置发布**
   - 草稿、校验结果、结构化差异、审批状态、执行步骤和逐项结果；
   - 当前版本、历史版本和“创建回滚发布”操作。
5. **运行监控**
   - API：QPS、成功率、延迟分位、错误、限流、上游健康；
   - AI：输入／输出 Token、TTFT、流式请求、模型降级、缓存和安全阻断；
   - 可按服务、版本、消费应用、路由、后端／模型过滤。
6. **异常事件与审计**
   - 证书将过期、后端异常、配置失败、熔断、漂移、Token 超限／安全阻断；
   - 审计列表展示操作者、动作、对象、前后版本、审批／发布关联和结果。

### 8.2 可模拟

- 新建路由和策略的表单校验、路由冲突提示；
- 配置差异预览、审批通过后的发布进度、单项失败和重试；
- 权重灰度、模型优先级降级、后端健康状态变化；
- API Key／OAuth 凭证仅用掩码和状态模拟，不生成真实 Secret；
- Prompt 阻断、内容安全、Token 超限和语义缓存命中事件；
- 调用日志详情和 Trace 拓扑摘要；
- 漂移检测以及“接受当前状态／重新覆盖”的对比交互。

### 8.3 暂不展示

- Pod、节点、容器、副本、CPU／内存资源请求、亲和性和服务网格拓扑；
- etcd、数据库、xDS、Nginx worker、线程、连接池和 buffer 参数；
- Redis／限流计数器集群、向量数据库、日志库和 OpenTelemetry Collector 的连接字段；
- 原始 APISIX Plugin JSON、Kong declarative YAML、Envoy CRD、Azure APIM XML Policy；
- 厂商许可证、控制面升级、数据库迁移和网关软件安装；
- WAF 规则编辑器、证书私钥、上游 API Key／Secret 明文；
- 完整 APM、SIEM、日志保留策略、告警渠道配置；
- 最低成本／语义模型路由、真实语义缓存和完整内容安全引擎实现。

## 9. 需要后续产品决策的问题

本研究给出了必要能力边界，但以下是产品决策而非资料事实，需在后续 Grilling 工单中由用户确认：

1. “配置发布”是否作为运行管理独立二级菜单，还是并入“注册与路由”；建议独立。
2. 生产路由和策略变更是否全部复用上线／下线审批，还是建立轻量配置变更审批；建议按风险分级。
3. 紧急停流是否允许管理者绕过普通审批并事后补单；建议允许但强审计。
4. 首期是否允许简单版本权重灰度；建议允许，复杂金丝雀规则暂缓。
5. AI 多模型路由首期支持到“权重＋优先级降级”，还是只展示单模型；建议支持前者。
6. Prompt／响应内容是否允许采样；建议默认禁止，仅对经过脱敏和单独审批的场景开放。
7. WAF 是只显示外部策略引用，还是需要在本平台发起绑定变更；建议首期支持引用和绑定，不编辑规则。
8. 配置漂移出现时，以平台期望状态覆盖网关，还是允许接纳网关现状；建议禁止自动覆盖，先结构化比较后人工选择。

## 10. 主要一手来源索引

### 本地源码

- `/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/Gateway.java:60-93`
- `/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/gateway/GatewayOperator.java:50-105`
- `/mnt/d/cursor/himarket/himarket-server/src/main/java/com/alibaba/himarket/service/impl/GatewayServiceImpl.java:102-177`
- `/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ProductRef.java:51-107`
- `/mnt/d/cursor/himarket/himarket-dal/src/main/java/com/alibaba/himarket/entity/ConsumerCredential.java:42-75`
- `/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/ModelDashboard.tsx:251-429`
- `/mnt/d/cursor/himarket/himarket-web/himarket-admin/src/pages/McpMonitor.tsx:200-322`
