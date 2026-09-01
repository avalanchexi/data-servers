/**
 * 资产中心共享组件 — 类目树
 * 基于 ui/Tree 的资产类目树（类目管理 + 目录浏览页签共用）
 */
import { useState } from 'react'
import { FolderTree, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui'

export interface CatalogNode {
  id: string
  name: string
  code?: string
  asset_count?: number
  children?: CatalogNode[]
}

interface CatalogTreeProps {
  nodes: CatalogNode[]
  selectedId?: string | null
  onSelect?: (node: CatalogNode) => void
  /** 写操作注入（新建子类目/删除），只读态由 data-ro 全局拦截 */
  onCreateChild?: (parent: CatalogNode) => void
  onDelete?: (node: CatalogNode) => void
}

export default function CatalogTree({
  nodes,
  selectedId,
  onSelect,
  onCreateChild,
  onDelete,
}: CatalogTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderNode = (node: CatalogNode, depth: number) => (
    <div key={node.id}>
      <div
        className="group flex items-center gap-1.5 rounded px-2 py-1.5 text-sm hover:opacity-85"
        style={{
          paddingLeft: `${depth * 16 + 8}px`,
          backgroundColor: selectedId === node.id ? 'var(--color-primary-bg, rgba(91,143,249,0.12))' : 'transparent',
          color: selectedId === node.id ? 'var(--color-primary)' : 'var(--color-text)',
          cursor: 'pointer',
        }}
        onClick={() => onSelect?.(node)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggle(node.id) }}
          className="flex h-4 w-4 items-center justify-center"
          style={{ color: 'var(--color-text-tertiary)' }}
          data-ro
        >
          <FolderTree size={13} />
        </button>
        <span className="flex-1 truncate">{node.name}</span>
        {node.asset_count != null && (
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{node.asset_count}</span>
        )}
        {onCreateChild && (
          <button
            onClick={(e) => { e.stopPropagation(); onCreateChild(node) }}
            className="hidden group-hover:block"
            style={{ color: 'var(--color-text-tertiary)' }}
            title="新建子类目"
            data-ro
          >
            <Plus size={12} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node) }}
            className="hidden group-hover:block"
            style={{ color: 'var(--color-error)' }}
            title="删除类目"
            data-ro
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      {expanded.has(node.id) && node.children?.map((child) => renderNode(child, depth + 1))}
    </div>
  )

  if (!nodes.length) {
    return (
      <div className="py-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        暂无类目
        {onCreateChild && (
          <div className="mt-2">
            <Button size="sm" variant="ghost" onClick={() => onCreateChild({ id: '', name: '根类目' })} data-ro>
              <Plus size={14} className="mr-1" /> 新建根类目
            </Button>
          </div>
        )}
      </div>
    )
  }
  return <div className="space-y-0.5">{nodes.map((node) => renderNode(node, 0))}</div>
}
