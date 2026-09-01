/**
 * 资产中心共享组件 — 权属矩阵表（持有权/使用权/经营权三权登记）
 * 行=资产，列=权属类型与责任人矩阵
 */
export interface OwnershipRow {
  asset_name: string
  asset_id: string
  holding_owner?: string
  usage_owner?: string
  management_owner?: string
  holding_dept?: string
  status?: string
  approved?: boolean
}

interface OwnerMatrixTableProps {
  rows: OwnershipRow[]
  /** 审批操作（可选，由调用方注入写操作按钮） */
  onApprove?: (row: OwnershipRow, approved: boolean) => void
}

export default function OwnerMatrixTable({ rows, onApprove }: OwnerMatrixTableProps) {
  if (!rows.length) {
    return <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无权属登记</p>
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left" style={{ color: 'var(--color-text-tertiary)' }}>
          <th className="py-2 px-2 font-normal">资产</th>
          <th className="py-2 px-2 font-normal">持有权</th>
          <th className="py-2 px-2 font-normal">使用权</th>
          <th className="py-2 px-2 font-normal">经营权</th>
          <th className="py-2 px-2 font-normal">归属部门</th>
          <th className="py-2 px-2 font-normal">审批状态</th>
          {onApprove && <th className="py-2 px-2 font-normal">操作</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={`${row.asset_id}-${i}`} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
            <td className="py-2 px-2" style={{ color: 'var(--color-text)' }}>{row.asset_name}</td>
            <td className="py-2 px-2" style={{ color: 'var(--color-text-secondary)' }}>{row.holding_owner || '-'}</td>
            <td className="py-2 px-2" style={{ color: 'var(--color-text-secondary)' }}>{row.usage_owner || '-'}</td>
            <td className="py-2 px-2" style={{ color: 'var(--color-text-secondary)' }}>{row.management_owner || '-'}</td>
            <td className="py-2 px-2" style={{ color: 'var(--color-text-secondary)' }}>{row.holding_dept || '-'}</td>
            <td className="py-2 px-2">
              <span
                className="rounded px-1.5 py-0.5 text-xs"
                style={
                  row.approved
                    ? { backgroundColor: 'rgba(90,216,166,0.15)', color: 'var(--color-success, #10b981)' }
                    : { backgroundColor: 'rgba(246,189,22,0.15)', color: 'var(--color-warning, #d97706)' }
                }
              >
                {row.approved ? '已批准' : '待审批'}
              </span>
            </td>
            {onApprove && (
              <td className="py-2 px-2">
                <button
                  onClick={() => onApprove(row, true)}
                  className="mr-2 text-xs underline"
                  style={{ color: 'var(--color-primary)' }}
                  data-ro
                >
                  批准
                </button>
                <button
                  onClick={() => onApprove(row, false)}
                  className="text-xs underline"
                  style={{ color: 'var(--color-error)' }}
                  data-ro
                >
                  驳回
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
