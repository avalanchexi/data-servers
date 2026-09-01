/**
 * 资产目录 — 权属管理页签
 * 持有权/使用权/经营权三权登记、责任人矩阵、权属变更审批
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination } from '../../../../../components/ui'
import OwnerMatrixTable, { type OwnershipRow as MatrixRow } from '../../../../../components/asset/OwnerMatrixTable'

interface RegistrationRow {
  id: string
  asset_id: string
  asset_name: string
  owner_name: string
  owner_type: '持有权' | '使用权' | '经营权'
  grantee_name?: string
  status: string
  approved?: boolean
  created_at?: string
}

const PAGE_SIZE = 10

export default function OwnershipTab() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ asset_id: '', asset_name: '', owner_name: '', owner_type: '持有权', grantee_name: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetCatalogApi.listOwnerships({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRegistrations((data.items ?? []) as unknown as RegistrationRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载权属登记失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const save = async () => {
    if (!form.asset_id.trim() || !form.owner_name.trim()) return
    setSaving(true)
    try {
      await AssetCatalogApi.createOwnership({
        asset_id: form.asset_id.trim(),
        asset_name: form.asset_name.trim(),
        owner_name: form.owner_name.trim(),
        owner_type: form.owner_type,
        grantee_name: form.grantee_name.trim() || undefined,
      })
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '登记失败')
    } finally {
      setSaving(false)
    }
  }

  // 单条登记记录 pivot 成矩阵（行=资产，列=三权），按 asset_id 分组
  const matrixRows: MatrixRow[] = (() => {
    const byAsset = new Map<string, RegistrationRow[]>()
    for (const reg of registrations) {
      const list = byAsset.get(reg.asset_id) ?? []
      list.push(reg)
      byAsset.set(reg.asset_id, list)
    }
    return Array.from(byAsset.entries()).map(([assetId, regs]) => {
      const first = regs[0]
      const pick = (type: string) => regs.find((r) => r.owner_type === type)?.owner_name
      const pending = regs.find((r) => !r.approved)
      return {
        asset_id: assetId,
        asset_name: first.asset_name || assetId,
        holding_owner: pick('持有权'),
        usage_owner: pick('使用权'),
        management_owner: pick('经营权'),
        status: pending?.status ?? first.status,
        approved: !pending,
        _pendingId: pending?.id,
      }
    })
  })()

  const approveMatrix = async (row: MatrixRow & { _pendingId?: string }, approved: boolean) => {
    const target = row._pendingId ?? registrations.find((r) => r.asset_id === row.asset_id)?.id
    if (!target) return
    try {
      await AssetCatalogApi.approveOwnership(target, { approved })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '审批操作失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          三权登记（持有权/使用权/经营权）→ 责任人矩阵 → 权属变更审批
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => { setForm({ asset_id: '', asset_name: '', owner_name: '', owner_type: '持有权', grantee_name: '' }); setModalOpen(true) }} data-ro>
            <Plus size={14} className="mr-1" /> 权属登记
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !registrations.length && (
        <EmptyState
          icon="folder"
          title="暂无权属登记"
          description="对已编目资产登记持有权/使用权/经营权，形成责任人矩阵；权属变更需审批。"
        />
      )}

      {!!registrations.length && (
        <>
          <div className="overflow-x-auto rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
            <OwnerMatrixTable rows={matrixRows} onApprove={(row, ok) => approveMatrix(row as MatrixRow & { _pendingId?: string }, ok)} />
          </div>
          {total > PAGE_SIZE && (
            <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
          )}
        </>
      )}

      {/* 权属登记弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="权属登记">
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            资产 ID <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} placeholder="已编目资产 ID" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            资产名称
            <Input value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} placeholder="可空，后端自动回填" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            责任人 <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="持有者姓名" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            权属类型
            <select
              value={form.owner_type}
              onChange={(e) => setForm({ ...form, owner_type: e.target.value })}
              className="h-10 w-full rounded-lg border px-3 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              data-ro
            >
              <option value="持有权">持有权</option>
              <option value="使用权">使用权</option>
              <option value="经营权">经营权</option>
            </select>
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            被授权人（使用权/经营权登记时填写）
            <Input value={form.grantee_name} onChange={(e) => setForm({ ...form, grantee_name: e.target.value })} placeholder="可选" data-ro />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.asset_id.trim() || !form.owner_name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 提交登记
          </Button>
        </div>
      </Modal>
    </div>
  )
}
