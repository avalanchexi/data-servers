/**
 * 数据标准 — 标准代码页签
 * 枚举值域（标准代码表）：码值/名称/排序
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AssetStandardApi } from '../../../../../api/asset'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination } from '../../../../../components/ui'

interface CodeRow {
  id: string
  standard_id: string
  standard_name?: string
  code: string
  name: string
  sort_order?: number
}

const PAGE_SIZE = 10

export default function StandardCodeTab() {
  const [rows, setRows] = useState<CodeRow[]>([])
  const [deleting, setDeleting] = useState<CodeRow | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CodeRow | null>(null)
  const [form, setForm] = useState({ standard_id: '', code: '', name: '', sort_order: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetStandardApi.listCodes({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as CodeRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载标准代码失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        standard_id: form.standard_id,
        code: form.code,
        name: form.name,
      }
      if (form.sort_order.trim()) payload.sort_order = Number(form.sort_order)
      if (editing) {
        await AssetStandardApi.updateCode(editing.id, payload)
      } else {
        await AssetStandardApi.createCode(payload)
      }
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = (row: CodeRow) => {
    setDeleting(row)
  }

  const doDelete = async () => {
    if (!deleting) return
    try {
      await AssetStandardApi.deleteCode(deleting.id)
      setDeleting(null)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          枚举值域：标准代码表（码值/名称/排序），供落标映射与质量规则引用
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => { setEditing(null); setForm({ standard_id: '', code: '', name: '', sort_order: '' }); setModalOpen(true) }} data-ro>
            <Plus size={14} className="mr-1" /> 新增码值
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无标准代码"
          description="为标准（如性别/币种/状态）定义枚举值域，字段落标后校验取值范围。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">所属标准</th>
                <th className="px-4 py-3 font-medium">码值</th>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 text-right font-medium">排序</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.standard_name ?? row.standard_id}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-primary)' }}>{row.code}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.sort_order ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(row); setForm({ standard_id: row.standard_id, code: row.code, name: row.name, sort_order: row.sort_order != null ? String(row.sort_order) : '' }); setModalOpen(true) }} data-ro>编辑</Button>
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

      {/* 新增/编辑弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑码值' : '新增码值'}>
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            所属标准 ID <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.standard_id} onChange={(e) => setForm({ ...form, standard_id: e.target.value })} placeholder="标准 ID" data-ro />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              码值 <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如 M / F" data-ro />
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              名称 <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如 男 / 女" data-ro />
            </label>
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            排序
            <Input value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} placeholder="可选" data-ro />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.code.trim() || !form.name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 删除码值确认 */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除码值"
        message={`确认删除码值「${deleting?.code ?? ''}」？`}
        type="danger"
        confirmText="删除"
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
