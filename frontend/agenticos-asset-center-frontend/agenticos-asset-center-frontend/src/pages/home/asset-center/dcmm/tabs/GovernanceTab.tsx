/**
 * 治理评估 — 数据治理域页签
 * 治理组织台账（委员会/理事会/数据管家/CDO）+ 治理概览（战略规划/治理组织/
 * 制度建设/数据文化四类覆盖率，DCMM 2.0 数据治理域 L4 举证）。
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, Pencil, Network, Bot } from 'lucide-react'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, Drawer, EmptyState, Input, Modal, Pagination, Select, Textarea } from '../../../../../components/ui'
import GovernanceCopilotPanel from '../../overview/components/GovernanceCopilotPanel'

interface OrgRow {
  id: string
  name: string
  org_type?: string // committee | council | steward | cdo
  member_ids?: string[] | null
  responsibility?: string | null
  status?: string // active | inactive
  updated_at?: string
}

interface GovernanceOverview {
  strategy?: {
    total_objectives?: number
    executing_or_evaluated?: number
    institutions?: number
    enabled_indicators?: number
  }
  governance?: {
    total_orgs?: number
    active_orgs?: number
    culture_institutions?: number
    enabled_indicators?: number
  }
  generated_at?: string
}

const PAGE_SIZE = 10
const ORG_TYPE_LABELS: Record<string, string> = {
  committee: '数据治理委员会',
  council: '数据治理理事会',
  steward: '数据管家网络',
  cdo: '首席数据官 CDO',
}
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '运转中', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  inactive: { label: '已停用', color: 'var(--color-text-tertiary)', bg: 'var(--color-bg)' },
}

const EMPTY_FORM = { name: '', org_type: 'committee', member_ids: '', responsibility: '', status: 'active' }

export default function GovernanceTab() {
  const [overview, setOverview] = useState<GovernanceOverview | null>(null)
  const [rows, setRows] = useState<OrgRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<OrgRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  // 治理Agent抽屉（DCMM 对标咨询入口）
  const [copilotOpen, setCopilotOpen] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const [listData, overviewData] = await Promise.all([
        AssetDcmmApi.listGovernanceOrgs({
          org_type: typeFilter || undefined,
          limit: PAGE_SIZE,
          offset: (p - 1) * PAGE_SIZE,
        }),
        AssetDcmmApi.governanceOverview(),
      ])
      setRows((listData.items ?? []) as unknown as OrgRow[])
      setTotal(listData.total ?? 0)
      setPage(p)
      setOverview(overviewData as unknown as GovernanceOverview)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载治理台账失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { load(1) }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (row: OrgRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      org_type: row.org_type ?? 'committee',
      member_ids: (row.member_ids ?? []).join(', '),
      responsibility: row.responsibility ?? '',
      status: row.status ?? 'active',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        org_type: form.org_type,
        member_ids: form.member_ids.trim()
          ? form.member_ids.split(/[,，]/).map((m) => m.trim()).filter(Boolean)
          : null,
        responsibility: form.responsibility.trim() || null,
        status: form.status,
      }
      if (editing) {
        await AssetDcmmApi.updateGovernanceOrg(editing.id, payload)
      } else {
        await AssetDcmmApi.createGovernanceOrg(payload)
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: OrgRow) => {
    try {
      await AssetDcmmApi.deleteGovernanceOrg(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  // ── 治理概览四类覆盖率卡片 ──
  const coverageCards = [
    {
      title: '战略规划',
      value: overview?.strategy?.total_objectives ?? 0,
      sub: `实施/评估中 ${overview?.strategy?.executing_or_evaluated ?? 0}`,
      extra: `战略制度 ${overview?.strategy?.institutions ?? 0} · 启用指标 ${overview?.strategy?.enabled_indicators ?? 0}`,
    },
    {
      title: '治理组织',
      value: overview?.governance?.total_orgs ?? 0,
      sub: `运转中 ${overview?.governance?.active_orgs ?? 0}`,
      extra: `启用指标 ${overview?.governance?.enabled_indicators ?? 0}`,
    },
    {
      title: '制度建设',
      value: overview?.strategy?.institutions ?? 0,
      sub: '战略规划/实施/评估制度',
      extra: '归档于制度库（战略类分类）',
    },
    {
      title: '数据文化',
      value: overview?.governance?.culture_institutions ?? 0,
      sub: '文化制度/培训/宣传',
      extra: '归档于制度库（数据文化分类）',
    },
  ]

  return (
    <div className="space-y-4">
      {/* 治理概览 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {coverageCards.map((card) => (
          <div key={card.title} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <Network size={13} /> {card.title}
            </div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{card.value}</div>
            <div className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{card.sub}</div>
            <div className="mt-1 truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }} title={card.extra}>{card.extra}</div>
          </div>
        ))}
      </div>
      {overview?.generated_at && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          概览计算时间：{new Date(overview.generated_at).toLocaleString()}
        </p>
      )}

      {/* 治理组织台账 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部组织类型</option>
            {Object.entries(ORG_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)} ro>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          {/* 治理Agent入口（只读打开抽屉） */}
          <Button variant="ghost" onClick={() => setCopilotOpen(true)} ro>
            <Bot size={14} className="mr-1" /> 治理Agent
          </Button>
          <Button onClick={openCreate}>
            <Plus size={14} className="mr-1" /> 新建治理组织
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="database"
          title="暂无治理组织"
          description="登记数据治理委员会/理事会/数据管家/CDO 等治理组织，对齐 DCMM 2.0 数据治理域 L4 举证。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">组织名称</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">成员</th>
                <th className="px-4 py-3 font-medium">职责</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = STATUS_LABELS[row.status ?? ''] ?? STATUS_LABELS.active
                return (
                  <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {ORG_TYPE_LABELS[row.org_type ?? ''] ?? row.org_type ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {row.member_ids?.length ? `${row.member_ids.length} 人` : '-'}
                    </td>
                    <td className="px-4 py-3 max-w-[280px] truncate text-xs" style={{ color: 'var(--color-text-secondary)' }} title={row.responsibility ?? ''}>
                      {row.responsibility ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)} title="编辑">
                          <Pencil size={13} style={{ color: 'var(--color-primary)' }} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(row)} title="删除">
                          <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {/* 治理组织登记/编辑表单 */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? '编辑治理组织' : '新建治理组织'} size="lg">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>组织名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：数据治理委员会" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>组织类型</label>
              <Select value={form.org_type} onValueChange={(v) => setForm({ ...form, org_type: Array.isArray(v) ? String(v[0]) : String(v) })}>
                {Object.entries(ORG_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>状态</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: Array.isArray(v) ? String(v[0]) : String(v) })}>
                {Object.entries(STATUS_LABELS).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>成员 ID（逗号分隔）</label>
            <Input value={form.member_ids} onChange={(e) => setForm({ ...form, member_ids: e.target.value })} placeholder="如：u_001, u_002" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>职责说明</label>
            <Textarea value={form.responsibility} onChange={(e) => setForm({ ...form, responsibility: e.target.value })} rows={3} placeholder="组织职责范围与问责机制说明" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)} ro>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 治理Agent抽屉 */}
      <Drawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        title="治理Agent"
        width="440px"
      >
        <GovernanceCopilotPanel initialPrompt="帮我分析 DCMM 数据治理域现状与 L4 差距" />
      </Drawer>
    </div>
  )
}
