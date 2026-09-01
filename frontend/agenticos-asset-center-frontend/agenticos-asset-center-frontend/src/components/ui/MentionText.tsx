import { Fragment } from 'react'

/** @mention 内联格式：@[username|display_name] */
const MENTION_RE = /@\[([^\]]+)\|([^\]]+)\]/g

interface MentionTextProps {
  /** 包含 mention 标记的原始文本 */
  text: string
  /** 额外的 CSS 类名 */
  className?: string
}

/**
 * MentionText — 解析并高亮渲染 @mention。
 *
 * 将 `@[user_id|display_name]` 格式的 mention 标记渲染为蓝色高亮徽章，
 * 其余文本按原样输出。类似飞书圈人效果。
 */
export function MentionText({ text, className }: MentionTextProps) {
  if (!text) return null

  const parts: Array<{ type: 'text' | 'mention'; content: string; userId?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // 重置正则的 lastIndex
  const re = new RegExp(MENTION_RE.source, 'g')
  while ((match = re.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    // 添加 mention
    parts.push({
      type: 'mention',
      content: match[2], // display_name
      userId: match[1],  // user_id
    })
    lastIndex = match.index + match[0].length
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  // 没有 mention 标记，直接返回文本
  if (parts.every((p) => p.type === 'text')) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === 'mention' ? (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 rounded px-1 py-px font-medium whitespace-nowrap"
            style={{
              backgroundColor: 'var(--color-info-light)',
              color: 'var(--color-info)',
              fontSize: 'inherit',
              lineHeight: 'inherit',
            }}
          >
            @{part.content}
          </span>
        ) : (
          <Fragment key={i}>{part.content}</Fragment>
        )
      )}
    </span>
  )
}
