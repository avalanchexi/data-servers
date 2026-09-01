import axios from 'axios'
import { apiClient, API_BASE, API_TOKEN, normalizeCardData } from './core'
import { createLogger } from '../utils/logger'

const log = createLogger('API')

export interface SendMessageRequest {
  message: string
  task_id?: string
  platform: string
  user_id?: string
  agent_id?: string
  attachments?: MessageAttachment[]
  network_search?: boolean
  /** 完整对话历史（OpenAI 格式），用于保持上下文连续性 */
  messages?: Array<{ role: string; content: string }>
  /** 上一轮分析的卡片上下文（数据库、SQL、列名等），注入为 system 消息 */
  card_context?: string
  /** 显式指定问答模式：data_qa | doc_qa | report | crm | auto */
  qa_mode?: string
  /** 推荐动作的元数据（仅推荐点击时传入） */
  recommendation_meta?: {
    mode?: string       // 推荐执行模式
    tool_hint?: string  // 后端路由提示（注入 agent system prompt）
    slot_snapshot?: Record<string, unknown>  // 槽位快照（推荐动作携带的上下文）
  }
  /** 显式切换 Agent 标记（澄清按钮/切换确认后重发原问题）：后端跳过候选探测并打 explicit 语义 */
  agent_switch?: boolean
}

export interface MessageAttachment {
  name: string
  type: string
  content: string
  kind: 'text' | 'image'
}

export interface SendMessageResponse {
  success: boolean
  message_id: string
  response?: string
  card_data?: Record<string, unknown>
  error?: string
}

export interface CitationItem {
  snippet: string
  doc_title?: string
  score?: number | null
  document_id?: string
  chunk_id?: string
  page?: string
  kb_name?: string
}

export interface ToolProgressEvent {
  tool: string
  emoji?: string
  /** Lucide 图标名（思考树阶段节点语义图标，优先级高于 emoji） */
  icon?: string
  label?: string
  toolCallId?: string
  status: 'running' | 'completed' | 'error' | 'failed' | 'skipped'
  details?: string
  /** 步骤序号（全局递增） */
  stepOrder?: number
  /** 工具分类，用于前端分组展示 */
  category?: string
  /** 工具执行耗时（毫秒，completed 时有效） */
  durationMs?: number
  /** DocQA 工具返回的文档依据片段，前端仅用于思考步骤展示。 */
  citations?: CitationItem[]
  /** 报告工具的阶段耗时（generate_analysis_report 专属） */
  phase_timings?: Record<string, string>
  /** 报告工具使用的数据库 */
  database?: string
  /** 报告工具使用的模板名称 */
  template_name?: string
  /** 报告工具使用的模板 ID */
  template_id?: string
  /** 报告工具的分析关键词 */
  keyword?: string
  /** 报告工具的推荐动作生成元数据 */
  recommendation_meta?: {
    count: number
    elapsed: string
    source: string
    has_numeric: boolean
    has_categorical: boolean
    table_count: number
    has_conclusions: boolean
  }
  /** DCG 检索来源统计（generate_analysis_report 专属，供前端渲染检索方式标签） */
  dcg_stats?: {
    search_method: string
    graph_entities_count: number
    schema_linked: boolean
    tables_with_graph_rels: number
    hit_sources: Record<string, number>
  }
  /** 思考树：事件类型（phase_begin / phase_end / leaf_event / detail_append） */
  treeEvent?: 'phase_begin' | 'phase_end' | 'leaf_event' | 'detail_append'
  /** 思考树：阶段/事件 ID */
  phaseId?: string
  /** 思考树：叶子事件 ID */
  eventId?: string
  /** 思考树：阶段名称（替代 tool 字段） */
  phase?: string
  /** 思考树：父阶段 ID */
  parentPhaseId?: string
  /** 思考树：detail_append 追加的文本 */
  text?: string
  /** 思考树：detail_append 模式（append | replace） */
  mode?: 'append' | 'replace'
}

/** 单通道评分详情（多通道并行评分后汇总） */
export interface ChannelScore {
  channel: string  // "regex" | "semantic" | "llm"
  intent: string
  score: number
  latency_ms: number
}

/**
 * 结构化澄清选项（postBack 语义：label 展示 / payload 承载动作）。
 * - agent_switch：点击执行 Agent 切换（不把文本当问题提交）
 * - stay_current：仅关闭澄清提示
 * - intent_choice / plain_question / legacy：当普通文本发送（话语补全）
 */
export interface ClarificationOption {
  type: 'agent_switch' | 'stay_current' | 'intent_choice' | 'plain_question' | 'legacy'
  label: string
  payload?: {
    agent_id?: string
    agent_name?: string
  }
}

export type ClarificationOptions = Array<string | ClarificationOption>

export interface RoutingEvent {
  /** Agent 决策 */
  agent: {
    id: string
    name: string
    match_method: string
    confidence: number
    candidates?: Array<{ name: string; score: number }>
    is_new_binding: boolean
  }
  /** Intent 决策 */
  intent: {
    name: string
    confidence: number
    layer: string
    reason: string
  }
  /** 数据集选择（意图识别阶段统一选定） */
  dataset?: {
    id: string
    name: string
    confidence: number
    method: string
    tables: string[]
    error: string
  } | null
  qa_mode: string
  toolsets?: string[]
  channel_scores?: ChannelScore[]
  candidates?: Array<{ intent: string; score: number }>
  /** 决策追踪（决策链，每步一条） */
  match_trace?: Array<{
    step: number
    action: string
    detail: string
  }>
  /** 语义模型（意图识别阶段匹配到的业务口径） */
  semantic_models?: Array<{
    model_name: string
    label_zh: string
    source_table: string
    match_score: number
    matched_metrics: string[]
    matched_dimensions: string[]
  }>
  cascade_plan?: string[]
  needs_clarification: boolean
  clarification_message: string
  clarification_options: ClarificationOptions
  /** 跨 Agent 切换澄清候选（路由层提前拦截）；存在且非空 → 渲染 A/B/C 切换按钮 */
  agent_switch_candidates?: AgentSwitchCandidate[]
  agent_switch_clarification?: boolean
  /** 本轮用户提问原文：点击澄清选项切换 Agent 时作为原问题重发 */
  user_message?: string
}

export interface CascadeEvent {
  from_intent: string
  to_intent: string
  from_toolsets: string[]
  to_toolsets: string[]
  reason: string
}

export interface DiscardPreviousEvent {
  reason: string
  discarded_intent: string
  discarded_length: number
}

export interface AgentErrorEvent {
  error_type: string
  message: string
  final_response: string
  completed: boolean
}

/** 跨 Agent 切换澄清候选（路由层提前拦截）。含 agent_id 供前端结构化 A/B/C 渲染点击。 */
export interface AgentSwitchCandidate {
  agent_id: string
  agent_name: string
  confidence: number
  reason: string
  matched_model?: string
}

/** 跨 Agent 级联建议事件（当前 Agent 无法处理，发现更适合的 Agent 时触发） */
export interface AgentSuggestionEvent {
  suggested_agent: {
    id: string
    name: string
    confidence: number
    reason: string
  }
  original_message: string
}

/** 智能体自动切换事件（通用智能体自动匹配到专业智能体时触发） */
export interface AgentSwitchEvent {
  from_agent: { id: string | null; name: string }
  to_agent: { id: string; name: string }
  reason: string
  confidence: number
  needs_confirmation: boolean
  /** 匹配方式: "vector_search" | "rule_match" | "llm_match" */
  match_method?: string
  /** 候选智能体列表 */
  candidates?: Array<{ name: string; score: number }>
}

export interface ThinkingEvent {
  type: 'thinking_start' | 'thinking_content' | 'thinking_end'
  content?: string
}

export interface RecommendationItem {
  text: string
  description: string
  query: string
  sql?: string
  action_type: string
  slot_snapshot?: Record<string, unknown>
}

/** 快速路由叙事补全事件（图表先行后由后端异步推送） */
export interface CardNarrativeEvent {
  narrative_blocks: Array<{ type: string; content?: string }>
  recommendations?: Array<Record<string, unknown>>
}

export interface StreamCallbacks {
  signal?: AbortSignal
  onRouting?: (event: RoutingEvent) => void
  onCascade?: (event: CascadeEvent) => void
  onDiscardPrevious?: (event: DiscardPreviousEvent) => void
  /** 澄清触发。switchCandidates 非空时表示跨 Agent 切换澄清（结构化的 A/B/C）。 */
  onClarification?: (message: string, switchCandidates?: AgentSwitchCandidate[]) => void
  onAgentError?: (event: AgentErrorEvent) => void
  onAgentSuggestion?: (event: AgentSuggestionEvent) => void
  onAgentSwitch?: (event: AgentSwitchEvent) => void
  onToolProgress?: (event: ToolProgressEvent) => void
  onThinking?: (event: ThinkingEvent) => void
  onRecommendations?: (recommendations: RecommendationItem[]) => void
  onCardNarrative?: (event: CardNarrativeEvent) => void
  onDelta?: (delta: string) => void
  onDone?: (response: string, card_data?: Record<string, unknown>) => void
  onError?: (error: Error) => void
}

const buildChatContent = (request: SendMessageRequest) => (
  request.attachments?.length
    ? [
      { type: 'text', text: request.message },
      ...request.attachments.map((attachment) => (
        attachment.kind === 'image'
          ? { type: 'image_url', image_url: { url: attachment.content } }
          : { type: 'text', text: `\n\n[附件：${attachment.name}]\n${attachment.content}` }
      )),
    ]
    : request.message
)

const buildChatCompletionBody = (request: SendMessageRequest, stream: boolean) => {
  // 如果有完整对话历史，使用它（追加当前用户消息）；否则只发单条消息
  let historyMessages = request.messages && request.messages.length > 0
    ? [...request.messages, { role: 'user', content: buildChatContent(request) }]
    : [{ role: 'user', content: buildChatContent(request) }]

  // 推荐操作上下文：注入上轮分析的 card_data 摘要（数据库、列、SQL、数据预览）
  // 作为 system 消息放在历史之前，帮助 AIAgent 直接复用上下文而无需重复探索
  if (request.card_context) {
    historyMessages = [
      { role: 'system', content: request.card_context },
      ...historyMessages,
    ]
  }

  return {
    model: 'dataqa',
    messages: historyMessages,
    stream,
    network_search: Boolean(request.network_search),
    qa_mode: request.qa_mode || 'auto',
    ...(request.agent_id ? { agent_id: request.agent_id } : {}),
    ...(request.recommendation_meta ? { recommendation_meta: request.recommendation_meta } : {}),
    ...(request.agent_switch ? { agent_switch: true } : {}),
  }
}

export const sendMessageStreaming = async (
  request: SendMessageRequest,
  callbacks: StreamCallbacks
): Promise<void> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`
    }
    if (request.task_id) {
      headers['X-Hermes-Session-Id'] = request.task_id
    }
    if (request.user_id) {
      headers['X-Hermes-User-Id'] = request.user_id
    }

    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers,
      signal: callbacks.signal,
      body: JSON.stringify(buildChatCompletionBody(request, true)),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullResponse = ''
    let currentCardData: Record<string, unknown> | undefined
    let currentEvent = ''
    // done 事件已触发 → 图表已渲染，[DONE] / while 循环结束不再重复调用 onDone
    let doneAlreadyCalled = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.slice(7).trim()
          continue
        }

        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim()
          if (!dataStr || dataStr === '[DONE]') {
            if (dataStr === '[DONE]') {
              // [DONE] 标记连接即将关闭，如果 done 事件尚未触发渲染，则在此处触发
              if (!doneAlreadyCalled) {
                doneAlreadyCalled = true
                callbacks.onDone?.(fullResponse, currentCardData)
              }
              // 不 return，继续读取后续事件（如 hermes.recommendations）
              currentEvent = ''
              continue
            }
            currentEvent = ''
            continue
          }

          try {
            const data = JSON.parse(dataStr)

            if (currentEvent === 'error') {
              const message = data?.error || data?.message || '后端服务异常'
              throw new Error(String(message))
            }

            // ── done 事件：携带 card_data，立即触发图表/表格渲染 ──
            if (currentEvent === 'done') {
              if (data.card_data) {
                currentCardData = normalizeCardData(data.card_data)
              }
              // 快速路径（semantic_query/semantic_report 短路）的 done 事件把交付文本
              // 放在 final_response 字段（choices[].delta 为空），若不读取则消息
              // content 为空，与刷新后从服务端回放的内容不一致
              if (typeof data.final_response === 'string' && data.final_response.trim()) {
                fullResponse += data.final_response
                callbacks.onDelta?.(data.final_response)
              }
              if (!doneAlreadyCalled) {
                doneAlreadyCalled = true
                callbacks.onDone?.(fullResponse, currentCardData)
              }
              currentEvent = ''
              continue
            }

            if (currentEvent === 'safety_notice') {
              const notice = data?.notice
              if (notice) {
                callbacks.onDelta?.(`> ⚠️ ${notice}\n\n`)
                fullResponse += `> ⚠️ ${notice}\n\n`
              }
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.routing') {
              callbacks.onRouting?.(data as RoutingEvent)
              if (data.needs_clarification) {
                callbacks.onClarification?.(
                  data.clarification_message || '',
                  data.agent_switch_clarification
                    ? (data.agent_switch_candidates as AgentSwitchCandidate[] | undefined)
                    : undefined,
                )
              }
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.cascade') {
              callbacks.onCascade?.(data as CascadeEvent)
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.discard_previous') {
              callbacks.onDiscardPrevious?.(data as DiscardPreviousEvent)
              fullResponse = ''
              currentCardData = undefined
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.error') {
              callbacks.onAgentError?.(data as AgentErrorEvent)
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.agent_switch') {
              callbacks.onAgentSwitch?.(data as AgentSwitchEvent)
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.agent_suggestion') {
              callbacks.onAgentSuggestion?.(data as AgentSuggestionEvent)
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.clarification') {
              callbacks.onClarification?.(
                data.message || '',
                data.clarification_kind === 'agent_switch'
                  ? (data.agent_switch_candidates as AgentSwitchCandidate[] | undefined)
                  : undefined,
              )
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.tool.progress') {
              callbacks.onToolProgress?.(data as ToolProgressEvent)
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.thinking') {
              callbacks.onThinking?.(data as ThinkingEvent)
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.recommendations') {
              callbacks.onRecommendations?.(data as RecommendationItem[])
              currentEvent = ''
              continue
            }

            if (currentEvent === 'hermes.card_narrative') {
              callbacks.onCardNarrative?.(data as CardNarrativeEvent)
              currentEvent = ''
              continue
            }

            const delta = data.choices?.[0]?.delta
            const message = data.choices?.[0]?.message
            const content = delta?.content || message?.content
            if (content) {
              fullResponse += content
              callbacks.onDelta?.(content)
            }

            if (data.usage && data.card_data) {
              currentCardData = normalizeCardData(data.card_data)
              // cardData 就绪时立即完成回答（不等 [DONE]），让思考步骤尽早终结
              if (!doneAlreadyCalled) {
                doneAlreadyCalled = true
                callbacks.onDone?.(fullResponse, currentCardData)
              }
            }

            if (data.card_data && !currentCardData) {
              currentCardData = normalizeCardData(data.card_data)
              if (!doneAlreadyCalled) {
                doneAlreadyCalled = true
                callbacks.onDone?.(fullResponse, currentCardData)
              }
            }
          } catch (e) {
            log.warn('[API] Failed to parse SSE event: ' + trimmedLine + ' ' + String(e))
          }
          currentEvent = ''
        } else if (trimmedLine === '' || trimmedLine.startsWith(':')) {
          currentEvent = ''
        }
      }
    }

    // while 循环结束（连接关闭）时的兜底
    if (!doneAlreadyCalled) {
      callbacks.onDone?.(fullResponse, currentCardData)
    }
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      callbacks.onError?.(new Error('ABORTED_BY_USER'))
      return
    }
    log.error('[API] Streaming request failed: ' + String(error))
    const message = error instanceof Error ? error.message : 'Unknown error'
    callbacks.onError?.(error instanceof Error ? error : new Error(message))
  }
}

export const sendMessage = async (
  request: SendMessageRequest
): Promise<SendMessageResponse> => {
  try {
    const requestBody = buildChatCompletionBody(request, false)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`
    }
    if (request.task_id) {
      headers['X-Hermes-Session-Id'] = request.task_id
    }
    if (request.user_id) {
      headers['X-Hermes-User-Id'] = request.user_id
    }

    const response = await apiClient.post(
      '/v1/chat/completions',
      requestBody,
      { headers, baseURL: API_BASE }
    )

    const content = response.data?.choices?.[0]?.message?.content || response.data?.response || ''
    const cardData = normalizeCardData(response.data?.card_data)

    return {
      success: response.data?.success ?? true,
      message_id: response.data?.id || '',
      response: content,
      card_data: cardData,
    }
  } catch (error) {
    log.error('[API] Request failed: ' + String(error))
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const statusText = error.response?.statusText
      const errorData = error.response?.data
      log.error('[API] Error details: ' + JSON.stringify({ status, statusText, errorData }))
      const errorMessage = errorData?.error?.message || errorData?.error || error.message || 'Unknown error'
      throw new Error(`${status ? `HTTP ${status} ${statusText}: ` : ''}${errorMessage}`)
    }
    throw error
  }
}

/** 通知后端取消当前会话的流式处理 */
export const cancelChatSession = async (taskId: string): Promise<boolean> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`
    }
    headers['X-Hermes-Session-Id'] = taskId

    const response = await fetch(`${API_BASE}/v1/chat/cancel`, {
      method: 'POST',
      headers,
    })
    if (!response.ok) return false
    const data = await response.json()
    return data?.success || false
  } catch {
    return false
  }
}
