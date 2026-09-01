/**
 * 数据服务 — API 商城页签
 * 上架/申请/审批/文档（已上架服务即商城条目，文档为 doc JSONB）
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, FileText, Store } from 'lucide-react'
import { AssetServiceApi } from '../../../../../api/asset'
import { Button, EmptyState, Pagination } from '../../../../../components/ui'

interface ServiceRow {
  id: string
  code: string
  name: string
  entity_type?: string
  status: string
  doc?: Record<string, unknown>
  mcp_published?: boolean
}

const PAGE_SIZE = 12

export default function ApiMarketTab() {
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<ServiceRow | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      // 商城 = 已上架服务；后端无 status 过滤时前端过滤
      const data = await AssetServiceApi.listServices({ limit: 100, offset: 0 })
      const all = ((data.items ?? []) as unknown as ServiceRow[]).filter((r) => r.status === 'published')
      setRows(all.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE))
      setTotal(all.length)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 API 商城失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          上架 → 申请 → 审批 → 文档（复用 RequirePermission 授权，服务注册页签可上架/下线）。
        </p>
        <Button variant="ghost" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="database"
          title="商城暂无上架服务"
          description="在「服务注册」页签将服务状态改为已上架后，将出现在 API 商城供申请使用。"
        />
      )}

      {!!rows.length && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-medium" style={{ color: 'var(--color-text)' }}>
                    <Store size={15} style={{ color: 'var(--color-primary)' }} /> {row.name}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{row.code}</p>
                </div>
                {row.mcp_published && (
                  <span className="shrink-0 rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>MCP</span>
                )}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {row.entity_type ? `封装：${row.entity_type}` : '参数化 SQL 服务'}
              </p>
              <div className="mt-3 flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setDetail(row)}>
                  <FileText size={13} className="mr-1" /> 查看文档
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {/* 服务文档弹窗 */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border p-5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{detail.name} — API 文档</h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{detail.code}</p>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg p-3 text-xs leading-5" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
              {detail.doc ? JSON.stringify(detail.doc, null, 2) : '暂无文档，可在服务注册中补充 doc 内容。'}
            </pre>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setDetail(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
