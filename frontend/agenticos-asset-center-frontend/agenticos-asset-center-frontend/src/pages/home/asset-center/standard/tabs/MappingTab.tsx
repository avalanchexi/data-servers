/**
 * 数据标准 — 落标映射页签
 * 标准 ↔ 物理字段映射（复用 DCG 图谱映射边），智能推荐落标：
 * 语义推荐引擎 + 标准库匹配产出候选，采纳即以 match_type=ai 落映射
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { AssetStandardApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface MappingRow {
  id: string
  standard_id: string
  standard_name?: string
  entity_id: string
  entity_name?: string
  status?: string
  confidence?: number
  created_at?: string
}

interface RecommendItem {
  standard_id: string
  code?: string
  name: string
  type?: string
  domain?: string
  score?: number
  reason?: string
}

const PAGE_SIZE = 10

export default function MappingTab() {
  const [rows, setRows] = useState<MappingRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ standard_id: '', entity_id: '' })
  const [saving, setSaving] = useState(false)

  // 智能推荐落标弹窗（推荐生成为只读，采纳为写操作）
  const [recModalOpen, setRecModalOpen] = useState(false)
  const [recForm, setRecForm] = useState({ entity_type: 'table', entity_id: '' })
  const [recTargetName, setRecTargetName] = useState<string | null>(null)
  const [recItems, setRecItems] = useState<RecommendItem[]>([])
  const [recMessage, setRecMessage] = useState<string | null>(null)
  const [recLoading, setRecLoading] = useState(false)
  const [adoptingId, setAdoptingId] = useState<string | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetStandardApi.listMappings({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as MappingRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载落标映射失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const save = async () => {
    if (!form.standard_id.trim() || !form.entity_id.trim()) return
    setSaving(true)
    try {
      await AssetStandardApi.createMapping(form as unknown as Record<string, unknown>)
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建映射失败')
    } finally {
      setSaving(false)
    }
  }

  // 智能推荐：语义推荐引擎 + 标准库匹配产出映射候选（只读）
  const fetchRecommend = async () => {
    if (!recForm.entity_id.trim()) return
    setRecLoading(true)
    setRecMessage(null)
    setRecItems([])
    setRecTargetName(null)
    try {
      const data = (await AssetStandardApi.recommendMapping({
        entity_type: recForm.entity_type,
        entity_id: recForm.entity_id.trim(),
        limit: 5,
      })) as unknown as {
        entity_name?: string | null
        recommendations?: RecommendItem[]
        message?: string | null
      }
      setRecTargetName(data.entity_name ?? null)
      setRecItems(data.recommendations ?? [])
      setRecMessage(data.message ?? null)
    } catch (e) {
      setRecMessage(e instanceof Error ? e.message : '推荐生成失败')
    } finally {
      setRecLoading(false)
    }
  }

  // 采纳候选：落 AssetStandardMapping（match_type=ai，写操作）
  const adopt = async (rec: RecommendItem) => {
    setAdoptingId(rec.standard_id)
    try {
      await AssetStandardApi.createMapping({
        entity_type: recForm.entity_type,
        entity_id: recForm.entity_id.trim(),
        standard_id: rec.standard_id,
        match_type: 'ai',
      })
      setRecItems((prev) => prev.filter((r) => r.standard_id !== rec.standard_id))
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '采纳落标失败')
    } finally {
      setAdoptingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          标准 ↔ 物理字段映射（同步 DCG 图谱映射边）；智能对标（AI 推荐）见治理 Agent
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setRecItems([])
              setRecMessage(null)
              setRecTargetName(null)
              setRecModalOpen(true)
            }}
            data-ro
          >
            <Sparkles size={14} className="mr-1" /> 智能推荐
          </Button>
          <Button onClick={() => { setForm({ standard_id: '', entity_id: '' }); setModalOpen(true) }} data-ro>
            <Plus size={14} className="mr-1" /> 新建映射
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无落标映射"
          description="将标准与 DCG 图谱中的物理字段建立映射（同步映射边），映射完成后参与落标率统计。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">标准</th>
                <th className="px-4 py-3 font-medium">物理字段（DCG 实体）</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">置信度</th>
                <th className="px-4 py-3 text-right font-medium">映射时间</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.standard_name ?? row.standard_id}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.entity_name ?? row.entity_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'confirmed' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-warning)',
                      }}
                    >
                      {row.status === 'confirmed' ? '已确认' : row.status === 'suggested' ? 'AI 建议' : row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.confidence != null ? `${(row.confidence * 100).toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
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

      {/* 新建映射弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新建落标映射">
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            标准 ID <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.standard_id} onChange={(e) => setForm({ ...form, standard_id: e.target.value })} placeholder="标准 ID" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            物理字段实体 ID <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} placeholder="DCG 图谱字段实体 ID" data-ro />
          </label>
          <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            映射创建后同步为 DCG 图谱映射边（AGE 只存关系事实），落标率统计以本表为准。
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.standard_id.trim() || !form.entity_id.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
      {/* 智能推荐落标弹窗（推荐只读，采纳为写操作） */}
      <Modal open={recModalOpen} onClose={() => setRecModalOpen(false)} title="智能推荐落标">
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              对象类型
              <Select value={recForm.entity_type} onValueChange={(v) => setRecForm({ ...recForm, entity_type: String(v) })} ro>
                <option value="table">数据表（table）</option>
                <option value="field">字段（field）</option>
              </Select>
            </label>
            <label className="block flex-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              对象 ID <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input
                value={recForm.entity_id}
                onChange={(e) => setRecForm({ ...recForm, entity_id: e.target.value })}
                placeholder="DCG 图谱实体 ID"
                data-ro
              />
            </label>
            <Button variant="ghost" onClick={fetchRecommend} disabled={recLoading || !recForm.entity_id.trim()} data-ro>
              {recLoading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />} 生成
            </Button>
          </div>

          {recTargetName && (
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              对象：{recTargetName}（{recForm.entity_type}）
            </p>
          )}
          {recMessage && !recLoading && (
            <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>{recMessage}</p>
          )}

          {!!recItems.length && (
            <div className="space-y-2">
              {recItems.map((rec) => (
                <div
                  key={rec.standard_id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {rec.name}
                      <span className="ml-2 font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{rec.code ?? rec.standard_id}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {[rec.type, rec.domain].filter(Boolean).join(' · ')}
                      {rec.score != null ? ` · 匹配度 ${(rec.score * 100).toFixed(0)}%` : ''}
                    </p>
                    {rec.reason && <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>{rec.reason}</p>}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => adopt(rec)}
                    disabled={adoptingId === rec.standard_id}
                  >
                    {adoptingId === rec.standard_id ? <Loader2 size={12} className="mr-1 animate-spin" /> : null} 采纳
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRecModalOpen(false)} data-ro>关闭</Button>
        </div>
      </Modal>
    </div>
  )
}
