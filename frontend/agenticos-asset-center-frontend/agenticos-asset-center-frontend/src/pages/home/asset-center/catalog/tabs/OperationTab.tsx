/**
 * 资产目录 — 资产运营页签
 * 发布（上下架）/ 定价（价格模型+折扣）/ 授权（资产×角色，联动⑥ ACL）/ 交易（订单/交付/结算）
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, RefreshCw } from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'
import { ApprovalFlowSteps } from '../../../../../components/asset'

interface AssetItem {
  id: string
  name: string
  status: string
  price?: number
  price_model?: string
  discount?: number
  authorized_roles?: string[]
}

interface OrderRow {
  id: string
  asset_id: string
  asset_name?: string
  buyer_name?: string
  amount?: number
  status: string
  created_at?: string
}

const PAGE_SIZE = 10
const PRICE_MODELS: Record<string, string> = {
  free: '免费',
  fixed: '一口价',
  by_usage: '按次计费',
  subscription: '订阅制',
}

export default function OperationTab() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AssetItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 定价弹窗
  const [priceTarget, setPriceTarget] = useState<AssetItem | null>(null)
  const [priceForm, setPriceForm] = useState({ price: '', price_model: 'fixed', discount: '' })
  const [saving, setSaving] = useState(false)

  // 交易订单
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetCatalogApi.listItems({
        status: 'published',
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setItems((data.items ?? []) as unknown as AssetItem[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载运营资产失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const data = await AssetCatalogApi.listOrders({ limit: 20 })
      setOrders((data.items ?? []) as unknown as OrderRow[])
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])
  useEffect(() => { loadOrders() }, [loadOrders])

  const savePrice = async () => {
    if (!priceTarget) return
    setSaving(true)
    try {
      await AssetCatalogApi.priceItem(priceTarget.id, {
        price: Number(priceForm.price) || 0,
        price_model: priceForm.price_model,
        discount: priceForm.discount ? Number(priceForm.discount) : undefined,
      })
      setPriceTarget(null)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '定价失败')
    } finally {
      setSaving(false)
    }
  }

  const changeOrderStatus = async (order: OrderRow, target: string) => {
    try {
      await AssetCatalogApi.changeOrderStatus(order.id, { target })
      loadOrders()
    } catch (e) {
      setError(e instanceof Error ? e.message : '订单状态变更失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          发布上下架 / 定价（价格模型+折扣）/ 授权（资产×角色，联动⑥ 数据安全 ACL）/ 交易订单
        </p>
        <Button variant="ghost" onClick={() => { load(page); loadOrders() }}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !items.length && (
        <EmptyState
          icon="folder"
          title="暂无已上架资产"
          description="资产在「资产盘点」页签提交上架审批通过后，进入运营管理（定价/授权/交易）。"
        />
      )}

      {!!items.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">资产</th>
                <th className="px-4 py-3 font-medium">价格模型</th>
                <th className="px-4 py-3 text-right font-medium">价格</th>
                <th className="px-4 py-3 text-right font-medium">折扣</th>
                <th className="px-4 py-3 font-medium">已授权角色</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{item.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {PRICE_MODELS[item.price_model ?? ''] ?? item.price_model ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.price ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.discount != null ? `${item.discount}%` : '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {(item.authorized_roles ?? []).join('、') || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setPriceTarget(item); setPriceForm({ price: String(item.price ?? ''), price_model: item.price_model ?? 'fixed', discount: item.discount != null ? String(item.discount) : '' }) }} data-ro>
                        定价
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate('/home/asset-security')} data-ro>
                        授权
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

      {/* 交易订单区 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>交易订单（交付/结算记录）</h4>
        {ordersLoading ? (
          <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : orders.length ? (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                  <th className="px-4 py-2.5 font-medium">订单号</th>
                  <th className="px-4 py-2.5 font-medium">资产</th>
                  <th className="px-4 py-2.5 font-medium">购买方</th>
                  <th className="px-4 py-2.5 text-right font-medium">金额</th>
                  <th className="px-4 py-2.5 font-medium">状态</th>
                  <th className="px-4 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{order.id}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--color-text)' }}>{order.asset_name ?? order.asset_id}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{order.buyer_name ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{order.amount ?? '-'}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{order.status}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {order.status === 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => changeOrderStatus(order, 'paid')} data-ro>结算</Button>
                        )}
                        {order.status === 'paid' && (
                          <Button size="sm" variant="ghost" onClick={() => changeOrderStatus(order, 'delivered')} data-ro>交付</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无交易订单</p>
        )}
      </div>

      {/* 定价弹窗 */}
      <Modal open={!!priceTarget} onClose={() => setPriceTarget(null)} title={`定价 — ${priceTarget?.name ?? ''}`}>
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            价格模型
            <Select value={priceForm.price_model} onValueChange={(v) => setPriceForm({ ...priceForm, price_model: Array.isArray(v) ? String(v[0]) : String(v) })} ro>
              <option value="free">免费</option>
              <option value="fixed">一口价</option>
              <option value="by_usage">按次计费</option>
              <option value="subscription">订阅制</option>
            </Select>
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            价格
            <Input value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} placeholder="0" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            折扣（%，可选）
            <Input value={priceForm.discount} onChange={(e) => setPriceForm({ ...priceForm, discount: e.target.value })} placeholder="如 20" data-ro />
          </label>
          <ApprovalFlowSteps steps={[
            { label: '提交定价', state: 'done' },
            { label: '定价审批', state: 'active' },
            { label: '生效', state: 'pending' },
          ]} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setPriceTarget(null)}>取消</Button>
          <Button onClick={savePrice} disabled={saving} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 提交定价
          </Button>
        </div>
      </Modal>
    </div>
  )
}
