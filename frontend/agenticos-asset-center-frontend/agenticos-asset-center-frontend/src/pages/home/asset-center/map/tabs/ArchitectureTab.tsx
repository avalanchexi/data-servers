/**
 * 数据地图 — 数据架构页签（DCMM 2.0 数据架构域，只读聚合）
 * 三视图：模型清单（ODS-DIM-DWD-DWS-ADS-TMP 落位）/ 数据分布 / 集成共享。
 * 复用数据地图菜单权限（asset-map read），零新增菜单点。
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Layers, Boxes, GitMerge } from 'lucide-react'
import { AssetArchitectureApi } from '../../../../../api/asset'
import { Button, EmptyState } from '../../../../../components/ui'

interface TableModel {
  table_name: string
  chinese_name?: string
  dataset_name?: string
  layer?: string | null
  layer_name?: string | null
  column_count?: number
  fk_count?: number
  row_count?: number | null
}

interface LayerDist {
  code: string
  name: string
  prefix?: string | null
  table_count: number
}

interface DataModels {
  tables?: TableModel[]
  layer_distribution?: LayerDist[]
  total_tables?: number
  unpositioned_tables?: number
  message?: string
}

interface DistEntry {
  domain?: string
  datasource_id?: string
  total: number
  by_type?: Record<string, number>
}

interface DataDistribution {
  total_entities?: number
  by_domain?: DistEntry[]
  by_datasource?: DistEntry[]
  by_type?: Record<string, number>
  generated_at?: string
}

interface IntegrationSharing {
  fk_edges?: Array<{ source_table?: string; target_table?: string; dataset_id?: string }>
  fk_relation_count?: number
  services?: { total?: number; by_status?: Record<string, number>; mcp_published?: number }
  generated_at?: string
}

type ViewId = 'models' | 'distribution' | 'integration'

const VIEWS: Array<{ key: ViewId; label: string; icon: typeof Layers }> = [
  { key: 'models', label: '模型清单', icon: Layers },
  { key: 'distribution', label: '数据分布', icon: Boxes },
  { key: 'integration', label: '集成共享', icon: GitMerge },
]

export default function ArchitectureTab() {
  const [view, setView] = useState<ViewId>('models')
  const [models, setModels] = useState<DataModels | null>(null)
  const [distribution, setDistribution] = useState<DataDistribution | null>(null)
  const [integration, setIntegration] = useState<IntegrationSharing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [modelsData, distData, integrationData] = await Promise.all([
        AssetArchitectureApi.dataModels(),
        AssetArchitectureApi.dataDistribution(),
        AssetArchitectureApi.integrationSharing(),
      ])
      setModels(modelsData as unknown as DataModels)
      setDistribution(distData as unknown as DataDistribution)
      setIntegration(integrationData as unknown as IntegrationSharing)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载数据架构视图失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const layerBars = models?.layer_distribution ?? []
  const maxLayerCount = Math.max(1, ...layerBars.map((l) => l.table_count))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = view === v.key
            return (
              <Button key={v.key} size="sm" variant={active ? 'primary' : 'ghost'} onClick={() => setView(v.key)} ro>
                <Icon size={13} className="mr-1" /> {v.label}
              </Button>
            )
          })}
        </div>
        <Button variant="ghost" onClick={load} ro>
          <RefreshCw size={14} className="mr-1" /> 刷新
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {/* ── 模型清单 / 分层分布 ── */}
      {!loading && view === 'models' && (
        <div className="space-y-4">
          {models?.message && !models.tables?.length && (
            <EmptyState icon="database" title="模型清单暂不可用" description={models.message} />
          )}
          {!!layerBars.length && (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  分层分布（共 {models?.total_tables ?? 0} 张表
                  {models?.unpositioned_tables ? `，未落层 ${models.unpositioned_tables} 张` : ''}）
                </h3>
              </div>
              <div className="space-y-2">
                {layerBars.map((layer) => (
                  <div key={layer.code} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs" style={{ color: 'var(--color-text-secondary)' }} title={layer.name}>
                      {layer.name}{layer.prefix ? `（${layer.prefix}）` : ''}
                    </span>
                    <div className="h-4 flex-1 overflow-hidden rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                      <div
                        className="h-full rounded"
                        style={{ width: `${(layer.table_count / maxLayerCount) * 100}%`, backgroundColor: 'var(--color-primary)' }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{layer.table_count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!!models?.tables?.length && (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                    <th className="px-4 py-3 font-medium">表名</th>
                    <th className="px-4 py-3 font-medium">中文名</th>
                    <th className="px-4 py-3 font-medium">数据集</th>
                    <th className="px-4 py-3 font-medium">分层落位</th>
                    <th className="px-4 py-3 font-medium">字段数</th>
                    <th className="px-4 py-3 font-medium">外键数</th>
                    <th className="px-4 py-3 font-medium">行数</th>
                  </tr>
                </thead>
                <tbody>
                  {models.tables.map((t) => (
                    <tr key={t.table_name} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text)' }}>{t.table_name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.chinese_name || '-'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.dataset_name || '-'}</td>
                      <td className="px-4 py-3">
                        {t.layer_name ? (
                          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                            {t.layer_name}
                          </span>
                        ) : (
                          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-tertiary)' }}>
                            未落层
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.column_count ?? 0}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.fk_count ?? 0}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {t.row_count != null ? Number(t.row_count).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 数据分布 ── */}
      {!loading && view === 'distribution' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>主题域分布</h3>
            <div className="space-y-2">
              {distribution?.by_domain?.length ? distribution.by_domain.map((d) => (
                <div key={d.domain} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs" style={{ color: 'var(--color-text-secondary)' }} title={d.domain}>{d.domain}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div
                      className="h-full rounded"
                      style={{ width: `${(d.total / Math.max(1, distribution.total_entities ?? 1)) * 100}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{d.total}</span>
                </div>
              )) : <p className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无主题域分布数据</p>}
            </div>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>数据源分布</h3>
            <div className="space-y-2">
              {distribution?.by_datasource?.length ? distribution.by_datasource.map((d) => (
                <div key={d.datasource_id} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }} title={d.datasource_id}>{d.datasource_id}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div
                      className="h-full rounded"
                      style={{ width: `${(d.total / Math.max(1, distribution.total_entities ?? 1)) * 100}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{d.total}</span>
                </div>
              )) : <p className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无数据源分布数据</p>}
            </div>
          </div>
          <div className="rounded-xl border p-4 lg:col-span-2" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              对象类型分布（共 {distribution?.total_entities ?? 0} 个实体）
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(distribution?.by_type ?? {}).map(([type, count]) => (
                <span key={type} className="rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  {type}：{count}
                </span>
              ))}
            </div>
            {distribution?.generated_at && (
              <p className="mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                聚合时间：{new Date(distribution.generated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 集成共享 ── */}
      {!loading && view === 'integration' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-4 lg:col-span-2" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              外键集成关系（共 {integration?.fk_relation_count ?? 0} 条，DCG TABLE_FK 边）
            </h3>
            {integration?.fk_edges?.length ? (
              <div className="max-h-[420px] space-y-2 overflow-auto">
                {integration.fk_edges.map((edge, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                    <span className="font-mono" style={{ color: 'var(--color-text)' }}>{edge.source_table}</span>
                    <span style={{ color: 'var(--color-primary)' }}>→</span>
                    <span className="font-mono" style={{ color: 'var(--color-text)' }}>{edge.target_table}</span>
                    {edge.dataset_id && (
                      <span className="ml-auto truncate font-mono" style={{ color: 'var(--color-text-tertiary)' }} title={edge.dataset_id}>{edge.dataset_id}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                暂无外键集成关系（DCG 图谱未同步或数据源未声明外键）
              </p>
            )}
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>数据服务共享</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>服务总数</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{integration?.services?.total ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>已发布 MCP</span>
                <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{integration?.services?.mcp_published ?? 0}</span>
              </div>
              {Object.entries(integration?.services?.by_status ?? {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{status}</span>
                  <span style={{ color: 'var(--color-text)' }}>{count}</span>
                </div>
              ))}
            </div>
            {integration?.generated_at && (
              <p className="mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                聚合时间：{new Date(integration.generated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
