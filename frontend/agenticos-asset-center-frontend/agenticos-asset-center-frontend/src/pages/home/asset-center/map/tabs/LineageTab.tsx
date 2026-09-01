/**
 * 数据地图 — 血缘分析页签
 * 表级+字段级血缘：上游追溯（来源）/ 下游影响分析（去向），基于 DCG 图谱拓扑
 */
import { useCallback, useEffect, useState } from 'react'
import { Loader2, ArrowUp, ArrowDown, Share2 } from 'lucide-react'
import { AssetMapApi } from '../../../../../api/asset'
import { Button, EmptyState, Input, RadioGroup } from '../../../../../components/ui'

interface TopoNode {
  id: string
  name: string
  entity_type?: string
  depth?: number
}

interface TopoEdge {
  from: string
  to: string
  relation?: string
  table_level?: boolean
}

interface TopoResult {
  nodes?: TopoNode[]
  edges?: TopoEdge[]
  direction?: string
  message?: string
}

export default function LineageTab() {
  const [entityName, setEntityName] = useState('')
  const [tableName, setTableName] = useState('')
  const [direction, setDirection] = useState('upstream')
  const [result, setResult] = useState<TopoResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = useCallback(async () => {
    if (!entityName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await AssetMapApi.report('lineage', entityName.trim())
      setResult(data as unknown as TopoResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : '血缘分析失败')
    } finally {
      setLoading(false)
    }
  }, [entityName, direction, tableName])

  useEffect(() => {
    if (result || entityName) return
    analyze()
  }, [analyze, result, entityName])

  const nodes = result?.nodes ?? []
  const edges = result?.edges ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-72">
          <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>实体名称</label>
          <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="输入表名/字段名，如 orders" ro />
        </div>
        <div className="w-72">
          <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-tertiary)' }}>所属表（字段级血缘）</label>
          <Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="可选" ro />
        </div>
        <RadioGroup
          name="lineage-direction"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'upstream', label: '上游追溯' },
            { value: 'downstream', label: '下游影响' },
          ]}
          ro
        />
        <Button onClick={analyze}>
          <Share2 size={14} className="mr-1" /> 分析血缘
        </Button>
      </div>

      {error && <p className="py-2 text-center text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      {loading && <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} /></div>}

      {!loading && !nodes.length && result && (
        <EmptyState
          icon="search"
          title="未发现血缘关系"
          description={result.message ?? '该实体在 DCG 图谱中暂无上下游关系，请先执行元数据采集或落标映射。'}
        />
      )}

      {!loading && !!nodes.length && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 拓扑节点列表 */}
          <div className="space-y-2 lg:col-span-2">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {direction === 'upstream' ? '上游数据来源（追溯）' : '下游数据流向（影响）'} — 共 {nodes.length} 个节点 / {edges.length} 条边
            </p>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                    <th className="px-4 py-3 font-medium">层级</th>
                    <th className="px-4 py-3 font-medium">节点</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">关系</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node, idx) => {
                    const related = edges.filter((e) => (direction === 'upstream' ? e.to === node.id : e.from === node.id))
                    return (
                      <tr key={node.id ?? idx} className="border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {node.depth != null ? `L${node.depth}` : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                          <span className="mr-1.5 inline-block align-middle" style={{ color: 'var(--color-primary)' }}>
                            {direction === 'upstream' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          </span>
                          {node.name}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{node.entity_type ?? '-'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {related.map((e) => e.relation ?? (e.table_level ? '表级血缘' : '字段级血缘')).join('、') || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 说明 */}
          <div className="space-y-3">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
              <h4 className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>血缘口径说明</h4>
              <ul className="mt-2 space-y-1.5 text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>
                <li>· 血缘关系存于 DCG 图谱（AGE 只存关系事实），随元数据采集与落标映射自动建立</li>
                <li>· 上游追溯：定位该资产的原始来源表/字段，支撑问题根因排查</li>
                <li>· 下游影响：评估表结构变更对下游报表/服务的影响面</li>
                <li>· 支持表级（table_level）与字段级血缘（column 粒度）</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
