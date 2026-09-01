/**
 * 数据服务 — 服务注册页签
 * dataset/semantic_model 封装为参数化 SQL 服务（复用 dataqa 引擎执行）；
 * 发布为 MCP 工具（复用 shared/mcp/registry）；状态机 draft/published/offline
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, Rocket } from 'lucide-react'
import { AssetServiceApi } from '../../../../../api/asset'
import { DatasetApi, type DatasetItem } from '../../../../../api/dataset'
import { SemanticLayerApi, type SemanticModel } from '../../../../../api/semantic-layer'
import { Button, EmptyState, Input, Modal, Pagination, SearchableSelect, Select, SemanticModelSelect, Textarea } from '../../../../../components/ui'

interface ServiceRow {
  id: string
  code: string
  name: string
  entity_type?: string
  entity_id?: string
  sql_text?: string
  status: string
  mcp_published?: boolean
  created_by?: string
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  published: '已上架',
  offline: '已下线',
}

export default function ServiceRegistryTab() {
  const [rows, setRows] = useState<ServiceRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ServiceRow | null>(null)
  const [form, setForm] = useState({ code: '', name: '', entity_type: 'dataset', entity_id: '', sql_text: '' })
  const [saving, setSaving] = useState(false)

  // 封装对象选项（数据集名称 / 语义模型编码+名称）
  const [datasets, setDatasets] = useState<DatasetItem[]>([])
  const [models, setModels] = useState<SemanticModel[]>([])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetServiceApi.listServices({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as ServiceRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载服务列表失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  // 加载数据集与语义模型列表供封装对象下拉选择
  useEffect(() => {
    Promise.all([
      DatasetApi.list({ limit: 200 }),
      SemanticLayerApi.list({ limit: 200 }),
    ]).then(([ds, sm]) => {
      setDatasets((ds.items ?? []) as DatasetItem[])
      setModels(((sm as { items?: SemanticModel[] }).items ?? []) as SemanticModel[])
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  const entityDisplay = (row: ServiceRow) => {
    if (!row.entity_type || !row.entity_id) return '-'
    if (row.entity_type === 'dataset') {
      const d = datasets.find((x) => x.id === row.entity_id)
      return d ? `${d.name}` : row.entity_id
    }
    if (row.entity_type === 'semantic_model') {
      const m = models.find((x) => x.id === row.entity_id)
      return m ? `${m.label_zh}（${m.name}）` : row.entity_id
    }
    return `${row.entity_type} / ${row.entity_id}`
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', name: '', entity_type: 'dataset', entity_id: '', sql_text: '' })
    setShowForm(true)
  }

  const openEdit = (row: ServiceRow) => {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      entity_type: row.entity_type === 'semantic_model' ? 'semantic_model' : 'dataset',
      entity_id: row.entity_id ?? '',
      sql_text: row.sql_text ?? '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        name: form.name,
        entity_type: form.entity_type,
        entity_id: form.entity_id || undefined,
        sql_text: form.sql_text || undefined,
      }
      if (editing) {
        await AssetServiceApi.updateService(editing.id, { name: payload.name, sql_text: payload.sql_text })
      } else {
        await AssetServiceApi.createService(payload)
      }
      setShowForm(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (row: ServiceRow, target: string) => {
    try {
      await AssetServiceApi.changeServiceStatus(row.id, { target })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态变更失败')
    }
  }

  const publishMcp = async (row: ServiceRow) => {
    try {
      await AssetServiceApi.publishMcp(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'MCP 发布失败')
    }
  }

  const remove = async (row: ServiceRow) => {
    try {
      await AssetServiceApi.deleteService(row.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已上架</option>
            <option value="offline">已下线</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={openCreate} data-ro>
            <Plus size={14} className="mr-1" /> 注册服务
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="database"
          title="暂无注册服务"
          description="将 dataset/semantic_model 封装为参数化 SQL 服务（复用 dataqa 引擎执行），发布为 MCP 工具。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">服务</th>
                <th className="px-4 py-3 font-medium">封装对象</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">MCP</th>
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
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.entity_type ? `${row.entity_type === 'dataset' ? '数据集' : row.entity_type === 'semantic_model' ? '语义模型' : row.entity_type}${row.entity_id ? ` / ${entityDisplay(row)}` : ''}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'published' ? 'var(--color-success-bg)' : row.status === 'offline' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)',
                        color: row.status === 'published' ? 'var(--color-success)' : row.status === 'offline' ? 'var(--color-error)' : 'var(--color-warning)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.mcp_published ? (
                      <span className="rounded px-2 py-0.5" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>已发布</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(row)} data-ro>编辑</Button>
                      {row.status === 'draft' && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(row, 'published')} data-ro>上架</Button>
                      )}
                      {row.status === 'published' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => publishMcp(row)} data-ro>
                            <Rocket size={13} className="mr-1" /> MCP 发布
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => changeStatus(row, 'offline')} data-ro>下线</Button>
                        </>
                      )}
                      {row.status === 'offline' && (
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(row, 'published')} data-ro>重新上架</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(row)} data-ro>
                        <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
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

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? '编辑服务' : '注册服务'}
        size="lg"
        maskClosable={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
            <Button variant="primary" onClick={save} loading={saving} disabled={!form.code.trim() || !form.name.trim()} data-ro>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                服务编码 {!editing && <span style={{ color: 'var(--color-error)' }}>*</span>}
              </label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如：cust_profile_query" disabled={!!editing} />
              <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {editing ? '服务编码创建后不可修改' : '小写字母、数字、下划线，全局唯一'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                服务名称 <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：客户画像查询服务" />
              <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                简明描述服务的业务含义，便于识别与检索
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                封装对象类型
              </label>
              <Select
                value={form.entity_type}
                onValueChange={(v) => setForm({ ...form, entity_type: Array.isArray(v) ? String(v[0]) : String(v), entity_id: '' })}
                disabled={!!editing}
              >
                <option value="dataset">数据集（dataset）</option>
                <option value="semantic_model">语义模型（semantic_model）</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                封装对象
              </label>
              {form.entity_type === 'dataset' ? (
                <SearchableSelect
                  value={form.entity_id}
                  onChange={(v) => setForm({ ...form, entity_id: v })}
                  placeholder="搜索选择数据集"
                  items={datasets.map((d) => ({ value: d.id, label: d.name }))}
                  size="md"
                  disabled={!!editing}
                />
              ) : (
                <SemanticModelSelect
                  value={form.entity_id}
                  onChange={(v) => setForm({ ...form, entity_id: v })}
                  placeholder="搜索选择语义模型"
                  options={models.map((m) => ({ value: m.id, label: m.label_zh, subLabel: m.name }))}
                  size="md"
                  disabled={!!editing}
                />
              )}
              <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {editing ? '封装对象创建后不可修改' : '服务将封装该对象，通过参数化 SQL 对外提供查询能力'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              参数化 SQL{' '}
              <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>（可选，不填则直接查询封装对象）</span>
            </label>
            <Textarea
              value={form.sql_text}
              onChange={(e) => setForm({ ...form, sql_text: e.target.value })}
              placeholder={'SELECT * FROM orders\nWHERE dept = :dept AND created_at >= :start_date'}
              rows={4}
            />
            <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              支持 :name 命名参数，由 dataqa 引擎执行
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
