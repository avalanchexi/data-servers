import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useWriteBlocked } from '../../permission/writeScope'
import { listUsers } from '../../api/users'
import type { AuthUserResponse } from '../../api/auth'

interface UserComboboxProps {
  value: string
  onChange: (userId: string) => void
  placeholder?: string
  size?: 'sm' | 'md'
  className?: string
  disabled?: boolean
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean
}

interface DropdownPos {
  left: number
  top: number
  width: number
  maxHeight: number
}

const PAGE_SIZE = 20

export function UserCombobox({
  value,
  onChange,
  placeholder = '选择用户',
  size = 'md',
  className,
  disabled = false,
  ro,
}: UserComboboxProps) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [users, setUsers] = useState<AuthUserResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AuthUserResponse | null>(null)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sizeClasses = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
  }
  const iconSize = size === 'sm' ? 14 : 16
  const iconRight = size === 'sm' ? 'right-2' : 'right-3'

  const getUserLabel = useCallback((u: AuthUserResponse) => {
    return u.cn_name || u.display_name || u.username
  }, [])

  // 加载用户列表
  const loadUsers = useCallback(async (p: number, search: string) => {
    setLoading(true)
    try {
      const data = await listUsers({
        page: p,
        page_size: PAGE_SIZE,
        search: search || undefined,
      })
      setUsers(data.items || [])
      setTotal(data.total)
    } catch {
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // 搜索防抖
  const handleInputChange = useCallback((text: string) => {
    setSearchText(text)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setPage(1)
      setCommittedSearch(text)
      loadUsers(1, text)
    }, 300)
  }, [loadUsers])

  // 翻页
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    loadUsers(newPage, committedSearch)
  }, [committedSearch, loadUsers])

  // 选中用户
  const selectUser = useCallback((u: AuthUserResponse) => {
    setSelectedUser(u)
    onChange(u.id)
    setOpen(false)
    setSearchText('')
    setCommittedSearch('')
    inputRef.current?.blur()
  }, [onChange])

  // 清除选择
  const clearSelection = useCallback(() => {
    setSelectedUser(null)
    onChange('')
    setSearchText('')
    setCommittedSearch('')
  }, [onChange])

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 计算下拉位置
  const updatePosition = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const gap = 6
    const pad = 12
    const availBelow = window.innerHeight - rect.bottom - gap - pad
    const availAbove = rect.top - gap - pad
    const upward = availBelow < 240 && availAbove > availBelow
    const space = upward ? availAbove : availBelow
    setDropdownPos({
      left: Math.max(pad, Math.min(rect.left, window.innerWidth - rect.width - pad)),
      top: upward ? Math.max(pad, rect.top - Math.min(space, 320) - gap) : rect.bottom + gap,
      width: Math.max(200, rect.width),
      maxHeight: Math.min(320, space),
    })
  }, [])

  useEffect(() => {
    if (open) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [open, updatePosition])

  // 打开时加载初始数据
  const handleFocus = useCallback(() => {
    if (effectiveDisabled) return
    setFocused(true)
    setOpen(true)
    if (users.length === 0) {
      loadUsers(1, '')
    }
  }, [effectiveDisabled, users.length, loadUsers])

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const displayValue = open ? searchText : (selectedUser ? getUserLabel(selectedUser) : '')

  return (
    <div ref={containerRef} data-ro={ro || undefined} className={clsx('relative', className)}>
      <div
        className={clsx('relative rounded-xl transition-all duration-200', focused && 'ring-2 ring-offset-0')}
        style={{ boxShadow: focused ? '0 0 0 3px rgba(47,107,255,0.15)' : undefined }}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          disabled={effectiveDisabled}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setFocused(false)}
          onKeyDown={effectiveDisabled ? undefined : handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            'w-full border outline-none transition-colors duration-200 rounded-xl',
            effectiveDisabled ? 'bg-[var(--color-bg)] text-[var(--color-text-tertiary)] cursor-not-allowed' : 'bg-[var(--color-card)] text-[var(--color-text)]',
            sizeClasses[size],
            size === 'md' ? 'pr-16' : 'pr-14',
          )}
          style={{ borderColor: effectiveDisabled ? 'var(--color-border)' : (focused ? 'var(--color-primary)' : 'var(--color-border)') }}
        />
        <div className={clsx('absolute top-1/2 -translate-y-1/2 flex items-center gap-1', iconRight)}>
          {selectedUser && !open && (
            <button
              type="button"
              tabIndex={-1}
              onClick={clearSelection}
              className="flex items-center justify-center rounded hover:opacity-70"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <X size={iconSize} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={effectiveDisabled}
            onClick={() => { if (!effectiveDisabled) { inputRef.current?.focus(); setOpen((prev) => !prev) } }}
            className="flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <ChevronDown size={iconSize} className={clsx('transition-transform duration-200', open && 'rotate-180')} />
          </button>
        </div>
      </div>

      {open && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          data-ro={ro || undefined}
          className="fixed z-[1000] overflow-hidden rounded-xl border bg-[var(--color-card)] shadow-[var(--shadow-card-lg)] animate-fade-in"
          style={{
            borderColor: 'var(--color-border)',
            left: dropdownPos.left,
            top: dropdownPos.top,
            width: dropdownPos.width,
          }}
        >
          {/* 全部操作人（清除选择） */}
          <button
            type="button"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg-hover)] border-b"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card-elevated)', color: value ? 'var(--color-text-secondary)' : 'var(--color-primary)' }}
            onMouseDown={(e) => { e.preventDefault(); clearSelection(); setOpen(false) }}
          >
            <Search size={14} />
            全部操作人
          </button>

          {/* 用户列表 */}
          <div className="overflow-auto scrollbar-thin py-1" style={{ maxHeight: dropdownPos.maxHeight - 44 }}>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
              </div>
            ) : users.length === 0 ? (
              <div className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {committedSearch ? '未找到匹配的用户' : '暂无用户'}
              </div>
            ) : (
              users.map((u) => {
                const isSelected = u.id === value
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left',
                      isSelected ? 'bg-[var(--color-primary-light)]' : 'hover:bg-[var(--color-bg-hover)]',
                    )}
                    style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}
                    onMouseDown={(e) => { e.preventDefault(); selectUser(u) }}
                  >
                    <span className="flex-1 truncate">{getUserLabel(u)}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                      {u.username}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* 分页 */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 px-4 py-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                disabled={page <= 1}
                onMouseDown={(e) => { e.preventDefault(); handlePageChange(page - 1) }}
                className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30 hover:bg-[var(--color-bg-hover)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{page}/{totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onMouseDown={(e) => { e.preventDefault(); handlePageChange(page + 1) }}
                className="flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30 hover:bg-[var(--color-bg-hover)]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
