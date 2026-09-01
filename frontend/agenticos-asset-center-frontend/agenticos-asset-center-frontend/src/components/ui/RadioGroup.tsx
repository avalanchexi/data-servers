import { clsx } from 'clsx';
import { useWriteBlocked } from '../../permission/writeScope';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** 只读豁免：该组件为读操作，页面只读时不被拦截 */
  ro?: boolean;
}

export function RadioGroup({
  name,
  value,
  options,
  onChange,
  disabled = false,
  className,
  ro,
}: RadioGroupProps) {
  const blocked = useWriteBlocked() && !ro;
  const effectiveDisabled = disabled || blocked;
  return (
    <div className={clsx('flex items-center gap-4', className)} role="radiogroup" data-ro={ro || undefined}>
      {options.map((option) => {
        const optionDisabled = effectiveDisabled || option.disabled;

        return (
          <label
            key={option.value}
            className={clsx(
              'flex items-center gap-2 text-sm',
              optionDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            )}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={optionDisabled}
              onChange={() => onChange(option.value)}
              className="h-4 w-4"
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
