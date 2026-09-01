import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { useWriteBlocked } from '../../permission/writeScope';

export interface SliderProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'min' | 'max' | 'step' | 'onChange'
  > {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  /** 只读豁免：该组件为读操作，页面只读时不被拦截 */
  ro?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value,
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    disabled = false,
    className,
    ro,
    ...rest
  },
  ref
) {
  const blocked = useWriteBlocked() && !ro;
  const effectiveDisabled = disabled || blocked;
  const safeMax = max > min ? max : min + 1;
  const safeValue = Math.min(safeMax, Math.max(min, value));
  const percentage = ((safeValue - min) / (safeMax - min)) * 100;

  return (
    <div
      data-ro={ro || undefined}
      className={clsx(
        'group relative flex h-6 w-full items-center',
        effectiveDisabled && 'opacity-50',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-150"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-[var(--color-card)] bg-[var(--color-primary)] shadow-sm transition-transform group-hover:scale-110 group-focus-within:scale-110 group-focus-within:ring-4 group-focus-within:ring-[var(--color-primary-light)]"
        style={{ left: `${percentage}%` }}
      />
      <input
        ref={ref}
        type="range"
        min={min}
        max={safeMax}
        step={step}
        value={safeValue}
        disabled={effectiveDisabled}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...rest}
      />
    </div>
  );
});
