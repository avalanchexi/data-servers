import { useEffect, useMemo, useState, type CSSProperties, type Key, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react';

/**
 * TreeTable 树形表格组件
 *
 * 面向「分组行 + 叶子行」的层级数据展示（如：数据源 → 数据集）。
 * 设计要点（参考 AG Grid Tree Data / Ant Design Table 树形数据等实践）：
 * - 分组行可展开/折叠，折叠时父节点聚合元数据（子项计数）仍保留显示
 * - 分组行与叶子行可差异化渲染（groupRender / render），分组行整行加粗并带背景色
 * - isGroup 可显式声明分组行：即使暂无子节点（空分组）也按分组行渲染
 * - 数据刷新（搜索过滤）后按 defaultExpandAll 自动重置展开状态，保证匹配路径可见
 * - 可选树形引导线（showGuides），辅助层级识别
 * - 可选「展开全部 / 收起全部」工具栏（expandToolbar）
 */
export interface TreeTableNode<T> {
  /** 节点唯一标识（跨层级全局唯一） */
  key: Key;
  data: T;
  children?: TreeTableNode<T>[];
}

export interface TreeTableRenderContext {
  /** 节点深度（根节点为 0） */
  depth: number;
  /** 展平后的渲染序号 */
  index: number;
  /** 是否含有子节点（分组行） */
  hasChildren: boolean;
  /** 当前是否处于展开状态 */
  expanded: boolean;
}

export interface TreeTableGroupContext extends TreeTableRenderContext {
  /** 直接子节点数量 */
  childCount: number;
  /** 全部子孙节点数量 */
  descendantCount: number;
}

export interface TreeTableColumn<T> {
  key: string;
  title: ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  /** 叶子行单元格渲染；不传时直接展示 row[key] */
  render?: (row: T, ctx: TreeTableRenderContext) => ReactNode;
  /** 分组行单元格渲染；不传时第一列展示 row[key] 及子节点计数徽标，其余列展示「—」 */
  groupRender?: (row: T, ctx: TreeTableGroupContext) => ReactNode;
}

interface TreeTableProps<T> {
  columns: TreeTableColumn<T>[];
  /** 树形数据，节点 key 需全局唯一 */
  data: TreeTableNode<T>[];
  /**
   * 显式声明哪些节点为分组行（即使暂无子节点也按分组行渲染，适用于空分组）。
   * 不传时默认「含子节点」即为分组行。
   */
  isGroup?: (data: T) => boolean;
  loading?: boolean;
  empty?: ReactNode;
  /** 数据变化后默认展开所有分组（搜索过滤场景推荐开启） */
  defaultExpandAll?: boolean;
  /** 每级缩进像素值，默认 24 */
  indentSize?: number;
  /** 显示树形引导线 */
  showGuides?: boolean;
  /** 显示「展开全部 / 收起全部」工具栏 */
  expandToolbar?: boolean;
  /** 纵向滚动（提供后自动吸附表头） */
  scroll?: { y?: string | number };
  className?: string;
}

interface FlattenedRow<T> {
  node: TreeTableNode<T>;
  depth: number;
  index: number;
  /** 是否为分组行（决定 groupRender / 加粗 / 底色） */
  groupRow: boolean;
  /** 是否含子节点（决定展开箭头） */
  hasChildren: boolean;
  expanded: boolean;
  childCount: number;
  descendantCount: number;
}

function normalizeWidth(width?: string | number) {
  if (typeof width === 'number') return `${width}px`;
  if (!width) return undefined;
  const trimmed = width.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

function getPixelWidth(width?: string | number) {
  const normalized = normalizeWidth(width);
  const match = normalized?.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? Number(match[1]) : 0;
}

function normalizeScrollY(scrollY?: string | number) {
  if (typeof scrollY === 'number') return `${scrollY}px`;
  if (!scrollY) return undefined;
  const trimmed = scrollY.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

function getAlignClass(align?: TreeTableColumn<unknown>['align']) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

/** 收集所有含子节点的 key，用于默认全展开 / 展开全部 */
function collectExpandableKeys<T>(nodes: TreeTableNode<T>[]): Set<Key> {
  const keys = new Set<Key>();
  const walk = (list: TreeTableNode<T>[]) => {
    list.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.add(node.key);
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return keys;
}

/** 统计节点的全部子孙数量 */
function countDescendants<T>(node: TreeTableNode<T>): number {
  return (node.children ?? []).reduce((acc, child) => acc + 1 + countDescendants(child), 0);
}

export function TreeTable<T>({
  columns,
  data,
  isGroup,
  loading,
  empty,
  defaultExpandAll = false,
  indentSize = 24,
  showGuides = false,
  expandToolbar = false,
  scroll,
  className = '',
}: TreeTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => new Set());

  // 数据刷新（搜索、增删改后重新加载）时按 defaultExpandAll 重置展开状态
  useEffect(() => {
    setExpandedKeys(defaultExpandAll ? collectExpandableKeys(data) : new Set());
  }, [data, defaultExpandAll]);

  const flattened = useMemo(() => {
    const rows: FlattenedRow<T>[] = [];
    const walk = (nodes: TreeTableNode<T>[], depth: number) => {
      nodes.forEach((node) => {
        const hasChildren = (node.children?.length ?? 0) > 0;
        const groupRow = isGroup ? isGroup(node.data) : hasChildren;
        const expanded = hasChildren && expandedKeys.has(node.key);
        rows.push({
          node,
          depth,
          index: rows.length,
          groupRow,
          hasChildren,
          expanded,
          childCount: node.children?.length ?? 0,
          descendantCount: hasChildren ? countDescendants(node) : 0,
        });
        if (expanded) walk(node.children!, depth + 1);
      });
    };
    walk(data, 0);
    return rows;
  }, [data, expandedKeys, isGroup]);

  const toggle = (key: Key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpandedKeys(collectExpandableKeys(data));
  const collapseAll = () => setExpandedKeys(new Set());

  const columnMinWidth = columns.reduce((total, col) => total + getPixelWidth(col.width), 0);
  const tableMinWidth = columnMinWidth > 0 ? `${columnMinWidth}px` : undefined;
  const tableMaxHeight = normalizeScrollY(scroll?.y);
  const wrapperStyle: CSSProperties = {
    overflowX: tableMinWidth ? 'auto' : undefined,
    overflowY: tableMaxHeight ? 'auto' : undefined,
    maxHeight: tableMaxHeight,
  };

  const renderCell = (col: TreeTableColumn<T>, row: FlattenedRow<T>, colIndex: number) => {
    const { node, depth, groupRow, hasChildren, expanded, childCount, descendantCount } = row;
    const baseCtx: TreeTableRenderContext = { depth, index: row.index, hasChildren, expanded };

    if (groupRow) {
      if (col.groupRender) {
        return col.groupRender(node.data, { ...baseCtx, childCount, descendantCount });
      }
      // 默认分组行：第一列展示 row[key] + 子节点计数徽标，其余列展示「—」
      if (colIndex === 0) {
        const value = (node.data as Record<string, unknown>)[col.key];
        return (
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold">{value != null ? String(value) : '—'}</span>
            {childCount > 0 && (
              <span
                className="inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[11px] font-medium leading-4"
                style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {childCount}
              </span>
            )}
          </span>
        );
      }
      return <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>;
    }

    if (col.render) return col.render(node.data, baseCtx);
    const value = (node.data as Record<string, unknown>)[col.key];
    return <>{value != null ? String(value) : '—'}</>;
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
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
    return <div className={`w-full ${className}`}>{empty}</div>;
  }

  const showToolbar = expandToolbar && data.length > 0;

  return (
    <div className={`w-full ${className}`}>
      {showToolbar && (
        <div data-ro className="mb-2 flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)]"
          >
            <ChevronsDown size={13} />
            展开全部
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-primary)]"
          >
            <ChevronsUp size={13} />
            收起全部
          </button>
        </div>
      )}

      <div style={wrapperStyle}>
        <table className="w-full border-separate border-spacing-0" style={{ minWidth: tableMinWidth, tableLayout: 'fixed' }}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: normalizeWidth(col.width) }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${getAlignClass(col.align)}`}
                  style={{
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-card-elevated)',
                    borderBottom: '1px solid var(--color-border)',
                    ...(tableMaxHeight ? { position: 'sticky', top: 0, zIndex: 3 } : {}),
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flattened.map((row) => {
              const { node, depth, groupRow, hasChildren, expanded, index } = row;
              return (
                <tr
                  key={node.key}
                  aria-level={depth + 1}
                  className={`group hover:bg-[var(--color-bg-hover)] ${groupRow ? 'bg-[var(--color-card-elevated)]' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 text-sm align-middle ${getAlignClass(col.align)}`}
                      style={{
                        color: 'var(--color-text)',
                        borderBottom: index < flattened.length - 1 ? '1px solid var(--color-border)' : undefined,
                      }}
                    >
                      {colIndex === 0 ? (
                        <div
                          className="relative flex min-w-0 items-center gap-1.5"
                          style={{ paddingLeft: depth * indentSize }}
                        >
                          {showGuides && depth > 0 && (
                            <>
                              {/* 树形引导线：纵向连接线（末级子节点仅延伸至行中线） */}
                              <span
                                aria-hidden="true"
                                className="absolute bottom-0 w-px"
                                style={{
                                  left: depth * indentSize - indentSize / 2,
                                  top: 0,
                                  bottom: expanded ? 0 : '50%',
                                  backgroundColor: 'var(--color-border)',
                                }}
                              />
                              {/* 横向连接线 */}
                              <span
                                aria-hidden="true"
                                className="absolute top-1/2 h-px"
                                style={{
                                  left: depth * indentSize - indentSize / 2,
                                  width: indentSize / 2 - 4,
                                  backgroundColor: 'var(--color-border)',
                                }}
                              />
                            </>
                          )}
                          {hasChildren ? (
                            <button
                              type="button"
                              data-ro
                              aria-label={expanded ? '收起下级' : '展开下级'}
                              aria-expanded={expanded}
                              title={expanded ? '收起下级' : '展开下级'}
                              onClick={() => toggle(node.key)}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--color-text-tertiary)] outline-none transition-colors hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                            >
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <span className="h-6 w-6 shrink-0" />
                          )}
                          <div
                            className={`min-w-0 max-w-full overflow-hidden break-words ${groupRow ? 'font-semibold' : ''} ${col.ellipsis ? 'truncate' : ''}`}
                            title={col.ellipsis ? String((node.data as Record<string, unknown>)[col.key] ?? '') : undefined}
                          >
                            {renderCell(col, row, colIndex)}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`min-w-0 max-w-full overflow-hidden break-words ${groupRow ? 'font-semibold' : ''} ${col.ellipsis ? 'truncate' : ''}`}
                          title={col.ellipsis ? String((node.data as Record<string, unknown>)[col.key] ?? '') : undefined}
                        >
                          {renderCell(col, row, colIndex)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
