import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useWriteBlocked } from '../../permission/writeScope'

export interface CascaderOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
  meta?: Record<string, unknown>
  children?: CascaderOption[]
  isLeaf?: boolean
}

interface CascaderProps {
  value?: string[]
  onChange?: (value: string[], selectedOptions: CascaderOption[]) => void
  options: CascaderOption[]
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  emptyText?: string
  loadingText?: string
  filterable?: boolean
  filterPlaceholder?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  clearable?: boolean
  /** 展示模式：full=完整路径（默认），leaf=只显示最终选中项 */
  displayMode?: 'full' | 'leaf'
  columnWidth?: number
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean
}

interface DropdownPosition {
  left: number
  top: number
  width: number
  maxHeight: number
}

function findPathOptions(options: CascaderOption[], path: string[]): CascaderOption[] {
  const selected: CascaderOption[] = []
  let currentOptions = options

  for (const value of path) {
    const option = currentOptions.find((item) => item.value === value)
    if (!option) break
    selected.push(option)
    currentOptions = option.children || []
  }

  return selected
}

function buildColumns(options: CascaderOption[], activePath: string[]): CascaderOption[][] {
  const columns: CascaderOption[][] = [options]
  let currentOptions = options

  for (const value of activePath) {
    const option = currentOptions.find((item) => item.value === value)
    if (!option?.children?.length) break
    currentOptions = option.children
    columns.push(currentOptions)
  }

  return columns
}

function pathsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function optionMatchesFilter(option: CascaderOption, filterText: string): boolean {
  const normalizedFilter = filterText.trim().toLowerCase()
  if (!normalizedFilter) return true

  return (
    option.label.toLowerCase().includes(normalizedFilter) ||
    option.value.toLowerCase().includes(normalizedFilter) ||
    Boolean(option.description?.toLowerCase().includes(normalizedFilter))
  )
}

export function Cascader({
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  placeholder = '请选择',
  emptyText = '暂无选项',
  loadingText = '加载中...',
  filterable = true,
  filterPlaceholder = '搜索',
  className,
  size = 'md',
  clearable = true,
  displayMode = 'full',
  columnWidth = 220,
  ro,
}: CascaderProps) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState<string[]>([])
  const [activePath, setActivePath] = useState<string[]>([])
  const [filterTexts, setFilterTexts] = useState<string[]>([])
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentValue = value === undefined ? internalValue : value
  const selectedOptions = useMemo(
    () => findPathOptions(options, currentValue),
    [currentValue, options],
  )
  const columns = useMemo(() => buildColumns(options, activePath), [activePath, options])
  const visibleColumns = useMemo(
    () => columns.map((column, columnIndex) => (
      column.filter((option) => optionMatchesFilter(option, filterTexts[columnIndex] || ''))
    )),
    [columns, filterTexts],
  )
  const hasSelection = currentValue.length > 0 && selectedOptions.length === currentValue.length
  const displayLabel = hasSelection
    ? (displayMode === 'leaf'
        ? selectedOptions[selectedOptions.length - 1]?.label ?? placeholder
        : selectedOptions.map((option) => option.label).join(' / '))
    : placeholder

  const sizes = {
    sm: { trigger: 'h-8 pl-3 pr-10 text-xs', icon: 14, clearRight: 'right-7' },
    md: { trigger: 'h-10 pl-4 pr-11 text-sm', icon: 16, clearRight: 'right-8' },
    lg: { trigger: 'h-12 pl-4 pr-12 text-base', icon: 18, clearRight: 'right-9' },
  }

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const gap = 6
    const viewportPadding = 12
    const columnCount = loading || options.length === 0 ? 1 : Math.max(1, visibleColumns.length)
    const preferredWidth = Math.max(rect.width, columnCount * columnWidth)
    const maxWidth = window.innerWidth - viewportPadding * 2
    const width = Math.min(preferredWidth, maxWidth)
    const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding
    const availableAbove = rect.top - gap - viewportPadding
    const maxHeight = Math.max(140, Math.min(320, Math.max(availableBelow, availableAbove)))
    const opensUpward = availableBelow < 220 && availableAbove > availableBelow
    const estimatedHeight = Math.min(maxHeight, 320)

    setDropdownPosition({
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding)),
      top: opensUpward
        ? Math.max(viewportPadding, rect.top - estimatedHeight - gap)
        : rect.bottom + gap,
      width,
      maxHeight,
    })
  }, [columnWidth, loading, options.length, visibleColumns.length])

  const closeDropdown = useCallback(() => {
    setOpen(false)
  }, [])

  const openDropdown = useCallback(() => {
    if (effectiveDisabled) return
    setActivePath(currentValue)
    setFilterTexts([])
    updateDropdownPosition()
    setOpen(true)
  }, [currentValue, effectiveDisabled, updateDropdownPosition])

  const applyValue = useCallback((nextValue: string[]) => {
    const nextSelectedOptions = findPathOptions(options, nextValue)
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue, nextSelectedOptions)
  }, [onChange, options, value])

  const handleOptionSelect = (option: CascaderOption, columnIndex: number) => {
    if (option.disabled) return

    const nextPath = [...activePath.slice(0, columnIndex), option.value]
    applyValue(nextPath)
    closeDropdown()
    triggerRef.current?.focus()
  }

  const handleOptionExpand = (option: CascaderOption, columnIndex: number) => {
    if (option.disabled || !option.children?.length) return

    const nextPath = [...activePath.slice(0, columnIndex), option.value]
    setActivePath(nextPath)
    setFilterTexts((current) => current.slice(0, columnIndex + 1))
  }

  const updateFilterText = (columnIndex: number, nextFilterText: string) => {
    setFilterTexts((current) => {
      const next = current.slice(0, columnIndex + 1)
      next[columnIndex] = nextFilterText
      return next
    })
  }

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setActivePath([])
    applyValue([])
    closeDropdown()
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) {
        closeDropdown()
      } else {
        openDropdown()
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      openDropdown()
    } else if (event.key === 'Escape') {
      closeDropdown()
    }
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        closeDropdown()
      }
    }
    const handleViewportChange = () => updateDropdownPosition()

    updateDropdownPosition()
    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [closeDropdown, open, updateDropdownPosition])

  useEffect(() => {
    if (effectiveDisabled) closeDropdown()
  }, [closeDropdown, effectiveDisabled])

  useEffect(() => {
    if (open) updateDropdownPosition()
  }, [activePath, open, updateDropdownPosition])

  return (
    <div className={clsx('relative w-full', className)} data-ro={ro || undefined}>
      <button
        ref={triggerRef}
        type="button"
        disabled={effectiveDisabled}
        aria-haspopup="tree"
        aria-expanded={open}
        onClick={() => open ? closeDropdown() : openDropdown()}
        onKeyDown={handleTriggerKeyDown}
        className={clsx(
          'group flex w-full items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-left font-medium text-[var(--color-text)] outline-none',
          'cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,background-color] duration-200',
          'hover:border-[var(--color-primary)] hover:bg-[var(--color-card-elevated)]',
          'focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--color-border)]',
          sizes[size].trigger,
        )}
      >
        <span className={clsx('block min-w-0 flex-1 truncate', !hasSelection && 'text-[var(--color-text-tertiary)]')}>
          {displayLabel}
        </span>
        <ChevronDown
          size={sizes[size].icon}
          className={clsx(
            'absolute right-3 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200',
            open && 'rotate-180 text-[var(--color-primary)]',
          )}
        />
      </button>

      {clearable && hasSelection && !effectiveDisabled && (
        <button
          type="button"
          aria-label="清除选择"
          onClick={handleClear}
          className={clsx(
            'absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]',
            sizes[size].clearRight,
          )}
        >
          <X size={12} />
        </button>
      )}

      {open && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          data-ro={ro || undefined}
          className="fixed z-[1000] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card-xl)]"
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width,
            maxHeight: dropdownPosition.maxHeight,
          }}
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
              {loadingText}
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
              {emptyText}
            </div>
          ) : (
            <div className="flex max-w-full overflow-x-auto">
              {visibleColumns.map((column, columnIndex) => (
                <div
                  key={`column-${columnIndex}`}
                  className="flex shrink-0 flex-col border-r border-[var(--color-border)] last:border-r-0"
                  style={{
                    width: visibleColumns.length === 1
                      ? dropdownPosition.width
                      : Math.min(columnWidth, dropdownPosition.width),
                    maxHeight: dropdownPosition.maxHeight,
                  }}
                >
                  {filterable && (
                    <div className="border-b border-[var(--color-border)] p-1.5">
                      <div className="relative">
                        <Search
                          size={13}
                          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                        />
                        <input
                          type="text"
                          value={filterTexts[columnIndex] || ''}
                          onChange={(event) => updateFilterText(columnIndex, event.target.value)}
                          placeholder={filterPlaceholder}
                          className="h-8 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card-elevated)] pl-7 pr-2 text-xs text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                        />
                      </div>
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-thin">
                    {column.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">
                        {emptyText}
                      </div>
                    ) : column.map((option) => {
                      const optionPath = [...activePath.slice(0, columnIndex), option.value]
                      const hasChildren = Boolean(option.children?.length)
                      const isActive = activePath[columnIndex] === option.value
                      const isSelected = pathsEqual(currentValue, optionPath)

                      return (
                        <div
                          key={`${columnIndex}-${option.value}`}
                          className={clsx(
                            'flex w-full items-stretch rounded-lg text-sm transition-colors',
                            (isActive || isSelected) && 'bg-[var(--color-primary-light)]',
                            !isActive && !isSelected && 'hover:bg-[var(--color-bg-hover)]',
                            option.disabled && 'cursor-not-allowed opacity-40',
                          )}
                        >
                          <button
                            type="button"
                            disabled={option.disabled}
                            onClick={() => handleOptionSelect(option, columnIndex)}
                            className={clsx(
                              'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                              isSelected && 'font-medium text-[var(--color-primary)]',
                            )}
                            style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{option.label}</span>
                              {option.description && (
                                <span className="block truncate text-xs font-normal text-[var(--color-text-tertiary)]">
                                  {option.description}
                                </span>
                              )}
                            </span>
                            <Check
                              size={14}
                              className={clsx('shrink-0 text-[var(--color-primary)]', !isSelected && 'invisible')}
                            />
                          </button>
                          {hasChildren && option.isLeaf !== true && (
                            <button
                              type="button"
                              disabled={option.disabled}
                              aria-label={`展开${option.label}下一级`}
                              aria-expanded={isActive}
                              title="展开下一级"
                              onClick={() => handleOptionExpand(option, columnIndex)}
                              className="flex w-9 shrink-0 items-center justify-center rounded-r-lg text-[var(--color-text-tertiary)] outline-none transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
