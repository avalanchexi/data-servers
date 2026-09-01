/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import {
  Check, ChevronDown, ChevronUp, ClipboardList, Gauge, Loader2, ScanSearch,
  Send, ShieldCheck, Sparkles, X,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  GovernanceAgentApi,
  type GovernanceApplyResult,
  type GovernanceChatMessage,
  type GovernancePatch,
  type GovernanceProposal,
  type GovernanceScanResult,
  type GovernanceThinkingEvent,
} from '../../../../../api/governance-agent'
import { extractApiErrorMessage } from '../../../../../api/core'
import { Message } from '../../../../../components/ui'

interface GovernanceCopilotPanelProps {
  /** 打开面板时预置的首条问题（如治理项行内「AI 治理」带入的上下文） */
  initialPrompt?: string
}

/** patch op 的中文标签（提案卡片标题） */
const PATCH_LABELS: Record<string, string> = {
  metadata_update: '元数据补全',
  standard_map: '落标映射',
  quality_rule_create: '新建质量规则',
  classification_confirm: '分级确认',
  lifecycle_action: '生命周期策略',
  tag_batch: '批量预打标',
  ownership_update: '权属登记',
  scan_rule_create: '创建扫描规则',
}

/** 快捷指令 chips：文本关键词与后端技能路由（governance_agent_skills.py）对齐 */
const QUICK_PROMPTS = [
  { label: '治理诊断', text: '帮我诊断当前有哪些治理问题' },
  { label: '健康度', text: '查看当前治理健康度' },
  { label: '落标率', text: '盘点未落标字段并给出补全建议' },
  { label: '安全分级', text: '查看待确认的安全分级草稿' },
  { label: '创建扫描', text: '帮我创建一条周期性治理扫描规则' },
]

/** 空态场景卡基础库（点击直接发送示例问题） */
const STARTER_SCENES = [
  {
    icon: ScanSearch,
    title: '治理诊断',
    desc: '聚合五类治理项，逐类解释问题根因与修复优先级',
    text: '帮我诊断当前有哪些治理问题',
  },
  {
    icon: Gauge,
    title: '健康度分析',
    desc: '五健康度 + 治理项扣分，指出拖累健康度的主要因素',
    text: '查看当前治理健康度并分析扣分来源',
  },
  {
    icon: ClipboardList,
    title: '盘点补全',
    desc: '未落标字段 / 待认领对象盘点，给出补全建议',
    text: '盘点未落标字段并给出补全建议',
  },
  {
    icon: ShieldCheck,
    title: '安全分级',
    desc: '查看分级草稿待确认项，支持批量预打标',
    text: '查看待确认的安全分级草稿',
  },
]

/** 简短的思考步骤描述 */
function thinkingLabel(step: GovernanceThinkingEvent): string {
  if (step.action === 'tool') return `查询 ${step.tool || ''}`
  if (step.action === 'tool_result') return `${step.tool || ''} ${step.success ? '完成' : '失败'}`
  if (step.action === 'apply_patch') return `应用 ${step.op || ''} ${step.target ?? ''}`
  if (step.action === 'scan_engine') return '规则引擎扫描中'
  if (step.action === 'scan_ai_filter') return 'AI 二次过滤降误报'
  if (step.action === 'scan_auto_fix') return '执行自动修复（预打标）'
  if (step.action === 'scan_done') return '扫描完成'
  if (step.action === 'proposal') return '生成提案'
  if (step.action === 'task') return '生成任务卡片'
  if (step.action === 'answer') return '组织回答'
  return String(step.action || '思考中')
}

/** 提案等价比较：intent 相同且 patches 的 op/target/payload 全等 */
function sortKeys(v: any): any {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])]))
  }
  return v
}

function sameProposal(a: GovernanceProposal, b: GovernanceProposal): boolean {
  const norm = (p: GovernanceProposal) => JSON.stringify(sortKeys(
    p.patches.map(x => ({ op: x.op, target: x.target, payload: x.payload ?? null })),
  ))
  return a.intent === b.intent && norm(a) === norm(b)
}

/** 单个 patch 卡片：op 标签 + payload 折叠展示（治理 patch 无 before/after diff 语义） */
function PatchCard({ patch, checked, onToggle }: {
  patch: GovernancePatch
  checked: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="w-3.5 h-3.5 cursor-pointer"
          style={{ accentColor: 'var(--color-primary)' }}
        />
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs font-medium hover:opacity-70" data-ro
          style={{ color: 'var(--color-text)' }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
            backgroundColor: 'rgba(37,99,235,.1)',
            color: '#2563eb',
          }}>{PATCH_LABELS[patch.op] || patch.op}</span>
          {patch.target !== undefined && patch.target !== '' && (
            <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{String(patch.target)}</span>
          )}
        </button>
      </div>
      {expanded && (
        <pre className="mt-2 overflow-x-auto rounded-lg p-2 text-[11px] font-mono whitespace-pre-wrap break-all"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
          {JSON.stringify(patch.payload ?? {}, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default function GovernanceCopilotPanel({ initialPrompt }: GovernanceCopilotPanelProps) {
  const [messages, setMessages] = useState<GovernanceChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [thinking, setThinking] = useState<GovernanceThinkingEvent[]>([])
  const [showThinking, setShowThinking] = useState(false)
  const [proposal, setProposal] = useState<GovernanceProposal | null>(null)
  const [checked, setChecked] = useState<boolean[]>([])
  const [applying, setApplying] = useState(false)
  const [report, setReport] = useState<GovernanceApplyResult | null>(null)
  // task 动作卡片：scan_run（写操作由用户确认后执行）
  const [taskCard, setTaskCard] = useState<{ task: 'scan_run'; rule_id: string; rationale: string } | null>(null)
  const [taskRunning, setTaskRunning] = useState(false)
  const [scanReport, setScanReport] = useState<GovernanceScanResult | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // 最近已应用/已拒绝的提案：拦截 LLM 被上文提案消息诱导重复生成的相同提案
  const lastProposalRef = useRef<{ proposal: GovernanceProposal; status: 'applied' | 'rejected' } | null>(null)
  // initialPrompt 只消费一次（行内「AI 治理」带入上下文）
  const initialConsumedRef = useRef(false)

  // 组件卸载时中止进行中的流式请求
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // 挂载时恢复服务端已保存的对话历史（最多 10 轮）
  useEffect(() => {
    setMessages([])
    setThinking([])
    setProposal(null)
    setReport(null)
    setTaskCard(null)
    setScanReport(null)
    GovernanceAgentApi.getHistory()
      .then(hist => {
        if (Array.isArray(hist) && hist.length > 0) {
          // 加载期间用户已发消息则保留本地（函数式更新兜底竞态）
          setMessages(prev => (prev.length > 0 ? prev : hist))
        }
      })
      .catch(() => { /* 历史加载失败静默降级为空对话 */ })
  }, [])

  // 打开时带入的上下文问题：历史加载完成后自动发送
  useEffect(() => {
    if (!initialPrompt || initialConsumedRef.current) return
    initialConsumedRef.current = true
    // 延迟至历史恢复完成（getHistory 的 then 之后）再发送
    const timer = setTimeout(() => handleSend(initialPrompt), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt])

  const appendMessage = (msg: GovernanceChatMessage) => {
    setMessages(prev => [...prev, msg])
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  const handleSend = async (preset?: string) => {
    const text = (preset ?? input).trim()
    if (!text || busy) return
    setInput('')
    setThinking([])
    setProposal(null)
    setReport(null)
    setTaskCard(null)
    setScanReport(null)
    setBusy(true)
    appendMessage({ role: 'user', content: text })

    const controller = await GovernanceAgentApi.chat(
      { history: messages, message: text },
      {
        onThinking: (data) => {
          if (abortRef.current === controller) setThinking(prev => [...prev, data])
        },
        onProposal: () => { /* 提案在 done 事件统一处理，此回调仅作标记 */ },
        onDone: (result) => {
          // 过期轮次（已取消或被新对话替代）丢弃，避免状态错乱
          if (abortRef.current !== controller) return
          if (result.kind === 'proposal') {
            // 与最近已应用/已拒绝提案相同时拦截（对齐语义Agent防重复提案策略）
            const last = lastProposalRef.current
            if (last && sameProposal(last.proposal, result.proposal)) {
              appendMessage({
                role: 'assistant',
                content: last.status === 'applied'
                  ? '该提案与刚才已应用的提案相同，治理操作已生效。如需进一步调整请说明具体变更。'
                  : '该提案与此前已拒绝的提案相同，未做修改。如确实需要请说明理由。',
              })
              setBusy(false)
              return
            }
            setProposal(result.proposal)
            setChecked(result.proposal.patches.map(() => true))
            appendMessage({ role: 'assistant', content: `已生成治理提案：**${result.proposal.intent}**` })
          } else if (result.kind === 'task') {
            setTaskCard({ task: result.task, rule_id: result.rule_id, rationale: result.rationale })
            appendMessage({ role: 'assistant', content: `已生成扫描任务卡片：**规则 ${result.rule_id}**` })
          } else if (result.text) {
            appendMessage({ role: 'assistant', content: result.text })
          }
          setBusy(false)
        },
        onError: (error) => {
          if (abortRef.current !== controller) return
          appendMessage({ role: 'assistant', content: `对话出错：${error}` })
          setBusy(false)
        },
      },
    )
    abortRef.current = controller
  }

  const handleApply = async () => {
    if (!proposal || applying) return
    const selected = proposal.patches.filter((_, i) => checked[i])
    if (selected.length === 0) {
      Message.warning('请至少勾选一项操作')
      return
    }
    setApplying(true)
    try {
      const result = await GovernanceAgentApi.apply({ ...proposal, patches: selected })
      setReport(result)
      setProposal(null)
      // 记录结论：拦截下一轮被上下文诱导的重复提案
      lastProposalRef.current = { proposal, status: 'applied' }
      const failed = result.applied.filter(a => !a.success)
      appendMessage({
        role: 'assistant',
        content: failed.length === 0
          ? `已应用治理提案「${proposal.intent}」，全部成功`
          : `已应用治理提案「${proposal.intent}」，${failed.length} 项失败`,
      })
      if (result.success) {
        Message.success('治理提案已全部应用')
      } else {
        Message.warning({ message: '部分操作失败，详情见应用报告', duration: 0, showClose: true })
      }
    } catch (err: any) {
      Message.error({ message: extractApiErrorMessage(err, '应用提案失败'), duration: 0, showClose: true })
    } finally {
      setApplying(false)
    }
  }

  const handleReject = () => {
    appendMessage({ role: 'assistant', content: '已拒绝提案，未做任何修改。' })
    if (proposal) {
      // 记录结论：拦截下一轮被上下文诱导的重复提案
      lastProposalRef.current = { proposal, status: 'rejected' }
      // 同步服务端历史（写操作）；失败静默：下次对话整段覆盖
      GovernanceAgentApi.appendHistoryNote('已拒绝提案，未做任何修改。').catch(() => {})
    }
    setProposal(null)
    setChecked([])
  }

  /** 执行扫描任务：SSE 流式 + 完成后展示扫描报告 */
  const runScanTask = async () => {
    if (!taskCard || taskRunning) return
    setTaskRunning(true)
    setScanReport(null)
    const controller = await GovernanceAgentApi.runScan(taskCard.rule_id, {
      onThinking: (data) => setThinking(prev => [...prev, data]),
      onDone: (result) => {
        if (abortRef.current !== controller) return
        setTaskRunning(false)
        setScanReport(result)
        setTaskCard(null)
        const fixed = result.auto_fixed?.length ?? 0
        appendMessage({
          role: 'assistant',
          content: `扫描完成：命中 ${result.hit_count} 项治理问题` +
            (fixed > 0 ? `，自动预打标 ${fixed} 项（待人工确认）` : ''),
        })
        Message.success(`扫描完成（命中 ${result.hit_count} 项）`)
      },
      onError: (error) => {
        if (abortRef.current !== controller) return
        setTaskRunning(false)
        Message.error({ message: extractApiErrorMessage(new Error(error), '扫描执行失败'), duration: 0, showClose: true })
      },
    })
    abortRef.current = controller
  }

  const handleClear = () => {
    if (busy) return
    setMessages([])
    setThinking([])
    setProposal(null)
    setReport(null)
    setTaskCard(null)
    setScanReport(null)
    lastProposalRef.current = null
    // 同步清理服务端历史记录（写操作）；失败提示，避免重开面板历史复现
    GovernanceAgentApi.clearHistory().catch(() => {
      Message.warning('历史记录清理失败，请重试')
    })
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* ── 头部 ── */}
      <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <span className="text-xs flex-1" style={{ color: 'var(--color-text-tertiary)' }}>
          诊断治理问题、对标 DCMM 标准、推进落标与分级；所有写操作先出提案，确认后应用
        </span>
        {messages.length > 0 && (
          /* 写操作按钮（清理服务端历史）：不加 data-ro，只读态被全局拦截 */
          <button onClick={handleClear} disabled={busy} className="flex items-center gap-1 text-xs hover:opacity-70 disabled:opacity-50"
            style={{ color: 'var(--color-text-tertiary)' }}>
            <X size={12} /> 清空对话
          </button>
        )}
      </div>

      {/* ── 消息流 ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !busy && (
          <div className="h-full flex flex-col items-center justify-center gap-4 px-2 overflow-auto">
            <div className="flex flex-col items-center gap-2">
              <Sparkles size={28} style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                你好，我是治理Agent
              </p>
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                通过对话完成治理诊断、标准落标、安全分级与扫描规则管理
                <br />
                所有治理操作先出提案，确认后才会应用
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              {STARTER_SCENES.map(scene => (
                <button
                  key={scene.title}
                  onClick={() => handleSend(scene.text)}
                  disabled={busy}
                  className="w-full flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
                  data-ro
                >
                  <scene.icon size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <span className="min-w-0 flex-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{scene.title}</span>
                    <span className="block text-[11px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>{scene.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              也可以直接描述需求，如「帮我诊断治理问题」或「盘点未落标字段」
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm ${msg.role === 'user' ? '' : 'border'}`}
              style={msg.role === 'user'
                ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}>
              {msg.role === 'user'
                ? <span className="whitespace-pre-wrap break-all">{msg.content}</span>
                : (
                  <div className="markdown-body text-[13px] leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
            </div>
          </div>
        ))}

        {/* 思考过程（对话中） */}
        {busy && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl border px-3.5 py-2.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <button onClick={() => setShowThinking(!showThinking)} className="flex items-center gap-1.5 text-xs hover:opacity-70" data-ro
                style={{ color: 'var(--color-text-secondary)' }}>
                <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                正在思考（第 {thinking.length} 步）...
                {showThinking ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showThinking && thinking.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                  {thinking.map((step, i) => (
                    <li key={i}>· {thinkingLabel(step)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* task 动作卡片（扫描规则执行） */}
        {taskCard && (
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-card)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                任务：执行扫描规则
              </div>
              {taskCard.rationale && (
                <div className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{taskCard.rationale}</div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1" />
              {/* 写操作按钮：不加 data-ro，只读态下被全局拦截 */}
              <button
                onClick={() => setTaskCard(null)}
                disabled={taskRunning}
                className="px-3 py-1.5 rounded-lg text-sm border transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={runScanTask}
                disabled={taskRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {taskRunning ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {taskRunning ? '执行中...' : '执行'}
              </button>
            </div>
          </div>
        )}

        {/* 提案确认卡片 */}
        {proposal && (
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-card)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>治理提案</div>
              <div className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {proposal.rationale || proposal.intent}
              </div>
            </div>
            <div className="space-y-2">
              {proposal.patches.map((patch, i) => (
                <PatchCard
                  key={i}
                  patch={patch}
                  checked={!!checked[i]}
                  onToggle={() => setChecked(prev => prev.map((v, j) => (j === i ? !v : v)))}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                共 {proposal.patches.length} 项操作，已勾选 {checked.filter(Boolean).length} 项
              </span>
              <div className="flex-1" />
              {/* 写操作按钮：不加 data-ro，只读态下被全局拦截 */}
              <button
                onClick={handleReject}
                disabled={applying}
                className="px-3 py-1.5 rounded-lg text-sm border transition-opacity hover:opacity-80 disabled:opacity-60"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                拒绝
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {applying ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {applying ? '应用中...' : '确认应用'}
              </button>
            </div>
          </div>
        )}

        {/* 应用报告 */}
        {report && (
          <div className="rounded-xl border p-4 space-y-2" style={{
            borderColor: report.success ? '#22c55e' : '#ef4444',
            backgroundColor: 'var(--color-card)',
          }}>
            <div className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: report.success ? '#22c55e' : '#ef4444' }}>
              {report.success ? <Check size={14} /> : <X size={14} />}
              {report.success ? '应用成功' : '部分操作失败'}
            </div>
            <ul className="text-xs space-y-1 font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              {report.applied.map((a, i) => (
                <li key={i}>
                  · {PATCH_LABELS[a.op] || a.op} {a.target ?? ''} {a.success ? '成功' : `失败：${a.error}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 扫描报告 */}
        {scanReport && (
          <div className="rounded-xl border p-4 space-y-2" style={{
            borderColor: '#2563eb',
            backgroundColor: 'var(--color-card)',
          }}>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#2563eb' }}>
              <ScanSearch size={14} />
              扫描报告：{scanReport.category}
            </div>
            <div className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              <div>候选 {scanReport.last_result?.candidate_count ?? 0} 项，命中 {scanReport.hit_count} 项</div>
              {scanReport.auto_fixed.length > 0 && (
                <div>自动预打标 {scanReport.auto_fixed.length} 项（draft 待人工确认）</div>
              )}
            </div>
            {scanReport.hits.length > 0 && (
              <ul className="text-xs space-y-1 max-h-40 overflow-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                {scanReport.hits.map((h, i) => (
                  <li key={i}>· [{h.severity ?? '?'}] {h.title ?? h.id}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── 输入区 ── */}
      <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        {/* 快捷指令 chips：点击填入输入框并聚焦（只读操作，加 data-ro） */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q.label}
              onClick={() => {
                setInput(q.text)
                inputRef.current?.focus()
              }}
              disabled={busy}
              className="px-2.5 py-0.5 rounded-full border text-[11px] transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' }}
              data-ro
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="描述你的需求，如：帮我诊断治理问题 / 盘点未落标字段 / 创建一条扫描规则"
            rows={2}
            className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-xs"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
            data-ro
          />
          <button
            onClick={() => handleSend()}
            disabled={busy || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            data-ro
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
