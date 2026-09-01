/**
 * 资产目录 — 资产盘点页签
 * DCG 表/字段自动盘点 → 圈选编目 → 上架发布
 * 状态机：草稿/待审/已上架/已下架，支持批量操作
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, CheckSquare } from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import { DataSourceApi, type DataSourceItem } from '../../../../../api/datasource'
import { DatasetApi, type DatasetItem } from '../../../../../api/dataset'
import { Button, EmptyState, Input, Modal, Pagination, SearchableSelect, Select } from '../../../../../components/ui'

interface AssetItem {
  id: string
  name: string
  entity_type?: string
  entity_id?: string
  catalog_id?: string
  status: string
  owner_name?: string
  domain?: string
  created_at?: string
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending: '待审',
  published: '已上架',
  offline: '已下架',
}

export default function InventoryTab() {
  const [items, setItems] = useState<AssetItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 新建编目弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', entity_type: 'table', entity_id: '', catalog_id: '', domain: '' })
  const [saving, setSaving] = useState(false)

  // 实体选择选项（数据集/数据源类型用名称下拉）
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [datasources, setDatasources] = useState<DataSourceItem[]>([])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetCatalogApi.listItems({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setItems((data.items ?? []) as unknown as AssetItem[])
      setTotal(data.total ?? 0)
      setPage(p)
      setChecked(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载盘点清单失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  // 加载数据集与数据源列表供实体下拉选择
  useEffect(() => {
    Promise.all([
      DatasetApi.list({ limit: 200 }),
      DataSourceApi.list({ limit: 200 }),
    ]).then(([ds, src]) => {
      setDatasets((ds.items ?? []) as DatasetItem[])
      setDatasources((src.items ?? []) as DataSourceItem[])
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await AssetCatalogApi.createItem({
        name: form.name.trim(),
        entity_type: form.entity_type,
        entity_id: form.entity_id || undefined,
        catalog_id: form.catalog_id || undefined,
        domain: form.domain || undefined,
      })
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (item: AssetItem, target: string) => {
    try {
      await AssetCatalogApi.changeItemStatus(item.id, { target })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态变更失败')
    }
  }

  const batchPublish = async () => {
    if (!checked.size) return
    try {
      await AssetCatalogApi.batchStatus({ item_ids: Array.from(checked), target: 'pending' })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '批量提交失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">待审</option>
            <option value="published">已上架</option>
            <option value="offline">已下架</option>
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={batchPublish} disabled={!checked.size} data-ro>
            <CheckSquare size={14} className="mr-1" /> 批量提交上架（{checked.size}）
          </Button>
          <Button onClick={() => { setForm({ name: '', entity_type: 'table', entity_id: '', catalog_id: '', domain: '' }); setModalOpen(true) }} data-ro>
            <Plus size={14} className="mr-1" /> 圈选编目
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !items.length && (
        <EmptyState
          icon="folder"
          title="暂无盘点资产"
          description="元数据采集完成后，DCG 图谱中的表/字段自动进入盘点池；在此圈选编目并提交上架审批。"
          action={<Button onClick={() => setModalOpen(true)} data-ro><Plus size={14} className="mr-1" /> 圈选编目</Button>}
        />
      )}

      {!!items.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={checked.size === items.length && items.length > 0} onChange={() => setChecked(checked.size === items.length ? new Set() : new Set(items.map((i) => i.id)))} data-ro />
                </th>
                <th className="px-4 py-3 font-medium">资产名称</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">主题域</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">负责人</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggleCheck(item.id)} data-ro />
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{item.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.entity_type ?? '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.domain ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: item.status === 'published' ? 'var(--color-success-bg)' : item.status === 'pending' ? 'var(--color-warning-bg)' : 'var(--color-card-elevated)',
                        color: item.status === 'published' ? 'var(--color-success)' : item.status === 'pending' ? 'var(--color-warning)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.owner_name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {item.status === 'draft' && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(item, 'pending')} data-ro>提交待审</Button>
                      )}
                      {item.status === 'pending' && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(item, 'published')} data-ro>上架</Button>
                      )}
                      {item.status === 'published' && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(item, 'offline')} data-ro>下架</Button>
                      )}
                      {item.status === 'offline' && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(item, 'draft')} data-ro>回退草稿</Button>
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

      {/* 圈选编目弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="圈选编目（新资产）">
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            资产名称 <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：经营库客户主档" data-ro />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              资产类型
              <Select value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: Array.isArray(v) ? String(v[0]) : String(v), entity_id: '' })} ro>
                <option value="table">表</option>
                <option value="column">字段</option>
                <option value="metric">指标</option>
                <option value="dataset">数据集</option>
                <option value="api">API</option>
                <option value="datasource">数据源</option>
                <option value="service">服务</option>
                <option value="standard">标准</option>
              </Select>
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              主题域
              <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="如：客户域" data-ro />
            </label>
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            实体（DCG 图谱对象）
            {form.entity_type === 'dataset' ? (
              <SearchableSelect
                value={form.entity_id}
                onChange={(v) => setForm({ ...form, entity_id: v })}
                placeholder="搜索选择数据集"
                items={datasets.map((d) => ({ value: d.id, label: d.name }))}
                ro
              />
            ) : form.entity_type === 'datasource' ? (
              <SearchableSelect
                value={form.entity_id}
                onChange={(v) => setForm({ ...form, entity_id: v })}
                placeholder="搜索选择数据源"
                items={datasources.map((d) => ({ value: d.id, label: d.name }))}
                ro
              />
            ) : (
              <Input value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} placeholder="DCG 图谱实体 ID" data-ro />
            )}
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            类目 ID
            <Input value={form.catalog_id} onChange={(e) => setForm({ ...form, catalog_id: e.target.value })} placeholder="可选，归属类目树" data-ro />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存草稿
          </Button>
        </div>
      </Modal>
    </div>
  )
}
