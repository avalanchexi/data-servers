/**
 * 数据标准 — 标准集页签
 * 五类标准：业务术语（引用 ontology）/数据元/主数据/参考数据/指标数据（引用 semantic_layer metric_registry）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { AssetStandardApi } from '../../../../../api/asset'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'
import { ApprovalFlowSteps } from '../../../../../components/asset'

interface StandardRow {
  id: string
  code: string
  name: string
  type: string
  version?: string
  status: string
  owner_name?: string
  description?: string
}

const PAGE_SIZE = 10
const TYPE_LABELS: Record<string, string> = {
  biz_term: '业务术语',
  data_element: '数据元',
  master_data: '主数据',
  ref_data: '参考数据',
  metric: '指标数据',
  layer_spec: '分层规范',
}

export default function StandardSetTab() {
  const [rows, setRows] = useState<StandardRow[]>([])
  const [deleting, setDeleting] = useState<StandardRow | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StandardRow | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'data_element', version: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetStandardApi.listStandards({
        type: typeFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as StandardRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载标准集失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { load(1) }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', name: '', type: 'data_element', version: '1.0', description: '' })
    setModalOpen(true)
  }

  const openEdit = (row: StandardRow) => {
    setEditing(row)
    setForm({ code: row.code, name: row.name, type: row.type, version: row.version ?? '', description: row.description ?? '' })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await AssetStandardApi.updateStandard(editing.id, form as unknown as Record<string, unknown>)
      } else {
        await AssetStandardApi.createStandard(form as unknown as Record<string, unknown>)
      }
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const approve = async (row: StandardRow, approved: boolean) => {
    try {
      const approver = useAuthStore.getState().user?.username ?? 'unknown'
      await AssetStandardApi.approveStandard(row.id, { approved, approver })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '审批操作失败')
    }
  }

  const remove = (row: StandardRow) => {
    setDeleting(row)
  }

  const doDelete = async () => {
    if (!deleting) return
    try {
      await AssetStandardApi.deleteStandard(deleting.id)
      setDeleting(null)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部类别</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
        <Button onClick={openCreate} data-ro>
          <Plus size={14} className="mr-1" /> 新建标准
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无标准"
          description="五类标准：业务术语（引用本体）、数据元、主数据、参考数据、指标数据（引用语义层指标注册，不复制）。"
          action={<Button onClick={openCreate} data-ro><Plus size={14} className="mr-1" /> 新建标准</Button>}
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">标准编码</th>
                <th className="px-4 py-3 font-medium">标准名称</th>
                <th className="px-4 py-3 font-medium">类别</th>
                <th className="px-4 py-3 font-medium">版本</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.code}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{TYPE_LABELS[row.type] ?? row.type}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>v{row.version ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'published' ? 'var(--color-success-bg)' : row.status === 'pending' ? 'var(--color-warning-bg)' : 'var(--color-card-elevated)',
                        color: row.status === 'published' ? 'var(--color-success)' : row.status === 'pending' ? 'var(--color-warning)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {row.status === 'published' ? '已发布' : row.status === 'pending' ? '待审批' : row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {row.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => approve(row, true)} data-ro>批准</Button>
                          <Button size="sm" variant="ghost" onClick={() => approve(row, false)} data-ro>驳回</Button>
                        </>
                      )}
                      {row.status === 'published' && (
                        <Button size="sm" variant="ghost" onClick={() => AssetStandardApi.changeStandardStatus(row.id, { target: 'draft' }).then(() => load(page))} data-ro>下线</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(row)} data-ro>编辑</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(row)} title="删除" data-ro>
                        <Trash2 size={13} />
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

      {/* 新建/编辑弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑标准' : '新建标准'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              标准编码 <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如 STD-CUST-001" data-ro />
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              类别
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: Array.isArray(v) ? String(v[0]) : String(v) })} ro>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            标准名称 <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：客户统一编号" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            版本
            <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            描述
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              placeholder="标准口径定义"
              data-ro
            />
          </label>
          {!editing && (
            <ApprovalFlowSteps steps={[
              { label: '新建草稿', state: 'done' },
              { label: '发布审批', state: 'active' },
              { label: '生效', state: 'pending' },
            ]} />
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim() || !form.code.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 删除标准确认 */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除标准"
        message={`确认删除标准「${deleting?.name ?? ''}」？`}
        type="danger"
        confirmText="删除"
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
