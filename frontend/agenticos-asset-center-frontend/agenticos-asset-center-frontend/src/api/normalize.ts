const RECOMMENDATION_ALIASES = ['suggested_actions', 'suggestedActions', 'suggested_questions', 'suggestedQuestions'] as const

const toRecommendation = (item: unknown): Record<string, unknown> | null => {
  if (typeof item === 'string') {
    const text = item.trim()
    return text ? { text, query: text, action_type: 'follow_up' } : null
  }
  if (!item || typeof item !== 'object') return null
  const source = item as Record<string, unknown>
  const query = String(source.query || source.question || source.prompt || source.value || '').trim()
  const text = String(source.text || source.title || source.label || query).trim()
  if (!query || !text) return null
  return {
    text,
    description: String(source.description || source.desc || '').trim(),
    query,
    action_type: String(source.action_type || source.actionType || source.type || 'follow_up').trim() || 'follow_up',
    // 透传 SQL 相关字段
    ...(source.sql ? { sql: source.sql } : {}),
    ...(source.sql_validated !== undefined ? { sql_validated: source.sql_validated } : {}),
    ...(source.validation_error ? { validation_error: source.validation_error } : {}),
    ...(source.dataset ? { dataset: source.dataset } : {}),
    ...(source.database ? { database: source.database } : {}),
  }
}

const normalizeRecommendations = (...sources: unknown[]): Record<string, unknown>[] => {
  const recommendations: Record<string, unknown>[] = []
  const seen = new Set<string>()
  for (const source of sources) {
    if (!Array.isArray(source)) continue
    for (const item of source) {
      const rec = toRecommendation(item)
      if (!rec) continue
      const key = String(rec.query || rec.text)
      if (seen.has(key)) continue
      seen.add(key)
      recommendations.push(rec)
    }
  }
  return recommendations
}

export function normalizeCardData(cardData: unknown): Record<string, unknown> | undefined {
  if (!cardData || typeof cardData !== 'object') return undefined
  const normalized = { ...(cardData as Record<string, unknown>) }
  const footer = normalized.footer && typeof normalized.footer === 'object'
    ? { ...(normalized.footer as Record<string, unknown>) }
    : {}

  const recommendations = normalizeRecommendations(
    footer.recommendations,
    ...RECOMMENDATION_ALIASES.map((key) => footer[key]),
    ...RECOMMENDATION_ALIASES.map((key) => normalized[key]),
    // 语义报告等插件可能将推荐放在顶层 recommendations 字段
    normalized.recommendations
  )

  if (recommendations.length > 0) {
    footer.recommendations = recommendations
  }
  for (const key of RECOMMENDATION_ALIASES) {
    delete footer[key]
    delete normalized[key]
  }
  // 清理顶层 recommendations（已合并到 footer.recommendations）
  delete normalized.recommendations
  normalized.footer = footer
  return normalized
}
