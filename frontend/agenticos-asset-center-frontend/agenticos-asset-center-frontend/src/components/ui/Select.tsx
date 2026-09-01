import {
  Children,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronDown, X} from 'lucide-react';
import {clsx} from 'clsx';
import {useWriteBlocked} from '../../permission/writeScope';

type SelectValue = string | string[];

interface SelectProps {
  value?: SelectValue;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: SelectValue) => void;
  children: ReactNode;
  disabled?: boolean;
  multiple?: boolean;
  filterable?: boolean;
  placeholder?: string;
  filterPlaceholder?: string;
  emptyText?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  /** 只读豁免：该组件为读操作（筛选等），页面只读时不被拦截 */
  ro?: boolean;
  /** 下拉面板宽度（px）。默认跟随触发器宽度（最小 160），传此值可独立控制 */
  dropdownWidth?: number;
}

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
  group?: string;
  /** 附加描述（来自 option 的 data-desc），以小号浅灰字体渲染在 label 右侧 */
  description?: string;
}

interface DropdownPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

function normalizeSelectedValues(value: SelectValue | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined) return [];
  return [String(value)];
}

function findFirstEnabledIndex(options: SelectOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

function findNextEnabledIndex(options: SelectOption[], current: number, direction: 1 | -1): number {
  if (options.length === 0) return -1;

  for (let offset = 1; offset <= options.length; offset += 1) {
    const next = (current + direction * offset + options.length) % options.length;
    if (!options[next]?.disabled) return next;
  }

  return -1;
}

function getText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      return isValidElement<{ children?: ReactNode }>(child) ? getText(child.props.children) : '';
    })
    .join('');
}

function getOptions(children: ReactNode, group?: string): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];

    const element = child as ReactElement<{
      children?: ReactNode;
      disabled?: boolean;
      label?: string;
      value?: string | number;
      'data-desc'?: string;
    }>;

    if (element.type === 'optgroup') {
      return getOptions(element.props.children, element.props.label);
    }

    if (element.type !== 'option') return [];

    return [{
      value: element.props.value === undefined ? getText(element.props.children) : String(element.props.value),
      label: getText(element.props.children),
      disabled: Boolean(element.props.disabled),
      group,
      description: element.props['data-desc'] || undefined
    }];
  });
}

export function Select({
  value,
  onChange,
  onValueChange,
  children,
  disabled,
  multiple = false,
  filterable = false,
  placeholder,
  filterPlaceholder = '搜索选项',
  emptyText = '没有匹配选项',
  className,
  size = 'md',
  clearable = false,
  dropdownWidth: dropdownWidthProp,
  ro
}: SelectProps) {
  const blocked = useWriteBlocked() && !ro;
  const effectiveDisabled = disabled || blocked;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<SelectValue>(multiple ? [] : '');
  const [filterText, setFilterText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const nativeSelectRef = useRef<HTMLSelectElement>(null);
  const options = useMemo(() => getOptions(children), [children]);
  const currentValue = value === undefined ? internalValue : value;
  const selectedValues = useMemo(() => normalizeSelectedValues(currentValue), [currentValue]);
  const hasSelection = selectedValues.some((selectedValue) => selectedValue !== '');
  const singleValue = selectedValues[0] ?? '';
  const selectedOption = options.find((option) => option.value === singleValue);
  const selectedLabels = useMemo(() => {
    const labelByValue = new Map(options.map((option) => [option.value, option.label]));

    return selectedValues
      .map((selectedValue) => labelByValue.get(selectedValue) ?? selectedValue)
      .filter(Boolean);
  }, [options, selectedValues]);
  const visibleOptions = useMemo(() => {
    const normalizedFilter = filterText.trim().toLowerCase();
    if (!filterable || !normalizedFilter) return options;

    return options.filter((option) => (
      option.label.toLowerCase().includes(normalizedFilter) ||
      option.description?.toLowerCase().includes(normalizedFilter) ||
      option.group?.toLowerCase().includes(normalizedFilter)
    ));
  }, [filterText, filterable, options]);
  const displayLabel = useMemo(() => {
    if (multiple) {
      if (selectedLabels.length === 0) return placeholder ?? options[0]?.label ?? '';
      return selectedLabels.length > 2 ? `已选择 ${selectedLabels.length} 项` : selectedLabels.join('、');
    }

    return selectedOption?.label || placeholder || options[0]?.label || '';
  }, [multiple, options, placeholder, selectedLabels, selectedOption]);

  const sizes = {
    sm: { trigger: 'h-8 pl-3 pr-9 text-xs', icon: 14 },
    md: { trigger: 'h-10 pl-4 pr-11 text-sm', icon: 16 },
    lg: { trigger: 'h-12 pl-4 pr-12 text-base', icon: 18 }
  };

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const dropdownWidth = dropdownWidthProp ?? Math.max(rect.width, 160);
    const gap = 6;
    const viewportPadding = 12;
    const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const availableAbove = rect.top - gap - viewportPadding;
    const maxHeight = Math.max(120, Math.min(280, Math.max(availableBelow, availableAbove)));
    const opensUpward = availableBelow < 180 && availableAbove > availableBelow;
    const estimatedRows = Math.max(1, visibleOptions.length);
    const estimatedHeight = Math.min(maxHeight, estimatedRows * 40 + 12);

    setDropdownPosition({
      left: Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - dropdownWidth - viewportPadding)),
      top: opensUpward ? Math.max(viewportPadding, rect.top - estimatedHeight - gap) : rect.bottom + gap,
      width: dropdownWidth,
      maxHeight
    });
  }, [dropdownWidthProp, visibleOptions.length]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setFilterText('');
  }, []);

  const openDropdown = useCallback(() => {
    if (effectiveDisabled) return;
    setFilterText('');
    updateDropdownPosition();
    const selectedIndex = options.findIndex((option) => (
      selectedValues.includes(option.value) && !option.disabled
    ));
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(options));
    setOpen(true);
  }, [effectiveDisabled, options, selectedValues, updateDropdownPosition]);

  const syncNativeSelect = useCallback((nextSelectedValues: string[]) => {
    const nativeSelect = nativeSelectRef.current;
    if (!nativeSelect) return null;

    if (multiple) {
      Array.from(nativeSelect.options).forEach((option) => {
        option.selected = nextSelectedValues.includes(option.value);
      });
    } else {
      nativeSelect.value = nextSelectedValues[0] ?? '';
    }

    return nativeSelect;
  }, [multiple]);

  const applySelection = useCallback((nextSelectedValues: string[]) => {
    const nextValue = multiple ? nextSelectedValues : nextSelectedValues[0] ?? '';

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    const nativeSelect = syncNativeSelect(nextSelectedValues);
    if (nativeSelect) {
      onChange?.({
        target: nativeSelect,
        currentTarget: nativeSelect
      } as React.ChangeEvent<HTMLSelectElement>);
    }
    onValueChange?.(nextValue);
  }, [multiple, onChange, onValueChange, syncNativeSelect, value]);

  const clearSelection = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (effectiveDisabled || !clearable || !hasSelection) return;

    applySelection([]);
    closeDropdown();
    triggerRef.current?.focus();
  }, [applySelection, clearable, closeDropdown, effectiveDisabled, hasSelection]);

  const selectOption = (option: SelectOption) => {
    if (option.disabled) return;

    const nextSelectedValues = multiple
      ? selectedValues.includes(option.value)
        ? selectedValues.filter((selectedValue) => selectedValue !== option.value)
        : [...selectedValues, option.value]
      : [option.value];

    applySelection(nextSelectedValues);

    if (multiple) {
      if (filterable) {
        filterInputRef.current?.focus();
      } else {
        triggerRef.current?.focus();
      }
      return;
    }

    closeDropdown();
    triggerRef.current?.focus();
  };

  const moveHighlight = (direction: 1 | -1) => {
    if (visibleOptions.length === 0) return;

    if (!open) {
      openDropdown();
      return;
    }

    setHighlightedIndex((current) => {
      return findNextEnabledIndex(visibleOptions, current, direction);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        openDropdown();
      } else if (visibleOptions[highlightedIndex]) {
        selectOption(visibleOptions[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      closeDropdown();
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (visibleOptions[highlightedIndex]) {
        selectOption(visibleOptions[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        closeDropdown();
      }
    };
    const handleViewportChange = () => updateDropdownPosition();

    updateDropdownPosition();
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [closeDropdown, open, updateDropdownPosition]);

  useEffect(() => {
    if (!open || !filterable) return;

    const frame = window.requestAnimationFrame(() => {
      filterInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [filterable, open]);

  useEffect(() => {
    if (!open) return;

    setHighlightedIndex((current) => {
      if (visibleOptions[current] && !visibleOptions[current].disabled) return current;

      const selectedIndex = visibleOptions.findIndex((option) => (
        selectedValues.includes(option.value) && !option.disabled
      ));
      return selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(visibleOptions);
    });
  }, [open, selectedValues, visibleOptions]);

  useEffect(() => {
    if (!open) return;

    const selectedIndex = visibleOptions.findIndex((option) => (
      selectedValues.includes(option.value) && !option.disabled
    ));
    if (selectedIndex < 0) return;

    const frame = window.requestAnimationFrame(() => {
      dropdownRef.current
        ?.querySelector<HTMLElement>(`[data-option-index="${selectedIndex}"]`)
        ?.scrollIntoView({ block: 'center' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, selectedValues, visibleOptions]);

  useEffect(() => {
    dropdownRef.current
      ?.querySelector<HTMLElement>(`[data-option-index="${highlightedIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  useEffect(() => {
    if (effectiveDisabled) closeDropdown();
  }, [closeDropdown, effectiveDisabled]);

  useEffect(() => {
    if (value !== undefined) return;

    setInternalValue((current) => {
      const normalized = normalizeSelectedValues(current);
      return multiple ? normalized : normalized[0] ?? '';
    });
  }, [multiple, value]);

  const nativeValue = multiple ? selectedValues : singleValue;
  const listMaxHeight = dropdownPosition
    ? Math.max(48, dropdownPosition.maxHeight)
    : undefined;

  return (
    <div className={clsx('relative', className)} data-ro={ro || undefined}>
      <select
        ref={nativeSelectRef}
        multiple={multiple}
        value={nativeValue}
        onChange={onChange ?? (() => {})}
        disabled={effectiveDisabled}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
      >
        {children}
      </select>

      {filterable ? (
        <div
          ref={(node) => {
            triggerRef.current = node;
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={clsx(
            'group relative flex w-full items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] font-medium text-[var(--color-text)] outline-none',
            'shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,background-color] duration-200',
            effectiveDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-text hover:border-[var(--color-primary)] hover:bg-[var(--color-card-elevated)]',
            open && !effectiveDisabled && 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary-light)]',
            sizes[size].trigger,
            clearable && hasSelection && !effectiveDisabled && '!pr-16'
          )}
          onClick={() => {
            if (effectiveDisabled) return;
            if (!open) openDropdown();
            filterInputRef.current?.focus();
          }}
        >
          <input
            ref={filterInputRef}
            type="text"
            disabled={effectiveDisabled}
            value={open ? filterText : displayLabel}
            onChange={(event) => {
              if (!open) openDropdown();
              setFilterText(event.target.value);
            }}
            onFocus={() => {
              if (effectiveDisabled) return;
              if (!open) openDropdown();
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={filterPlaceholder || placeholder || '请选择'}
            className="min-w-0 flex-1 bg-transparent p-0 text-inherit outline-none placeholder:text-[var(--color-text-tertiary)]"
          />
          <ChevronDown
            size={sizes[size].icon}
            className={clsx(
              'absolute shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200',
              clearable && hasSelection && !effectiveDisabled ? 'right-9' : 'right-3',
              open && 'rotate-180 text-[var(--color-primary)]'
            )}
          />
        </div>
      ) : (
        <button
          ref={(node) => {
            triggerRef.current = node;
          }}
          type="button"
          disabled={effectiveDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => open ? closeDropdown() : openDropdown()}
          onKeyDown={handleKeyDown}
          className={clsx(
            'group flex w-full items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-left font-medium text-[var(--color-text)] outline-none',
            'cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,background-color] duration-200',
            'hover:border-[var(--color-primary)] hover:bg-[var(--color-card-elevated)]',
            'focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-light)]',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--color-border)]',
            sizes[size].trigger,
            clearable && hasSelection && !effectiveDisabled && '!pr-16'
          )}
        >
          <span className="block min-w-0 flex-1 truncate">
            {displayLabel}
          </span>
          <ChevronDown
            size={sizes[size].icon}
            className={clsx(
              'absolute shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200',
              clearable && hasSelection && !effectiveDisabled ? 'right-9' : 'right-3',
              open && 'rotate-180 text-[var(--color-primary)]'
            )}
          />
        </button>
      )}
      {clearable && hasSelection && !effectiveDisabled && (
        <button
          type="button"
          aria-label="清空选择"
          onClick={clearSelection}
          className="absolute right-3 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
        >
          <X size={13} />
        </button>
      )}

      {open && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          data-ro={ro || undefined}
          className="fixed z-[100] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 shadow-[var(--shadow-card-xl)]"
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width,
            maxHeight: dropdownPosition.maxHeight
          }}
        >
          <div
            role="listbox"
            aria-multiselectable={multiple || undefined}
            className="overflow-y-auto"
            style={{ maxHeight: listMaxHeight }}
          >
            {visibleOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">
                {filterText ? emptyText : '暂无选项'}
              </div>
            ) : visibleOptions.map((option, index) => {
              const selected = selectedValues.includes(option.value);
              const highlighted = index === highlightedIndex;
              const showGroup = option.group && option.group !== visibleOptions[index - 1]?.group;

              return (
                <div key={`${option.group ?? ''}-${option.value}-${index}`}>
                  {showGroup && (
                    <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      {option.group}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-option-index={index}
                    disabled={option.disabled}
                    title={option.description ? `${option.label} ${option.description}` : option.label}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectOption(option)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      selected && 'font-medium text-[var(--color-primary)]',
                      highlighted && 'bg-[var(--color-primary-light)]',
                      !highlighted && 'hover:bg-[var(--color-bg-hover)]',
                      option.disabled && 'cursor-not-allowed opacity-40'
                    )}
                    style={{ color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}
                  >
                    <span className="flex min-w-0 flex-1 items-baseline gap-2 truncate">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="shrink-0 truncate text-[11px] font-normal text-[var(--color-text-tertiary)]">
                          {option.description}
                        </span>
                      )}
                    </span>
                    <Check
                      size={15}
                      className={clsx('shrink-0 text-[var(--color-primary)]', !selected && 'invisible')}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
