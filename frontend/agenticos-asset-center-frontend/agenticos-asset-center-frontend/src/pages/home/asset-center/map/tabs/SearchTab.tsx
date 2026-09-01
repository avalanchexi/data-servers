/**
 * 数据地图 — 数据检索页签
 * 全局统一检索：中文全文+模糊，按数据源/类目/属主/分级/标签/主题域组合过滤，
 * 点击结果查看资产详情（基础信息/字段列表/质量评分/安全分级/热度）
 */
import { useCallback, useEffect, useState } from 'react'
import { Clock, Eye, Loader2, Search, Sparkles } from 'lucide-react'
import { AssetCatalogApi, AssetMapApi } from '../../../../../api/asset'
import { Button, Input, Pagination, Select } from '../../../../../components/ui'
import { AssetDetailCard, ClassificationBadge } from '../../../../../components/asset'
import { useDebouncedValue } from '../../../../../hooks/useDebouncedValue'
import { useInfiniteScroll } from '../../useInfiniteScroll'

interface SearchItem {
  entity_type: string
  entity_id: string
  code?: string
  name_zh: string
  name_en?: string
  description?: string
  domain?: string
  owner_name?: string
  classification_level?: string
  quality_score?: number
  tags?: string[]
  datasource_id?: string
  catalog_name?: string
  schema_name?: string
  hot?: number
  cataloged?: boolean
}

interface RecAction {
  text: string
  query?: string
  description?: string
  action_type?: string
}

interface SearchResult {
  items: SearchItem[]
  total: number
  routes?: Record<string, number>
  recommendations?: RecAction[]
}

interface PreviewData {
  columns?: string[]
  rows?: unknown[][]
  total?: number
  masked?: boolean
  classification_level?: string
  sample_note?: string
  message?: string
  dataset_id?: string
  table?: string
}

interface TimelineEvent {
  event_type: string
  title: string
  time?: string
  status?: string
}

interface GovernanceItem {
  id: string
  category: string
  title: string
  severity: string
  deduct_score: number
}

const SUB_TABS = [
  { key: 'detail', label: '详情' },
  { key: 'preview', label: '数据预览' },
  { key: 'events', label: '事件记录' },
] as const

type SubTab = (typeof SUB_TABS)[number]['key']

export default function SearchTab() {
  const [keyword, setKeyword] = useState('')
  // 300ms 防抖：停止输入后才触发检索，避免每次击键都发请求（计划 6.4）
  const debouncedKeyword = useDebouncedValue(keyword, 300)
  const [entityType, setEntityType] = useState('')
  const [catalogName, setCatalogName] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [catalogOptions, setCatalogOptions] = useState<{ id: string; name: string }[]>([])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [selected, setSelected] = useState<SearchItem | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('detail')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 20

  const search = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetMapApi.search({
        keyword: debouncedKeyword || undefined,
        entity_type: entityType || undefined,
        catalog_name: catalogName || undefined,
        schema_name: schemaName || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      }) as unknown as SearchResult
      // 增量加载：追加下一页；推荐动作以首页结果为准
      setResult((prev) => (append && prev
        ? { ...data, items: [...prev.items, ...data.items], recommendations: prev.recommendations ?? data.recommendations }
        : data))
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '检索失败')
    } finally {
      setLoading(false)
    }
  }, [debouncedKeyword, entityType, catalogName, schemaName])

  // 物理 catalog 清单（四层定位过滤）：静默加载，失败不阻塞检索
  useEffect(() => {
    let cancelled = false
    AssetCatalogApi.listCatalogs()
      .then((data) => {
        if (!cancelled) setCatalogOptions(data as unknown as { id: string; name: string }[])
      })
      .catch(() => {
        if (!cancelled) setCatalogOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => { search(1) }, [search])

  // 滚动到底自动加载下一页（IntersectionObserver，零新依赖）
  const hasMore = !!result && result.items.length < result.total
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    search(page + 1, true)
  }, [loading, hasMore, page, search])
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loading)

  const openDetail = async (item: SearchItem) => {
    setSelected(item)
    setDetail(null)
    setSubTab('detail')
    setPreview(null)
    try {
      setDetail(await AssetMapApi.detail(item.entity_type, item.entity_id))
    } catch {
      setDetail(null)
    }
  }

  // 数据预览：切到子 tab 时懒加载（纯读）
  useEffect(() => {
    if (subTab !== 'preview' || !selected || preview) return
    let cancelled = false
    const load = async () => {
      setPreviewLoading(true)
      try {
        const data = (await AssetMapApi.preview(selected.entity_type, selected.entity_id, {
          limit: 10,
        })) as unknown as PreviewData
        if (!cancelled) setPreview(data)
      } catch {
        if (!cancelled) setPreview({ message: '数据预览加载失败' })
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [subTab, selected, preview])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 左：检索与结果列表 */}
      <div className="space-y-3 lg:col-span-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词检索表/列/指标/资产（支持中文全文+模糊）"
              ro
            />
          </div>
          <Select value={entityType} onValueChange={(v) => setEntityType(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部类型</option>
            <option value="table">数据表</option>
            <option value="column">字段</option>
            <option value="metric">指标</option>
            <option value="standard">数据标准</option>
            <option value="asset">资产</option>
            <option value="service">数据服务</option>
          </Select>
          <Button onClick={() => search(1)}>
            <Search size={14} className="mr-1" /> 检索
          </Button>
        </div>

        {/* 四层定位过滤：catalog → schema */}
        <div className="flex items-center gap-2" data-ro>
          <div className="w-44">
            <Select value={catalogName} onValueChange={(v) => setCatalogName(Array.isArray(v) ? String(v[0]) : String(v))}>
              <option value="">全部 Catalog</option>
              {catalogOptions.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Input
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="schema 名（可选）"
              ro
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>catalog → schema 四层定位</span>
        </div>

        {result?.routes && (
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            三路召回命中：词元 {result.routes.tokens ?? 0} / 全文 {result.routes.fts ?? 0} / 模糊 {result.routes.trgm ?? 0}（RRF 融合 {result.routes.fused ?? 0}）
          </p>
        )}

        {!!result?.recommendations?.length && (
          <div className="flex flex-wrap items-center gap-1.5" data-ro>
            <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>AI 推荐动作：</span>
            {result.recommendations.map((rec) => (
              <button
                key={rec.text}
                type="button"
                title={rec.description}
                onClick={() => setKeyword(rec.query ?? rec.text)}
                className="rounded-full border px-2.5 py-0.5 text-xs transition-opacity hover:opacity-80"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-card)' }}
                data-ro
              >
                {rec.text}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}
        {error && <p className="py-10 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
        {!loading && !error && result && !result.items.length && (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            未检索到数据。请先在「采集任务」页签执行元数据采集，或调整检索关键词。
          </p>
        )}

        <div className="space-y-2">
          {(result?.items ?? []).map((item) => (
            <button
              key={`${item.entity_type}-${item.entity_id}`}
              onClick={() => openDetail(item)}
              className="w-full rounded-xl border px-4 py-3 text-left transition-opacity hover:opacity-85"
              style={{
                borderColor: selected?.entity_id === item.entity_id ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: 'var(--color-card)',
              }}
              data-ro
            >
              <div className="flex items-center gap-2">
                {item.code && (
                  <span className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.code}</span>
                )}
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.name_zh}</span>
                {item.name_en && (
                  <span className="font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.name_en}</span>
                )}
                <ClassificationBadge level={item.classification_level} short />
                {item.cataloged && (
                  <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(90,216,166,0.15)', color: 'var(--color-success, #10b981)' }}>已编目</span>
                )}
                <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {[item.catalog_name, item.schema_name].filter(Boolean).join(' / ') || item.domain || '-'} · 热度 {item.hot ?? 0}
                </span>
              </div>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
              )}
            </button>
          ))}
        </div>

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }} data-ro>
            {loading ? <Loader2 size={14} className="animate-spin" /> : '滚动加载更多…'}
          </div>
        )}

        {result && result.total > PAGE_SIZE && (
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={result.total}
            onChange={(p) => search(p)}
          />
        )}
      </div>

      {/* 右：资产详情（详情 / 数据预览 / 事件记录） */}
      <div className="space-y-3">
        {selected ? (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <div className="flex gap-1 border-b px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
              {SUB_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSubTab(t.key)}
                  className="flex items-center gap-1 rounded px-2.5 py-1 text-xs transition-colors"
                  style={{
                    backgroundColor: subTab === t.key ? 'var(--color-primary-light)' : 'transparent',
                    color: subTab === t.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}
                  data-ro
                >
                  {t.key === 'preview' && <Eye size={13} />}
                  {t.key === 'events' && <Clock size={13} />}
                  {t.label}
                </button>
              ))}
            </div>

            {subTab === 'detail' &&
              (detail ? (
                <AssetDetailCard data={detail as never} />
              ) : (
                <p className="p-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  详情加载中…
                </p>
              ))}

            {subTab === 'preview' && (
              <div className="p-4">
                {previewLoading && (
                  <div className="flex justify-center py-10">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  </div>
                )}
                {!previewLoading && preview && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                        {preview.table || selected.name_en || selected.entity_id}
                      </span>
                      {preview.classification_level && <ClassificationBadge level={preview.classification_level} short />}
                      {preview.masked && (
                        <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(255,180,60,0.15)', color: '#d97706' }}>
                          已脱敏
                        </span>
                      )}
                      <span className="ml-auto text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        共 {preview.total ?? 0} 行
                      </span>
                    </div>
                    {preview.sample_note && (
                      <p className="text-xs" style={{ color: '#d97706' }}>{preview.sample_note}</p>
                    )}
                    {preview.message ? (
                      <p className="py-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {preview.message}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs" data-ro>
                          <thead>
                            <tr>
                              {(preview.columns ?? []).map((c, i) => (
                                <th key={i} className="whitespace-nowrap border px-2 py-1.5 text-left font-medium" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                  {String(c)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(preview.rows ?? []).map((row, ri) => (
                              <tr key={ri}>
                                {(row as unknown[]).map((cell, ci) => (
                                  <td key={ci} className="max-w-[160px] truncate border px-2 py-1" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                    {cell === null || cell === undefined ? '—' : String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {subTab === 'events' && (
              <div className="max-h-[480px] space-y-3 overflow-y-auto p-4">
                {!!((detail?.governance_items as GovernanceItem[]) ?? []).length && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                      治理项（{((detail?.governance_items as GovernanceItem[]) ?? []).length}）
                    </p>
                    <div className="space-y-1">
                      {((detail?.governance_items as GovernanceItem[]) ?? []).map((g) => (
                        <p key={g.id} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          · {g.title}（{g.severity}，扣 {g.deduct_score}）
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {!!((detail?.timeline as TimelineEvent[]) ?? []).length && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                      事件时间线（{((detail?.timeline as TimelineEvent[]) ?? []).length}）
                    </p>
                    <div className="space-y-1.5">
                      {((detail?.timeline as TimelineEvent[]) ?? []).map((e, i) => (
                        <p key={`${e.event_type}-${i}`} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          · {e.title}
                          <span className="ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            {e.time ? new Date(e.time).toLocaleString() : '—'}
                            {e.status ? ` · ${e.status}` : ''}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {!((detail?.governance_items as GovernanceItem[]) ?? []).length &&
                  !((detail?.timeline as TimelineEvent[]) ?? []).length && (
                  <p className="py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    暂无治理项与事件记录
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="rounded-xl border p-6 text-center text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
            点击左侧检索结果查看资产详情（基础信息/字段列表/负责人/热度/质量评分/安全分级）
          </p>
        )}
      </div>
    </div>
  )
}
