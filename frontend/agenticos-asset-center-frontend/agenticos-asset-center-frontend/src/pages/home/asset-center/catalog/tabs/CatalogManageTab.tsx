/**
 * 资产目录 — Catalog 管理页签
 * 统一命名空间 v3：物理 Catalog 一级管理对象专业管理（对标 Unity Catalog / Gravitino）
 * 能力：CRUD（数据源下拉/负责人/公开性/状态/storage_config 绑定）、启用/停用、
 * 绑定/解绑数据源、Polaris 清单同步（下拉选部署）、详情面板（对象/schema 统计 +
 * schema 分布 + 继承诊断）、业务目录树管理（迁移自数据地图类目管理）。
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Boxes, ChevronDown, ChevronRight, Database, Layers, Link2,
  Loader2, Pencil, Plus, RefreshCw, Trash2,
} from 'lucide-react'
import { AssetCatalogApi } from '../../../../../api/asset'
import { DataSourceApi, type DataSourceItem } from '../../../../../api/datasource'
import { Button, ConfirmDialog, EmptyState, Input, Modal, RadioGroup, Select } from '../../../../../components/ui'
import CatalogTree, { type CatalogNode } from '../../../../../components/asset/CatalogTree'

interface SchemaStat {
  schema_name: string
  count: number
}

interface PhysCatalog {
  id: string
  name: string
  catalog_type: string
  provider?: string
  datasource_id?: string
  owner_id?: string
  owner_name?: string
  status?: string
  description?: string
  storage_config?: Record<string, unknown>
  is_public?: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
  object_count?: number
  schema_count?: number
}

interface CatalogDetail extends PhysCatalog {
  schemas: SchemaStat[]
  inheritable: boolean
}

interface CatalogForm {
  name: string
  catalog_type: string
  provider: string
  datasource_id: string
  status: string
  owner_name: string
  is_public: boolean
  description: string
  storage_config_text: string
}

const TYPE_LABELS: Record<string, string> = {
  managed: '内部托管', external: '外部直映', foreign: '联邦外联',
}
const PROVIDER_LABELS: Record<string, string> = {
  polaris: 'Polaris 数据湖', hive: 'Hive Metastore', iceberg_rest: 'Iceberg REST',
  postgresql: 'PostgreSQL', mysql: 'MySQL', hdfs: 'HDFS', s3: 'S3',
  vector: '向量库', model: 'AI 模型', semantic: '内建语义目录',
}
// 新建时可选 provider（semantic 由系统内建，不允许手工创建）
const PROVIDER_OPTIONS = Object.entries(PROVIDER_LABELS)
  .filter(([v]) => v !== 'semantic')
  .map(([value, label]) => ({ value, label }))

const EMPTY_FORM: CatalogForm = {
  name: '', catalog_type: 'external', provider: 'polaris', datasource_id: '',
  status: 'enabled', owner_name: '', is_public: false, description: '', storage_config_text: '',
}

export default function CatalogManageTab() {
  // ── Catalog 列表 ──
  const [catalogs, setCatalogs] = useState<PhysCatalog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<CatalogDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  // ── 数据源选项（绑定/表单/同步下拉） ──
  const [datasources, setDatasources] = useState<DataSourceItem[]>([])
  // ── 业务目录树 ──
  const [nodes, setNodes] = useState<CatalogNode[]>([])
  const [treeOpen, setTreeOpen] = useState(false)
  const [selected, setSelected] = useState<CatalogNode | null>(null)
  // ── 弹窗 ──
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CatalogForm>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [bindOpen, setBindOpen] = useState(false)
  const [bindDsId, setBindDsId] = useState('')
  const [syncOpen, setSyncOpen] = useState(false)
  const [syncDsId, setSyncDsId] = useState('')
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [deletingCat, setDeletingCat] = useState<PhysCatalog | null>(null)
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [parent, setParent] = useState<CatalogNode | null>(null)
  const [nodeName, setNodeName] = useState('')
  const [deletingNode, setDeletingNode] = useState<CatalogNode | null>(null)

  const loadCatalogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = (await AssetCatalogApi.listCatalogs({ with_stats: true })) as unknown as PhysCatalog[]
      setCatalogs(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 Catalog 失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTree = useCallback(async () => {
    try {
      const data = await AssetCatalogApi.listCategoryTree()
      setNodes(data as unknown as CatalogNode[])
    } catch {
      setNodes([])
    }
  }, [])

  useEffect(() => {
    loadCatalogs()
    loadTree()
    DataSourceApi.list({ limit: 200 })
      .then((res) => setDatasources((res.items ?? []) as DataSourceItem[]))
      .catch(() => { /* 数据源下拉加载失败不阻塞主流程 */ })
  }, [loadCatalogs, loadTree])

  const loadDetail = useCallback(async (catalogId: string) => {
    setDetailLoading(true)
    try {
      const data = await AssetCatalogApi.getCatalog(catalogId)
      setDetail(data as unknown as CatalogDetail)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 Catalog 详情失败')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const selectCatalog = (cat: PhysCatalog) => {
    setSelectedId(cat.id)
    loadDetail(cat.id)
  }

  const refreshAfterWrite = async () => {
    await loadCatalogs()
    if (selectedId) loadDetail(selectedId)
  }

  const dsName = (id?: string) => datasources.find((d) => d.id === id)?.name ?? id ?? '-'
  // 后端 SysDatasource.type 支持 polaris（数据湖部署），前端类型枚举滞后，用字符串比较
  const polarisDs = datasources.filter((d) => String(d.type) === 'polaris')

  // ── Catalog 表单 ──
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setCatModalOpen(true)
  }

  const openEdit = (cat: PhysCatalog) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      catalog_type: cat.catalog_type,
      provider: cat.provider ?? 'polaris',
      datasource_id: cat.datasource_id ?? '',
      status: cat.status ?? 'enabled',
      owner_name: cat.owner_name ?? '',
      is_public: Boolean(cat.is_public),
      description: cat.description ?? '',
      storage_config_text: cat.storage_config ? JSON.stringify(cat.storage_config, null, 2) : '',
    })
    setFormError(null)
    setCatModalOpen(true)
  }

  const saveCatalog = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setFormError(null)
    let storageConfig: Record<string, unknown> | undefined
    if (form.storage_config_text.trim()) {
      try {
        const parsed = JSON.parse(form.storage_config_text)
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('storage_config 必须是 JSON 对象')
        }
        storageConfig = parsed
      } catch (e) {
        setFormError(`storage_config 不是合法 JSON 对象：${e instanceof Error ? e.message : String(e)}`)
        setSaving(false)
        return
      }
    }
    try {
      const payload = {
        name: form.name.trim(),
        catalog_type: form.catalog_type,
        provider: form.provider || undefined,
        datasource_id: form.datasource_id || undefined,
        status: form.status,
        owner_name: form.owner_name.trim() || undefined,
        is_public: form.is_public,
        description: form.description.trim() || undefined,
        storage_config: storageConfig,
      }
      if (editingId) {
        await AssetCatalogApi.updateCatalog(editingId, payload)
      } else {
        await AssetCatalogApi.createCatalog(payload)
      }
      setCatModalOpen(false)
      await refreshAfterWrite()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存 Catalog 失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (cat: PhysCatalog) => {
    const target = cat.status === 'disabled' ? 'enabled' : 'disabled'
    try {
      await AssetCatalogApi.updateCatalog(cat.id, { status: target })
      await refreshAfterWrite()
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态变更失败')
    }
  }

  const saveBind = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await AssetCatalogApi.bindCatalogDatasource(selectedId, bindDsId || null)
      setBindOpen(false)
      await refreshAfterWrite()
    } catch (e) {
      setError(e instanceof Error ? e.message : '绑定数据源失败')
    } finally {
      setSaving(false)
    }
  }

  const doSyncPolaris = async () => {
    if (!syncDsId) return
    setSaving(true)
    setSyncMsg(null)
    try {
      const res = (await AssetCatalogApi.syncPolarisCatalogs(syncDsId)) as unknown as {
        created?: number; updated?: number; catalogs?: string[]
      }
      setSyncMsg(`同步完成：新建 ${res.created ?? 0} 个，更新 ${res.updated ?? 0} 个（${(res.catalogs ?? []).join('、') || '无'}）`)
      await loadCatalogs()
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : '同步失败')
    } finally {
      setSaving(false)
    }
  }

  const doDeleteCatalog = async () => {
    if (!deletingCat) return
    try {
      await AssetCatalogApi.deleteCatalog(deletingCat.id)
      if (selectedId === deletingCat.id) { setSelectedId(''); setDetail(null) }
      setDeletingCat(null)
      await loadCatalogs()
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  // ── 业务目录树操作 ──
  const openCreateNode = (parentNode: CatalogNode) => {
    setParent(parentNode.id ? parentNode : null)
    setNodeName('')
    setNodeModalOpen(true)
  }

  const saveNode = async () => {
    if (!nodeName.trim()) return
    setSaving(true)
    try {
      await AssetCatalogApi.createCategoryNode({
        name: nodeName.trim(),
        type: parent ? 'category' : 'domain',
        parent_id: parent?.id || undefined,
      })
      setNodeModalOpen(false)
      loadTree()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存目录节点失败')
    } finally {
      setSaving(false)
    }
  }

  const doDeleteNode = async () => {
    if (!deletingNode) return
    try {
      await AssetCatalogApi.deleteCategoryNode(deletingNode.id)
      if (selected?.id === deletingNode.id) setSelected(null)
      setDeletingNode(null)
      loadTree()
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除目录节点失败')
    }
  }

  const selectedCat = catalogs.find((c) => c.id === selectedId)
  const isBuiltin = (cat?: PhysCatalog) => cat?.provider === 'semantic'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* 左：Catalog 列表 */}
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              物理 Catalog（权限继承起点）
            </h4>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setSyncDsId(''); setSyncMsg(null); setSyncOpen(true) }}>
                <RefreshCw size={13} className="mr-1" /> 同步 Polaris
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus size={13} className="mr-1" /> 新建
              </Button>
            </div>
          </div>

          {/* Metastore 全局层说明 */}
          <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-text-tertiary)' }}>
            <Boxes size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <span>
              Metastore 全局层（catalog_id=NULL）承载本体域等跨 catalog 共享资产，
              不隶属任何 catalog 继承链，可在「目录浏览」页签经全局本体入口查看。
            </span>
          </div>

          {error && <p className="py-2 text-center text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>}
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
          ) : !catalogs.length ? (
            <EmptyState title="暂无 Catalog" description="新建外部绑定或联邦外联 Catalog，内建 semantic 目录将在首次访问时自动创建。" />
          ) : (
            <div className="space-y-2">
              {catalogs.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => selectCatalog(cat)}
                  className="w-full rounded-xl border px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: selectedId === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: selectedId === cat.id ? 'var(--color-primary-bg, rgba(91,143,249,0.08))' : 'var(--color-card)',
                  }}
                  data-ro
                >
                  <div className="flex items-center gap-2">
                    <Database size={15} style={{ color: 'var(--color-primary)' }} />
                    <span className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{cat.name}</span>
                    {cat.provider === 'semantic' && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--color-primary-bg, rgba(91,143,249,0.12))', color: 'var(--color-primary)' }}>内建</span>
                    )}
                    {cat.status === 'disabled' && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-tertiary)' }}>已停用</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    <span>{TYPE_LABELS[cat.catalog_type] ?? cat.catalog_type}</span>
                    <span>·</span>
                    <span>{PROVIDER_LABELS[cat.provider ?? ''] ?? cat.provider ?? '-'}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    <span>{cat.object_count ?? 0} 个对象</span>
                    <span>·</span>
                    <span>{cat.schema_count ?? 0} 个 schema</span>
                    <span>·</span>
                    <span className="truncate">{cat.owner_name ?? '未设负责人'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右：详情面板 */}
        <div className="lg:col-span-3">
          {!selectedId ? (
            <EmptyState title="选择左侧 Catalog 查看详情" description="详情含基础信息、存储绑定、schema 分布与权限继承诊断。" />
          ) : detailLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
          ) : detail ? (
            <div className="space-y-3">
              {/* 头部 + 操作 */}
              <div className="flex flex-wrap items-center gap-2">
                <Database size={17} style={{ color: 'var(--color-primary)' }} />
                <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{detail.name}</span>
                <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}>
                  {TYPE_LABELS[detail.catalog_type] ?? detail.catalog_type}
                </span>
                <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}>
                  {PROVIDER_LABELS[detail.provider ?? ''] ?? detail.provider ?? '-'}
                </span>
                {detail.status === 'disabled' && (
                  <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-error-bg, rgba(245,34,45,0.1))', color: 'var(--color-error)' }}>已停用</span>
                )}
                {!isBuiltin(detail) && (
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(detail)}>
                      <Pencil size={13} className="mr-1" /> 编辑
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleStatus(detail)}>
                      {detail.status === 'disabled' ? '启用' : '停用'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setBindDsId(detail.datasource_id ?? ''); setBindOpen(true) }}>
                      <Link2 size={13} className="mr-1" /> 数据源
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingCat(detail)}>
                      <Trash2 size={13} className="mr-1" style={{ color: 'var(--color-error)' }} />
                      <span style={{ color: 'var(--color-error)' }}>删除</span>
                    </Button>
                  </div>
                )}
              </div>
              {detail.description && (
                <p className="text-sm leading-5" style={{ color: 'var(--color-text-secondary)' }}>{detail.description}</p>
              )}

              {/* 基础信息 */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border p-4 sm:grid-cols-3"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                {[
                  ['绑定数据源', dsName(detail.datasource_id)],
                  ['负责人', detail.owner_name ?? '-'],
                  ['公开性', detail.is_public ? '公开' : '私有'],
                  ['对象数', String(detail.object_count)],
                  ['Schema 数', String(detail.schema_count)],
                  ['创建时间', detail.created_at ? new Date(detail.created_at).toLocaleString() : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
                    <p className="mt-0.5 truncate text-sm" style={{ color: 'var(--color-text)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* storage_config */}
              {detail.storage_config && Object.keys(detail.storage_config).length > 0 && (
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                  <h5 className="mb-2 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>存储绑定（storage_config）</h5>
                  <div className="space-y-1.5">
                    {Object.entries(detail.storage_config).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 rounded px-1.5 py-0.5 font-mono" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}>{k}</span>
                        <span className="break-all" style={{ color: 'var(--color-text)' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* schema 分布 */}
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
                <div className="mb-2 flex items-center gap-2">
                  <Layers size={13} style={{ color: 'var(--color-primary)' }} />
                  <h5 className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Schema 分布（第一级命名空间）</h5>
                </div>
                {!detail.schemas.length ? (
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>暂无 schema 级资产对象</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detail.schemas.map((s) => (
                      <span key={s.schema_name} className="rounded-lg border px-2.5 py-1 text-xs"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {s.schema_name} <span style={{ color: 'var(--color-primary)' }}>{s.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 继承诊断 */}
              <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-text-tertiary)' }}>
                <Boxes size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                <span>
                  权限继承起点：catalog 下 {detail.object_count} 个对象默认继承 catalog 级权限；
                  {detail.inheritable ? '删除保护已生效（存在对象时拒绝删除）。' : '继承链异常，请检查子对象归属。'}
                </span>
              </div>
            </div>
          ) : (
            <EmptyState title="详情加载失败" description="请重试或联系管理员。" />
          )}
        </div>
      </div>

      {/* 业务目录树管理（折叠区） */}
      <div className="rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <button
          onClick={() => setTreeOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
          data-ro
        >
          {treeOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          业务目录树管理（域 → 类目，业务域侧挂标签）
          <span className="ml-auto text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
            业务目录树不参与资产物理寻址，仅作为 domains 标签的管理入口
          </span>
        </button>
        {treeOpen && (
          <div className="border-t px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>物理寻址由上方 Catalog 统一命名空间承担</p>
              <Button size="sm" variant="ghost" onClick={() => openCreateNode({ id: '', name: '根类目' })}>
                <Plus size={13} className="mr-1" /> 新建域
              </Button>
            </div>
            <CatalogTree
              nodes={nodes}
              selectedId={selected?.id}
              onSelect={setSelected}
              onCreateChild={openCreateNode}
              onDelete={setDeletingNode}
            />
          </div>
        )}
      </div>

      {/* 新建/编辑 Catalog 弹窗 */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingId ? '编辑 Catalog' : '新建 Catalog'}>
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Catalog 名 <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：lakehouse / ods / semantic" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              类型
              <select className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={form.catalog_type} onChange={(e) => setForm({ ...form, catalog_type: e.target.value })}>
                <option value="external">external（外部直映）</option>
                <option value="managed">managed（内部托管）</option>
                <option value="foreign">foreign（联邦外联）</option>
              </select>
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Provider
              <select className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                {PROVIDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            绑定数据源（采集与回源路径的权威配置，可留空）
            <Select value={form.datasource_id} onValueChange={(v) => setForm({ ...form, datasource_id: Array.isArray(v) ? String(v[0]) : String(v) })}>
              <option value="">不绑定</option>
              {datasources.map((d) => (
                <option key={d.id} value={d.id}>{d.name}（{d.type}）</option>
              ))}
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              状态
              <select className="mt-1 w-full rounded border px-2 py-1.5 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="enabled">enabled（启用）</option>
                <option value="disabled">disabled（停用）</option>
              </select>
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              负责人
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="负责人姓名" />
            </label>
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            公开性
            <RadioGroup
              name="is_public"
              value={form.is_public ? 'public' : 'private'}
              onChange={(v) => setForm({ ...form, is_public: v === 'public' })}
              options={[
                { value: 'private', label: '私有（仅授权用户可见）' },
                { value: 'public', label: '公开（全员可见）' },
              ]}
            />
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            描述
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="catalog 用途与治理说明" />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            存储配置（storage_config，JSON 对象；凭证不入此表）
            <textarea
              className="mt-1 w-full rounded border px-2 py-1.5 font-mono text-xs"
              style={{ borderColor: 'var(--color-border)', minHeight: 72 }}
              value={form.storage_config_text}
              onChange={(e) => setForm({ ...form, storage_config_text: e.target.value })}
              placeholder='{"polaris_catalog": "lake_ods", "default_base_location": "s3://lake/ods"}'
            />
          </label>
          {formError && <p className="text-xs" style={{ color: 'var(--color-error)' }}>{formError}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCatModalOpen(false)}>取消</Button>
          <Button onClick={saveCatalog} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 绑定数据源弹窗 */}
      <Modal open={bindOpen} onClose={() => setBindOpen(false)} title={`绑定数据源 · ${selectedCat?.name ?? ''}`}>
        <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          底层连接（一个连接可被多个 catalog 复用；选择空值解绑）
          <Select value={bindDsId} onValueChange={(v) => setBindDsId(Array.isArray(v) ? String(v[0]) : String(v))}>
            <option value="">解绑（不绑定数据源）</option>
            {datasources.map((d) => (
              <option key={d.id} value={d.id}>{d.name}（{d.type}）</option>
            ))}
          </Select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setBindOpen(false)}>取消</Button>
          <Button onClick={saveBind} disabled={saving}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* Polaris 同步弹窗 */}
      <Modal open={syncOpen} onClose={() => setSyncOpen(false)} title="同步 Polaris Catalog 清单">
        <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Polaris 部署（数据源）<span style={{ color: 'var(--color-error)' }}>*</span>
          <Select value={syncDsId} onValueChange={(v) => setSyncDsId(Array.isArray(v) ? String(v[0]) : String(v))}>
            <option value="">选择 Polaris 数据源</option>
            {polarisDs.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </label>
        {!polarisDs.length && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            暂无 type=polaris 的数据源，请先在数据源管理注册 Polaris 部署。
          </p>
        )}
        {syncMsg && <p className="mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{syncMsg}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSyncOpen(false)}>取消</Button>
          <Button onClick={doSyncPolaris} disabled={saving || !syncDsId}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 同步
          </Button>
        </div>
      </Modal>

      {/* 新建业务目录树节点弹窗 */}
      <Modal open={nodeModalOpen} onClose={() => setNodeModalOpen(false)} title={parent ? `新建类目（${parent.name}）` : '新建业务域'}>
        <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          名称 <span style={{ color: 'var(--color-error)' }}>*</span>
          <Input value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="如：客户域 / 交易域 / 财务域" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNodeModalOpen(false)}>取消</Button>
          <Button onClick={saveNode} disabled={saving || !nodeName.trim()}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={Boolean(deletingCat)}
        title="删除 Catalog"
        message={`确认删除 Catalog「${deletingCat?.name ?? ''}」？catalog 下有资产对象时将被拒绝。`}
        type="danger"
        confirmText="删除"
        onConfirm={doDeleteCatalog}
        onCancel={() => setDeletingCat(null)}
      />
      <ConfirmDialog
        open={Boolean(deletingNode)}
        title="删除目录节点"
        message={`确认删除「${deletingNode?.name ?? ''}」？存在子节点时将被拒绝。`}
        type="danger"
        confirmText="删除"
        onConfirm={doDeleteNode}
        onCancel={() => setDeletingNode(null)}
      />
    </div>
  )
}
