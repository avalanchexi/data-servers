/**
 * 数据服务 — 外部数据台账页签
 * 外部数据采购/共享/使用登记（DCMM 数据应用流通域能力项）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AssetServiceApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface ExternalDataRow {
  id: string
  name: string
  provider?: string
  data_type?: string
  usage_scene?: string
  contract?: Record<string, unknown>
  owner_name?: string
  status: string
  created_at?: string
}

const PAGE_SIZE = 10
const TYPE_LABELS: Record<string, string> = {
  api: 'API 数据',
  file: '文件数据',
  stream: '流数据',
  other: '其他',
}
const STATUS_LABELS: Record<string, string> = {
  active: '使用中',
  expired: '已到期',
  inactive: '停用',
}

export default function ExternalDataTab() {
  const [rows, setRows] = useState<ExternalDataRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExternalDataRow | null>(null)
  const [form, setForm] = useState({ name: '', provider: '', data_type: 'api', usage_scene: '', owner_name: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetServiceApi.listExternalData({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as ExternalDataRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载外部数据台账失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', provider: '', data_type: 'api', usage_scene: '', owner_name: '' })
    setShowForm(true)
  }

  const openEdit = (row: ExternalDataRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      provider: row.provider ?? '',
      data_type: row.data_type ?? 'other',
      usage_scene: row.usage_scene ?? '',
      owner_name: row.owner_name ?? '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        provider: form.provider || undefined,
        data_type: form.data_type,
        usage_scene: form.usage_scene || undefined,
        owner_name: form.owner_name || undefined,
      }
      if (editing) {
        await AssetServiceApi.updateExternalData(editing.id, payload)
      } else {
        await AssetServiceApi.createExternalData(payload)
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: ExternalDataRow) => {
    try {
      await AssetServiceApi.deleteExternalData(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部状态</option>
            <option value="active">使用中</option>
            <option value="expired">已到期</option>
            <option value="inactive">停用</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={openCreate} data-ro>
            <Plus size={14} className="mr-1" /> 登记数据
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="database"
          title="暂无外部数据登记"
          description="外部数据采购/共享/使用登记（DCMM 数据应用流通域能力项）。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">数据名称</th>
                <th className="px-4 py-3 font-medium">提供方</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">使用场景</th>
                <th className="px-4 py-3 font-medium">责任人</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.provider ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{TYPE_LABELS[row.data_type ?? ''] ?? row.data_type ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.usage_scene ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.owner_name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'active' ? 'var(--color-success-bg)' : row.status === 'expired' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'active' ? 'var(--color-success)' : row.status === 'expired' ? 'var(--color-error)' : 'var(--color-warning)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(row)} data-ro>编辑</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(row)} data-ro>
                        <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                      </Button>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? '编辑外部数据' : '登记外部数据'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>数据名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：工商企业信息 API" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>提供方</label>
            <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="供应商名称" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>数据类型</label>
            <Select value={form.data_type} onValueChange={(v) => setForm({ ...form, data_type: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="api">API 数据</option>
              <option value="file">文件数据</option>
              <option value="stream">流数据</option>
              <option value="other">其他</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>使用场景</label>
            <Input value={form.usage_scene} onChange={(e) => setForm({ ...form, usage_scene: e.target.value })} placeholder="如：客户主数据补充" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>责任人</label>
            <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="责任人姓名" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
