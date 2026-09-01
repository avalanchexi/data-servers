import { useEffect, useId, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  key: string;
  label: ReactNode;
  icon?: LucideIcon;
  content?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
  variant?: 'line' | 'card';
  lazy?: boolean;
  keepMounted?: boolean;
  children?: (item: TabItem) => ReactNode;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  className,
  listClassName,
  panelClassName,
  variant = 'line',
  lazy = true,
  keepMounted = false,
  children,
}: TabsProps) {
  const tabsId = useId();
  const [internalActiveKey, setInternalActiveKey] = useState(items[0]?.key);
  const selectedKey = activeKey ?? internalActiveKey;
  const activeItem = items.find((item) => item.key === selectedKey) ?? items[0];
  const currentKey = activeItem?.key;
  const [mountedKeys, setMountedKeys] = useState<Set<string>>(
    () => new Set(currentKey ? [currentKey] : [])
  );

  useEffect(() => {
    if (!currentKey) return;
    setMountedKeys((prev) => {
      if (prev.has(currentKey)) return prev;
      const next = new Set(prev);
      next.add(currentKey);
      return next;
    });
  }, [currentKey]);

  const tabId = (index: number) => `${tabsId}-tab-${index}`;
  const panelId = (index: number) => `${tabsId}-panel-${index}`;

  const selectTab = (index: number) => {
    const nextItem = items[index];
    if (!nextItem || nextItem.disabled) return;

    if (activeKey === undefined) {
      setInternalActiveKey(nextItem.key);
    }
    onChange?.(nextItem.key);
    document.getElementById(tabId(index))?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;

    const enabledIndexes = items
      .map((item, itemIndex) => (item.disabled ? -1 : itemIndex))
      .filter((itemIndex) => itemIndex >= 0);
    const currentEnabledIndex = enabledIndexes.indexOf(index);
    const lastEnabledIndex = enabledIndexes.length - 1;
    const keyActions: Record<string, number | undefined> = {
      ArrowLeft: enabledIndexes[currentEnabledIndex === 0 ? lastEnabledIndex : currentEnabledIndex - 1],
      ArrowUp: enabledIndexes[currentEnabledIndex === 0 ? lastEnabledIndex : currentEnabledIndex - 1],
      ArrowRight: enabledIndexes[currentEnabledIndex === lastEnabledIndex ? 0 : currentEnabledIndex + 1],
      ArrowDown: enabledIndexes[currentEnabledIndex === lastEnabledIndex ? 0 : currentEnabledIndex + 1],
      Home: enabledIndexes[0],
      End: enabledIndexes[lastEnabledIndex],
    };
    const nextIndex = keyActions[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    selectTab(nextIndex);
  };

  const baseListClassName = clsx(
    // overflow-y-hidden 避免 line 变体底边 border-b-[3px] 撑出垂直滚动条
    'flex items-center overflow-x-auto overflow-y-hidden border-b',
    variant === 'line' ? 'gap-8' : 'gap-0'
  );

  const shouldRenderPanel = (item: TabItem) => {
    if (!lazy) return true;
    if (keepMounted) return mountedKeys.has(item.key);
    return currentKey === item.key;
  };

  return (
    <div
      className={clsx('flex flex-col', className)}
    >
      <div
        role="tablist"
        data-ro
        className={clsx(baseListClassName, listClassName)}
        style={{ borderColor: 'var(--color-border)' }}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentKey === item.key;
          const isCard = variant === 'card';

          return (
            <button
              id={tabId(index)}
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId(index)}
              disabled={item.disabled}
              tabIndex={isActive && !item.disabled ? 0 : -1}
              onClick={() => selectTab(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={clsx(
                'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                isCard
                  ? 'h-10 border border-b-0 px-4 rounded-t-lg'
                  : '-mb-px h-12 border-b-[3px] px-0',
                isActive
                  ? 'font-medium text-[var(--color-primary)] border-[var(--color-primary)]'
                  : 'font-normal text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-primary)]',
                isCard && !isActive && 'border-[var(--color-border)] bg-[var(--color-bg-hover)]'
              )}
              style={isCard && isActive ? { backgroundColor: 'var(--color-card)' } : undefined}
            >
              {Icon && <Icon size={15} />}
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => {
        const isActive = currentKey === item.key;
        if (!shouldRenderPanel(item)) return null;

        return (
          <div
            id={panelId(index)}
            key={item.key}
            role="tabpanel"
            aria-labelledby={tabId(index)}
            hidden={!isActive}
            className={panelClassName}
          >
            {children ? children(item) : item.children ?? item.content}
          </div>
        );
      })}
    </div>
  );
}
