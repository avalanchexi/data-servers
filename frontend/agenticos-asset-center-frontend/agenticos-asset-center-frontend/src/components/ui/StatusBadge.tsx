export const STATUS_LABEL: Record<string, string> = {
  uploaded: '已上传',
  pending_parse: '待解析',
  parsing: '解析中',
  parsed: '已解析',
  failed: '解析失败',
  active: '已发布',
  archived: '已归档',
  inactive: '未发布',
  enabled: '已生效',
  disabled: '未生效',
  lightrag_none: '待构建',
  lightrag_building: '构建中',
  lightrag_built: '构建完成',
  lightrag_failed: '构建失败',
}

const STATUS_CSS_VAR: Record<string, { label: string; colorVar: string }> = {
  uploaded: { label: '已上传', colorVar: '--color-state-default' },
  pending_parse: { label: '待解析', colorVar: '--color-state-default' },
  parsing: { label: '解析中', colorVar: '--color-state-info' },
  parsed: { label: '已解析', colorVar: '--color-state-success' },
  failed: { label: '解析失败', colorVar: '--color-error' },
  active: { label: '已发布', colorVar: '--color-state-success' },
  archived: { label: '已归档', colorVar: '--color-state-default' },
  inactive: { label: '未发布', colorVar: '--color-state-default' },
  enabled: { label: '已生效', colorVar: '--color-state-success' },
  disabled: { label: '未生效', colorVar: '--color-error' },
  lightrag_none: { label: '待构建', colorVar: '--color-state-default' },
  lightrag_building: { label: '构建中', colorVar: '--color-state-info' },
  lightrag_built: { label: '构建完成', colorVar: '--color-state-success' },
  lightrag_failed: { label: '构建失败', colorVar: '--color-error' },
}

export function StatusBadge({ value }: { value: string }) {
  const mapped = STATUS_CSS_VAR[value] || { label: value, colorVar: '--color-state-default' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        backgroundColor: `color-mix(in srgb, var(${mapped.colorVar}) 10%, transparent)`,
        color: `var(${mapped.colorVar})`,
        border: `1px solid color-mix(in srgb, var(${mapped.colorVar}) 25%, transparent)`,
      }}
    >
      {mapped.label}
    </span>
  )
}
