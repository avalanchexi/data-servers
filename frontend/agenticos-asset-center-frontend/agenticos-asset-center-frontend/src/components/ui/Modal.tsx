import { clsx } from 'clsx';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  maskClosable?: boolean;
  extra?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  maskClosable = true,
  extra
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && maskClosable) {
      onClose();
    }
  };

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-7xl',
    // 占满视口宽度（外层容器 p-4 边距内）
    full: 'max-w-none'
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      onClick={(e) => {
        if (maskClosable && e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={clsx(
          "w-full max-h-[calc(100vh-2rem)] bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card-xl)] overflow-hidden fade-in-up flex flex-col",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || footer) && (
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {title}
              </h2>
            )}
            {!title && <div />}
            <div className="flex items-center gap-2">
              {extra}
              <button
              data-ro
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={18} />
            </button>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto min-h-0">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}