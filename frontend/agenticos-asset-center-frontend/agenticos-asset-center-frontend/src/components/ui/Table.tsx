import {type CSSProperties, type Key, type ReactNode, useCallback, useMemo, useRef, useState} from 'react';
import {ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight} from 'lucide-react';

interface Column<T> {
  key: string;
  title: ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: ReactNode;
  rowKey?: keyof T | ((row: T, index: number) => Key);
  scroll?: {
    x?: string | number | true;
    y?: string | number;
  };
  tableLayout?: CSSProperties['tableLayout'];
  /** 横向滚动交由外层容器处理（内部不生成 overflow-x，适用于页面表格区统一滚动场景） */
  externalXScroll?: boolean;
  tree?: {
    childrenColumnName?: keyof T;
    defaultExpandAllRows?: boolean;
    indentSize?: number;
  };
  bordered?: boolean;
  /** 按需固定表头，默认关闭，不影响现有表格 */
  stickyHeader?: boolean;
  /** 紧凑模式：减小字体和内边距，适用于窄屏自适应场景 */
  compact?: boolean;
  /** 仅压缩水平内边距，保留默认字号（用于列表列多时的紧凑布局） */
  compactX?: boolean;
  /** 所有单元格单行显示：超长省略，原生 title 悬浮展示完整内容 */
  nowrap?: boolean;
  /** 行点击回调（配合 rowClassName 做选中高亮） */
  onRowClick?: (row: T, index: number) => void;
  /** 行自定义类名（如选中高亮） */
  rowClassName?: (row: T, index: number) => string | undefined;
}

interface FlattenedRow<T> {
  row: T;
  key: Key;
  depth: number;
  hasChildren: boolean;
  renderIndex: number;
}

function normalizeWidth(width?: string | number) {
  if (typeof width === 'number') return `${width}px`;
  if (!width) return undefined;

  const trimmed = width.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

function getPixelWidth(width?: string | number) {
  if (typeof width === 'number') return width;
  const normalized = normalizeWidth(width);
  const match = normalized?.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : 0;
}

function normalizeScrollX(scrollX?: string | number | true) {
  if (scrollX === true) return 'max-content';
  return normalizeWidth(scrollX);
}

function getAlignClass(align?: Column<unknown>['align']) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function getCellTitle<T>(row: T, col: Column<T>, nowrap: boolean) {
  if (!col.ellipsis && !nowrap) return undefined;
  const value = (row as Record<string, unknown>)[col.key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function getFixedOffset<T>(columns: Column<T>[], index: number, fixed?: Column<T>['fixed']) {
  if (!fixed) return undefined;

  const offsetColumns = fixed === 'left'
    ? columns.slice(0, index)
    : columns.slice(index + 1);
  const offset = offsetColumns
    .filter((col) => col.fixed === fixed)
    .reduce((total, col) => total + getPixelWidth(col.width), 0);

  return offset;
}

function getFixedCellStyle<T>(
  columns: Column<T>[],
  col: Column<T>,
  index: number,
  isHeader: boolean
): CSSProperties {
  if (!col.fixed) return {};

  const offset = getFixedOffset(columns, index, col.fixed) ?? 0;
  return {
    position: 'sticky',
    [col.fixed]: offset,
    zIndex: isHeader ? 4 : 2,
    backgroundColor: isHeader ? 'var(--color-card-elevated)' : 'var(--color-card)',
    boxShadow:
      col.fixed === 'right'
        ? '-8px 0 12px -12px var(--color-shadow-fixed)'
        : '8px 0 12px -12px var(--color-shadow-fixed)',
  };
}

function normalizeScrollY(scrollY?: string | number) {
  if (typeof scrollY === 'number') return `${scrollY}px`;
  if (!scrollY) return undefined;
  const trimmed = scrollY.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

export function Table<T>({
  columns,
  data,
  loading,
  empty,
  rowKey,
  scroll,
  tableLayout,
  externalXScroll = false,
  tree,
  bordered,
  stickyHeader = false,
  compact,
  compactX = false,
  nowrap = false,
  onRowClick,
  rowClassName,
}: TableProps<T>) {
  const [toggledRowKeys, setToggledRowKeys] = useState<Set<Key>>(() => new Set());
  // 排序状态：{ key, direction }
  const [sortState, setSortState] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // 拖拽调整列宽
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const thRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

  /** 获取列的当前有效像素宽度（动态宽度优先，否则用静态配置宽度） */
  const getEffectivePixelWidth = (col: Column<T>) => {
    if (columnWidths[col.key] !== undefined) return columnWidths[col.key];
    return getPixelWidth(col.width);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const thEl = thRefs.current.get(colKey);
    const startWidth = columnWidths[colKey] ?? thEl?.offsetWidth ?? getPixelWidth(columns.find(c => c.key === colKey)?.width) ?? 100;
    resizingRef.current = { key: colKey, startX: e.clientX, startWidth };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = moveEvent.clientX - resizingRef.current.startX;
      const newWidth = Math.max(50, resizingRef.current.startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [resizingRef.current!.key]: newWidth }));
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths, columns]);

  const toggleSort = (key: string) => {
    setSortState(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return null; // 第三次点击取消排序
      }
      return { key, direction: 'asc' };
    });
  };

  // 排序后的数据
  const sortedData = useMemo(() => {
    if (!sortState) return data;
    const { key, direction } = sortState;
    return [...data].sort((a, b) => {
      const va = (a as Record<string, unknown>)[key];
      const vb = (b as Record<string, unknown>)[key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      let cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), 'zh-CN');
      }
      return direction === 'desc' ? -cmp : cmp;
    });
  }, [data, sortState]);

  const columnMinWidth = columns.reduce((total, col) => total + getEffectivePixelWidth(col), 0);
  const tableMinWidth = normalizeScrollX(scroll?.x) || (columnMinWidth > 0 ? `${columnMinWidth}px` : undefined);
  const tableMaxHeight = normalizeScrollY(scroll?.y);
  const resolvedTableLayout = tableLayout || 'fixed';
  const wrapperClassName = `w-full ${bordered ? 'rounded-xl border border-[var(--color-border)]' : ''}`;
  const wrapperStyle: CSSProperties = {
    overflowX: externalXScroll ? undefined : (tableMinWidth ? 'auto' : undefined),
    overflowY: tableMaxHeight ? 'auto' : undefined,
    maxHeight: tableMaxHeight,
  };

  const getRowKey = (row: T, index: number): Key => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    const record = row as Record<string, unknown>;
    if (rowKey && record[String(rowKey)] != null) return record[String(rowKey)] as Key;
    if (record.key != null) return record.key as Key;
    if (record.id != null) return record.id as Key;
    return index;
  };

  const getChildren = (row: T): T[] => {
    if (!tree) return [];
    const childrenKey = String(tree.childrenColumnName || 'children');
    const children = (row as Record<string, unknown>)[childrenKey];
    return Array.isArray(children) ? children as T[] : [];
  };

  const isRowExpanded = (key: Key) => (
    tree?.defaultExpandAllRows
      ? !toggledRowKeys.has(key)
      : toggledRowKeys.has(key)
  );

  const toggleRow = (key: Key) => {
    setToggledRowKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const flattenedRows: FlattenedRow<T>[] = [];
  const appendRows = (rows: T[], depth = 0) => {
    rows.forEach((row) => {
      const renderIndex = flattenedRows.length;
      const key = getRowKey(row, renderIndex);
      const children = getChildren(row);
      flattenedRows.push({
        row,
        key,
        depth,
        hasChildren: children.length > 0,
        renderIndex,
      });
      if (children.length > 0 && isRowExpanded(key)) {
        appendRows(children, depth + 1);
      }
    });
  };
  appendRows(sortedData);

  if (loading) {
    return (
      <div className={wrapperClassName} style={wrapperStyle}>
        <div className="p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <span style={{ color: 'var(--color-text-tertiary)' }}>加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0 && empty) {
    return (
      <div className={wrapperClassName} style={wrapperStyle}>
        {empty}
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName}
      style={wrapperStyle}
    >
      <table
        className="w-full border-separate border-spacing-0"
        style={{
          minWidth: tableMinWidth,
          tableLayout: resolvedTableLayout,
        }}
      >
        <colgroup>
          {columns.map((col) => (
            <col key={col.key} style={{ width: columnWidths[col.key] !== undefined ? `${columnWidths[col.key]}px` : normalizeWidth(col.width) }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
            {columns.map((col, colIndex) => (
              <th
                key={col.key}
                ref={(el) => { if (el) thRefs.current.set(col.key, el); }}
                className={`group relative border-b ${compact ? 'px-2 py-2 text-xs' : compactX ? 'px-2.5 py-3 text-sm' : 'px-4 py-3 text-sm'} font-semibold whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:bg-[var(--color-bg-hover)]' : ''} ${getAlignClass(col.align)}`}
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-card-elevated)',
                  borderColor: 'var(--color-border)',
                  ...(stickyHeader ? { position: 'sticky', top: 0, zIndex: 3 } : {}),
                  ...getFixedCellStyle(columns, col, colIndex, true),
                }}
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.title}
                  {col.sortable && (
                    <span className="inline-flex flex-col leading-none" style={{ fontSize: 10 }}>
                      {sortState?.key === col.key ? (
                        sortState.direction === 'asc'
                          ? <ArrowUp size={12} style={{ color: 'var(--color-primary)' }} />
                          : <ArrowDown size={12} style={{ color: 'var(--color-primary)' }} />
                      ) : (
                        <ArrowUpDown size={12} style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }} />
                      )}
                    </span>
                  )}
                </span>
                {colIndex < columns.length - 1 && (
                  <div
                    className="absolute right-[-4px] top-0 bottom-0 w-2 cursor-col-resize z-10 flex items-center justify-center"
                    onMouseDown={(e) => handleResizeStart(e, col.key)}
                  >
                    <div className="w-px h-5 bg-[var(--color-border)] opacity-0 group-hover:opacity-100 group-hover:h-7 group-hover:w-0.5 group-hover:bg-[var(--color-primary)] transition-all duration-150" />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flattenedRows.map(({ row, key, depth, hasChildren, renderIndex }, index) => (
            <tr
              key={key}
              aria-level={tree ? depth + 1 : undefined}
              onClick={onRowClick ? () => onRowClick(row, renderIndex) : undefined}
              className={`group hover:bg-[var(--color-bg-hover)] ${tree && hasChildren ? 'bg-[var(--color-card-elevated)]' : ''} ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName?.(row, renderIndex) ?? ''}`}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={col.key}
                  className={`${compact ? 'px-2 py-1.5 text-xs' : compactX ? 'px-2.5 py-3 text-sm' : 'px-4 py-3 text-sm'} align-middle ${col.fixed ? 'group-hover:!bg-[var(--color-bg-hover)]' : ''} ${getAlignClass(col.align)}`}
                  style={{
                    color: 'var(--color-text)',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    borderBottom: index < flattenedRows.length - 1 ? '1px solid var(--color-border)' : undefined,
                    ...getFixedCellStyle(columns, col, colIndex, false),
                    ...(tree && hasChildren && col.fixed
                      ? { backgroundColor: 'var(--color-card-elevated)' }
                      : {}),
                  }}
                >
                  <div
                    className={`min-w-0 max-w-full overflow-hidden break-words ${col.ellipsis || nowrap ? 'truncate' : ''}`}
                    title={getCellTitle(row, col, nowrap)}
                  >
                    {tree && colIndex === 0 ? (
                      <div
                        className="flex min-w-0 items-center gap-1.5"
                        style={{ paddingLeft: depth * (tree.indentSize ?? 20) }}
                      >
                        {hasChildren ? (
                          <button
                            type="button"
                            data-ro
                            aria-label={isRowExpanded(key) ? '收起下级' : '展开下级'}
                            aria-expanded={isRowExpanded(key)}
                            title={isRowExpanded(key) ? '收起下级' : '展开下级'}
                            onClick={(e) => {
                              // 避免展开/收起冒泡触发 onRowClick 行点击
                              e.stopPropagation()
                              toggleRow(key)
                            }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-text-tertiary)] outline-none transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            {isRowExpanded(key) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : (
                          <span className="h-6 w-6 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          {col.render ? col.render(row, renderIndex) : (row as Record<string, ReactNode>)[col.key]}
                        </div>
                      </div>
                    ) : (
                      col.render ? col.render(row, renderIndex) : (row as Record<string, ReactNode>)[col.key]
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
