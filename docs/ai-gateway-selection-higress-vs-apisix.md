# 集团 AI 网关选型分析：Higress 与 Apache APISIX

> 状态：初步选型建议  
> 更新日期：2026-08-26  
> 关联材料：[集团AI网关与MaaS平台初步产品设计.docx](../集团AI网关与MaaS平台初步产品设计.docx)

## 1. 选型结论

在没有存量网关约束的情况下，建议集团 AI 网关首选 **Higress**。

Higress 与 Apache APISIX 都能同时承载传统 API 和大模型 API，但本项目不仅需要模型代理，还需要支撑 MaaS 平台中的外部 Agent、MCP 工具、模型路由、Token 治理、内容安全和调用审计。Higress 已提供专门的 MCP Server 插件、REST-to-MCP 转换、工具级安全配置和动态工具白名单，和本项目目标更接近，所需组合组件更少。

如果集团已经在生产环境大规模使用 Apache APISIX，并具备成熟的 Consumer、OIDC、插件开发和运维体系，则应优先保护存量投资，选择：

> **Apache APISIX + MaaS 工具代理或独立 MCP Gateway + 本地 Guardrail/DLP + 独立预算结算服务**

这两种选择的判断原则如下：

| 场景 | 推荐方案 |
| --- | --- |
| 新建集团 AI 网关，外部 Agent 和 MCP 是一期重点 | Higress |
| 已有 APISIX 生产集群，传统 API 治理体系成熟 | Apache APISIX 组合方案 |
| 工具目录、工具授权和人工审批已由 MaaS 完整承担 | 两者均可，优先复用现有网关 |
| 希望尽量减少 MCP 和 Agent 治理的自研组件 | Higress |
| 敏感数据禁止送到外部内容审核服务 | 两者都需要补充本地 Guardrail/DLP |

## 2. 与产品设计的责任边界

根据《集团AI网关与MaaS平台初步产品设计》，网关和 MaaS 不应互相替代：

- **MaaS 平台**负责 Agent、Prompt、知识、工具、运行状态、版本发布、评测以及人工审批。
- **AI 网关**负责模型统一接入、身份校验、路由、数据保护、Token/预算控制、调用审计和供应商凭据保护。
- **业务系统**保留最终业务授权。例如付款、删除、发布、数据修改等操作，不能因为模型或 Agent 提出了工具调用就自动获得执行权限。

即使选择带有 Agent 插件的网关，也不建议把集团级 Agent 编排、业务授权和人工审批下沉到网关。网关是流量和安全控制点，MaaS 才是 Agent 资产及运行治理中心。

## 3. 为什么外部 AI Agent 需要额外防护

传统外部系统通常按固定协议调用一个确定接口。外部 AI Agent 则可能根据模型输出连续调用模型、知识库和工具，并把网页、文档及工具返回内容继续送入下一轮推理。

因此，外部 Agent 应被视为一个可自主连续调用、但不完全可信的工作负载。主要风险包括：

1. Agent 伪造租户、应用、用户或角色信息。
2. Prompt 注入诱导 Agent 忽略原有规则并调用高风险工具。
3. 知识库文档、网页或工具返回值携带间接 Prompt 注入。
4. Agent 通过 MCP、URL 抓取或自定义工具访问内网和云元数据地址。
5. Agent 进入循环，持续调用模型和工具，放大 Token 与费用消耗。
6. Agent 把用户凭据、内部 Header 或敏感数据转发给外部模型供应商。
7. 故障切换将受限数据发送给不符合区域或安全等级要求的模型。
8. 多租户语义缓存复用错误，导致一个租户读取另一个租户的输出。

## 4. 外部 Agent 调用的必选防护能力

### 4.1 P0：上线前必须具备

| 防护领域 | 必须实现的控制 | 不应采用的做法 |
| --- | --- | --- |
| Agent 与委托用户身份 | 同时识别租户、消费应用、Agent、最终用户；使用短期令牌；支持吊销和重放保护 | 只给整个 Agent 平台配置一个长期 API Key |
| 可信身份上下文 | 在网关或可信身份服务中覆盖写入租户、用户、Agent、数据等级和请求 ID | 直接信任客户端提交的 `tenant`、`user`、`role` 等 Header |
| 工具调用授权 | 每次工具调用重新鉴权；按 Agent、用户、工具、方法和数据范围授权 | 因为 Agent 已登录，就允许调用目录中的全部工具 |
| 高风险动作控制 | 付款、删除、发布、外发、写库等操作支持二次确认和人工审批 | 把模型输出中的“确认”当作用户授权 |
| Prompt 与间接注入 | 检查用户输入、历史消息、RAG 文档和工具返回值；隔离系统指令与不可信内容 | 只对最后一条用户消息做关键词过滤 |
| 数据防泄漏 | 请求和响应双向 DLP；流式响应也必须检查；按数据等级限制模型和区域 | 只检查请求，不检查模型响应和工具结果 |
| 网络出口与 SSRF | 域名、协议、端口白名单；阻断内网扫描、云元数据、控制面和 DNS 重绑定 | 允许 Agent 根据任意 URL 参数发起请求 |
| 凭据隔离 | 模型及内部系统密钥由网关或密钥系统托管；按下游签发最小权限凭据 | 把外部 Agent 的 Authorization、Cookie 原样转发给模型或内部服务 |
| 失控循环与费用 | 同时限制 RPS、并发、输入/输出 Token、Agent 步数、工具次数、运行时长和金额 | 只配置普通 API RPS 限流 |
| 模型路由与降级 | Fallback 只能在同一数据合规范围和模型白名单内进行 | 出错后无条件切换到任意可用的公网模型 |
| 全链路审计 | 记录用户、Agent 版本、运行 ID、模型版本、工具、授权、审批、Token、费用和策略结果 | 只保留普通 HTTP 状态码和访问日志 |

### 4.2 P1：生产稳定运行所需

- 语义缓存按租户、用户权限、模型、策略版本和数据等级隔离；敏感路由默认禁用缓存。
- 客户端断开或取消时，网关应关闭上游流式请求，避免后台继续产生费用。
- 重试只能由一个层级负责，避免 MaaS、网关和模型 SDK 同时重试导致调用放大。
- 对请求体大小、上下文长度、最大输出 Token、SSE 连接时长和慢客户端设置限制。
- 对模型、插件、MCP Server 和工具建立准入目录，固定插件镜像版本和摘要，不在生产环境使用 `latest`。
- 审计数据采用防篡改存储，并明确日志脱敏、访问权限和保留周期。

## 5. 两个方案的能力比选

| 维度 | Higress | Apache APISIX | 选型判断 |
| --- | --- | --- | --- |
| 传统 API 网关 | 支持 Kubernetes Ingress/Gateway API、JWT、OIDC、HMAC、WAF、服务发现 | Consumer、OIDC、mTLS、WAF、限流及传统网关插件体系成熟 | 已有 APISIX 时 APISIX 更有优势 |
| 多模型代理 | 多模型协议转换、负载均衡、Fallback、Token 限流、AI 可观测 | `ai-proxy-multi` 支持多供应商、负载均衡、重试、Fallback、健康检查和 Token 日志 | 两者均可 |
| 外部 Agent/MCP | 有专门的 MCP Server 插件，支持 REST-to-MCP 和 MCP 代理 | 可保护 MCP 周边 HTTP 流量，但官方不把 APISIX 定义为专门的 MCP Gateway | Higress 优势明显 |
| 工具级权限 | 支持静态 `allowTools` 与可信动态工具白名单取交集 | 通常依赖 Route、Consumer、HTTP 方法限制或外部策略层 | Higress 优势明显 |
| MCP 上下游鉴权 | 支持 Client 到 Gateway、Gateway 到 Backend 两级安全方案及工具级覆盖 | 需要通过通用认证插件和外部 MCP/工具代理组合 | Higress 更完整 |
| Prompt 防护 | 产品能力包含 Prompt 注入和敏感内容识别；具体内容安全插件可检查输入、输出和流式内容 | `ai-prompt-guard` 支持允许/拒绝正则、全角色和全历史检查 | Higress略优，但两者均需语义 Guardrail |
| 内容合规的私有化 | 部分现成插件依赖阿里云内容安全 | 内容审核插件可依赖 AWS 或阿里云服务 | 两者都要验证数据不出域方案 |
| 身份与传统授权 | Consumer、JWT、OAuth2、HMAC 等能力齐全 | Consumer、Consumer Group、OIDC、方法级访问限制成熟 | APISIX 略优 |
| 可观测性 | Token、模型、首 Token 时延、路由等指标、日志和 Trace | Token、模型、首 Token 时延及多种日志输出插件 | 基本相当 |
| 语义缓存 | 官方 AI Gateway 能力中包含语义缓存 | 当前官方 AI 插件列表以代理、限流、Prompt 和 RAG 为主 | Higress 更直接；使用前仍需验证租户隔离 |
| 预算与成本中心 | Token 限流不能替代集团预算账本 | 同样缺少完整预算预占、结算和成本中心能力 | 两者都需要独立服务 |
| Agent 运行治理 | 不应替代 MaaS 的状态、步骤、审批、评测和版本治理 | 同样不应替代 MaaS | 两者相同 |
| 插件生态和扩展 | Envoy/Istio/Wasm 路线，AI 与 MCP 能力集中 | NGINX/OpenResty/etcd，传统插件数量更多，支持 Lua 及外部插件运行器 | 取决于现有团队技术栈 |

## 6. 方案一：选择 Higress

### 6.1 推荐架构

```text
外部 AI Agent
    |
    v
Higress 北向入口
  - WAF / mTLS / OIDC / HMAC
  - 请求大小、并发和重放保护
  - 清除客户端伪造的内部身份 Header
    |
    v
MaaS Agent 访问服务
  - Agent 注册及版本校验
  - 最终用户委托身份
  - 运行步骤、时长、Token 和金额上限
  - 工具授权与人工审批
    |
    +-- 模型请求 --> Higress AI Route --> Guardrail / DLP --> 模型供应商
    |
    +-- 工具调用 --> Higress MCP Route --> 传统 API 路由 --> 业务系统
                                                    |
                                                    +-- 最终业务鉴权
```

### 6.2 主要优势

- 同一个数据面可以承载传统 API、模型 API 和 MCP 工具流量。
- MCP Server 插件支持 REST-to-MCP，可把已有传统 API 按治理流程暴露为 Agent 工具。
- 支持工具级安全配置，并能把静态工具白名单与可信上游生成的动态白名单取交集。
- MCP 文档明确提示必须覆盖而不是追加工具权限 Header，可降低 Agent 伪造工具授权的风险。
- AI 路由、Token 限流、AI 可观测和内容安全能力相对集中，减少组合组件数量。

### 6.3 需要补齐的能力

- 集团预算预占、调用后结算、成本中心和价格版本管理。
- Agent 运行状态、步骤控制、工具审批及业务事务控制。
- 不依赖公网内容审核服务的本地 Prompt 注入检测、敏感数据识别和输出 Guardrail。
- 统一策略决策点，例如 OPA 或企业自有 ABAC 服务。
- 插件镜像签名、版本固定、灰度升级和回滚规范。

## 7. 方案二：选择 Apache APISIX

### 7.1 推荐组合

```text
外部 AI Agent
    |
    v
Apache APISIX
  - WAF / mTLS / OIDC / Consumer
  - 限流、路由、日志和 Header 清理
    |
    v
MaaS Agent 访问服务
    |
    +-- 模型请求 --> APISIX AI Route --> Guardrail / DLP --> 模型供应商
    |
    +-- 工具调用 --> 独立 MCP Gateway / 工具代理 --> APISIX API Route --> 业务系统
```

### 7.2 主要优势

- 传统 API 认证、Consumer、流量治理、日志和插件生态成熟。
- `ai-proxy-multi` 已能覆盖主流模型协议、负载均衡、重试和 Fallback。
- `ai-rate-limiting` 可以按 Token 用量限流。
- `ai-prompt-guard` 可以检查全部对话历史和不同角色消息。
- 如果集团已有 APISIX，能避免新建第二套传统网关控制面和运维体系。

### 7.3 需要特别处理的风险

- APISIX 官方说明其不是专门的 MCP Gateway，工具目录、协议转换和工具级授权需要 MaaS 或独立 MCP 组件承担。
- `ai-prompt-guard` 主要基于正则允许/拒绝规则，不能单独承担语义 Prompt 注入检测。
- `ai-prompt-guard` 对无法识别的 AI 协议默认可配置为跳过。生产策略应设置为失败拒绝，并监控协议解析失败。
- `ai-proxy-multi` 默认会向模型上游转发大部分客户端 Header。必须显式删除 `Authorization`、`Cookie`、租户信息和内部调试 Header，只注入允许发送给供应商的字段。
- Token 限流不等于金额预算，也不能限制 Agent 总步骤和工具调用次数。

## 8. 最终决策规则

### 8.1 选择 Higress 的条件

满足以下任一关键条件时，优先选择 Higress：

- 当前没有统一生产级网关，需要从零建设集团 AI 网关。
- 外部 Agent、MCP Server、REST-to-MCP 是一期范围。
- 需要网关直接执行工具白名单、上下游两级鉴权和 MCP 审计。
- 技术体系以 Kubernetes、Envoy、Istio、Nacos 或 Dubbo 为主。
- 希望减少独立 MCP Gateway 和自研协议转换组件。

### 8.2 选择 Apache APISIX 的条件

以下条件同时成立时，优先选择 Apache APISIX：

1. 集团已经稳定运行 APISIX，并已有统一认证、Consumer、监控、发布和应急体系。
2. MaaS 或独立工具平台已经负责 MCP 协议、工具目录、工具级授权和人工审批。
3. 主要目标是复用存量 API 治理能力，AI 模型代理属于增量需求。

### 8.3 本项目建议

结合当前产品设计，在未发现存量 APISIX 强约束的前提下：

> **建议选择 Higress 作为集团统一 AI 网关数据面；MaaS 继续承担 Agent 资产、运行、工具意图和审批；业务系统保留最终业务授权。**

该选择不是依赖单一产品完成全部能力。仍需建设本地 Guardrail/DLP、统一策略服务和集团预算结算服务。

## 9. PoC 验收和淘汰线

候选方案必须完成同一组 PoC，不以演示页面或功能列表作为验收依据。

| 编号 | 测试场景 | 验收标准 |
| --- | --- | --- |
| POC-01 | Agent 伪造租户、用户和角色 Header | 网关删除或覆盖伪造字段，审计记录真实身份来源 |
| POC-02 | Agent 直接传入额外工具白名单 | 不得扩大权限；有效工具集合必须由可信策略计算 |
| POC-03 | 未授权用户调用写工具 | 在工具执行前被拒绝；业务系统仍执行最终授权 |
| POC-04 | RAG 文档包含间接 Prompt 注入 | 能够阻断、降权或进入人工审核，不得直接执行危险工具 |
| POC-05 | 工具返回内容包含恶意指令 | 工具结果按不可信数据处理，不能覆盖系统策略 |
| POC-06 | 请求包含个人信息或内部密钥 | 请求进入外部模型前完成识别、脱敏或拒绝 |
| POC-07 | SSE 流式响应产生敏感内容 | 流式阶段仍能发现并中止或替换输出 |
| POC-08 | Agent 请求任意 URL | 内网、云元数据、控制面和非白名单目标被阻断 |
| POC-09 | Agent 进入模型与工具调用循环 | 达到步骤、Token、时间或金额上限后立即终止，并取消上游请求 |
| POC-10 | 主模型故障触发 Fallback | 只能切换到符合租户、数据等级、区域和模型白名单的目标 |
| POC-11 | 客户端携带 Cookie 和内部 Authorization | 这些 Header 不得被转发给外部模型供应商 |
| POC-12 | 多租户使用语义缓存 | 不同租户、权限和数据等级之间不得命中同一敏感结果 |
| POC-13 | Redis、鉴权或 Guardrail 服务不可用 | P0 安全控制应失败拒绝，不得静默放行 |
| POC-14 | 审计追溯 | 可通过业务请求 ID 还原 Agent、模型、知识、工具、审批、Token 和费用链路 |

任何候选方案出现以下情况，应直接淘汰或退出一期范围：

- 无法防止客户端伪造身份或工具权限 Header。
- 安全插件不可用时默认放行，且不能配置为失败拒绝。
- 无法在流式调用中实施超时、取消和审计。
- Fallback 不能绑定数据等级和模型白名单。
- 无法按租户、消费应用和 Agent 分别统计 Token。
- 工具调用无法执行逐次授权和完整审计。

## 10. 实施建议

1. 先建设一条模型代理链路和一条只读工具链路，不在首轮 PoC 接入写操作。
2. 使用同一身份源，明确租户、消费应用、Agent 和最终用户四级身份模型。
3. 首批工具只开放查询类接口，并为参数设置 JSON Schema、枚举和最大长度。
4. 将 Prompt、RAG 内容、工具返回值和模型输出统一纳入内容安全策略。
5. 建立调用前预算预占、调用后按实际 Token 结算的独立账本。
6. 统一 Trace ID，并贯穿 MaaS、网关、模型和工具调用。
7. PoC 通过后再评估写工具、跨系统事务、语义缓存和自动 Fallback。

## 11. 参考资料

### Higress

- [Higress GitHub](https://github.com/higress-group/higress)
- [Higress AI Gateway](https://higress.cn/en/ai-gateway)
- [Higress MCP Server Plugin](https://higress.cn/en/docs/ai/mcp-server/)
- [Higress AI Content Security](https://higress.cn/en/docs/latest/user/plugins/ai/api-provider/ai-security-guard/)
- [Higress AI Token Rate Limit](https://higress.cn/docs/latest/plugins/ai/api-consumer/ai-token-ratelimit/)
- [Higress AI Statistics](https://higress.cn/en/docs/latest/plugins/ai/api-o11y/ai-statistics/)

### Apache APISIX

- [Apache APISIX GitHub](https://github.com/apache/apisix)
- [Apache APISIX AI Gateway](https://apisix.apache.org/ai-gateway/)
- [Apache APISIX Plugin Hub](https://apisix.apache.org/plugins/)
- [APISIX ai-proxy-multi](https://apisix.apache.org/docs/apisix/plugins/ai-proxy-multi/)
- [APISIX ai-rate-limiting](https://apisix.apache.org/docs/apisix/plugins/ai-rate-limiting/)
- [APISIX ai-prompt-guard](https://apisix.apache.org/docs/apisix/plugins/ai-prompt-guard/)
- [APISIX MCP 与 AI Gateway 说明](https://apisix.apache.org/learning-center/mcp-protocol-ai-gateway/)
- [APISIX OpenID Connect](https://apisix.apache.org/docs/apisix/plugins/openid-connect/)
- [APISIX Consumer Restriction](https://apisix.apache.org/docs/apisix/plugins/consumer-restriction/)

## 12. 安全说明

本文件是基于产品设计和开源项目官方资料形成的架构级初步选型，不替代生产上线前的插件源码审查、性能压测、渗透测试、Agent 红队测试和合规评审。具体能力应以拟采用版本、实际部署配置和 PoC 结果为准。
