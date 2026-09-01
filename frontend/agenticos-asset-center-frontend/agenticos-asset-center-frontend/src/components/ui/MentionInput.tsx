import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { OkrApi, type OkrUserBrief } from '@/api/oa'
import { useWriteBlocked, READONLY_CLASS } from '../../permission/writeScope'

const MENTION_MARKUP_RE = /@\[([^\]]+)\|([^\]]+)\]/g

function parseMentionValue(value: string) {
  const tokens = new Map<string, string>()
  const display = value.replace(MENTION_MARKUP_RE, (markup, userId: string, name: string) => {
    tokens.set(`@${name}`, markup)
    return `@${name}`
  })
  return { display, tokens }
}

function serializeMentionValue(display: string, tokens: Map<string, string>) {
  const mentions = [...tokens.keys()].sort((a, b) => b.length - a.length)
  if (mentions.length === 0) return display
  const escaped = mentions.map((mention) =>
    mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  return display.replace(
    new RegExp(escaped.join('|'), 'g'),
    (mention) => tokens.get(mention)!,
  )
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** 是否为多行模式（textarea），默认 false（input） */
  multiline?: boolean
  className?: string
  style?: React.CSSProperties
  /** 透传其他 input/textarea 属性 */
  onKeyDown?: React.KeyboardEventHandler
  onFocus?: React.FocusEventHandler
  onBlur?: React.FocusEventHandler
  autoFocus?: boolean
  rows?: number
  /** 只读豁免：该组件为读操作，页面只读时不被拦截 */
  ro?: boolean
}

/**
 * MentionInput — 支持 @mention 的输入组件。
 *
 * 输入 @ 后触发用户搜索下拉，选中后插入 @[user_id|display_name] 内联标记。
 * 支持单行 <input> 和多行 <textarea> 两种模式。
 */
export function MentionInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
  style,
  onKeyDown,
  onFocus,
  onBlur,
  autoFocus,
  rows = 3,
  ro,
}: MentionInputProps) {
  const blocked = useWriteBlocked() && !ro
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialMentionValue = parseMentionValue(value)
  const mentionTokensRef = useRef(initialMentionValue.tokens)
  const [displayValue, setDisplayValue] = useState(initialMentionValue.display)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<OkrUserBrief[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1) // @ 在 value 中的位置
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchVersionRef = useRef(0)

  const elRef = multiline ? textareaRef : inputRef

  useEffect(() => {
    const parsed = parseMentionValue(value)
    mentionTokensRef.current = parsed.tokens
    setDisplayValue(parsed.display)
  }, [value])

  // 计算下拉菜单位置（下方空间不足时自动翻转到上方）
  const updateDropdownPosition = useCallback(() => {
    const el = multiline ? textareaRef.current : inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dropdownHeight = 240 // 与 maxHeight 保持一致
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    // 下方空间不足且上方空间更大时，显示在输入框上方
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    setDropdownStyle({
      position: 'fixed',
      left: `${rect.left}px`,
      top: showAbove ? `${rect.top - dropdownHeight - gap}px` : `${rect.bottom + gap}px`,
      minWidth: `${Math.max(rect.width, 240)}px`,
      maxHeight: `${Math.min(dropdownHeight, showAbove ? spaceAbove - gap : spaceBelow - gap)}px`,
      zIndex: 9999,
    })
  }, [multiline])

  // 获取光标所在的 @mention 查询文本
  const getMentionQuery = useCallback((
    currentValue = displayValue,
    currentCursor?: number,
  ): { start: number; query: string } | null => {
    const el = multiline ? textareaRef.current : inputRef.current
    if (!el && currentCursor === undefined) return null

    const cursorPos = currentCursor ?? el?.selectionStart ?? 0
    const textBeforeCursor = currentValue.slice(0, cursorPos)

    // 从光标向前查找最近的 @
    const atIdx = textBeforeCursor.lastIndexOf('@')
    if (atIdx === -1) return null

    // @ 必须在行首或前面是空白字符
    const charBeforeAt = atIdx > 0 ? textBeforeCursor[atIdx - 1] : ' '
    if (charBeforeAt !== ' ' && charBeforeAt !== '\n') return null

    // 查询文本（@ 之后到光标之间的内容）
    // 排除已经完整的 mention 标记 @[xxx|xxx]
    const afterAt = textBeforeCursor.slice(atIdx + 1)
    // 如果 afterAt 以 [ 开头，说明可能是已完成的 mention 标记，不触发
    if (afterAt.startsWith('[')) return null

    // 光标越过空格后说明本次 mention 输入已经结束。
    if (/[\s\]]/.test(afterAt)) return null
    const query = afterAt

    return { start: atIdx, query }
  }, [displayValue, multiline])

  // 搜索用户
  const searchUsers = useCallback(async (query: string, version: number) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    try {
      const users = await OkrApi.searchUsers(query)
      if (version !== searchVersionRef.current) return
      setSearchResults(users)
      setActiveIndex(0)
      if (users.length > 0) {
        setShowDropdown(true)
        updateDropdownPosition()
      } else {
        setShowDropdown(false)
      }
    } catch {
      if (version !== searchVersionRef.current) return
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [updateDropdownPosition])

  // 插入 mention 并关闭下拉
  const insertMention = useCallback((user: OkrUserBrief) => {
    if (mentionStart === -1) return

    const el = multiline ? textareaRef.current : inputRef.current
    if (!el) return

    const cursorPos = el.selectionStart ?? 0
    const name = user.display_name || user.username
    const mentionText = `@${name}`
    mentionTokensRef.current.set(
      mentionText,
      `@[${user.username}|${name}]`,
    )

    const before = displayValue.slice(0, mentionStart)
    const after = displayValue.slice(cursorPos)
    const newValue = before + mentionText + ' ' + after
    setDisplayValue(newValue)
    onChange(serializeMentionValue(newValue, mentionTokensRef.current))

    searchVersionRef.current += 1
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setShowDropdown(false)
    setMentionStart(-1)
    setSearchResults([])

    // 恢复焦点并将光标移到插入文本之后
    requestAnimationFrame(() => {
      el.focus()
      const newCursorPos = mentionStart + mentionText.length + 1 // +1 for space
      el.setSelectionRange(newCursorPos, newCursorPos)
    })
  }, [displayValue, onChange, mentionStart, multiline])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showDropdown && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % searchResults.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(searchResults[activeIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        searchVersionRef.current += 1
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setShowDropdown(false)
        setMentionStart(-1)
        return
      }
    }
    onKeyDown?.(e)
  }, [showDropdown, searchResults, activeIndex, insertMention, onKeyDown])

  // 处理输入变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart ?? newValue.length
    setDisplayValue(newValue)
    onChange(serializeMentionValue(newValue, mentionTokensRef.current))

    // 检查是否需要显示 mention 下拉
    // 直接使用本次输入值，避免 React 状态更新前读取到旧 value。
    requestAnimationFrame(() => {
      const mention = getMentionQuery(newValue, cursorPos)
      if (mention) {
        setMentionStart(mention.start)
        // debounce 搜索
        if (debounceRef.current) clearTimeout(debounceRef.current)
        const version = ++searchVersionRef.current
        debounceRef.current = setTimeout(() => {
          searchUsers(mention.query, version)
        }, 150)
      } else {
        searchVersionRef.current += 1
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setShowDropdown(false)
        setMentionStart(-1)
      }
    })
  }, [onChange, getMentionQuery, searchUsers])

  // 点击下拉项
  const handleSelectUser = useCallback((user: OkrUserBrief) => {
    insertMention(user)
  }, [insertMention])

  // 点击外部关闭下拉
  useEffect(() => {
    if (!showDropdown) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.mention-dropdown')) return
      if (target === inputRef.current || target === textareaRef.current) return
      searchVersionRef.current += 1
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setShowDropdown(false)
      setMentionStart(-1)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  // 滚动时更新位置
  useEffect(() => {
    if (!showDropdown) return
    const handler = () => updateDropdownPosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [showDropdown, updateDropdownPosition])

  // 清理 debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const inputProps = {
    ref: elRef as React.Ref<HTMLInputElement & HTMLTextAreaElement>,
    value: displayValue,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onFocus,
    onBlur,
    placeholder,
    autoFocus,
    disabled: blocked,
    'data-ro': ro || undefined,
    className: blocked ? `${className || ''} ${READONLY_CLASS}` : className,
    style,
  }

  return (
    <>
      {multiline ? (
        <textarea {...inputProps} rows={rows} />
      ) : (
        <input {...inputProps} type="text" />
      )}

      {showDropdown && searchResults.length > 0 &&
        createPortal(
          <div
            className="mention-dropdown"
            data-ro={ro || undefined}
            style={{
              ...dropdownStyle,
              backgroundColor: 'var(--color-card, #fff)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              overflowY: 'auto',
            }}
          >
            {searchResults.map((user, i) => (
              <div
                key={user.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelectUser(user)
                }}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm"
                style={{
                  backgroundColor: i === activeIndex ? 'rgba(59,130,246,0.08)' : 'transparent',
                  color: 'var(--color-text, #1f2937)',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* 头像 */}
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary, #3b82f6)' }}
                >
                  {user.display_name?.charAt(0) || user.username.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">
                    {user.display_name || user.username}
                  </span>
                  {user.display_name && user.display_name !== user.username && (
                    <span className="text-xs truncate" style={{ color: 'var(--color-text-tertiary, #9ca3af)' }}>
                      @{user.username}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
