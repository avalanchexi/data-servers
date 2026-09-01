/**
 * 数据标准 — 命名词典页签
 * 词根/词缀 + 缩写 + 词类（对齐后端 AssetNamingDict 契约：word/word_type/abbr/word_class/description）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AssetStandardApi } from '../../../../../api/asset'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface WordRow {
  id: string
  word: string
  word_type: string
  abbr?: string
  word_class?: string
  description?: string
}

const PAGE_SIZE = 10
const WORD_TYPE_LABELS: Record<string, string> = {
  root: '词根',
  affix: '词缀',
}
const WORD_CLASS_OPTIONS = ['业务对象', '属性', '金额数量', '时间', '动作', '前缀', '后缀']

export default function NamingDictTab() {
  const [rows, setRows] = useState<WordRow[]>([])
  const [deleting, setDeleting] = useState<WordRow | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WordRow | null>(null)
  const [form, setForm] = useState({ word: '', word_type: 'root', abbr: '', word_class: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetStandardApi.listNamingDict({
        word_type: typeFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as WordRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载命名词典失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { load(1) }, [load])

  const save = async () => {
    if (!form.word.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await AssetStandardApi.updateNamingWord(editing.id, form as unknown as Record<string, unknown>)
      } else {
        await AssetStandardApi.createNamingWord(form as unknown as Record<string, unknown>)
      }
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = (row: WordRow) => {
    setDeleting(row)
  }

  const doDelete = async () => {
    if (!deleting) return
    try {
      await AssetStandardApi.deleteNamingWord(deleting.id)
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
            <option value="">全部类型</option>
            {Object.entries(WORD_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ word: '', word_type: 'root', abbr: '', word_class: '', description: '' }); setModalOpen(true) }} data-ro>
          <Plus size={14} className="mr-1" /> 新增词条
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="命名词典为空"
          description="词根/词缀规范（含数仓分层前缀 ods_/dwd_/dws_/ads_/dim_），支撑表/字段命名智能审核。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">词条</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">缩写</th>
                <th className="px-4 py-3 font-medium">词类</th>
                <th className="px-4 py-3 font-medium">含义</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: 'var(--color-primary)' }}>{row.word}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{WORD_TYPE_LABELS[row.word_type] ?? row.word_type}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.abbr ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.word_class ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.description ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(row); setForm({ word: row.word, word_type: row.word_type, abbr: row.abbr ?? '', word_class: row.word_class ?? '', description: row.description ?? '' }); setModalOpen(true) }} data-ro>编辑</Button>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑词条' : '新增词条'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              词条 <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} placeholder="如 cust / ods_ / _id" data-ro />
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              类型
              <Select value={form.word_type} onValueChange={(v) => setForm({ ...form, word_type: Array.isArray(v) ? String(v[0]) : String(v) })} ro>
                {Object.entries(WORD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              缩写
              <Input value={form.abbr} onChange={(e) => setForm({ ...form, abbr: e.target.value })} placeholder="如 cust / ord" data-ro />
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              词类
              <Select value={form.word_class} onValueChange={(v) => setForm({ ...form, word_class: Array.isArray(v) ? String(v[0]) : String(v) })} ro>
                <option value="">未分类</option>
                {WORD_CLASS_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            含义
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="如 客户（customer）" data-ro />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.word.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 删除词条确认 */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除词条"
        message={`确认删除词条「${deleting?.word ?? ''}」？`}
        type="danger"
        confirmText="删除"
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
