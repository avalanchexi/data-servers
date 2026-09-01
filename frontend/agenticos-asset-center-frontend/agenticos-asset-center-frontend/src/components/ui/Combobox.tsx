import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useWriteBlocked } from '../../permission/writeScope'

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  onInputChange?: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  emptyText?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  allowCustom?: boolean
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean
}

interface DropdownPosition {
  left: number
  top: number
  width: number
  maxHeight: number
}

export function Combobox({
  value,
  onChange,
  onInputChange,
  options,
  placeholder = '请选择或输入',
  emptyText,
  className,
  size = 'md',
  disabled = false,
  allowCustom = true,
  ro,
}: ComboboxProps) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [filter, setFilter] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-4',
  }

  const iconSize = size === 'sm' ? 14 : 16
  const iconRight = size === 'sm' ? 'right-2' : 'right-3'

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(filter.toLowerCase()) ||
      opt.value.toLowerCase().includes(filter.toLowerCase()),
  )

  const showDropdown = open

  const updateDropdownPosition = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const gap = 6
    const viewportPadding = 12
    const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding
    const availableAbove = rect.top - gap - viewportPadding
    const opensUpward = availableBelow < 180 && availableAbove > availableBelow
    const availableSpace = opensUpward ? availableAbove : availableBelow
    const itemCount = Math.max(1, filteredOptions.length)
    const maxHeight = Math.max(72, Math.min(208, availableSpace))
    const estimatedHeight = Math.min(maxHeight, itemCount * 40 + 8)
    const width = rect.width

    setDropdownPosition({
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding)),
      top: opensUpward
        ? Math.max(viewportPadding, rect.top - estimatedHeight - gap)
        : rect.bottom + gap,
      width,
      maxHeight,
    })
  }, [filteredOptions.length])

  const selectOption = useCallback(
    (optValue: string) => {
      onChange(optValue)
      setFilter('')
      setHighlightIndex(-1)
      setOpen(false)
      inputRef.current?.blur()
    },
    [onChange],
  )

  const scrollToHighlight = useCallback((index: number) => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-combobox-item]')
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' })
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setOpen(true)
        setFilter('')
        setHighlightIndex(0)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') return
      setOpen(true)
      setFilter('')
      return
    }

    const totalItems = filteredOptions.length > 0 ? filteredOptions.length : 1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((prev) => {
          const next = prev < totalItems - 1 ? prev + 1 : 0
          scrollToHighlight(next)
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((prev) => {
          const next = prev > 0 ? prev - 1 : totalItems - 1
          scrollToHighlight(next)
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0) {
          if (filteredOptions.length === 0) {
            if (allowCustom) selectOption(filter || value)
          } else if (highlightIndex < filteredOptions.length) {
            selectOption(filteredOptions[highlightIndex].value)
          }
        } else if (filteredOptions.length > 0) {
          selectOption(filteredOptions[0].value)
        } else if (allowCustom) {
          selectOption(filter || value)
        }
        break
      case 'Escape':
        setOpen(false)
        setFilter('')
        setHighlightIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        setOpen(false)
        if (allowCustom) onChange(filter || value)
        setFilter('')
        setHighlightIndex(-1)
        break
    }
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
        setFilter('')
        setHighlightIndex(-1)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) {
      setFilter('')
      setHighlightIndex(-1)
      setDropdownPosition(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    updateDropdownPosition()
    const handleViewportChange = () => updateDropdownPosition()
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [open, updateDropdownPosition])

  useEffect(() => {
    if (open) {
      setHighlightIndex(-1)
    }
  }, [filter, open])

  const selectedOption = options.find((option) => option.value === value)
  const displayValue = open ? filter : selectedOption?.label ?? value

  return (
    <div ref={containerRef} className={clsx('relative', className)} data-ro={ro || undefined}>
      <div
        className={clsx(
          'relative rounded-xl transition-all duration-200',
          focused && 'ring-2 ring-offset-0',
        )}
        style={{
          boxShadow: focused ? '0 0 0 3px rgba(47, 107, 255, 0.15)' : undefined,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          disabled={effectiveDisabled}
          onChange={(e) => {
            setFilter(e.target.value)
            onInputChange?.(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => {
            if (effectiveDisabled) return
            setFocused(true)
            setOpen(true)
            setFilter('')
          }}
          onBlur={() => setFocused(false)}
          onClick={() => {
            if (effectiveDisabled) return
            if (!open) {
              setOpen(true)
              setFilter('')
            }
          }}
          onKeyDown={effectiveDisabled ? undefined : handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            'w-full border outline-none transition-colors duration-200',
            effectiveDisabled ? 'bg-[var(--color-bg)] text-[var(--color-text-tertiary)] cursor-not-allowed' : 'bg-[var(--color-card)] text-[var(--color-text)]',
            sizeClasses[size],
            size === 'md' ? 'pr-10' : 'pr-8',
            'rounded-xl',
          )}
          style={{ borderColor: effectiveDisabled ? 'var(--color-border)' : (focused ? 'var(--color-primary)' : 'var(--color-border)') }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={effectiveDisabled}
          onClick={() => {
            if (effectiveDisabled) return
            inputRef.current?.focus()
            if (!open) setOpen(true)
          }}
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-md transition-colors',
            iconRight,
          )}
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <ChevronDown
            size={iconSize}
            className={clsx('transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
      </div>

      {showDropdown && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          data-ro={ro || undefined}
          className={clsx(
            'fixed z-[1000] overflow-hidden rounded-xl',
            'shadow-[var(--shadow-card-lg)]',
            'border bg-[var(--color-card)]',
            'animate-fade-in',
          )}
          style={{
            borderColor: 'var(--color-border)',
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width,
          }}
        >
          <ul
            ref={listRef}
            className="overflow-auto py-1 scrollbar-thin"
            style={{ maxHeight: dropdownPosition.maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <li
                data-combobox-item
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                  highlightIndex === 0
                    ? 'bg-[var(--color-primary-light)]'
                    : 'hover:bg-[var(--color-bg-hover)]',
                )}
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <span>{emptyText || '无匹配结果'}</span>
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value
                const isHighlighted = idx === highlightIndex
                return (
                  <li
                    key={opt.value}
                    data-combobox-item
                    className={clsx(
                      'flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors',
                      isHighlighted
                        ? 'bg-[var(--color-primary-light)]'
                        : isSelected
                          ? 'bg-[var(--color-primary-light)]'
                          : 'hover:bg-[var(--color-bg-hover)]',
                    )}
                    style={{
                      color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectOption(opt.value)
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <span
                        className="flex-shrink-0 ml-2 flex items-center justify-center w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  )
}
