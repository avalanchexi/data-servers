/**
 * 数据安全 — 脱敏策略页签
 * 静态脱敏（导出/同步落盘）+ 动态脱敏（查询返回按密级/角色改写）；
 * 脱敏原语抽 shared/security/ 与 llm_security 共用
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, Database, EyeOff } from 'lucide-react'
import { AssetSecurityApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface MaskPolicyRow {
  id: string
  name: string
  mode: string // static | dynamic
  rule_type: string
  rule_config?: Record<string, unknown>
  min_level?: string
  target?: string
  enabled?: boolean
}

const PAGE_SIZE = 10
const MODE_LABELS: Record<string, string> = {
  static: '静态脱敏',
  dynamic: '动态脱敏',
}

export default function MaskPolicyTab() {
  const [rows, setRows] = useState<MaskPolicyRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [modeFilter, setModeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 新建/编辑弹窗
  const [editing, setEditing] = useState<MaskPolicyRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', mode: 'static', rule_type: 'phone', min_level: 'L3' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetSecurityApi.listMaskPolicies({
        mode: modeFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as MaskPolicyRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载脱敏策略失败')
    } finally {
      setLoading(false)
    }
  }, [modeFilter])

  useEffect(() => { load(1) }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', mode: 'static', rule_type: 'phone', min_level: 'L3' })
    setShowForm(true)
  }

  const openEdit = (row: MaskPolicyRow) => {
    setEditing(row)
    setForm({
      name: row.name,
      mode: row.mode,
      rule_type: row.rule_type,
      min_level: row.min_level ?? 'L3',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await AssetSecurityApi.updateMaskPolicy(editing.id, {
          name: form.name,
          mode: form.mode,
          rule_type: form.rule_type,
          min_level: form.min_level,
        })
      } else {
        await AssetSecurityApi.createMaskPolicy({
          name: form.name,
          mode: form.mode,
          rule_type: form.rule_type,
          min_level: form.min_level,
        })
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: MaskPolicyRow) => {
    try {
      await AssetSecurityApi.deleteMaskPolicy(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={modeFilter} onValueChange={(v) => setModeFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部模式</option>
            <option value="static">静态脱敏</option>
            <option value="dynamic">动态脱敏</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={openCreate} data-ro>
            <Plus size={14} className="mr-1" /> 新建策略
          </Button>
        </div>
      </div>

      {/* 两种脱敏模式说明 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <Database size={14} style={{ color: 'var(--color-primary)' }} /> 静态脱敏
          </p>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            导出/同步落盘前对数据执行不可逆改写，落盘即脱敏。
          </p>
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <EyeOff size={14} style={{ color: 'var(--color-primary)' }} /> 动态脱敏
          </p>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            查询返回时按密级/角色改写结果（复用 dq_injector 机制），原数据不动。
          </p>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="database"
          title="暂无脱敏策略"
          description="按密级（L1-L5）与角色配置静态/动态脱敏规则，脱敏原语与 llm_security 共用 shared/security/。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">策略名称</th>
                <th className="px-4 py-3 font-medium">模式</th>
                <th className="px-4 py-3 font-medium">规则</th>
                <th className="px-4 py-3 font-medium">生效密级</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{MODE_LABELS[row.mode] ?? row.mode}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.rule_type}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>≥ {row.min_level ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.enabled ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        color: row.enabled ? 'var(--color-success)' : 'var(--color-warning)',
                      }}
                    >
                      {row.enabled ? '启用' : '停用'}
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

      {/* 新建/编辑弹窗 */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? '编辑脱敏策略' : '新建脱敏策略'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>策略名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：手机号静态脱敏" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>脱敏模式</label>
            <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="static">静态脱敏（导出/落盘）</option>
              <option value="dynamic">动态脱敏（查询改写）</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>脱敏原语</label>
            <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="phone">手机号（138****1234）</option>
              <option value="id_card">身份证（保留前 6 后 4）</option>
              <option value="email">邮箱（u***@domain）</option>
              <option value="bank_card">银行卡（尾号保留）</option>
              <option value="hash">哈希（不可逆）</option>
              <option value="null">置空</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>生效密级（≥ 该级别才脱敏）</label>
            <Select value={form.min_level} onValueChange={(v) => setForm({ ...form, min_level: Array.isArray(v) ? String(v[0]) : String(v) })}>
              {['L1', 'L2', 'L3', 'L4', 'L5'].map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </Select>
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
