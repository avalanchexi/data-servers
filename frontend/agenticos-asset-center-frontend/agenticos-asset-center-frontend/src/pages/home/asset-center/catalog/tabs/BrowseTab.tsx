/**
 * 资产目录 — 目录浏览页签
 * 统一命名空间 v3：物理 Catalog → schema → object 三级浏览 +
 * Metastore 全局层（全局本体）入口 + 业务目录树（域侧挂标签过滤）
 */
import { useCallback, useEffect, useState } from 'react'
import { Boxes, Loader2 } from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import { Pagination, Select } from '../../../../../components/ui'
import CatalogTree, { type CatalogNode } from '../../../../../components/asset/CatalogTree'
import { ClassificationBadge } from '../../../../../components/asset'

interface AssetItem {
  id: string
  name: string
  object_type?: string
  entity_type?: string
  status: string
  domain?: string
  domains?: string[]
  schema_name?: string
  catalog_name?: string
  owner_name?: string
  classification_level?: string
  quality_score?: number
}

interface PhysCatalog {
  id: string
  name: string
  catalog_type: string
  provider?: string
}

interface SchemaStat {
  schema_name: string
  count: number
}

const PAGE_SIZE = 10
const TYPE_LABELS: Record<string, string> = {
  table: '表', view: '视图', column: '字段', metric: '指标', dataset: '数据集', api: 'API',
  datasource: '数据源', service: '服务', standard: '标准',
  semantic_model: '语义模型', ontology_domain: '本体域', fileset: '文件集', model: 'AI 模型',
}

export default function BrowseTab() {
  // ── 物理 Catalog 三级浏览 ──
  const [catalogs, setCatalogs] = useState<PhysCatalog[]>([])
  const [catalogId, setCatalogId] = useState('')
  const [schemas, setSchemas] = useState<SchemaStat[]>([])
  const [schemaName, setSchemaName] = useState('')
  // ── 业务目录树（域侧挂标签过滤） ──
  const [nodes, setNodes] = useState<CatalogNode[]>([])
  const [selectedNode, setSelectedNode] = useState<CatalogNode | null>(null)
  // ── 对象列表 ──
  const [mode, setMode] = useState<'catalog' | 'global'>('catalog')
  const [items, setItems] = useState<AssetItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMeta = useCallback(async () => {
    try {
      const [cats, tree] = await Promise.all([
        AssetCatalogApi.listCatalogs(),
        AssetCatalogApi.listCategoryTree(),
      ])
      setCatalogs(cats as unknown as PhysCatalog[])
      setNodes(tree as unknown as CatalogNode[])
    } catch {
      setCatalogs([])
      setNodes([])
    }
  }, [])

  useEffect(() => { loadMeta() }, [loadMeta])

  // catalog 变化时拉取 schema 分布
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!catalogId || mode !== 'catalog') { setSchemas([]); return }
      try {
        const res = (await AssetCatalogApi.listCatalogSchemas(catalogId)) as unknown as { schemas?: SchemaStat[] }
        if (!cancelled) {
          setSchemas(res.schemas ?? [])
          setSchemaName('')
        }
      } catch {
        if (!cancelled) setSchemas([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [catalogId, mode])

  const loadItems = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (mode === 'global') {
        data = await AssetCatalogApi.listGlobalObjects({
          limit: PAGE_SIZE,
          offset: (p - 1) * PAGE_SIZE,
        })
      } else if (catalogId) {
        data = await AssetCatalogApi.listCatalogObjects(catalogId, {
          schema_name: schemaName || undefined,
          limit: PAGE_SIZE,
          offset: (p - 1) * PAGE_SIZE,
        })
      } else {
        data = await AssetCatalogApi.listItems({
          domain: selectedNode?.name || undefined,
          status: 'published',
          limit: PAGE_SIZE,
          offset: (p - 1) * PAGE_SIZE,
        })
      }
      setItems((data.items ?? []) as unknown as AssetItem[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载目录资产失败')
    } finally {
      setLoading(false)
    }
  }, [mode, catalogId, schemaName, selectedNode])

  useEffect(() => { loadItems(1) }, [loadItems])

  const onSelectNode = (node: CatalogNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node))
    if (node.id) { setMode('catalog'); setCatalogId('') }
  }

  const typeLabel = (item: AssetItem) =>
    TYPE_LABELS[item.object_type ?? item.entity_type ?? ''] ?? item.object_type ?? item.entity_type ?? '-'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 左：业务目录树 + 全局本体入口 */}
      <div className="space-y-3">
        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <h4 className="mb-2 px-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>业务目录树（域标签）</h4>
          <CatalogTree
            nodes={nodes}
            selectedId={selectedNode?.id}
            onSelect={onSelectNode}
          />
          <p className="mt-2 px-1 text-xs leading-5" style={{ color: 'var(--color-text-tertiary)' }}>
            选中域/类目按 domains 侧挂标签过滤已上架资产；物理寻址请用右侧 Catalog 命名空间。
          </p>
        </div>
        <button
          onClick={() => { setMode('global'); setCatalogId(''); setSelectedNode(null) }}
          className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm hover:opacity-85"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: mode === 'global' ? 'var(--color-primary-bg, rgba(91,143,249,0.12))' : 'var(--color-card)',
            color: mode === 'global' ? 'var(--color-primary)' : 'var(--color-text)',
          }}
        >
          <Boxes size={15} />
          全局本体（Metastore 全局层）
        </button>
      </div>

      {/* 右：Catalog 命名空间浏览 + 对象列表 */}
      <div className="space-y-3 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={mode === 'global' ? '' : catalogId}
            onValueChange={(v) => {
              const val = Array.isArray(v) ? String(v[0]) : String(v)
              setMode('catalog')
              setCatalogId(val)
              setSelectedNode(null)
            }}
            ro
            disabled={mode === 'global'}
          >
            <option value="">全部 Catalog / 按业务域</option>
            {catalogs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.provider === 'semantic' ? '（语义）' : ''}</option>
            ))}
          </Select>
          {mode === 'catalog' && catalogId && schemas.length > 0 && (
            <Select
              value={schemaName}
              onValueChange={(v) => setSchemaName(Array.isArray(v) ? String(v[0]) : String(v))}
              ro
            >
              <option value="">全部 schema</option>
              {schemas.map((s) => (
                <option key={s.schema_name} value={s.schema_name}>{s.schema_name}（{s.count}）</option>
              ))}
            </Select>
          )}
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {mode === 'global'
              ? '全局层：本体域等平台级共享资产（catalog_id=NULL）'
              : catalogId
                ? `命名空间：${catalogs.find((c) => c.id === catalogId)?.name ?? catalogId}${schemaName ? ` / ${schemaName}` : ''}`
                : selectedNode
                  ? `业务域：${selectedNode.name} · 已上架资产`
                  : '全部资产'}
          </span>
        </div>

        {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
        {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

        {!loading && !items.length && (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {mode === 'global' ? '全局层暂无本体域资产' : '该命名空间下暂无资产对象'}
          </p>
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <span
                className="rounded px-2 py-0.5 text-xs"
                style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}
              >
                {typeLabel(item)}
              </span>
              <span className="flex-1 truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.name}</span>
              {item.schema_name && (
                <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-tertiary)' }}>
                  {item.catalog_name ?? ''}{item.catalog_name ? '.' : ''}{item.schema_name}
                </span>
              )}
              <ClassificationBadge level={item.classification_level} short />
              {item.quality_score != null && (
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>质量分 {item.quality_score}</span>
              )}
              <span className="w-20 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.owner_name ?? '-'}</span>
            </div>
          ))}
        </div>

        {total > PAGE_SIZE && (
          <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => loadItems(p)} />
        )}
      </div>
    </div>
  )
}
