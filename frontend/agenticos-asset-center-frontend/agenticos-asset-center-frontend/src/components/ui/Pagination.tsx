import { useEffect, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { Input } from './Input';
import { Select } from './Select';

type PageItem = number | 'jump-prev' | 'jump-next';

export interface PaginationProps {
  total: number;
  current?: number;
  defaultCurrent?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => ReactNode);
  hideOnSinglePage?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const buffer = 1;
  let left = Math.max(2, current - buffer);
  let right = Math.min(totalPages - 1, current + buffer);

  if (current <= 4) {
    left = 2;
    right = 5;
  } else if (current >= totalPages - 3) {
    left = totalPages - 4;
    right = totalPages - 1;
  }

  const items: PageItem[] = [1];

  if (left > 2) {
    items.push('jump-prev');
  } else {
    for (let page = 2; page < left; page += 1) items.push(page);
  }

  for (let page = left; page <= right; page += 1) {
    items.push(page);
  }

  if (right < totalPages - 1) {
    items.push('jump-next');
  } else {
    for (let page = right + 1; page < totalPages; page += 1) items.push(page);
  }

  items.push(totalPages);
  return items;
}

export function Pagination({
  total,
  current,
  defaultCurrent = 1,
  pageSize,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
  onShowSizeChange,
  showSizeChanger = true,
  showQuickJumper = false,
  showTotal = true,
  hideOnSinglePage,
  disabled,
  size = 'md',
  align = 'end',
  className,
}: PaginationProps) {
  const [internalCurrent, setInternalCurrent] = useState(defaultCurrent);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);
  const [jumpValue, setJumpValue] = useState('');

  const safeTotal = Math.max(0, total);
  const effectivePageSize = Math.max(1, pageSize ?? internalPageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotal / effectivePageSize));
  const effectiveCurrent = clamp(current ?? internalCurrent, 1, totalPages);
  const rangeStart = safeTotal === 0 ? 0 : (effectiveCurrent - 1) * effectivePageSize + 1;
  const rangeEnd = Math.min(effectiveCurrent * effectivePageSize, safeTotal);
  const pageItems = getPageItems(effectiveCurrent, totalPages);

  useEffect(() => {
    if (current === undefined && internalCurrent !== effectiveCurrent) {
      setInternalCurrent(effectiveCurrent);
    }
  }, [current, effectiveCurrent, internalCurrent]);

  if (hideOnSinglePage && safeTotal <= effectivePageSize) {
    return null;
  }

  const itemSize = size === 'sm' ? 'h-8 min-w-8 text-xs rounded-lg' : 'h-9 min-w-9 text-sm rounded-lg';
  const alignClassName = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  }[align];

  const changePage = (nextPage: number, nextPageSize = effectivePageSize) => {
    if (disabled) return;

    const nextTotalPages = Math.max(1, Math.ceil(safeTotal / nextPageSize));
    const safePage = clamp(nextPage, 1, nextTotalPages);

    if (current === undefined) {
      setInternalCurrent(safePage);
    }
    if (pageSize === undefined) {
      setInternalPageSize(nextPageSize);
    }

    onChange?.(safePage, nextPageSize);
  };

  const changePageSize = (nextPageSize: number) => {
    const nextTotalPages = Math.max(1, Math.ceil(safeTotal / nextPageSize));
    const nextPage = clamp(effectiveCurrent, 1, nextTotalPages);

    if (pageSize === undefined) {
      setInternalPageSize(nextPageSize);
    }
    if (current === undefined) {
      setInternalCurrent(nextPage);
    }

    onShowSizeChange?.(nextPage, nextPageSize);
    onChange?.(nextPage, nextPageSize);
  };

  const jumpToPage = () => {
    const page = Number(jumpValue);
    if (!Number.isFinite(page)) return;

    changePage(Math.trunc(page));
    setJumpValue('');
  };

  const handleQuickJumperKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      jumpToPage();
    }
  };

  const renderTotal = () => {
    if (!showTotal) return null;
    if (typeof showTotal === 'function') {
      return showTotal(safeTotal, [rangeStart, rangeEnd]);
    }
    return `共 ${safeTotal} 条`;
  };

  return (
    // data-ro：翻页/每页条数/跳页均为读操作，只读作用域内豁免
    <div data-ro className={clsx('flex flex-wrap items-center gap-3', alignClassName, className)}>
      {showTotal && (
        <div className="shrink-0 text-sm text-[var(--color-text-secondary)]">
          {renderTotal()}
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          title="上一页"
          aria-label="上一页"
          disabled={disabled || effectiveCurrent <= 1}
          onClick={() => changePage(effectiveCurrent - 1)}
          className={clsx(
            'inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-secondary)]',
            itemSize
          )}
        >
          <ChevronLeft size={size === 'sm' ? 14 : 16} />
        </button>

        {pageItems.map((item) => {
          if (item === 'jump-prev' || item === 'jump-next') {
            const direction = item === 'jump-prev' ? -5 : 5;
            return (
              <button
                key={item}
                type="button"
                title={item === 'jump-prev' ? '向前 5 页' : '向后 5 页'}
                aria-label={item === 'jump-prev' ? '向前 5 页' : '向后 5 页'}
                disabled={disabled}
                onClick={() => changePage(effectiveCurrent + direction)}
                className={clsx(
                  'inline-flex items-center justify-center border border-transparent bg-transparent text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45',
                  itemSize
                )}
              >
                <MoreHorizontal size={size === 'sm' ? 14 : 16} />
              </button>
            );
          }

          const active = item === effectiveCurrent;
          return (
            <button
              key={item}
              type="button"
              aria-current={active ? 'page' : undefined}
              disabled={disabled}
              onClick={() => changePage(item)}
              className={clsx(
                'inline-flex items-center justify-center border bg-[var(--color-card)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45',
                itemSize,
                active
                  ? 'border-[var(--color-primary)] font-medium text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              )}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          title="下一页"
          aria-label="下一页"
          disabled={disabled || effectiveCurrent >= totalPages}
          onClick={() => changePage(effectiveCurrent + 1)}
          className={clsx(
            'inline-flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-text-secondary)]',
            itemSize
          )}
        >
          <ChevronRight size={size === 'sm' ? 14 : 16} />
        </button>
      </div>

      {showSizeChanger && (
        <div className={clsx('shrink-0', size === 'sm' ? 'w-32' : 'w-36')}>
          <Select
            size={size}
            ro
            value={String(effectivePageSize)}
            disabled={disabled}
            onChange={(event) => changePageSize(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} 条/页
              </option>
            ))}
          </Select>
        </div>
      )}

      {showQuickJumper && (
        <div className="flex shrink-0 items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <span>跳至</span>
          <div className={clsx('shrink-0', size === 'sm' ? 'w-14' : 'w-16')}>
            <Input
              size={size}
              ro
              type="number"
              min={1}
              max={totalPages}
              disabled={disabled}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
              onKeyDown={handleQuickJumperKeyDown}
              onBlur={() => setJumpValue('')}
              className="text-center"
            />
          </div>
          <span>页</span>
        </div>
      )}
    </div>
  );
}
