/**
 * 数据生命周期 — 归档管理页签
 * 归档策略配置 + 归档任务（审批流复用 lifecycle execution 记录）
 */
import { useCallback, useEffect, useState } from 'react'
import { Archive, Loader2, Plus, RefreshCw } from 'lucide-react'
import { AssetLifecycleApi, AssetCatalogApi } from '../../../../../api/asset'
import { useAuthStore } from '../../../../../store/authStore'
import { Button, EmptyState, Modal, Pagination, SearchableSelect, Select } from '../../../../../components/ui'

interface ExecutionRow {
  id: string
  policy_id?: string
  asset_id?: string
  asset_name?: string
  execution_type?: string
  status: string
  detail?: Record<string, unknown>
  requested_by?: string
  created_at?: string
}

interface AssetOption {
  id: string
  name: string
  code?: string
  entity_type?: string
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  running: '执行中',
  done: '已完成',
}

export default function ArchiveTab() {
  const [rows, setRows] = useState<ExecutionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ asset_id: '', target_storage: 'hdfs-cold' })
  const [saving, setSaving] = useState(false)

  // 资产目录条目选项（名称下拉选择）
  const [assets, setAssets] = useState<AssetOption[]>([])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetLifecycleApi.listExecutions({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      // 后端无 execution_type 过滤参数，前端按归档类型过滤
      const all = (data.items ?? []) as unknown as ExecutionRow[]
      setRows(all.filter((r) => r.execution_type === 'archive'))
      setTotal(Math.max(all.length, data.total ?? 0))
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载归档任务失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  // 加载资产目录条目供名称下拉选择
  useEffect(() => {
    AssetCatalogApi.listItems({ limit: 500 }).then((res) => {
      setAssets(((res as unknown as { items?: AssetOption[] }).items ?? []) as AssetOption[])
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  const submit = async () => {
    if (!form.asset_id.trim()) return
    setSaving(true)
    try {
      // 归档申请：创建 archive 策略 → 创建执行（审批流 pending → approved → running → success）
      const policy = await AssetLifecycleApi.createPolicy({
        name: `归档-${form.asset_id}`,
        asset_id: form.asset_id,
        policy_type: 'archive',
        config: { target_storage: form.target_storage },
      })
      const policyId = (policy as { id?: string }).id ?? ''
      if (policyId) {
        await AssetLifecycleApi.createExecution({
          policy_id: policyId,
          execution_type: 'archive',
          detail: { asset_id: form.asset_id, target_storage: form.target_storage },
        })
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败')
    } finally {
      setSaving(false)
    }
  }

  const approve = async (row: ExecutionRow, approved: boolean) => {
    try {
      const approver = useAuthStore.getState().user?.username ?? 'unknown'
      await AssetLifecycleApi.approveExecution(row.id, { approved, approver })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '审批失败')
    }
  }

  const execute = async (row: ExecutionRow) => {
    try {
      await AssetLifecycleApi.changeExecutionStatus(row.id, { target: 'running' })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '执行失败')
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          归档策略配置 + 归档任务（审批后执行，落盘留痕）。
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => setShowForm(true)} data-ro>
            <Plus size={14} className="mr-1" /> 归档申请
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无归档任务"
          description="归档策略：冷数据按保留期限自动建议归档（HDFS/对象存储），审批后执行。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 font-medium">目标存储</th>
                <th className="px-4 py-3 font-medium">申请人</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{row.asset_name ?? row.asset_id ?? row.policy_id ?? '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {String((row.detail as Record<string, unknown> | undefined)?.target_storage ?? '-')}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.requested_by ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'done' ? 'var(--color-success-bg)' : row.status === 'rejected' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'done' ? 'var(--color-success)' : row.status === 'rejected' ? 'var(--color-error)' : 'var(--color-warning)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
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
                      {row.status === 'approved' && (
                        <Button size="sm" variant="ghost" onClick={() => execute(row)} data-ro>执行归档</Button>
                      )}
                      {row.status === 'running' && (
                        <Button size="sm" variant="ghost" onClick={() => AssetLifecycleApi.changeExecutionStatus(row.id, { target: 'success' }).then(() => load(page))} data-ro>标记完成</Button>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title="归档申请">
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
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>目标存储</label>
            <Select value={form.target_storage} onValueChange={(v) => setForm({ ...form, target_storage: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="hdfs-cold">HDFS 冷目录</option>
              <option value="object">对象存储</option>
              <option value="tape">离线磁带</option>
            </Select>
          </div>
          <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            <Archive size={13} className="mr-1 inline" style={{ color: 'var(--color-primary)' }} />
            提交后进入审批流（待审批 → 批准 → 执行 → 完成），全量留痕。
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
          <Button onClick={submit} disabled={saving || !form.asset_id.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 提交申请
          </Button>
        </div>
      </Modal>
    </div>
  )
}
