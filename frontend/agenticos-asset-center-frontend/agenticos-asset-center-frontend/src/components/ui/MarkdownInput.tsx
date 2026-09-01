import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { clsx } from 'clsx'
import { Textarea } from './Input'
import { useWriteBlocked, READONLY_CONTAINER_CLASS } from '../../permission/writeScope'

interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  contentClassName?: string
  /** 只读豁免：该组件为读操作，页面只读时不被拦截 */
  ro?: boolean
}

export function MarkdownInput({
  value,
  onChange,
  placeholder,
  rows = 6,
  className,
  contentClassName,
  ro,
}: MarkdownInputProps) {
  const blocked = useWriteBlocked() && !ro
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div
      data-ro={ro || undefined}
      className={clsx('overflow-hidden rounded-xl border bg-[var(--color-card)]', className, blocked && READONLY_CONTAINER_CLASS)}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Markdown
        </span>
        <div className="flex rounded-lg bg-[var(--color-bg)] p-0.5">
          {(['edit', 'preview'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={clsx(
                'rounded-md px-2.5 py-1 text-xs transition-colors',
                mode === item && 'bg-[var(--color-card)] shadow-sm',
              )}
              style={{
                color: mode === item ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              }}
            >
              {item === 'edit' ? '编辑' : '预览'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'edit' ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={clsx('rounded-none border-0 focus:ring-0', contentClassName)}
        />
      ) : (
        <div className={clsx('min-h-[144px] px-4 py-3 text-sm leading-6', contentClassName)} style={{ color: 'var(--color-text)' }}>
          {value.trim() ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <span style={{ color: 'var(--color-text-tertiary)' }}>暂无预览内容</span>
          )}
        </div>
      )}
    </div>
  )
}
