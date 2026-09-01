/**
 * 数据安全 — 分类分级页签
 * 资源梳理→分类→分级→清单四步流程；LLM 预打标+人工确认，标签回流 DCG；
 * 分级对齐 JR/T 0197-2020 五级（L1-L5）
 */
import { useCallback, useEffect, useState } from 'react'
import { Bot, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { AssetSecurityApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'
import { ClassificationBadge } from '../../../../../components/asset'

interface ClassificationRow {
  id: string
  entity_type: string
  entity_id: string
  entity_name?: string
  category?: string
  level: string
  status: string
  llm_suggested?: boolean
  llm_confidence?: number
  confirmed_by?: string
}

interface AdoptionStat {
  llm_total?: number
  llm_confirmed?: number
  adoption_rate?: number
}

const PAGE_SIZE = 10
const LEVEL_LABELS: Record<string, string> = {
  L1: 'L1 公开',
  L2: 'L2 内部',
  L3: 'L3 秘密',
  L4: 'L4 机密',
  L5: 'L5 绝密',
}

export default function ClassificationTab() {
  const [rows, setRows] = useState<ClassificationRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [levelFilter, setLevelFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverage, setCoverage] = useState<Record<string, unknown> | null>(null)
  const [adoption, setAdoption] = useState<AdoptionStat | null>(null)

  // LLM 预打标弹窗
  const [preTagTarget, setPreTagTarget] = useState<ClassificationRow | null>(null)
  const [preTagging, setPreTagging] = useState(false)

  // 自动打标弹窗（AI 五级分级：LLM 不可用降级敏感词启发式）
  const [autoTagOpen, setAutoTagOpen] = useState(false)
  const [autoTagForm, setAutoTagForm] = useState({ entity_type: 'table', entity_id: '' })
  const [autoTagging, setAutoTagging] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetSecurityApi.listClassifications({
        level: levelFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as ClassificationRow[])
      setTotal(data.total ?? 0)
      setPage(p)
      setCoverage(await AssetSecurityApi.coverage())
      setAdoption((await AssetSecurityApi.aiAdoption()) as unknown as AdoptionStat)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载分类分级失败')
    } finally {
      setLoading(false)
    }
  }, [levelFilter])

  useEffect(() => { load(1) }, [load])

  const preTag = async (row: ClassificationRow) => {
    setPreTagTarget(row)
    setPreTagging(true)
    try {
      await AssetSecurityApi.preTag({ entity_type: row.entity_type, entity_id: row.entity_id })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'LLM 预打标失败')
    } finally {
      setPreTagging(false)
      setPreTagTarget(null)
    }
  }

  const confirm = async (row: ClassificationRow) => {
    try {
      await AssetSecurityApi.confirmClassification(row.id, { level: row.level })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '确认失败')
    }
  }

  // 自动打标：从检索宽表/资产条目直接生成 draft 分级记录（LLM 五级 + 启发式兜底）
  const autoTag = async () => {
    if (!autoTagForm.entity_id.trim()) return
    setAutoTagging(true)
    try {
      await AssetSecurityApi.autoTag({
        entity_type: autoTagForm.entity_type,
        entity_id: autoTagForm.entity_id.trim(),
      })
      setAutoTagOpen(false)
      setAutoTagForm({ entity_type: 'table', entity_id: '' })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '自动打标失败')
    } finally {
      setAutoTagging(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部级别（L1-L5）</option>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            覆盖率：{(coverage as { rate?: number })?.rate != null ? `${(((coverage as { rate?: number }).rate ?? 0) * 100).toFixed(1)}%` : '-'}
          </span>
          {adoption && (
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              AI 采纳率：{adoption.llm_total ? `${((adoption.adoption_rate ?? 0) * 100).toFixed(1)}% (${adoption.llm_confirmed ?? 0}/${adoption.llm_total})` : '-'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setAutoTagForm({ entity_type: 'table', entity_id: '' })
              setAutoTagOpen(true)
            }}
          >
            <Bot size={14} className="mr-1" /> 自动打标
          </Button>
          <Button variant="ghost" onClick={() => load(page)} data-ro>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['资源梳理', 'LLM 预打标', '人工确认', '分级清单'].map((step, idx) => (
          <span
            key={step}
            className="rounded-full px-3 py-1 text-xs"
            style={{
              backgroundColor: idx <= 1 ? 'var(--color-success-bg)' : idx === 2 ? 'var(--color-warning-bg)' : 'var(--color-card-elevated)',
              color: idx <= 1 ? 'var(--color-success)' : idx === 2 ? 'var(--color-warning)' : 'var(--color-text-tertiary)',
            }}
          >
            {idx + 1}. {step}
          </span>
        ))}
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无分类分级记录"
          description="元数据采集后执行 LLM 预打标（复用 llm_security classifier 敏感识别），人工确认后标签回流 DCG。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">对象</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">分级</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{row.entity_name ?? row.entity_id}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.entity_type}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.category ?? '-'}</td>
                  <td className="px-4 py-3"><ClassificationBadge level={row.level} /></td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'confirmed' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)',
                      }}
                    >
                      {row.status === 'confirmed' ? '已确认' : row.status === 'suggested' ? 'LLM 建议' : row.status}
                    </span>
                    {row.llm_confidence != null && (
                      <span className="ml-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {`${(row.llm_confidence * 100).toFixed(0)}%`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {row.status !== 'confirmed' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => preTag(row)} disabled={preTagging && preTagTarget?.id === row.id} data-ro>
                            <Sparkles size={13} className="mr-1" /> LLM 预打标
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => confirm(row)} data-ro>确认</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {/* LLM 预打标确认弹窗 */}
      <Modal open={!!preTagTarget} onClose={() => setPreTagTarget(null)} title="LLM 预打标">
        <p className="text-sm leading-6" style={{ color: 'var(--color-text-secondary)' }}>
          对「{preTagTarget?.entity_name ?? preTagTarget?.entity_id}」执行 LLM 敏感识别（复用 llm_security classifier）？
          输出分类与分级建议（L1-L5），人工确认后标签回流 DCG 图谱。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPreTagTarget(null)}>取消</Button>
          <Button onClick={() => preTagTarget && preTag(preTagTarget)} disabled={preTagging} data-ro>
            {preTagging ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />} 执行预打标
          </Button>
        </div>
      </Modal>

      {/* 自动打标弹窗（AI 五级分级，写操作） */}
      <Modal open={autoTagOpen} onClose={() => setAutoTagOpen(false)} title="自动分类分级">
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              对象类型
              <Select value={autoTagForm.entity_type} onValueChange={(v) => setAutoTagForm({ ...autoTagForm, entity_type: String(v) })} ro>
                <option value="table">数据表（table）</option>
                <option value="field">字段（field）</option>
                <option value="column">列（column）</option>
              </Select>
            </label>
            <label className="block flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              对象 ID <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input
                value={autoTagForm.entity_id}
                onChange={(e) => setAutoTagForm({ ...autoTagForm, entity_id: e.target.value })}
                placeholder="检索宽表 / 资产条目实体 ID"
                data-ro
              />
            </label>
          </div>
          <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            对对象执行 AI 五级分级（JR/T 0197-2020）：LLM 判定分级与分类，LLM 不可用时降级
            本地敏感词启发式；结果落 draft 待人工确认，确认后计入 AI 采纳率（L4 举证）。
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAutoTagOpen(false)} data-ro>取消</Button>
          <Button onClick={autoTag} disabled={autoTagging || !autoTagForm.entity_id.trim()}>
            {autoTagging ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Bot size={14} className="mr-1" />} 执行打标
          </Button>
        </div>
      </Modal>
    </div>
  )
}
