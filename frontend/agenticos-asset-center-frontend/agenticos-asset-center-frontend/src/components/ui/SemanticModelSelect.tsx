import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Check } from 'lucide-react'
import { useWriteBlocked } from '../../permission/writeScope'

export interface SemanticModelSelectOption {
  value: string
  label: string       // 中文名称
  subLabel: string    // 模型名称（灰色小字）
}

interface SemanticModelSelectProps {
  value: string
  options: SemanticModelSelectOption[]
  placeholder?: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  /** 尺寸：sm=32px（默认），md=40px */
  size?: 'sm' | 'md'
  /** 只读豁免：该组件为读操作，页面只读时不被拦截 */
  ro?: boolean
}

export function SemanticModelSelect({
  value,
  options,
  placeholder = '请选择',
  onChange,
  className,
  disabled = false,
  size = 'sm',
  ro,
}: SemanticModelSelectProps) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) { setFilter(''); return }
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const q = filter.trim().toLowerCase()
  const filtered = q
    ? options.filter(o => o.label.toLowerCase().includes(q) || o.subLabel.toLowerCase().includes(q))
    : options
  const selectedOption = options.find(o => o.value === value)
  const sizes = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
  }

  return (
    <div ref={ref} className={clsx('relative', className)} data-ro={ro || undefined}>
      {/* 触发器 */}
      <button
        type="button"
        disabled={effectiveDisabled}
        onClick={() => { if (!effectiveDisabled) { setOpen(!open); setFilter('') } }}
        className={clsx(
          'flex items-center gap-2 rounded-xl border text-sm outline-none transition-colors w-full text-left',
          sizes[size],
          open ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]',
          effectiveDisabled && 'cursor-not-allowed opacity-60',
          !effectiveDisabled && 'hover:border-[var(--color-primary)]'
        )}
        style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text)' }}
      >
        <span className="flex-1 truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={clsx('shrink-0 text-[var(--color-text-tertiary)] transition-transform', open && 'rotate-180')} />
      </button>

      {/* 下拉面板 */}
      {open && !effectiveDisabled && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{
            zIndex: 9999,
            maxHeight: 280,
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* 搜索框 */}
          <div className="px-2 py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <input
              type="text"
              value={filter}
              placeholder="搜索模型..."
              onChange={e => setFilter(e.target.value)}
              className="w-full h-7 px-2 text-xs rounded-lg outline-none transition-colors"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)', borderWidth: '1px' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
              autoFocus
            />
          </div>

          {/* 选项列表 */}
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                无匹配结果
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    className={clsx(
                      'px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors',
                      isSelected ? 'bg-[var(--color-primary-light)]' : 'hover:bg-[var(--color-bg-hover)]',
                    )}
                    onMouseDown={e => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {opt.label}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                        {opt.subLabel}
                      </div>
                    </div>
                    <Check size={14} className={clsx('shrink-0', isSelected ? 'text-[var(--color-primary)]' : 'invisible')} />
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
