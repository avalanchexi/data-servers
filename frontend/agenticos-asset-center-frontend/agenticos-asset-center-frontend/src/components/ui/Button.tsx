import { clsx } from 'clsx'
import { useCallback, memo, ReactNode } from 'react'
import { Message } from './Message'
import { useWriteBlocked, NO_WRITE_PERMISSION_MESSAGE, READONLY_CLASS } from '../../permission/writeScope'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
  title?: string
  style?: React.CSSProperties
  /** 只读豁免：该按钮为读操作（查看/搜索等），页面只读时不被拦截 */
  ro?: boolean
}

export const Button = memo(function Button({
  variant = 'secondary',
  size = 'md',
  children,
  disabled,
  loading,
  fullWidth,
  onClick,
  className,
  type = 'button',
  title,
  style,
  ro,
}: ButtonProps) {
  const writeBlocked = useWriteBlocked() && !ro
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (writeBlocked) {
      // 阻断默认行为：防止 type="submit" 的写按钮在只读态下触发表单提交
      e.preventDefault()
      Message.warning(NO_WRITE_PERMISSION_MESSAGE)
      return
    }
    if (!disabled && !loading && onClick) onClick()
  }, [disabled, loading, onClick, writeBlocked])

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'text-white focus:ring-[var(--color-primary)] shadow-[var(--glow-primary)]',
    secondary: 'bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] focus:ring-[var(--color-primary)]',
    danger: 'bg-[var(--color-error-light)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white focus:ring-[var(--color-error)]',
    ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] focus:ring-[var(--color-primary)]',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-2xl',
  }

  return (
    <button
      type={type}
      data-ro={ro || undefined}
      className={clsx(
        baseStyles,
        variant === 'primary' ? '' : variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        writeBlocked && READONLY_CLASS,
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      title={writeBlocked ? NO_WRITE_PERMISSION_MESSAGE : title}
      style={variant === 'primary' ? { background: 'var(--gradient-primary)', color: 'white', ...style } : style}
    >
      {loading && (
        <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
})
