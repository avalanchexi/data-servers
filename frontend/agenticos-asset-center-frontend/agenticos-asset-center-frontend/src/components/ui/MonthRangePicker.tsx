import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useWriteBlocked, READONLY_CONTAINER_CLASS } from '../../permission/writeScope'

export interface MonthRangeValue {
  start: string // YYYY-MM
  end: string   // YYYY-MM
}

interface MonthRangePickerProps {
  value?: MonthRangeValue
  onChange?: (value: MonthRangeValue) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  clearable?: boolean
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean
}

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function parseMonth(value: string): { year: number; month: number } | null {
  if (!value) return null
  const [y, m] = value.split('-')
  if (!y || !m) return null
  const year = parseInt(y, 10)
  const month = parseInt(m, 10)
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null
  return { year, month }
}

function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatDisplay(value: string): string {
  const parsed = parseMonth(value)
  if (!parsed) return ''
  return `${parsed.year}/${String(parsed.month).padStart(2, '0')}`
}

function getYearRange(centerYear: number): number[] {
  const start = centerYear - 10
  const end = centerYear + 10
  const years: number[] = []
  for (let y = start; y <= end; y++) years.push(y)
  return years
}

export function MonthRangePicker({
  value,
  onChange,
  placeholder = '选择月份范围',
  className,
  size = 'md',
  clearable = true,
  ro,
}: MonthRangePickerProps) {
  const blocked = useWriteBlocked() && !ro
  const today = new Date()
  const defaultValue: MonthRangeValue = {
    start: formatMonth(today.getFullYear(), today.getMonth() + 1),
    end: formatMonth(today.getFullYear(), today.getMonth() + 1),
  }

  const startValue = value?.start || defaultValue.start
  const endValue = value?.end || defaultValue.end

  const [open, setOpen] = useState(false)
  const [draftStart, setDraftStart] = useState(startValue)
  const [draftEnd, setDraftEnd] = useState(endValue)
  const [leftYear, setLeftYear] = useState(parseMonth(startValue)?.year || today.getFullYear())
  const [rightYear, setRightYear] = useState(parseMonth(endValue)?.year || today.getFullYear())
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDraftStart(startValue)
    setDraftEnd(endValue)
    const sy = parseMonth(startValue)?.year || today.getFullYear()
    const ey = parseMonth(endValue)?.year || today.getFullYear()
    setLeftYear(sy)
    setRightYear(ey)
  }, [startValue, endValue])

  const apply = useCallback(() => {
    const s = parseMonth(draftStart)
    const e = parseMonth(draftEnd)
    if (!s || !e) return
    if (draftStart > draftEnd) {
      onChange?.({ start: draftEnd, end: draftStart })
    } else {
      onChange?.({ start: draftStart, end: draftEnd })
    }
    setOpen(false)
  }, [draftStart, draftEnd, onChange])

  const handleClear = () => {
    const empty = { start: '', end: '' }
    onChange?.(empty)
    setDraftStart('')
    setDraftEnd('')
    setOpen(false)
  }

  const handleThisMonth = () => {
    const m = formatMonth(today.getFullYear(), today.getMonth() + 1)
    setDraftStart(m)
    setDraftEnd(m)
    setLeftYear(today.getFullYear())
    setRightYear(today.getFullYear())
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 6
    const viewportPadding = 12
    const dropdownH = 360
    const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding
    const opensUpward = availableBelow < dropdownH && rect.top - gap - viewportPadding > dropdownH
    setDropdownPos({
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - 640 - viewportPadding)),
      top: opensUpward ? rect.top - dropdownH - gap : rect.bottom + gap,
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setDropdownPos(null)
      return
    }
    updatePosition()
    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
    }
  }, [open, updatePosition])

  const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-4',
  }

  const iconSize = size === 'sm' ? 14 : 16

  const displayText = startValue && endValue
    ? `${formatDisplay(startValue)} 至 ${formatDisplay(endValue)}`
    : '全部'

  const renderPanel = (
    side: 'left' | 'right',
    panelYear: number,
    setPanelYear: (y: number) => void,
    selectedMonth: string,
    setSelectedMonth: (m: string) => void,
  ) => {
    const isStart = side === 'left'
    // 确定起止月的先后顺序（可能开始>结束，apply 时会交换）
    const chronoStart = draftStart && draftEnd && draftStart <= draftEnd ? draftStart : draftEnd || ''
    const chronoEnd = draftStart && draftEnd && draftStart <= draftEnd ? draftEnd : draftStart || ''
    return (
      <div className="flex-1 min-w-[280px] p-4">
        <div className="text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          {isStart ? '起始月' : '结束月'}
        </div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setPanelYear(panelYear - 1)}
            className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <select
            value={panelYear}
            onChange={(e) => setPanelYear(parseInt(e.target.value, 10))}
            className="text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
            style={{ color: 'var(--color-text)' }}
          >
            {getYearRange(today.getFullYear()).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPanelYear(panelYear + 1)}
            className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MONTH_LABELS.map((label, idx) => {
            const month = idx + 1
            const monthStr = formatMonth(panelYear, month)
            const isSelected = selectedMonth === monthStr
            // 范围高亮：在 chronoStart 和 chronoEnd 之间（不含两端）
            const inRange = chronoStart && chronoEnd && monthStr > chronoStart && monthStr < chronoEnd
            return (
              <button
                key={month}
                type="button"
                onClick={() => setSelectedMonth(monthStr)}
                className={clsx(
                  'flex items-center justify-center h-10 text-sm rounded-lg transition-colors',
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white font-medium'
                    : inRange
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-bg-hover)]',
                )}
                style={{ color: isSelected ? '#fff' : 'var(--color-text)' }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} data-ro={ro || undefined} className={clsx('relative', className, blocked && READONLY_CONTAINER_CLASS)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'w-full flex items-center gap-2 rounded-xl border bg-[var(--color-card)] text-[var(--color-text)] outline-none transition-all duration-200',
          sizeClasses[size],
        )}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <CalendarDays size={iconSize} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
        <span className={clsx('min-w-0 flex-1 truncate text-left', (!startValue || !endValue) && 'text-[var(--color-text-tertiary)]')}>
          {displayText}
        </span>
        {clearable && startValue && endValue && (
          <X
            size={iconSize}
            className="shrink-0 cursor-pointer hover:text-[var(--color-primary)]"
            style={{ color: 'var(--color-text-tertiary)' }}
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
          />
        )}
      </button>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          data-ro={ro || undefined}
          className="fixed z-[1000] rounded-xl border bg-[var(--color-card)] shadow-[var(--shadow-card-lg)] overflow-hidden animate-fade-in"
          style={{
            borderColor: 'var(--color-border)',
            left: dropdownPos.left,
            top: dropdownPos.top,
            width: '620px',
          }}
        >
          <div className="flex divide-x" style={{ borderColor: 'var(--color-border)' }}>
            {renderPanel('left', leftYear, setLeftYear, draftStart, setDraftStart)}
            {renderPanel('right', rightYear, setRightYear, draftEnd, setDraftEnd)}
          </div>
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              本月
            </button>
            <div className="flex items-center gap-2">
            {clearable && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                清除
              </button>
            )}
              <button
                type="button"
                onClick={apply}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)',
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
