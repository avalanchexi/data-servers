/**
 * 治理评估 — 制度库页签
 * 数据战略/治理组织/数据管家等制度台账（DCMM 制度域举证）
 * 支持：制度登记（含正文）、正文查看（Markdown 渲染）、分类筛选。
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, BookOpen, Eye } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AssetDcmmApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, Select } from '../../../../../components/ui'

interface InstitutionRow {
  id: string
  name: string
  category?: string // strategy | org | steward | lifecycle | classification | quality | asset | standard | security
  version?: string
  status?: string // draft | pending | published | offline
  content?: string | null
  publish_date?: string | null
  owner_name?: string | null
  updated_at?: string
}

const PAGE_SIZE = 10
const CATEGORY_LABELS: Record<string, string> = {
  strategy: '数据战略规划',
  strategy_plan: '战略规划制度',
  strategy_impl: '战略实施制度',
  strategy_eval: '战略评估制度',
  org: '治理组织',
  steward: '数据管家',
  data_culture: '数据文化',
  lifecycle: '数据生命周期',
  classification: '分类分级',
  quality: '数据质量',
  asset: '数据资产',
  standard: '数据标准',
  security: '数据安全',
}
// 制度状态机：draft 草稿 / pending 待发布 / published 已发布 / offline 已下线
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'var(--color-text-tertiary)', bg: 'var(--color-bg)' },
  pending: { label: '待发布', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  published: { label: '已发布', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  offline: { label: '已下线', color: 'var(--color-text-tertiary)', bg: 'var(--color-bg)' },
}

// 制度正文 Markdown 渲染组件映射（表格/标题/列表/引用等，GFM 支持）
// 项目全局 CSS 无表格排版样式，制度文档大量使用表格，此处按项目 CSS 变量风格自定义。
const MD_COMPONENTS: Components = {
  table: ({ children }) => (
    <table style={{ borderCollapse: 'collapse', width: '100%', margin: '12px 0', fontSize: '13px' }}>{children}</table>
  ),
  thead: ({ children }) => (
    <thead style={{ backgroundColor: 'var(--color-bg)' }}>{children}</thead>
  ),
  th: ({ children }) => (
    <th style={{ border: '1px solid var(--color-border)', padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text)' }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ border: '1px solid var(--color-border)', padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{children}</td>
  ),
  h1: ({ children }) => (
    <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '16px 0 10px', color: 'var(--color-text)' }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '18px 0 8px', color: 'var(--color-text)' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '14px 0 6px', color: 'var(--color-text)' }}>{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '12px 0 4px', color: 'var(--color-text)' }}>{children}</h4>
  ),
  p: ({ children }) => (
    <p style={{ margin: '6px 0', color: 'var(--color-text)' }}>{children}</p>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '6px 0', paddingLeft: '20px', listStyle: 'disc', color: 'var(--color-text)' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '6px 0', paddingLeft: '20px', listStyle: 'decimal', color: 'var(--color-text)' }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ margin: '2px 0' }}>{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{ margin: '8px 0', padding: '8px 12px', borderLeft: '3px solid var(--color-primary)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>{children}</blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '12px 0' }} />
  ),
  code: ({ children }) => (
    <code style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>{children}</code>
  ),
}

export default function InstitutionTab() {
  const [rows, setRows] = useState<InstitutionRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'strategy', version: '1.0', content: '' })
  const [saving, setSaving] = useState(false)

  // 制度详情查看（Markdown 正文渲染）
  const [detail, setDetail] = useState<InstitutionRow | null>(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetDcmmApi.listInstitutions({
        category: categoryFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRows((data.items ?? []) as unknown as InstitutionRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载制度库失败')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => { load(1) }, [load])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await AssetDcmmApi.createInstitution({
        name: form.name.trim(),
        category: form.category,
        version: form.version,
        content: form.content.trim() || null,
      })
      setShowForm(false)
      setForm({ name: '', category: 'strategy', version: '1.0', content: '' })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: InstitutionRow) => {
    try {
      await AssetDcmmApi.deleteInstitution(row.id)
      if (detail?.id === row.id) setDetail(null)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const statusMeta = (status?: string) =>
    STATUS_LABELS[status ?? ''] ?? STATUS_LABELS.draft

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部制度</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)} ro>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus size={14} className="mr-1" /> 登记制度
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="制度库为空"
          description="登记数据战略规划/治理章程/数据管家等九制度台账（预置制度随制品存放于 config/data_asset/dcmm_institutions/）。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">制度名称</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">版本</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = statusMeta(row.status)
                return (
                  <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1.5 font-medium text-left hover:opacity-70" onClick={() => setDetail(row)} data-ro>
                        <BookOpen size={14} style={{ color: 'var(--color-primary)' }} /> {row.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {CATEGORY_LABELS[row.category ?? ''] ?? row.category ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.version ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetail(row)} ro title="查看正文">
                          <Eye size={13} style={{ color: 'var(--color-primary)' }} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(row)} title="删除">
                          <Trash2 size={13} style={{ color: 'var(--color-error)' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {/* 制度详情（Markdown 正文查看） */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? '制度详情'} size="xl">
        {detail && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="rounded px-2 py-0.5" style={{ backgroundColor: statusMeta(detail.status).bg, color: statusMeta(detail.status).color }}>
                {statusMeta(detail.status).label}
              </span>
              <span>{CATEGORY_LABELS[detail.category ?? ''] ?? detail.category ?? '-'}</span>
              <span>版本 {detail.version ?? '-'}</span>
              {detail.publish_date && <span>发布于 {new Date(detail.publish_date).toLocaleDateString()}</span>}
              {detail.owner_name && <span>责任人 {detail.owner_name}</span>}
            </div>
            {detail.content ? (
              <div
                className="rounded-lg border p-4 text-sm overflow-auto"
                style={{ borderColor: 'var(--color-border)', maxHeight: '60vh', lineHeight: 1.7 }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{detail.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>该制度暂无正文内容</p>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setDetail(null)} ro>关闭</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 制度登记表单 */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="登记制度">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>制度名称</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：数据质量管理规范" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>分类</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: Array.isArray(v) ? String(v[0]) : String(v) })}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>版本</label>
            <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0" />
          </div>
          <div>
            <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>制度正文（Markdown）</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              placeholder="粘贴制度正文，支持 Markdown 格式"
              className="w-full rounded-lg border p-3 text-sm font-mono outline-none resize-y"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowForm(false)} ro>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
