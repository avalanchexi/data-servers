import { clsx } from 'clsx'
import { memo, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = memo(function Card({
  children,
  className,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-[var(--color-card)] shadow-[var(--shadow-card)]',
        paddings[padding],
        hoverable && 'cursor-pointer transition-shadow hover:shadow-[var(--shadow-card-lg)]',
        className
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  )
})
