/**
 * 数据地图 — 采集任务页签
 * 元数据采集任务管理：数据源/库/表级、周期调度、采集日志、水位；
 * 三级并行（数据源→schema→表）+ 并发信号量 + 增量指纹
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Play, Square, Trash2, RefreshCw } from 'lucide-react'
import { AssetCollectApi } from '../../../../../api/asset'
import { DataSourceApi, type DataSourceItem } from '../../../../../api/datasource'
import { Button, ConfirmDialog, EmptyState, Input, Modal, Pagination, SearchableSelect, Select } from '../../../../../components/ui'

interface Task {
  id: string
  name: string
  datasource_id?: string
  datasource_name?: string
  scope?: Record<string, unknown>
  schedule_config?: { cron?: string }
  state: string
  last_run_at?: string
  last_status?: string
  watermark?: string
  collected_count?: number
}

interface LogItem {
  id: string
  task_id: string
  task_name?: string
  status: string
  collected_count?: number
  detail?: string
  started_at?: string
  finished_at?: string
  watermark?: string
}

const PAGE_SIZE = 10
const STATE_LABELS: Record<string, string> = {
  enabled: '已启用',
  disabled: '已停用',
  running: '运行中',
  paused: '已暂停',
}

export default function CollectTaskTab() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 数据源选项（名称下拉选择）
  const [datasources, setDatasources] = useState<DataSourceItem[]>([])

  // 新建/编辑弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ name: '', datasource_id: '', scope: '', schedule_cron: '' })
  const [saving, setSaving] = useState(false)

  // 日志抽屉
  const [logTask, setLogTask] = useState<Task | null>(null)
  const [logs, setLogs] = useState<LogItem[]>([])
  const [logLoading, setLogLoading] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await AssetCollectApi.listTasks({
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      setTasks((data.items ?? []) as unknown as Task[])
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载采集任务失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  // 加载数据源列表供名称下拉选择
  useEffect(() => {
    DataSourceApi.list({ limit: 200 }).then((res) => {
      setDatasources((res.items ?? []) as DataSourceItem[])
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', datasource_id: '', scope: '', schedule_cron: '' })
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditing(task)
    setForm({
      name: task.name,
      datasource_id: task.datasource_id ?? '',
      scope: task.scope ? JSON.stringify(task.scope) : '',
      schedule_cron: task.schedule_config?.cron ?? '',
    })
    setModalOpen(true)
  }

  /** 采集范围：空串转 undefined，非空 JSON 文本解析为对象（非法 JSON 提示错误） */
  const parseScope = (): Record<string, unknown> | undefined => {
    const text = form.scope.trim()
    if (!text) return undefined
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('采集范围必须是 JSON 对象')
      }
      return parsed
    } catch {
      setError('采集范围必须是合法的 JSON 对象，如 {"schemas": ["public"]}')
      return undefined
    }
  }

  const save = async () => {
    if (!form.name.trim()) return
    const scope = parseScope()
    if (form.scope.trim() && !scope) return
    const cron = form.schedule_cron.trim()
    // 与后端 CollectTaskCreateRequest 对齐：scope 传对象、cron 映射为 schedule_type/schedule_config
    const payload = {
      name: form.name.trim(),
      datasource_id: form.datasource_id || undefined,
      scope,
      schedule_type: cron ? 'cron' : 'manual',
      schedule_config: cron ? { cron } : undefined,
    }
    setSaving(true)
    try {
      if (editing) {
        await AssetCollectApi.updateTask(editing.id, payload)
      } else {
        await AssetCollectApi.createTask(payload)
      }
      setModalOpen(false)
      load(page)
    } catch (e) {
      // 优先展示后端 detail（如 422 校验明细），否则用网络错误文案
      const detail = (e as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
      setError(typeof detail === 'string' ? detail : (e instanceof Error ? e.message : '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  const remove = (task: Task) => {
    setDeleting(task)
  }

  const doDelete = async () => {
    if (!deleting) return
    try {
      await AssetCollectApi.deleteTask(deleting.id)
      setDeleting(null)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const run = async (task: Task) => {
    try {
      await AssetCollectApi.runTask(task.id)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '运行失败')
    }
  }

  const toggleState = async (task: Task) => {
    try {
      await AssetCollectApi.changeTaskStatus(task.id, {
        target: task.state === 'enabled' ? 'disabled' : 'enabled',
      })
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态切换失败')
    }
  }

  const openLogs = async (task: Task) => {
    setLogTask(task)
    setLogLoading(true)
    try {
      const data = await AssetCollectApi.listLogs({ task_id: task.id, limit: 20 })
      setLogs((data.items ?? []) as unknown as LogItem[])
    } catch {
      setLogs([])
    } finally {
      setLogLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(Array.isArray(v) ? String(v[0]) : String(v))} ro>
            <option value="">全部状态</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已停用</option>
            <option value="running">运行中</option>
          </Select>
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
        </div>
        <Button onClick={openCreate} data-ro>
          <Plus size={14} className="mr-1" /> 新建采集任务
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !tasks.length && (
        <EmptyState
          icon="database"
          title="暂无采集任务"
          description="创建采集任务后，系统按三级并行（数据源→schema→表）采集元数据入 DCG 图谱，支持周期调度与增量水位。"
          action={<Button onClick={openCreate} data-ro><Plus size={14} className="mr-1" /> 新建采集任务</Button>}
        />
      )}

      {!!tasks.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">任务名称</th>
                <th className="px-4 py-3 font-medium">数据源</th>
                <th className="px-4 py-3 font-medium">调度</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">最近采集</th>
                <th className="px-4 py-3 font-medium">采集量</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{task.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{task.datasource_name ?? task.datasource_id ?? '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{task.schedule_config?.cron || '手动'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: task.state === 'enabled' ? 'rgba(90,216,166,0.15)' : 'var(--color-card-elevated)',
                        color: task.state === 'enabled' ? 'var(--color-success, #10b981)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {STATE_LABELS[task.state] ?? task.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {task.last_run_at ? new Date(task.last_run_at).toLocaleString() : '从未运行'}
                    {task.last_status ? `（${task.last_status}）` : ''}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{task.collected_count ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => run(task)} title="立即运行" data-ro>
                        <Play size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleState(task)} title={task.state === 'enabled' ? '停用' : '启用'} data-ro>
                        <Square size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openLogs(task)} title="采集日志" data-ro>
                        日志
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(task)} data-ro>编辑</Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(task)} title="删除" data-ro>
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

      {/* 新建/编辑弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑采集任务' : '新建采集任务'}>
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            任务名称 <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：经营库全量元数据采集" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            数据源
            <SearchableSelect
              value={form.datasource_id}
              onChange={(v) => setForm({ ...form, datasource_id: v })}
              placeholder="全部数据源"
              items={[
                { value: '', label: '全部数据源（不限定）' },
                ...datasources.map((d) => ({ value: d.id, label: d.name })),
              ]}
              ro
            />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            采集范围（JSON）
            <textarea
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              placeholder='{"schemas": ["public"], "tables": [], "exclude": []}'
              rows={3}
              className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              data-ro
            />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            周期调度（cron 表达式）
            <Input value={form.schedule_cron} onChange={(e) => setForm({ ...form, schedule_cron: e.target.value })} placeholder="0 2 * * *（每日 02:00 全量）" data-ro />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>

      {/* 采集日志抽屉 */}
      <Modal open={!!logTask} onClose={() => setLogTask(null)} title={`采集日志 — ${logTask?.name ?? ''}`} size="lg">
        {logLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : logs.length ? (
          <div className="max-h-96 space-y-2 overflow-auto">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="rounded px-1.5 py-0.5"
                    style={{
                      backgroundColor: log.status === 'success' ? 'rgba(90,216,166,0.15)' : log.status === 'failed' ? 'rgba(248,113,113,0.15)' : 'var(--color-card-elevated)',
                      color: log.status === 'success' ? 'var(--color-success, #10b981)' : log.status === 'failed' ? 'var(--color-error)' : 'var(--color-text-tertiary)',
                    }}
                  >
                    {log.status}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{log.started_at ? new Date(log.started_at).toLocaleString() : '-'}</span>
                  <span className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>采集 {log.collected_count ?? 0} 个对象</span>
                </div>
                {log.watermark && (
                  <p className="mt-1 font-mono text-xs" style={{ color: 'var(--color-text-tertiary)' }}>水位：{log.watermark}</p>
                )}
                {log.detail && (
                  <p className="mt-1 line-clamp-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{log.detail}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无采集日志</p>
        )}
      </Modal>

      {/* 删除采集任务确认 */}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="删除采集任务"
        message={`确认删除采集任务「${deleting?.name ?? ''}」？删除后采集日志将一并移除。`}
        type="danger"
        confirmText="删除"
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
