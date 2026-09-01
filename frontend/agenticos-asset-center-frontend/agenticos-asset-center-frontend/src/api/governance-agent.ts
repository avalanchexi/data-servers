/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHttp } from './http'

const http = createHttp({ baseURL: '/api/v1/governance-agent' })

// ── 类型定义 ──

/** 提案 patch 的 op 白名单（与后端 PATCH_OPS 对齐） */
export type GovernancePatchOp =
  | 'metadata_update'
  | 'standard_map'
  | 'quality_rule_create'
  | 'classification_confirm'
  | 'lifecycle_action'
  | 'tag_batch'
  | 'ownership_update'
  | 'scan_rule_create'

/** 单个治理提案 patch（提案卡片渲染单元） */
export interface GovernancePatch {
  op: GovernancePatchOp
  /** classification_confirm：分级记录ID */
  target?: string | number
  /** add 类：完整定义；tag_batch：预打标数组 */
  payload?: Record<string, any>
}

export interface GovernanceProposal {
  intent: string
  rationale: string
  patches: GovernancePatch[]
}

export interface GovernanceChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** thinking 事件数据（动作进度） */
export interface GovernanceThinkingEvent {
  round?: number
  action?: string
  tool?: string
  success?: boolean
  op?: string
  target?: string | number
}

/** 对话轮次最终结果（done 事件数据） */
export type GovernanceTurnResult =
  | { kind: 'proposal'; proposal: GovernanceProposal }
  | { kind: 'answer'; text: string }
  | { kind: 'task'; task: 'scan_run'; rule_id: string; rationale: string }

/** apply 提案返回 */
export interface GovernanceApplyResult {
  success: boolean
  applied: Array<{ op: string; target?: string | number; success: boolean; error?: string }>
}

/** 扫描执行结果（scan run done 事件数据） */
export interface GovernanceScanResult {
  success: boolean
  rule_id: string
  category: string
  hit_count: number
  hits: Array<Record<string, any>>
  auto_fixed: Array<Record<string, any>>
  last_result: Record<string, any>
}

// ── SSE 流解析公共实现 ──

/** 解析单条 SSE 流：事件名 + JSON 数据，回调处理 */
async function consumeSseStream(
  response: Response,
  onEvent: (eventType: string, data: any) => void,
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法读取响应流')

  const decoder = new TextDecoder()
  let buffer = ''
  // eventType/dataStr 必须在循环外持有：SSE 事件的 event: 行与结束空行
  // 可能落在不同网络分片（两次 read()），循环内声明会被重置导致事件丢失
  let eventType = ''
  let dataStr = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        dataStr = line.slice(6)
      } else if (line === '' && eventType) {
        try {
          onEvent(eventType, JSON.parse(dataStr))
        } catch { /* 解析失败跳过 */ }
        eventType = ''
        dataStr = ''
      }
    }
  }
}

// ── API 客户端 ──

export const GovernanceAgentApi = {
  /**
   * 治理Agent对话轮次（SSE 流式）。
   * 返回 AbortController 供取消；结果经回调实时返回。
   */
  chat: async (
    params: { history: GovernanceChatMessage[]; message: string },
    callbacks: {
      onThinking: (data: GovernanceThinkingEvent) => void
      onProposal: (proposal: GovernanceProposal) => void
      onDone: (result: GovernanceTurnResult) => void
      onError: (error: string) => void
    },
  ): Promise<AbortController> => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const response = await fetch('/api/v1/governance-agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: params.history, message: params.message }),
          signal: controller.signal,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        await consumeSseStream(response, (eventType, data) => {
          if (eventType === 'thinking') {
            callbacks.onThinking(data)
          } else if (eventType === 'proposal') {
            callbacks.onProposal(data.proposal)
          } else if (eventType === 'done') {
            callbacks.onDone(data)
          } else if (eventType === 'error') {
            callbacks.onError(data.message || '未知错误')
          }
        })
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || '连接失败')
        }
      }
    })()

    return controller
  },

  /** 应用治理提案（写操作）：逐 patch 分派写方法 */
  apply: (proposal: GovernanceProposal) =>
    http.post('/apply', { proposal }).then(r => r.data as GovernanceApplyResult),

  /** 读取已保存的对话历史（面板重开时恢复，最多 10 轮） */
  getHistory: () =>
    http.get('/history').then(r => r.data.history as GovernanceChatMessage[]),

  /** 清空服务端对话历史（「清空对话」按钮同步，写操作） */
  clearHistory: () =>
    http.delete('/history').then(r => r.data as { success: boolean }),

  /** 追加一条 assistant 结论消息（拒绝提案后同步，写操作） */
  appendHistoryNote: (content: string) =>
    http.post('/history/note', { content }).then(r => r.data as { success: boolean }),

  /**
   * 手动执行扫描规则（SSE 流式）。
   * 返回 AbortController 供取消；进度经 onThinking 实时返回，完成经 onDone 返回报告。
   */
  runScan: async (
    ruleId: string,
    callbacks: {
      onThinking: (data: GovernanceThinkingEvent) => void
      onDone: (report: GovernanceScanResult) => void
      onError: (error: string) => void
    },
  ): Promise<AbortController> => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const response = await fetch(`/api/v1/governance-agent/scan/${ruleId}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        await consumeSseStream(response, (eventType, data) => {
          if (eventType === 'thinking') {
            callbacks.onThinking(data)
          } else if (eventType === 'done') {
            callbacks.onDone(data)
          } else if (eventType === 'error') {
            callbacks.onError(data.message || '未知错误')
          }
        })
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || '连接失败')
        }
      }
    })()

    return controller
  },
}
