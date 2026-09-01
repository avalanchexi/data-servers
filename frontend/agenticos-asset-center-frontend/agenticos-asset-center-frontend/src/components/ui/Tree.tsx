import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, ChevronRight, Folder, FolderOpen, Network, User } from 'lucide-react'

export interface TreeNode {
  key: string
  label: string
  type?: 'org' | 'user'
  children?: TreeNode[]
}

interface TreeProps {
  nodes: TreeNode[]
  selectedKey?: string | null
  onSelect?: (node: TreeNode) => void
  checkable?: boolean
  checkedKeys?: ReadonlySet<string>
  onCheck?: (node: TreeNode) => void
  className?: string
}

function CheckboxWithIndeterminate({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return <input ref={inputRef} type="checkbox" checked={checked} onChange={onChange} className="shrink-0" />
}

function getDescendantKeys(node: TreeNode): string[] {
  const keys: string[] = []
  const walk = (item: TreeNode) => {
    keys.push(item.key)
    item.children?.forEach(walk)
  }
  node.children?.forEach(walk)
  return keys
}

function TreeNodeItem({
  node,
  depth,
  selectedKey,
  onSelect,
  checkable,
  checkedKeys,
  onCheck,
}: {
  node: TreeNode
  depth: number
  selectedKey?: string | null
  onSelect?: (node: TreeNode) => void
  checkable: boolean
  checkedKeys: ReadonlySet<string>
  onCheck?: (node: TreeNode) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = node.key === selectedKey
  const descendantKeys = checkable && hasChildren ? getDescendantKeys(node) : []
  const checkedDescendantCount = descendantKeys.filter(key => checkedKeys.has(key)).length
  const isChecked = checkedKeys.has(node.key)
  const isIndeterminate = descendantKeys.length > 0
    && checkedDescendantCount > 0
    && (!isChecked || checkedDescendantCount < descendantKeys.length)
  const NodeIcon = checkable
    ? hasChildren ? (expanded ? FolderOpen : Folder) : node.type === 'user' ? User : Folder
    : depth === 0 ? Network : hasChildren ? (expanded ? FolderOpen : Folder) : Building2

  const handleClick = useCallback(() => {
    if (hasChildren) setExpanded(prev => !prev)
    onSelect?.(node)
  }, [hasChildren, onSelect, node])

  const handleExpand = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  if (checkable) {
    return (
      <div className="relative">
        {depth > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 top-0 w-px opacity-70"
            style={{ left: `${17 + (depth - 1) * 20}px`, backgroundColor: 'var(--color-border)' }}
          />
        )}
        <div
          role="treeitem"
          aria-expanded={hasChildren ? expanded : undefined}
          aria-checked={isIndeterminate ? 'mixed' : isChecked}
          className="group relative flex h-8 w-full select-none items-center gap-2 rounded-md pr-2 text-sm"
          style={{ paddingLeft: `${8 + depth * 20}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              data-ro
              aria-label={`${expanded ? '收起' : '展开'}${node.label}`}
              className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]"
              onClick={handleExpand}
            >
              <ChevronRight
                size={14}
                className="transition-transform duration-200"
                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
            <CheckboxWithIndeterminate
              checked={isChecked}
              indeterminate={isIndeterminate}
              onChange={() => onCheck?.(node)}
            />
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-[var(--color-text-tertiary)]">
              <NodeIcon size={13} />
            </span>
            <span className="min-w-0 truncate text-[var(--color-text-secondary)]">{node.label}</span>
          </label>
        </div>
        {hasChildren && expanded && (
          <div role="group" className="mt-0.5 space-y-0.5">
            {node.children!.map(child => (
              <TreeNodeItem
                key={child.key}
                node={child}
                depth={depth + 1}
                selectedKey={selectedKey}
                onSelect={onSelect}
                checkable={checkable}
                checkedKeys={checkedKeys}
                onCheck={onCheck}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {depth > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 top-0 w-px opacity-70"
          style={{
            left: `${17 + (depth - 1) * 20}px`,
            backgroundColor: 'var(--color-border)',
          }}
        />
      )}
      <button
        type="button"
        data-ro
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={isSelected}
        className={`group relative flex h-9 w-full select-none items-center gap-2 rounded-lg pr-2 text-left text-sm outline-none transition-all duration-200
          focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1
          ${isSelected
            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-[inset_3px_0_0_var(--color-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]'
          }`}
        style={{
          paddingLeft: `${8 + depth * 20}px`,
          fontWeight: isSelected || depth === 0 ? 600 : hasChildren ? 500 : 400,
        }}
        onClick={handleClick}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors ${
            isSelected
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary)]'
          }`}
        >
          <NodeIcon size={12} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {hasChildren && (
          <ChevronRight
            aria-hidden="true"
            size={14}
            className="shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 group-hover:text-[var(--color-primary)]"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        )}
      </button>
      {hasChildren && expanded && (
        <div role="group" className="mt-0.5 space-y-0.5">
          {node.children!.map(child => (
            <TreeNodeItem
              key={child.key}
              node={child}
              depth={depth + 1}
              selectedKey={selectedKey}
              onSelect={onSelect}
              checkable={checkable}
              checkedKeys={checkedKeys}
              onCheck={onCheck}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tree({
  nodes,
  selectedKey,
  onSelect,
  checkable = false,
  checkedKeys = new Set<string>(),
  onCheck,
  className = '',
}: TreeProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      const maxScrollTop = container.scrollHeight - container.clientHeight
      if (maxScrollTop <= 0) return

      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * container.clientHeight
          : event.deltaY

      event.preventDefault()
      event.stopPropagation()
      container.scrollTop = Math.max(0, Math.min(maxScrollTop, container.scrollTop + delta))
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div
      ref={scrollContainerRef}
      role="tree"
      className={`${checkable ? 'max-h-64 px-2 py-1' : 'min-h-0 px-2 pb-3'} overflow-y-auto scrollbar-thin ${className}`}
    >
      {nodes.length ? nodes.map(node => (
        <TreeNodeItem
          key={node.key}
          node={node}
          depth={0}
          selectedKey={selectedKey}
          onSelect={onSelect}
          checkable={checkable}
          checkedKeys={checkedKeys}
          onCheck={onCheck}
        />
      )) : checkable ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">暂无数据</p>
      ) : null}
    </div>
  )
}
