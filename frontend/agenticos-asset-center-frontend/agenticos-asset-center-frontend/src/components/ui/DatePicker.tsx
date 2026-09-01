import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from 'lucide-react'
import { clsx } from 'clsx'
import { useWriteBlocked, READONLY_CONTAINER_CLASS } from '../../permission/writeScope'

export interface DateRangeValue {
  start: string
  end: string
}

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  mode?: 'single' | 'range'
  rangeValue?: DateRangeValue
  onRangeChange?: (value: DateRangeValue) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  compactRangeDisplay?: boolean
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
}

function formatDate(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function DatePicker({
  value = '',
  onChange,
  mode = 'single',
  rangeValue,
  onRangeChange,
  placeholder = '选择日期',
  className,
  size = 'md',
  compactRangeDisplay = false,
  ro,
}: DatePickerProps) {
  const blocked = useWriteBlocked() && !ro
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isRangeMode = mode === 'range'
  const startValue = rangeValue?.start || ''
  const endValue = rangeValue?.end || ''
  const selectedDate = parseDate(value)
  const startDate = parseDate(startValue)
  const endDate = parseDate(endValue)
  const initialViewDate = selectedDate || startDate || endDate || new Date()
  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth())

  // 外部日期变化时同步日历视图
  useEffect(() => {
    const nextDate = isRangeMode ? parseDate(startValue) || parseDate(endValue) : parseDate(value)
    if (nextDate) {
      setViewYear(nextDate.getFullYear())
      setViewMonth(nextDate.getMonth())
    }
  }, [endValue, isRangeMode, startValue, value])

  const days = getMonthDays(viewYear, viewMonth)

  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-4',
  }

  const iconSize = size === 'sm' ? 14 : 16

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handlePrevYear = () => setViewYear((year) => year - 1)
  const handleNextYear = () => setViewYear((year) => year + 1)

  const handleSelectDay = (day: number) => {
    const dateStr = formatDate(viewYear, viewMonth, day)
    if (isRangeMode) {
      if (!startValue || (startValue && endValue)) {
        onRangeChange?.({ start: dateStr, end: '' })
        return
      }

      if (dateStr < startValue) {
        onRangeChange?.({ start: dateStr, end: startValue })
      } else {
        onRangeChange?.({ start: startValue, end: dateStr })
      }
      setOpen(false)
      return
    }

    onChange?.(dateStr)
    setOpen(false)
  }

  const handleToday = () => {
    const d = new Date()
    const str = formatDate(d.getFullYear(), d.getMonth(), d.getDate())
    if (isRangeMode) {
      onRangeChange?.({ start: str, end: str })
    } else {
      onChange?.(str)
    }
    setOpen(false)
  }

  const handleClear = () => {
    if (isRangeMode) {
      onRangeChange?.({ start: '', end: '' })
    } else {
      onChange?.('')
    }
    setOpen(false)
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

  // 计算下拉日历位置
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const updatePosition = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 6
    const viewportPadding = 12
    const dropdownH = 340
    const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding
    const opensUpward = availableBelow < dropdownH && rect.top - gap - viewportPadding > dropdownH

    setDropdownPos({
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - 300 - viewportPadding)),
      top: opensUpward ? rect.top - dropdownH - gap : rect.bottom + gap,
      width: Math.max(280, rect.width),
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

  // 月份视图变化时重新计算位置
  useEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition, viewYear, viewMonth])

  const formatDisplayDate = (date: Date) => (
    `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  )
  const formatRangeDate = (date: Date) => (
    `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  )
  const formatCompactRangeDate = (date: Date) => (
    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  )
  const rangeDisplayText = startDate && endDate
    ? compactRangeDisplay
      ? `${formatCompactRangeDate(startDate)}-${formatCompactRangeDate(endDate)}`
      : `${formatRangeDate(startDate)} 至 ${formatRangeDate(endDate)}`
    : startDate
      ? compactRangeDisplay
        ? `${formatCompactRangeDate(startDate)}-结束`
        : `${formatRangeDate(startDate)} 至 结束日期`
      : endDate
        ? compactRangeDisplay
          ? `开始-${formatCompactRangeDate(endDate)}`
          : `开始日期 至 ${formatRangeDate(endDate)}`
        : placeholder
  const singleDisplayText = selectedDate ? formatDisplayDate(selectedDate) : ''

  return (
    <div ref={containerRef} data-ro={ro || undefined} className={clsx('relative', className, blocked && READONLY_CONTAINER_CLASS)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          'w-full flex items-center gap-2 rounded-xl border bg-[var(--color-card)] text-[var(--color-text)] outline-none transition-all duration-200',
          sizeClasses[size],
          focused && 'ring-2 ring-offset-0',
        )}
        style={{
          borderColor: focused ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: focused ? '0 0 0 3px rgba(47, 107, 255, 0.15)' : undefined,
        }}
      >
        <CalendarDays size={iconSize} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
        {isRangeMode ? (
          <span className={clsx('min-w-0 flex-1 truncate text-left', !startDate && !endDate && 'text-[var(--color-text-tertiary)]')}>
            {rangeDisplayText}
          </span>
        ) : (
          <span className={clsx('flex-1 text-left', !singleDisplayText && 'text-[var(--color-text-tertiary)]')}>
            {singleDisplayText || placeholder}
          </span>
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
            width: dropdownPos.width,
          }}
        >
          {/* 年月切换 */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevYear}
                aria-label="上一年"
                title="上一年"
                className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronsLeft size={17} />
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="上个月"
                title="上个月"
                className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {viewYear}年{viewMonth + 1}月
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="下个月"
                title="下个月"
                className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                aria-label="下一年"
                title="下一年"
                className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronsRight size={17} />
              </button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 px-3 pb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="flex items-center justify-center h-8 text-xs font-medium"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="grid grid-cols-7 px-3 pb-2">
            {days.map((day, idx) => {
              if (day == null) return <div key={`empty-${idx}`} className="h-9" />

              const dateStr = formatDate(viewYear, viewMonth, day)
              const isSelected = dateStr === value
              const isRangeStart = isRangeMode && dateStr === startValue
              const isRangeEnd = isRangeMode && dateStr === endValue
              const isInRange = isRangeMode && startValue && endValue && dateStr > startValue && dateStr < endValue
              const isRangeSelected = Boolean(isRangeStart || isRangeEnd)
              const isToday = dateStr === todayStr

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={clsx(
                    'flex items-center justify-center h-9 text-sm rounded-lg transition-colors',
                    isSelected || isRangeSelected
                      ? 'bg-[var(--color-primary)] text-white font-medium'
                      : isInRange
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : isToday
                        ? 'font-medium'
                        : 'hover:bg-[var(--color-bg-hover)]',
                  )}
                  style={{
                    color: isSelected || isRangeSelected ? '#fff' : isToday ? 'var(--color-primary)' : undefined,
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* 操作区 */}
          <div
            className="flex items-center justify-between px-3 py-2 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              type="button"
              onClick={handleClear}
              className="text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              清除
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
              }}
            >
              今天
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
