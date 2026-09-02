# 七类详情页调研与设计映射

Type: research
Status: resolved

## Scope

调研 DataLeap、阿里百炼、HiMarket 以及 AsyncAPI/Kafka/Pulsar/Celery 等一手资料，形成七类详情字段与接入路径。

## Answer

研究结果已固化到 `../spec.md`：API 以接口契约为主；数据流补充消息契约与消费语义；Agent、MCP、Skill 分别强调调用、双路径连接与装配；模型强调算法能力、输入输出及离线评估；Worker 强调任务、调度与恢复。动态性能监控和开发平面操作不进入当前详情页。

## Evidence

- DataLeap API 管理与市场详情：<https://www.volcengine.com/docs/6260/1154939>、<https://www.volcengine.com/docs/6260/127700>、<https://www.volcengine.com/docs/6260/1148775>、<https://www.volcengine.com/docs/6260/127583>
- AsyncAPI 3.0 规范：<https://www.asyncapi.com/docs/reference/specification/v3.0.0>
- 阿里百炼 Agent、Skill、MCP 官方文档：<https://help.aliyun.com/zh/model-studio/agent-api/>、<https://help.aliyun.com/zh/model-studio/introduction-to-skill>、<https://help.aliyun.com/zh/model-studio/managed-agents-mcp>
- Worker 任务语义参考：<https://docs.celeryq.dev/en/stable/userguide/tasks.html>
- HiMarket 详情壳与类型页面：`D:\cursor\himarket\himarket-web\himarket-frontend\src\components\ProductDetailLayout.tsx`、`D:\cursor\himarket\himarket-web\himarket-frontend\src\pages\ApiDetail.tsx`

## Comments

- 2026-09-01：用户确认数据消费方身份、七类页签、静态示例、同类型单接口、异常状态与版本边界。
