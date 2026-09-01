/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHttp } from './http'
import type { SemanticModel, ValidationIssue } from './semantic-layer'

const http = createHttp({ baseURL: '/api/v1/semantic-agent' })

// ── 类型定义 ──

/** 提案 patch 的 op 白名单（与后端 PATCH_OPS 对齐） */
export type ProposalOp =
  | 'add_metric' | 'update_metric' | 'delete_metric'
  | 'add_dimension' | 'update_dimension' | 'delete_dimension'
  | 'add_dq' | 'update_dq' | 'delete_dq'
  | 'set_aliases'
  | 'add_metrics_batch' | 'add_dimensions_batch'
  | 'add_relation' | 'delete_relation'
  | 'update_overview'

/** 单个修改提案（diff 卡片渲染单元） */
export interface ProposalPatch {
  op: ProposalOp
  /** 指标/维度英文名（update/delete/set_aliases）或 DQ 规则索引（update_dq/delete_dq） */
  target?: string | number
  /** add 类：完整定义；update 类：要修改的字段；set_aliases：值别名映射数组 */
  payload?: Record<string, any>
  /** 前端计算：修改前的原配置（用于 diff 展示） */
  before?: Record<string, any>
  /** 前端计算：修改后的配置（用于 diff 展示） */
  after?: Record<string, any>
}

export interface AgentProposal {
  intent: string
  rationale: string
  patches: ProposalPatch[]
}

export interface AgentChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** thinking 事件数据（动作进度） */
export interface ThinkingEvent {
  round?: number
  action?: string
  tool?: string
  success?: boolean
  op?: string
  target?: string | number
}

/** 对话轮次最终结果（done 事件数据） */
export type AgentTurnResult =
  | { kind: 'proposal'; proposal: AgentProposal }
  | { kind: 'answer'; text: string }
  | { kind: 'task'; task: 'regenerate_model' | 'fix_all'; rationale: string }

/** apply 提案返回 */
export interface ApplyResult {
  success: boolean
  applied: Array<{ op: string; target?: string | number; success: boolean; error?: string }>
  auto_fixes: Array<{ round: number; op: string; target?: string | number; success: boolean; error?: string }>
  validation: {
    valid: boolean
    issues: ValidationIssue[]
    error_count?: number
    warning_count?: number
    compile_checked?: boolean
    [key: string]: any
  }
  model: SemanticModel
}

/** fix-all 流式进度事件数据（fix_batch / thinking 事件共用） */
export interface FixAllProgress {
  /** fix_batch 事件：当前批次号与问题数 */
  batch?: number
  issue_count?: number
  /** thinking 事件（fix_all_apply）：逐 patch 应用结果 */
  action?: string
  round?: number
  op?: string
  target?: string | number
  success?: boolean
}

/** fix-all 最终报告（done 事件数据） */
export interface FixAllReport {
  success: boolean
  fixed_count: number
  remaining_issues: ValidationIssue[]
  rounds: number
  applied: Array<{ op: string; target?: string | number; success: boolean; error?: string }>
  validation: {
    valid: boolean
    issues: ValidationIssue[]
    [key: string]: any
  }
}

// ── API 客户端 ──

export const SemanticAgentApi = {
  /**
   * 设计器对话轮次（SSE 流式）。
   * 返回 AbortController 供取消；结果经回调实时返回。
   */
  chat: async (
    modelId: string,
    params: { history: AgentChatMessage[]; message: string },
    callbacks: {
      onThinking: (data: ThinkingEvent) => void
      onProposal: (proposal: AgentProposal) => void
      onDone: (result: AgentTurnResult) => void
      onError: (error: string) => void
    },
  ): Promise<AbortController> => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const response = await fetch(`/api/v1/semantic-agent/${modelId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history: params.history, message: params.message }),
          signal: controller.signal,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('无法读取响应流')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let eventType = ''
          let dataStr = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6)
            } else if (line === '' && eventType) {
              try {
                const data = JSON.parse(dataStr)
                if (eventType === 'thinking') {
                  callbacks.onThinking(data)
                } else if (eventType === 'proposal') {
                  callbacks.onProposal(data.proposal)
                } else if (eventType === 'done') {
                  callbacks.onDone(data)
                } else if (eventType === 'error') {
                  callbacks.onError(data.message || '未知错误')
                }
              } catch { /* 解析失败跳过 */ }
              eventType = ''
              dataStr = ''
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || '连接失败')
        }
      }
    })()

    return controller
  },

  /** 应用提案（写操作）：逐 patch 写库 + 校验自愈，返回最新模型 */
  apply: (modelId: string, proposal: AgentProposal) =>
    http.post(`/${modelId}/apply`, { proposal }).then(r => r.data as ApplyResult),

  /** 读取已保存的对话历史（抽屉重开时恢复，最多 10 轮） */
  getHistory: (modelId: string) =>
    http.get(`/${modelId}/history`).then(r => r.data.history as AgentChatMessage[]),

  /** 清空服务端对话历史（「清空对话」按钮同步，写操作） */
  clearHistory: (modelId: string) =>
    http.delete(`/${modelId}/history`).then(r => r.data as { success: boolean }),

  /** 追加一条 assistant 结论消息（拒绝提案后同步，写操作） */
  appendHistoryNote: (modelId: string, content: string) =>
    http.post(`/${modelId}/history/note`, { content }).then(r => r.data as { success: boolean }),

  /**
   * 一键批量修复（SSE 流式）：校验 → 分批 LLM 修复 → 逐批复验。
   * 返回 AbortController 供取消；进度经 onProgress 实时返回，完成经 onDone 返回报告。
   */
  fixAll: async (
    modelId: string,
    callbacks: {
      onProgress: (data: FixAllProgress) => void
      onDone: (report: FixAllReport) => void
      onError: (error: string) => void
    },
  ): Promise<AbortController> => {
    const controller = new AbortController()

    ;(async () => {
      try {
        const response = await fetch(`/api/v1/semantic-agent/${modelId}/fix-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('无法读取响应流')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let eventType = ''
          let dataStr = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              dataStr = line.slice(6)
            } else if (line === '' && eventType) {
              try {
                const data = JSON.parse(dataStr)
                if (eventType === 'fix_batch' || eventType === 'thinking') {
                  callbacks.onProgress(data)
                } else if (eventType === 'done') {
                  callbacks.onDone(data)
                } else if (eventType === 'error') {
                  callbacks.onError(data.message || '未知错误')
                }
              } catch { /* 解析失败跳过 */ }
              eventType = ''
              dataStr = ''
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError(err.message || '连接失败')
        }
      }
    })()

    return controller
  },
}
