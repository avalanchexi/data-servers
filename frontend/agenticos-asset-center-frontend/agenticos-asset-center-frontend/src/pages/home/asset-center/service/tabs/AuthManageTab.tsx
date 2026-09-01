/**
 * 数据服务 — 授权管理页签
 * 复用 RequirePermission + 资产目录「授权」联动（资产×角色×行列范围，联动数据安全 ACL）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AssetServiceApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination, Select } from '../../../../../components/ui'

interface ServiceRow {
  id: string
  code: string
  name: string
  status: string
  mcp_published?: boolean
}

const PAGE_SIZE = 10

export default function AuthManageTab() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState('all')

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetServiceApi.listServices({ limit: 100, offset: 0 })
      const all = (data.items ?? []) as unknown as ServiceRow[]
      const filtered = scope === 'all' ? all : all.filter((r) => r.status === scope)
      setRows(filtered.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE))
      setTotal(filtered.length)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载授权列表失败')
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => { load(1) }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v) => setScope(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="all">全部服务</option>
            <option value="published">已上架</option>
            <option value="offline">已下线</option>
          </Select>
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <ShieldCheck size={13} style={{ color: 'var(--color-primary)' }} /> RequirePermission 权限管控
          </span>
        </div>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无服务"
          description="服务授权复用 RequirePermission 菜单权限 + 资产目录「授权」联动数据安全 ACL（资产×角色×行列范围）。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">服务</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">权限模式</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'published' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'published' ? 'var(--color-success)' : 'var(--color-warning)',
                      }}
                    >
                      {row.status === 'published' ? '已上架' : row.status === 'offline' ? '已下线' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    RequirePermission（asset-service）+ ACL 行列范围
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate('/home/asset-security')} data-ro>
                        配置 ACL
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
    </div>
  )
}
