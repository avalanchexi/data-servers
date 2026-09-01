import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { useWriteBlocked } from '../../permission/writeScope'

// ── 类型 ──────────────────────────────────────────────────

/** 便捷数据源结构：{value, label} 简单选项（见 items prop） */
export interface SearchSelectOption {
  value: string
  label: string
}

export interface SearchableSelectProps<T = SearchSelectOption> {
  /** 当前选中值 */
  value: string
  onChange: (value: string) => void
  /** 便捷数据源：{value,label} 简单选项，与 options+提取函数二选一 */
  items?: SearchSelectOption[]
  /** 选项列表（支持任意数据类型，需配合 getOptionValue/getSearchText/renderOption） */
  options?: T[]
  /** 从选项提取唯一值，用于选中和比较 */
  getOptionValue?: (opt: T) => string
  /** 从选项提取搜索文本，用于输入过滤匹配 */
  getSearchText?: (opt: T) => string
  /** 渲染下拉选项内容 */
  renderOption?: (opt: T, isSelected: boolean) => React.ReactNode
  /** 渲染触发器（折叠态）的选中内容，默认复用 renderOption */
  renderTrigger?: (opt: T) => React.ReactNode
  /** 下拉最多渲染条数，超出部分提示用户细化搜索（大列表性能保护） */
  maxRender?: number
  /** 尺寸：sm=32px（默认），md=40px */
  size?: 'sm' | 'md'
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean
}

interface DropdownPosition {
  left: number
  top: number
  width: number
  maxHeight: number
  opensUpward: boolean
}

/** 下拉最多渲染条数（大列表性能保护默认值，超出提示细化搜索） */
const DEFAULT_MAX_RENDER = 100

// ── 组件 ──────────────────────────────────────────────────

export function SearchableSelect<T = SearchSelectOption>({
  value,
  onChange,
  items,
  options,
  getOptionValue,
  getSearchText,
  renderOption,
  renderTrigger,
  maxRender = DEFAULT_MAX_RENDER,
  size = 'sm',
  placeholder = '选择',
  searchPlaceholder = '搜索…',
  emptyText = '无匹配结果',
  className,
  disabled = false,
  ro,
}: SearchableSelectProps<T>) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)
  const [inputFocused, setInputFocused] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // ── 数据源解析：items 便捷模式映射为 {value,label} 提取函数 ──

  const resolvedOptions: T[] = (items ?? options ?? []) as T[]

  const getValue = useCallback(
    (opt: T): string => {
      if (getOptionValue) return getOptionValue(opt)
      return (opt as unknown as SearchSelectOption).value
    },
    [getOptionValue],
  )

  const getText = useCallback(
    (opt: T): string => {
      if (getSearchText) return getSearchText(opt)
      const it = opt as unknown as SearchSelectOption
      return `${it.label} ${it.value}`
    },
    [getSearchText],
  )

  // items 模式默认渲染：复刻选中高亮 + ✓ 标记
  const defaultRenderOption = useCallback(
    (opt: T, isSelected: boolean) => {
      const it = opt as unknown as SearchSelectOption
      return (
        <>
          <span className="truncate" style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
            {it.label}
          </span>
          {isSelected && (
            <span className="text-[10px] font-bold text-white bg-[var(--color-primary)] rounded-full w-4 h-4 flex items-center justify-center ml-2 flex-shrink-0">
              ✓
            </span>
          )}
        </>
      )
    },
    [],
  )

  const renderItem = renderOption ?? defaultRenderOption

  // ── 过滤选项 ────────────────────────────────────────────

  const filteredOptions = resolvedOptions.filter((opt) => {
    if (!filter.trim()) return true
    return getText(opt).toLowerCase().includes(filter.trim().toLowerCase())
  })

  const visibleOptions = maxRender && maxRender > 0 ? filteredOptions.slice(0, maxRender) : filteredOptions
  const truncatedCount = filteredOptions.length - visibleOptions.length

  const selectedOption = resolvedOptions.find((opt) => getValue(opt) === value)

  // ── 定位计算 ────────────────────────────────────────────

  const updateDropdownPosition = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const gap = 4
    const vp = 12
    const below = window.innerHeight - rect.bottom - gap - vp
    const above = rect.top - gap - vp
    const opensUpward = below < 200 && above > below
    const maxHeight = Math.max(120, Math.min(320, opensUpward ? above : below))

    setDropdownPosition({
      left: Math.max(vp, Math.min(rect.left, window.innerWidth - rect.width - vp)),
      top: opensUpward ? rect.top - gap : rect.bottom + gap,
      width: Math.max(rect.width, 220),
      maxHeight,
      opensUpward,
    })
  }, [])

  // ── 选择 / 关闭 ────────────────────────────────────────

  const selectOption = useCallback(
    (optValue: string) => {
      onChange(optValue)
      setFilter('')
      setHighlightIndex(-1)
      setOpen(false)
      setInputFocused(false)
      inputRef.current?.blur()
    },
    [onChange],
  )

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setFilter('')
    setHighlightIndex(-1)
    setInputFocused(false)
  }, [])

  // ── 键盘导航 ────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (effectiveDisabled) return

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setOpen(true)
        setHighlightIndex(0)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
        return
      }
      return
    }

    const total = Math.max(visibleOptions.length, 1)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((prev) => (prev < total - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : total - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (visibleOptions.length > 0 && highlightIndex >= 0 && highlightIndex < visibleOptions.length) {
          selectOption(getValue(visibleOptions[highlightIndex]))
        } else if (visibleOptions.length > 0) {
          selectOption(getValue(visibleOptions[0]))
        }
        break
      case 'Escape':
        e.preventDefault()
        closeDropdown()
        break
      case 'Tab':
        closeDropdown()
        break
    }
  }

  // ── 滚动高亮项到可见区域 ────────────────────────────────

  useEffect(() => {
    if (!listRef.current || highlightIndex < 0) return
    const item = listRef.current.querySelector(`[data-sel-index="${highlightIndex}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  // ── 外部点击关闭 ────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      closeDropdown()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, closeDropdown])

  // ── 视口变化时更新位置 ──────────────────────────────────

  useEffect(() => {
    if (!open) {
      setDropdownPosition(null)
      return
    }
    updateDropdownPosition()
    const handler = () => updateDropdownPosition()
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [open, updateDropdownPosition])

  // ── 过滤变化时重置高亮 ──────────────────────────────────

  useEffect(() => {
    if (open) setHighlightIndex(0)
  }, [filter, open])

  // ── 渲染 ────────────────────────────────────────────────

  const isActive = open || inputFocused

  const triggerHeight = size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm'

  const triggerContent = open ? (
    <>
      <Search size={14} className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
      <input
        ref={inputRef}
        type="text"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setInputFocused(true)
          if (!open) setOpen(true)
        }}
        onBlur={() => setInputFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={searchPlaceholder}
        disabled={effectiveDisabled}
        className="min-w-0 flex-1 bg-transparent p-0 outline-none placeholder:text-[var(--color-text-tertiary)]"
        style={{ color: 'var(--color-text)', fontSize: 'inherit' }}
      />
    </>
  ) : (
    <span className="min-w-0 flex-1 truncate">
      {selectedOption ? (
        renderTrigger ? renderTrigger(selectedOption) : renderItem(selectedOption, false)
      ) : (
        <span style={{ color: 'var(--color-text-tertiary)' }}>{placeholder}</span>
      )}
    </span>
  )

  return (
    <div ref={containerRef} data-ro={ro || undefined} className={clsx('relative', className)}>
      {/* 触发器 */}
      <div
        className={clsx(
          'flex items-center gap-1.5 px-2.5 rounded-lg border cursor-text transition-all duration-200 select-none',
          triggerHeight,
        )}
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
          boxShadow: isActive ? '0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent)' : undefined,
        }}
        onClick={() => {
          if (effectiveDisabled) return
          if (!open) {
            setOpen(true)
            setFilter('')
          }
          inputRef.current?.focus()
        }}
      >
        {triggerContent}
        <ChevronDown
          size={14}
          className={clsx('shrink-0 transition-transform duration-200', open && 'rotate-180')}
          style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
        />
      </div>

      {/* 下拉面板 */}
      {open && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          data-ro={ro || undefined}
          className="fixed z-[1001] overflow-hidden rounded-xl border bg-[var(--color-card)] shadow-[var(--shadow-card-xl)] animate-fade-in"
          style={{
            borderColor: 'var(--color-border)',
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width,
            transformOrigin: dropdownPosition.opensUpward ? 'bottom center' : 'top center',
          }}
        >
          <ul
            ref={listRef}
            className="overflow-auto py-1.5"
            style={{ maxHeight: dropdownPosition.maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <li
                className="px-2.5 py-2 text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {filter.trim() ? emptyText : '暂无可用选项'}
              </li>
            ) : (
              visibleOptions.map((opt, idx) => {
                const isHighlighted = idx === highlightIndex
                return (
                  <li
                    key={getValue(opt)}
                    data-sel-index={idx}
                    className="flex items-baseline gap-1.5 px-2.5 py-2 cursor-pointer transition-colors text-xs"
                    style={{
                      backgroundColor: isHighlighted ? 'var(--color-bg-hover)' : undefined,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectOption(getValue(opt))
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    {renderItem(opt, getValue(opt) === value)}
                  </li>
                )
              })
            )}
          </ul>
          {truncatedCount > 0 && (
            <div
              className="border-t px-2.5 py-2 text-xs text-center"
              style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border)' }}
            >
              仅显示前 {visibleOptions.length} 条，共 {filteredOptions.length} 条，请细化搜索
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
