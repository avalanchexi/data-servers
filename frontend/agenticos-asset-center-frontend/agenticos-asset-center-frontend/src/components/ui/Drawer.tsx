import { clsx } from 'clsx';
import { ReactNode, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = '384px',
}: DrawerProps) {
  // 打开时禁止 body 滚动
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  // 未打开时不渲染 DOM
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* 抽屉面板 */}
      <div
        className="fixed top-0 right-0 h-full flex flex-col"
        style={{
          width,
          backgroundColor: 'var(--color-card)',
          boxShadow: 'var(--shadow-modal)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        {(title) && (
          <div
            className="flex items-center justify-between px-5 py-4 border-b shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {title ? (
              <h2
                id="drawer-title"
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {title}
              </h2>
            ) : (
              <div />
            )}
            <button
              type="button"
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
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
          {children}
        </div>

        {/* 底部操作栏 */}
        {footer && (
          <div
            className="px-5 py-4 border-t shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
