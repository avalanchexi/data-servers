/**
 * 数据安全 — 行列权限页签
 * 资产×角色×列掩码/行级 WHERE 过滤（复用 dq_injector WHERE 注入机制）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { AssetSecurityApi, AssetCatalogApi } from '../../../../../api/asset'
import { listRoles, type RoleResponse } from '../../../../../api/role'
import { Button, EmptyState, Input, Modal, Pagination, SearchableSelect, Select } from '../../../../../components/ui'

interface AclRow {
  id: string
  asset_id: string
  asset_name?: string
  role_id: string
  role_name?: string
  scope: string // column | row | both
  column_mask?: string[]
  row_filter?: string
  granted_by?: string
}

interface AssetOption {
  id: string
  name: string
  code?: string
  entity_type?: string
}

const PAGE_SIZE = 10
const SCOPE_LABELS: Record<string, string> = {
  column: '列掩码',
  row: '行过滤',
  both: '行列',
}

export default function AclTab() {
  const [rows, setRows] = useState<AclRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AclRow | null>(null)
  const [form, setForm] = useState({ asset_id: '', role_id: '', scope: 'column', column_mask: '', row_filter: '' })
  const [saving, setSaving] = useState(false)

  // 资产/角色选项（名称下拉选择）
  const [assets, setAssets] = useState<AssetOption[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetSecurityApi.listAcls({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as AclRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载行列权限失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  // 加载资产目录条目与角色列表供名称下拉选择
  useEffect(() => {
    Promise.all([
      AssetCatalogApi.listItems({ limit: 500 }),
      listRoles(),
    ]).then(([assetRes, roleItems]) => {
      setAssets(((assetRes as unknown as { items?: AssetOption[] }).items ?? []) as AssetOption[])
      setRoles((roleItems ?? []) as RoleResponse[])
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ asset_id: '', role_id: '', scope: 'column', column_mask: '', row_filter: '' })
    setShowForm(true)
  }

  const openEdit = (row: AclRow) => {
    setEditing(row)
    setForm({
      asset_id: row.asset_id,
      role_id: row.role_id,
      scope: row.scope,
      column_mask: (row.column_mask ?? []).join(','),
      row_filter: row.row_filter ?? '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.asset_id.trim() || !form.role_id.trim()) return
    setSaving(true)
    try {
      const payload = {
        asset_id: form.asset_id,
        role_id: form.role_id,
        scope: form.scope,
        column_mask: form.column_mask ? form.column_mask.split(',').map((s) => s.trim()).filter(Boolean) : [],
        row_filter: form.row_filter || undefined,
      }
      if (editing) {
        await AssetSecurityApi.updateAcl(editing.id, payload)
      } else {
        await AssetSecurityApi.createAcl(payload)
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: AclRow) => {
    try {
      await AssetSecurityApi.deleteAcl(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const filtered = roleFilter ? rows.filter((r) => r.role_id === roleFilter) : rows

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SearchableSelect
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            placeholder="全部角色"
            className="w-48"
            items={[
              { value: '', label: '全部角色' },
              ...roles.map((r) => ({ value: r.id, label: r.name })),
            ]}
            ro
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={openCreate} data-ro>
            <Plus size={14} className="mr-1" /> 新增授权
          </Button>
        </div>
      </div>

      <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
        行级过滤复用 dq_injector WHERE 注入机制（如 <code>dept_id = &#123;&#123;user.dept&#125;&#125;</code>），列掩码按字段清单改写查询结果，与资产目录「资产运营→授权」联动。
      </p>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无行列权限规则"
          description="按 资产×角色 配置列掩码与行级 WHERE 过滤，写操作需 RequirePermission 授权。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">范围</th>
                <th className="px-4 py-3 font-medium">列掩码</th>
                <th className="px-4 py-3 font-medium">行过滤</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{row.asset_name ?? row.asset_id}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.asset_id}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.role_name ?? row.role_id}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{SCOPE_LABELS[row.scope] ?? row.scope}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {(row.column_mask ?? []).join('、') || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.row_filter || '-'}</td>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? '编辑行列权限' : '新增行列权限'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>资产</label>
            <SearchableSelect
              value={form.asset_id}
              onChange={(v) => setForm({ ...form, asset_id: v })}
              placeholder="搜索选择资产"
              items={assets.map((a) => ({ value: a.id, label: a.code ? `${a.name}（${a.code}）` : a.name }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>角色</label>
            <SearchableSelect
              value={form.role_id}
              onChange={(v) => setForm({ ...form, role_id: v })}
              placeholder="搜索选择角色"
              items={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>授权范围</label>
            <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="column">列掩码</option>
              <option value="row">行过滤</option>
              <option value="both">行列（组合）</option>
            </Select>
          </div>
          {(form.scope === 'column' || form.scope === 'both') && (
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>列掩码清单（逗号分隔）</label>
              <Input value={form.column_mask} onChange={(e) => setForm({ ...form, column_mask: e.target.value })} placeholder="phone, id_card, email" />
            </div>
          )}
          {(form.scope === 'row' || form.scope === 'both') && (
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>行级 WHERE 过滤</label>
              <Input value={form.row_filter} onChange={(e) => setForm({ ...form, row_filter: e.target.value })} placeholder="dept_id = {{user.dept}}" />
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.asset_id.trim() || !form.role_id.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
