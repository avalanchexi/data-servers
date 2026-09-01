/**
 * 数据质量 — 规则模板库页签
 * 六维对齐 GB/T 36344-2018（完整性/唯一性/有效性/一致性/准确性/及时性），
 * 内置 ≥20 模板 + 自定义 SQL 规则 + AI 规则推荐入口
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw, Trash2, Play } from 'lucide-react'
import { AssetQualityApi } from '../../../../../api/asset'
import { DataSourceApi, type DataSourceItem } from '../../../../../api/datasource'
import { DatasetApi, type BizTable } from '../../../../../api/dataset'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination, SearchableSelect, Select } from '../../../../../components/ui'

interface Template {
  id: string
  code: string
  name: string
  dimension: string
  scope: string
  category?: string
  description?: string
  sql_template?: string
  params?: Array<{ key: string; label?: string; type?: string; default?: unknown }>
  severity?: string
  source?: string
  builtin?: boolean
}

const SCOPE_LABELS: Record<string, string> = {
  table: '表级',
  field: '字段级',
  cross_table: '跨表',
  cross_source: '跨源',
}

const SEVERITY_LABELS: Record<string, string> = {
  low: '低危',
  medium: '中危',
  high: '高危',
  critical: '严重',
}

interface RuleRow {
  id: string
  name: string
  template_id?: string
  template_name?: string
  dimension?: string
  datasource_id?: string
  table_name?: string
  status: string
  rule_sql?: string
}

const PAGE_SIZE = 10
const DIMENSION_LABELS: Record<string, string> = {
  completeness: '完整性',
  uniqueness: '唯一性',
  validity: '有效性',
  consistency: '一致性',
  accuracy: '准确性',
  timeliness: '及时性',
}

export default function RuleTemplateTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [expandedTpl, setExpandedTpl] = useState<string | null>(null)
  const [rules, setRules] = useState<RuleRow[]>([])
  const [deleting, setDeleting] = useState<RuleRow | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [dimensionFilter, setDimensionFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', dimension: 'completeness', datasource_id: '', table_name: '', rule_sql: '' })
  const [saving, setSaving] = useState(false)

  // 数据源/表选项（名称下拉选择，表随数据源联动）
  const [datasources, setDatasources] = useState<DataSourceItem[]>([])
  const [tables, setTables] = useState<BizTable[]>([])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      setTemplates((await AssetQualityApi.listTemplates()) as unknown as Template[])
      const data = await AssetQualityApi.listRules({
        dimension: dimensionFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setRules((data.items ?? []) as unknown as RuleRow[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载规则模板失败')
    } finally {
      setLoading(false)
    }
  }, [dimensionFilter])

  useEffect(() => { load(1) }, [load])

  // 加载数据源列表供名称下拉选择
  useEffect(() => {
    DataSourceApi.list({ limit: 200 }).then((res) => {
      setDatasources((res.items ?? []) as DataSourceItem[])
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  // 选中数据源后联动加载其表清单（供表名下拉选择）
  useEffect(() => {
    if (!form.datasource_id) {
      setTables([])
      return
    }
    let alive = true
    DatasetApi.listTablesById(form.datasource_id).then((items) => {
      if (alive) setTables(items ?? [])
    }).catch(() => { if (alive) setTables([]) })
    return () => { alive = false }
  }, [form.datasource_id])

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await AssetQualityApi.createRule({
        ...form,
        rule_sql: form.rule_sql || undefined,
        datasource_id: form.datasource_id || undefined,
        table_name: form.table_name || undefined,
      })
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = (rule: RuleRow) => {
    setDeleting(rule)
  }

  const doDelete = async () => {
    if (!deleting) return
    try {
      await AssetQualityApi.deleteRule(deleting.id)
      setDeleting(null)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const run = async (rule: RuleRow) => {
    try {
      await AssetQualityApi.runRule(rule.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '运行失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={dimensionFilter} onValueChange={(v) => setDimensionFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">六维全部</option>
            {Object.entries(DIMENSION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
        <Button onClick={() => { setForm({ name: '', dimension: 'completeness', datasource_id: '', table_name: '', rule_sql: '' }); setModalOpen(true) }} data-ro>
          <Plus size={14} className="mr-1" /> 自定义规则
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {/* 内置模板库 */}
      {!loading && !!templates.length && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            内置模板（{templates.length} 个，六维对齐 GB/T 36344-2018，行业最佳实践预置）
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="cursor-pointer rounded-lg border px-3 py-2 transition-colors hover:border-current"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}
                onClick={() => setExpandedTpl(expandedTpl === tpl.id ? null : tpl.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-card-elevated)', color: 'var(--color-text-secondary)' }}>
                    {DIMENSION_LABELS[tpl.dimension] ?? tpl.dimension}
                  </span>
                  <span className="truncate text-sm font-medium" style={{ color: 'var(--color-text)' }}>{tpl.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{tpl.code}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {tpl.scope && (
                    <span className="rounded border px-1 py-px" style={{ borderColor: 'var(--color-border)' }}>
                      {SCOPE_LABELS[tpl.scope] ?? tpl.scope}
                    </span>
                  )}
                  {tpl.category && <span>{tpl.category}</span>}
                  {tpl.severity && <span>{SEVERITY_LABELS[tpl.severity] ?? tpl.severity}</span>}
                </div>
                {tpl.description && (
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{tpl.description}</p>
                )}
                {tpl.source && (
                  <p className="mt-1 truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    来源：{tpl.source}
                  </p>
                )}
                {expandedTpl === tpl.id && tpl.sql_template && (
                  <pre
                    className="mt-2 overflow-x-auto rounded-lg p-2 font-mono text-xs"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                  >
                    {tpl.sql_template}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 自定义规则 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>自定义规则（SQL 规则 + AI 推荐）</h4>
        {!loading && !rules.length ? (
          <EmptyState
            icon="folder"
            title="暂无自定义规则"
            description="基于内置模板或自定义 SQL 创建规则；AI 规则推荐见治理 Agent。"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                  <th className="px-4 py-3 font-medium">规则</th>
                  <th className="px-4 py-3 font-medium">维度</th>
                  <th className="px-4 py-3 font-medium">数据源/表</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{rule.name}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {DIMENSION_LABELS[rule.dimension ?? ''] ?? rule.dimension ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {rule.datasource_id
                        ? `${datasources.find((d) => d.id === rule.datasource_id)?.name ?? rule.datasource_id}${rule.table_name ? `.${rule.table_name}` : ''}`
                        : (rule.table_name ?? '-')}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{rule.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => run(rule)} title="立即校验" data-ro>
                          <Play size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(rule)} title="删除" data-ro>
                          <Trash2 size={13} />
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

      {/* 自定义规则弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="自定义质量规则">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              规则名称 <span style={{ color: 'var(--color-error)' }}>*</span>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：订单金额非负" data-ro />
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              质量维度
              <Select value={form.dimension} onValueChange={(v) => setForm({ ...form, dimension: Array.isArray(v) ? String(v[0]) : String(v) })} ro>
                {Object.entries(DIMENSION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              数据源
              <SearchableSelect
                value={form.datasource_id}
                onChange={(v) => setForm({ ...form, datasource_id: v, table_name: '' })}
                placeholder="全部（不限定）"
                items={[
                  { value: '', label: '全部（不限定）' },
                  ...datasources.map((d) => ({ value: d.id, label: d.name })),
                ]}
                ro
              />
            </label>
            <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              表名
              <SearchableSelect
                value={form.table_name}
                onChange={(v) => setForm({ ...form, table_name: v })}
                placeholder={form.datasource_id ? '可选，搜索选择表' : '请先选择数据源'}
                items={[
                  { value: '', label: '不限表' },
                  ...tables.map((t) => ({ value: t.table_name, label: t.chinese_name ? `${t.table_name}（${t.chinese_name}）` : t.table_name })),
                ]}
                ro
              />
            </label>
          </div>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            自定义 SQL（返回违规行）
            <textarea
              value={form.rule_sql}
              onChange={(e) => setForm({ ...form, rule_sql: e.target.value })}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              placeholder="SELECT ... WHERE 违规条件"
              data-ro
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 删除规则确认 */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除规则"
        message={`确认删除规则「${deleting?.name ?? ''}」？`}
        type="danger"
        confirmText="删除"
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
