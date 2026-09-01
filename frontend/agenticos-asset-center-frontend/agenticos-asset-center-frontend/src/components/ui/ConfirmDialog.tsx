import { useState, useCallback, type ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react'

export type ConfirmType = 'danger' | 'warning' | 'info' | 'question'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string | ReactNode
  type?: ConfirmType
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

const TYPE_CONFIG: Record<ConfirmType, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  danger: { icon: AlertCircle, color: 'var(--color-error, #ef4444)', bg: 'rgba(239,68,68,0.08)' },
  warning: { icon: AlertTriangle, color: 'var(--color-warning, #f59e0b)', bg: 'rgba(245,158,11,0.08)' },
  info: { icon: Info, color: 'var(--color-primary)', bg: 'rgba(59,130,246,0.08)' },
  question: { icon: HelpCircle, color: 'var(--color-primary)', bg: 'rgba(59,130,246,0.08)' },
}

export function ConfirmDialog({
  open,
  title,
  message,
  type = 'question',
  confirmText = '确定',
  cancelText = '取消',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  const handleConfirm = useCallback(async () => {
    if (internalLoading) return
    setInternalLoading(true)
    try {
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }, [onConfirm, internalLoading])

  const isLoading = loading || internalLoading

  return (
    <Modal open={open} onClose={() => !isLoading && onCancel?.()} size="sm" maskClosable={!isLoading}>
      <div className="flex flex-col items-center text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: config.bg }}
        >
          <Icon size={24} style={{ color: config.color }} />
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>
        {message && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {message}
          </p>
        )}
      </div>
      <div className="flex justify-center gap-3 mt-6">
        <Button variant="ghost" ro onClick={() => onCancel?.()} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={type === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
