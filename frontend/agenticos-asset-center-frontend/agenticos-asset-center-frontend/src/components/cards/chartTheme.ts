/** 图表主题常量 — 镜像 plugins/common/presentation/_theme.py 和 _constants.py。
 *
 * 前端保持与 Python 公共展现模块一致的配色体系和图表类型定义，
 * 避免前后端各自维护一套重复的配色/常量。
 */

// ═══════════════════════════════════════════════════════════════
// 调色板 — 镜像 _theme.py（跨色系分类配色，确保多系列图表高区分度）
// ═══════════════════════════════════════════════════════════════

/** 主色板：跨色系分布（蓝/绿/金/红/天蓝/紫/橙/青），相邻色相角差 ≥34°（镜像 PRIMARY_PALETTE） */
export const PRIMARY_PALETTE = [
  '#5B8FF9',  // 蓝 — 专业可信（品牌主色）
  '#5AD8A6',  // 薄荷绿 — 增长/活力
  '#F6BD16',  // 金 — 温暖/醒目
  '#E8684A',  // 珊瑚红 — 柔和对比
  '#6DC8EC',  // 天蓝 — 科技感/明亮
  '#9270CA',  // 紫罗兰 — 高级/优雅
  '#FF9D4D',  // 暖橙 — 能量/补充
  '#269A99',  // 深青 — 稳重/专业
]

/** 扩展调色板：覆盖更多类别，在 8 色基础上扩展粉红、黄绿、浅蓝、粉紫（镜像 EXTENDED_PALETTE） */
export const EXTENDED_PALETTE = [
  '#5B8FF9', '#5AD8A6', '#F6BD16', '#E8684A',
  '#6DC8EC', '#9270CA', '#FF9D4D', '#269A99',
  '#FF6B9D', '#BDD631', '#9ED0FF', '#D97AB5',
]

/** 语义色板：正向/负向/中性/预警（镜像 SEMANTIC_COLORS） */
export const SEMANTIC_COLORS: Record<string, string> = {
  positive: '#5AD8A6',
  negative: '#E8684A',
  warning:  '#F6BD16',
  neutral:  '#6B7280',
  info:     '#5B8FF9',
  accent:   '#9270CA',
}

// ═══════════════════════════════════════════════════════════════
// 图表类型 → 推荐配色策略 — 镜像 _CHART_COLOR_STRATEGIES
// ═══════════════════════════════════════════════════════════════

export const CHART_COLOR_STRATEGIES: Record<string, { palette: string[] }> = {
  bar:     { palette: PRIMARY_PALETTE },
  line:    { palette: PRIMARY_PALETTE },
  area:    { palette: PRIMARY_PALETTE },
  pie:     { palette: EXTENDED_PALETTE },
  scatter: { palette: PRIMARY_PALETTE },
  funnel:  { palette: ['#5B8FF9', '#6DC8EC', '#5AD8A6', '#F6BD16', '#E8684A'] },
  radar:   { palette: ['#5B8FF9'] },
  // 前端独有的图表类型，使用 PRIMARY_PALETTE 作为默认
  heatmap: { palette: PRIMARY_PALETTE },
  treemap: { palette: EXTENDED_PALETTE },
  bubble:  { palette: PRIMARY_PALETTE },
}

/** 获取指定图表类型的最佳配色（镜像 get_chart_type_palette） */
export function getChartTypePalette(chartType: string): string[] {
  const strategy = CHART_COLOR_STRATEGIES[chartType]
  return strategy?.palette || PRIMARY_PALETTE
}

/** 获取指定主题的调色板（镜像 get_theme_palette） */
export function getThemePalette(theme: string = 'primary'): string[] {
  const themes: Record<string, string[]> = {
    primary: PRIMARY_PALETTE,
    extended: EXTENDED_PALETTE,
  }
  return themes[theme] || PRIMARY_PALETTE
}

// ═══════════════════════════════════════════════════════════════
// 图表类型中文名 — 镜像 _constants.py EXPLICIT_CHART_TYPE_MAP
// ═══════════════════════════════════════════════════════════════

/** 图表类型 → 中文名（镜像 EXPLICIT_CHART_TYPE_MAP + 前端扩展） */
export const CHART_TYPE_LABELS: Record<string, string> = {
  bar:     '柱状图',
  hbar:    '条形图',
  line:    '折线图',
  bar_line: '柱线组合图',
  pie:     '饼图',
  area:    '面积图',
  scatter: '散点图',
  funnel:  '漏斗图',
  radar:   '雷达图',
  heatmap: '热力图',
  treemap: '矩形树图',
  bubble:  '气泡图',
}

/** 图表类型 → 展示图标 */
export const CHART_TYPE_ICONS: Record<string, string> = {
  bar:     '▦',
  hbar:    '▤',
  line:    '╱',
  bar_line: '▥',
  pie:     '◔',
  area:    '◢',
  scatter: '✦',
  radar:   '⬡',
  funnel:  '▽',
  heatmap: '⊞',
  treemap: '⊟',
  bubble:  '◉',
}
