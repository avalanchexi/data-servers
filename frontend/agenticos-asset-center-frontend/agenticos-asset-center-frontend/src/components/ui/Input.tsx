import { clsx } from 'clsx'
import { memo, ReactNode } from 'react'
import { useWriteBlocked } from '../../permission/writeScope'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'suffix'> {
  prefix?: ReactNode
  suffix?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** 只读豁免：该输入框为读操作（搜索等），页面只读时不被拦截 */
  ro?: boolean
}

export const Input = memo(function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
  prefix,
  suffix,
  className,
  size = 'md',
  id,
  name,
  autoComplete,
  ro,
  ...rest
}: InputProps) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked

  const sizes = {
    sm: 'h-8 text-xs px-3',
    md: 'h-10 text-sm px-4',
    lg: 'h-12 text-base px-4',
  }

  const paddingLeft = prefix ? (size === 'lg' || size === 'md' ? 'pl-10' : 'pl-8') : ''
  const paddingRight = suffix ? (size === 'lg' || size === 'md' ? 'pr-10' : 'pr-8') : ''

  return (
    <div className="relative w-full" data-ro={ro || undefined}>
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {prefix}
        </div>
      )}
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={effectiveDisabled}
        autoComplete={autoComplete || 'off'}
        className={clsx(
          'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
          sizes[size],
          paddingLeft,
          paddingRight,
          className
        )}
        {...rest}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {suffix}
        </div>
      )}
    </div>
  )
})

interface TextareaProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  rows?: number
  className?: string
  id?: string
  name?: string
  /** 只读豁免：该输入框为读操作（搜索等），页面只读时不被拦截 */
  ro?: boolean
}

export const Textarea = memo(function Textarea({
  placeholder,
  value,
  onChange,
  disabled,
  rows = 3,
  className,
  id,
  name,
  ro,
}: TextareaProps) {
  const blocked = useWriteBlocked() && !ro
  const effectiveDisabled = disabled || blocked
  return (
    <textarea
      id={id}
      name={name}
      data-ro={ro || undefined}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={effectiveDisabled}
      rows={rows}
      className={clsx(
        'w-full rounded-xl border bg-[var(--color-card)] text-[var(--color-text)] p-3 outline-none transition-all focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] resize-none disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={{ borderColor: 'var(--color-border)' }}
    />
  )
})
