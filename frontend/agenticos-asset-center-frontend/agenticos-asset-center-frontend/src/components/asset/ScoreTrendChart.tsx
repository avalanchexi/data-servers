/**
 * 资产中心共享组件 — 质量评分趋势折线图（ScoreTrendChart）
 * 支持单数据集多轮评分趋势；色值走 PRIMARY_PALETTE
 */
import ReactECharts from 'echarts-for-react'
import { PRIMARY_PALETTE } from '../cards/chartTheme'

export interface TrendPoint {
  /** X 轴标签（日期/轮次） */
  label: string
  /** 各维度分数（与 dimensions 对齐） */
  values: number[]
}

interface ScoreTrendChartProps {
  dimensions: string[]
  points: TrendPoint[]
  height?: number
  /** 满分刻度（默认 100） */
  max?: number
}

export default function ScoreTrendChart({ dimensions, points, height = 260, max = 100 }: ScoreTrendChartProps) {
  const series = dimensions.map((dim, idx) => ({
    type: 'line' as const,
    name: dim,
    data: points.map((p) => p.values[idx] ?? 0),
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2, color: PRIMARY_PALETTE[idx % PRIMARY_PALETTE.length] },
    itemStyle: { color: PRIMARY_PALETTE[idx % PRIMARY_PALETTE.length] },
  }))
  const option = {
    tooltip: { trigger: 'axis' as const },
    legend: { bottom: 0, textStyle: { color: 'var(--color-text-secondary)' } },
    grid: { left: 40, right: 20, top: 24, bottom: 40 },
    xAxis: {
      type: 'category' as const,
      data: points.map((p) => p.label),
      axisLine: { lineStyle: { color: 'var(--color-border)' } },
      axisLabel: { color: 'var(--color-text-tertiary)' },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max,
      splitLine: { lineStyle: { color: 'var(--color-border)' } },
      axisLabel: { color: 'var(--color-text-tertiary)' },
    },
    series,
  }
  return <ReactECharts option={option} style={{ height }} notMerge />
}
