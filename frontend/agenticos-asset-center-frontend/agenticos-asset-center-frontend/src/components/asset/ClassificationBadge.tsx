/**
 * 资产中心共享组件 — 安全分级徽标（JR/T 0197-2020 五级 L1-L5）
 * 色值取自语义色板（chartTheme.ts），禁止硬编码新色值
 */
import { SEMANTIC_COLORS } from '../cards/chartTheme'

export type ClassificationLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5'

/** 五级定义（JR/T 0197-2020）：L1 公开 → L5 核心商密 */
const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  L1: { label: 'L1 公开', color: SEMANTIC_COLORS.neutral },
  L2: { label: 'L2 内部', color: SEMANTIC_COLORS.positive },
  L3: { label: 'L3 秘密', color: SEMANTIC_COLORS.info },
  L4: { label: 'L4 机密', color: SEMANTIC_COLORS.warning },
  L5: { label: 'L5 核心商密', color: SEMANTIC_COLORS.negative },
}

interface ClassificationBadgeProps {
  level?: string | null
  /** 仅显示 Lx 短标签 */
  short?: boolean
}

export default function ClassificationBadge({ level, short = false }: ClassificationBadgeProps) {
  const normalized = (level || '').toUpperCase()
  const config = LEVEL_CONFIG[normalized] ?? LEVEL_CONFIG.L1
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
      style={{ color: config.color, backgroundColor: `${config.color}1a` }}
    >
      {short ? normalized || 'L1' : config.label}
    </span>
  )
}
