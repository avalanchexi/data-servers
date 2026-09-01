/**
 * 资产总览 — 治理中心页签（原问题大盘升级）
 * 五类治理项聚合：质量工单/安全待确认/高风险对象/未落标字段/生命周期待办
 * 分类筛选 + 严重度徽标 + 跳转处理入口（只读聚合，不建工单）
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Bug, ShieldAlert, AlertTriangle, Ruler, Archive, ArrowRight, Bot } from 'lucide-react'
import { AssetGovernanceApi } from '../../../../../api/asset'
import { Button, Drawer } from '../../../../../components/ui'
import GovernanceCopilotPanel from '../components/GovernanceCopilotPanel'

interface GovernanceItem {
  id: string
  category: string
  source_id: string
  title: string
  description?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  deduct_score: number
  status: string
  entity_type?: string
  entity_id?: string
  created_at?: string
}

interface GovernanceData {
  items?: GovernanceItem[]
  total?: number
  by_category?: Record<string, number>
  total_deduct?: number
  generated_at?: string
  computed_at?: string
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  quality_case: { label: '质量工单', icon: Bug, color: 'var(--color-error)' },
  security_draft: { label: '安全待确认', icon: ShieldAlert, color: 'var(--color-warning, #d97706)' },
  high_level: { label: '高风险对象', icon: AlertTriangle, color: 'var(--color-error)' },
  unmapped_field: { label: '未落标字段', icon: Ruler, color: 'var(--color-primary)' },
  lifecycle_todo: { label: '生命周期待办', icon: Archive, color: 'var(--color-info, #2563eb)' },
}

// 跳转处理入口（复用各模块菜单，deny-by-default 下只读跳转）
const CATEGORY_ROUTE: Record<string, string> = {
  quality_case: '/home/asset-quality',
  security_draft: '/home/asset-security',
  high_level: '/home/asset-security',
  unmapped_field: '/home/asset-standard',
  lifecycle_todo: '/home/asset-lifecycle',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--color-error)',
  high: 'var(--color-warning, #d97706)',
  medium: 'var(--color-primary)',
  low: 'var(--color-text-tertiary)',
}

export default function ProblemTab() {
  const navigate = useNavigate()
  const [data, setData] = useState<GovernanceData | null>(null)
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 治理Agent抽屉：行内「AI 治理」带入上下文问题
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotPrompt, setCopilotPrompt] = useState<string | undefined>(undefined)

  const openCopilot = (prompt?: string) => {
    setCopilotPrompt(prompt)
    setCopilotOpen(true)
  }

  const load = useCallback(async (cat?: string) => {
    setLoading(true)
    setError(null)
    try {
      const raw = (await AssetGovernanceApi.governanceItems(
        cat ? { category: cat, limit: 200 } : { limit: 200 },
      )) as GovernanceData
      setData(raw)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载治理中心失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(category) }, [load, category])

  const items = data?.items ?? []
  const byCategory = data?.by_category ?? {}

  const categoryChips = useMemo(
    () => [
      { key: '', label: '全部', count: data?.total ?? 0 },
      ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
        key,
        label: meta.label,
        count: byCategory[key] ?? 0,
      })),
    ],
    [data, byCategory],
  )

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
  }
  if (error) {
    return <p className="py-10 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error} <button onClick={() => load(category)} className="underline" data-ro>重试</button></p>
  }

  return (
    <div className="space-y-4">
      {/* 总扣分 + 分类筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        {categoryChips.map((chip) => {
          const active = category === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => setCategory(chip.key)}
              data-ro
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors"
              style={{
                borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: active ? 'var(--color-primary-light)' : 'var(--color-card)',
                color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {chip.label}
              <span className="font-semibold">{chip.count}</span>
            </button>
          )
        })}
        {data?.total_deduct != null && data.total_deduct > 0 && (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            累计健康扣分：<span className="font-semibold" style={{ color: 'var(--color-error)' }}>{data.total_deduct}</span>
          </span>
        )}
        {/* 治理Agent入口（只读打开抽屉，对话内写操作由面板自身权限控制） */}
        <Button size="sm" variant="ghost" onClick={() => openCopilot(undefined)} ro>
          <Bot size={14} /> 治理Agent
        </Button>
      </div>

      {/* 治理项列表 */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const meta = CATEGORY_META[item.category] ?? CATEGORY_META.quality_case
          const route = CATEGORY_ROUTE[item.category]
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
            >
              <meta.icon size={18} style={{ color: meta.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                  >
                    {meta.label}
                  </span>
                  <span className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {item.title}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {item.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-xs" style={{ color: SEVERITY_COLOR[item.severity] }}>
                    {SEVERITY_LABEL[item.severity] ?? item.severity} · 扣 {item.deduct_score}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.status}</p>
                </div>
                {route && (
                  <Button size="sm" variant="ghost" onClick={() => navigate(route)} ro>
                    去处理 <ArrowRight size={14} />
                  </Button>
                )}
                {/* 行内 AI 治理：带入该治理项上下文提问 */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openCopilot(
                    `帮我分析治理项「${item.title}」（${meta.label}，${item.severity}，扣 ${item.deduct_score} 分），给出处理建议${item.entity_type && item.entity_id ? `；对象：${item.entity_type}/${item.entity_id}` : ''}`,
                  )}
                  ro
                >
                  <Bot size={14} /> AI 治理
                </Button>
              </div>
            </div>
          )
        })}
        {!items.length && (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            暂无治理项（质量工单/安全分级/落标/生命周期均无待办）
          </p>
        )}
      </div>

      {(data?.computed_at || data?.generated_at) && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          聚合时间：{new Date((data.computed_at ?? data.generated_at) as string).toLocaleString()}
          {data?.computed_at ? '（缓存口径，写操作后自动刷新）' : ''}
        </p>
      )}

      {/* 治理Agent抽屉 */}
      <Drawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        title="治理Agent"
        width="440px"
      >
        <GovernanceCopilotPanel key={copilotPrompt ?? 'default'} initialPrompt={copilotPrompt} />
      </Drawer>
    </div>
  )
}
