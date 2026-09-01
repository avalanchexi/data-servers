/**
 * 资产中心共享组件 — 健康分雷达图（治理驾驶舱五健康度）
 * 五维：存储/质量/安全/标准/成本；echarts radar，色值走 PRIMARY_PALETTE
 */
import ReactECharts from 'echarts-for-react'
import { PRIMARY_PALETTE, SEMANTIC_COLORS } from '../cards/chartTheme'

export interface HealthDimension {
  name: string
  score: number
}

interface HealthScoreRadarProps {
  dimensions: HealthDimension[]
  /** 对比基线（可选，如全域均值） */
  baseline?: HealthDimension[]
  height?: number
}

export default function HealthScoreRadar({ dimensions, baseline, height = 300 }: HealthScoreRadarProps) {
  // 结构防御：契约变化（如后端返回 dict）时渲染空图而非抛错白屏
  const safeDims = Array.isArray(dimensions) ? dimensions : []
  const safeBaseline = Array.isArray(baseline) ? baseline : []
  const names = safeDims.map((d) => d.name)
  const values = safeDims.map((d) => Math.max(0, Math.min(100, d.score ?? 0)))
  const series: Array<Record<string, unknown>> = [{
    type: 'radar',
    data: [{
      value: values,
      name: '当前健康度',
      areaStyle: { opacity: 0.2, color: PRIMARY_PALETTE[0] },
      lineStyle: { color: PRIMARY_PALETTE[0], width: 2 },
      itemStyle: { color: PRIMARY_PALETTE[0] },
    }],
  }]
  if (safeBaseline.length) {
    series.push({
      type: 'radar',
      data: [{
        value: safeBaseline.map((b) => Math.max(0, Math.min(100, b.score ?? 0))),
        name: '全域均值',
        areaStyle: { opacity: 0.1, color: SEMANTIC_COLORS.neutral },
        lineStyle: { color: SEMANTIC_COLORS.neutral, width: 1.5, type: 'dashed' as const },
        itemStyle: { color: SEMANTIC_COLORS.neutral },
      }],
    })
  }
  const option = {
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { color: 'var(--color-text-secondary)' } },
    radar: {
      indicator: names.map((n) => ({ name: n, max: 100 })),
      radius: '62%',
      axisName: { color: 'var(--color-text-secondary)', fontSize: 12 },
      splitLine: { lineStyle: { color: 'var(--color-border)' } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: 'var(--color-border)' } },
    },
    series,
  }
  // 防 Chrome GPU 崩溃（错误代码 5）：圆角 + overflow:hidden 祖先 + 图表 Canvas
  // 会触发合成崩溃（crbug.com/1313302），.gpu-safe-chart 将 Canvas 推到独立
  // GPU 合成层，与祖先圆角 mask 脱钩（与 dataqa 卡片路径同款防护）
  return (
    <div className="gpu-safe-chart" style={{ height }}>
      <ReactECharts option={option} notMerge style={{ height: '100%' }} />
    </div>
  )
}
