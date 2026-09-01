import { clsx } from 'clsx';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';
type Variant = 'dark' | 'light';

interface TooltipProps {
  /** 提示内容，支持文本或任意 React 节点 */
  content: ReactNode;
  /** 触发元素 */
  children: ReactNode;
  /** 出现方向，默认 top */
  placement?: Placement;
  /** 色彩模式：dark 深色底白字（默认），light 浅色底深字 */
  variant?: Variant;
  /** 延迟显示毫秒数，默认 300 */
  delay?: number;
  /** 触发容器 className */
  className?: string;
  /** 最大宽度，超出换行，默认 260px */
  maxWidth?: number;
  /** 与触发元素的距离(px)，默认 6 */
  offset?: number;
}

/** 箭头大小(px) */
const ARROW_SIZE = 5;

export function Tooltip({
  content,
  children,
  placement = 'top',
  variant = 'dark',
  delay = 300,
  className,
  maxWidth = 260,
  offset = 6,
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [flippedPlacement, setFlippedPlacement] = useState<Placement>(placement);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const calculatePosition = useCallback(() => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) return;

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth ?? 0;
    const tooltipHeight = tooltipEl?.offsetHeight ?? 0;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let finalPlacement: Placement = placement;
    let left = 0;
    let top = 0;

    // 根据方向计算初始位置
    switch (placement) {
      case 'top':
        left = triggerRect.left + triggerRect.width / 2;
        top = triggerRect.top - offset;
        break;
      case 'bottom':
        left = triggerRect.left + triggerRect.width / 2;
        top = triggerRect.bottom + offset;
        break;
      case 'left':
        left = triggerRect.left - offset;
        top = triggerRect.top + triggerRect.height / 2;
        break;
      case 'right':
        left = triggerRect.right + offset;
        top = triggerRect.top + triggerRect.height / 2;
        break;
    }

    // 自动翻转：超出视口时反向
    if (placement === 'top' && top - tooltipHeight < 0) {
      finalPlacement = 'bottom';
      top = triggerRect.bottom + offset;
    } else if (placement === 'bottom' && top + tooltipHeight > vh) {
      finalPlacement = 'top';
      top = triggerRect.top - tooltipHeight - offset;
    } else if (placement === 'left' && left - tooltipWidth < 0) {
      finalPlacement = 'right';
      left = triggerRect.right + offset;
    } else if (placement === 'right' && left + tooltipWidth > vw) {
      finalPlacement = 'left';
      left = triggerRect.left - tooltipWidth - offset;
    }

    // 水平方向不超出视口
    if (finalPlacement === 'top' || finalPlacement === 'bottom') {
      left = Math.max(tooltipWidth / 2 + 4, Math.min(left, vw - tooltipWidth / 2 - 4));
    }

    setFlippedPlacement(finalPlacement);
    setPos({ left, top });
  }, [placement, offset]);

  const showTooltip = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      setShow(true);
      // 先渲染到 DOM，下一帧再计算位置
      requestAnimationFrame(() => {
        requestAnimationFrame(calculatePosition);
      });
    }, delay);
  }, [clearTimer, delay, calculatePosition]);

  const hideTooltip = useCallback(() => {
    clearTimer();
    setShow(false);
    setPos(null);
  }, [clearTimer]);

  // 键盘 Escape 关闭
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideTooltip();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, hideTooltip]);

  // 清理定时器
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <span
      ref={triggerRef}
      className={clsx('inline-flex', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {show && content && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          // 层级需高于下拉面板（SearchableSelect z-[1001]），否则悬浮提示会被面板盖住
          className={clsx(
            'pointer-events-none fixed z-[1100] rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg animate-fade-in',
            variant === 'dark' && 'text-white',
            variant === 'light' && 'border',
          )}
          style={{
            backgroundColor: variant === 'dark' ? 'var(--color-text)' : 'var(--color-card)',
            color: variant === 'light' ? 'var(--color-text)' : undefined,
            borderColor: variant === 'light' ? 'var(--color-border)' : undefined,
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            maxWidth,
            transform: getTransform(flippedPlacement),
          }}
        >
          {typeof content === 'string' ? <span className="block whitespace-pre-wrap">{content}</span> : content}

          {/* 小三角箭头 */}
          {pos && (
            <span
              className="absolute"
              style={{
                ...getArrowStyle(flippedPlacement),
                borderColor: getArrowColor(flippedPlacement, variant),
              }}
            />
          )}
        </div>,
        document.body,
      )}
    </span>
  );
}

/** 根据方向返回 tooltip 容器的 transform */
function getTransform(p: Placement): string {
  switch (p) {
    case 'top':
      return 'translate(-50%, -100%)';
    case 'bottom':
      return 'translate(-50%, 0)';
    case 'left':
      return 'translate(-100%, -50%)';
    case 'right':
      return 'translate(0, -50%)';
  }
}

/** 根据方向返回箭头的 CSS 定位 + 边框 */
function getArrowStyle(p: Placement): React.CSSProperties {
  const size = ARROW_SIZE;
  const base: React.CSSProperties = {
    width: 0,
    height: 0,
    borderLeft: `${size}px solid transparent`,
    borderRight: `${size}px solid transparent`,
    borderTop: `${size}px solid transparent`,
    borderBottom: `${size}px solid transparent`,
  };

  switch (p) {
    case 'top':
      return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', borderTop: `${size}px solid` };
    case 'bottom':
      return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', borderBottom: `${size}px solid` };
    case 'left':
      return { ...base, left: '100%', top: '50%', transform: 'translateY(-50%)', borderLeft: `${size}px solid` };
    case 'right':
      return { ...base, right: '100%', top: '50%', transform: 'translateY(-50%)', borderRight: `${size}px solid` };
  }
}

/** 箭头颜色跟随 tooltip 背景 */
function getArrowColor(p: Placement, variant: Variant): string {
  const bgVar = variant === 'dark' ? 'var(--color-text)' : 'var(--color-card)';
  switch (p) {
    case 'top':
      return `${bgVar} transparent transparent transparent`;
    case 'bottom':
      return `transparent transparent ${bgVar} transparent`;
    case 'left':
      return `transparent transparent transparent ${bgVar}`;
    case 'right':
      return `transparent ${bgVar} transparent transparent`;
  }
}
