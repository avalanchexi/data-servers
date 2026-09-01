/**
 * 数据质量 — 监控任务页签
 * 按数据源/表配置监控任务，旁路异步执行不阻塞主链路
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, RefreshCw } from 'lucide-react'
import { AssetQualityApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, Modal, Pagination, SearchableSelect } from '../../../../../components/ui'

interface MonitorTask {
  id: string
  name: string
  rule_id: string
  rule_name?: string
  schedule_cron?: string
  status: string
  last_run_at?: string
  last_result?: string
  alert_channels?: string[]
}

const PAGE_SIZE = 10
const STATUS_LABELS: Record<string, string> = {
  enabled: '已启用',
  disabled: '已停用',
  running: '运行中',
}

export default function MonitorTaskTab() {
  const [rows, setRows] = useState<MonitorTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', rule_id: '', schedule_cron: '', alert_channels: '' })
  const [saving, setSaving] = useState(false)

  // 关联规则选项（名称下拉选择）
  const [ruleOptions, setRuleOptions] = useState<Array<{ id: string; name: string }>>([])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      // 监控任务复用规则列表（监控任务与规则 1:1，任务表由规则 CRUD 维护）
      const data = await AssetQualityApi.listRules({
        limit: PAGE_SIZE,
        offset: (p - 1) * PAGE_SIZE,
      })
      const items = ((data.items ?? []) as unknown as MonitorTask[]).map((r) => ({
        ...r,
        name: r.name,
        rule_id: r.id,
      }))
      setRows(items)
      setTotal(data.total ?? 0)
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载监控任务失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  // 加载规则清单供关联规则下拉选择
  useEffect(() => {
    AssetQualityApi.listRules({ limit: 500 }).then((data) => {
      setRuleOptions(((data as unknown as { items?: Array<{ id: string; name: string }> }).items ?? []) as Array<{ id: string; name: string }>)
    }).catch(() => { /* 下拉选项加载失败不影响主流程 */ })
  }, [])

  const save = async () => {
    if (!form.name.trim() || !form.rule_id.trim()) return
    setSaving(true)
    try {
      await AssetQualityApi.createRule({
        name: form.name.trim(),
        rule_id: form.rule_id.trim(),
        schedule_cron: form.schedule_cron || undefined,
        alert_channels: form.alert_channels ? form.alert_channels.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      })
      setModalOpen(false)
      load(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          监控任务旁路异步执行（不阻塞数据主链路）；告警经治理 Agent hooks 推送
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => load(page)}>
            <RefreshCw size={14} className="mr-1" /> 刷新
          </Button>
          <Button onClick={() => { setForm({ name: '', rule_id: '', schedule_cron: '', alert_channels: '' }); setModalOpen(true) }} data-ro>
            <Plus size={14} className="mr-1" /> 新建监控任务
          </Button>
        </div>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !rows.length && (
        <EmptyState
          icon="folder"
          title="暂无监控任务"
          description="先在「规则模板库」创建规则，再配置调度周期与告警渠道。"
        />
      )}

      {!!rows.length && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                <th className="px-4 py-3 font-medium">任务名称</th>
                <th className="px-4 py-3 font-medium">关联规则</th>
                <th className="px-4 py-3 font-medium">调度</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">最近执行</th>
                <th className="px-4 py-3 font-medium">最近结果</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{row.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.rule_name ?? row.rule_id}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.schedule_cron || '手动'}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: row.status === 'enabled' ? 'var(--color-success-bg)' : 'var(--color-card-elevated)',
                        color: row.status === 'enabled' ? 'var(--color-success)' : 'var(--color-text-tertiary)',
                      }}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.last_run_at ? new Date(row.last_run_at).toLocaleString() : '从未执行'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{row.last_result ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination current={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => load(p)} />
      )}

      {/* 新建监控任务弹窗 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新建监控任务">
        <div className="space-y-3">
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            任务名称 <span style={{ color: 'var(--color-error)' }}>*</span>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：订单金额每日校验" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            关联规则 <span style={{ color: 'var(--color-error)' }}>*</span>
            <SearchableSelect
              value={form.rule_id}
              onChange={(v) => setForm({ ...form, rule_id: v })}
              placeholder="搜索选择规则"
              items={ruleOptions.map((r) => ({ value: r.id, label: r.name }))}
              ro
            />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            调度周期（cron）
            <Input value={form.schedule_cron} onChange={(e) => setForm({ ...form, schedule_cron: e.target.value })} placeholder="0 6 * * *（每日 06:00）" data-ro />
          </label>
          <label className="block text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            告警渠道（逗号分隔）
            <Input value={form.alert_channels} onChange={(e) => setForm({ ...form, alert_channels: e.target.value })} placeholder="如 飞书,邮件" data-ro />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>取消</Button>
          <Button onClick={save} disabled={saving || !form.name.trim() || !form.rule_id.trim()} data-ro>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} 保存
          </Button>
        </div>
      </Modal>
    </div>
  )
}
