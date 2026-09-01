/**
 * 数据生命周期 — 退役管理页签
 * 退役申请→审批→执行；退役对象取自资产目录（已下架资产）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, LogOut } from 'lucide-react'
import { AssetLifecycleApi } from '../../../../../api/asset'
import { useAuthStore } from '../../../../../store/authStore'
import { Button, EmptyState, Input, Modal, Pagination } from '../../../../../components/ui'

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

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  running: '执行中',
  success: '已完成',
  failed: '失败',
}

export default function RetireTab() {
  const [rows, setRows] = useState<ExecutionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ asset_id: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetLifecycleApi.listExecutions({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      const all = (data.items ?? []) as unknown as ExecutionRow[]
      setRows(all.filter((r) => r.execution_type === 'retire'))
      setTotal(Math.max(all.length, data.total ?? 0))
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载退役任务失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const submit = async () => {
    if (!form.asset_id.trim()) return
    setSaving(true)
    try {
      // 退役申请：创建 retire 策略 → 创建执行（审批流 pending → approved → running → success）
      const policy = await AssetLifecycleApi.createPolicy({
        name: `退役-${form.asset_id}`,
        asset_id: form.asset_id,
        policy_type: 'retire',
        config: { reason: form.reason || undefined },
      })
      const policyId = (policy as { id?: string }).id ?? ''
      if (policyId) {
        await AssetLifecycleApi.createExecution({
          policy_id: policyId,
          execution_type: 'retire',
          detail: { asset_id: form.asset_id, reason: form.reason },
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
          退役对象取自资产目录（已下架资产）：退役申请 → 审批 → 执行，全量留痕。
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => setShowForm(true)} data-ro>
            <Plus size={14} className="mr-1" /> 退役申请
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无退役任务"
          description="资产下架后可发起退役申请，审批通过后执行退役并留痕。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 font-medium">退役原因</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">申请时间</th>
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
                    {String((row.detail as Record<string, unknown> | undefined)?.reason ?? '-')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'success' ? 'var(--color-success-bg)' : row.status === 'rejected' || row.status === 'failed' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'success' ? 'var(--color-success)' : row.status === 'rejected' || row.status === 'failed' ? 'var(--color-error)' : 'var(--color-warning)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
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
                        <Button size="sm" variant="ghost" onClick={() => execute(row)} data-ro>执行退役</Button>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title="退役申请">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>资产 ID（已下架资产）</label>
            <Input value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} placeholder="资产 ID" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>退役原因</label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="如：业务下线/表废弃" />
          </div>
          <p className="text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            <LogOut size={13} className="mr-1 inline" style={{ color: 'var(--color-warning)' }} />
            提交后进入审批流（待审批 → 批准 → 执行 → 完成），执行记录全量留痕可追溯。
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
