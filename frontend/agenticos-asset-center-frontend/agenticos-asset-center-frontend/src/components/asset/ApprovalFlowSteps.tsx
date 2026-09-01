/**
 * 资产中心共享组件 — 审批流程步骤条
 * 通用审批流状态可视化（提交→审批→执行），供标准发布/权属变更/
 * 退役申请/API 上架等审批场景共用
 */
import { Check, Circle, Clock } from 'lucide-react'

export interface ApprovalStep {
  label: string
  /** done=已完成 active=当前进行 pending=未开始 */
  state: 'done' | 'active' | 'pending'
  /** 步骤备注（审批人/时间） */
  note?: string
}

interface ApprovalFlowStepsProps {
  steps: ApprovalStep[]
}

export default function ApprovalFlowSteps({ steps }: ApprovalFlowStepsProps) {
  return (
    <div className="flex items-start gap-0">
      {steps.map((step, idx) => (
        <div key={idx} className="flex flex-1 items-start">
          <div className="flex flex-col items-center">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={
                step.state === 'done'
                  ? { backgroundColor: 'var(--color-success, #10b981)', color: '#fff' }
                  : step.state === 'active'
                    ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text-tertiary)' }
              }
            >
              {step.state === 'done' ? (
                <Check size={14} />
              ) : step.state === 'active' ? (
                <Clock size={14} />
              ) : (
                <Circle size={12} />
              )}
            </div>
            <p
              className="mt-1.5 text-center text-xs font-medium"
              style={{ color: step.state === 'pending' ? 'var(--color-text-tertiary)' : 'var(--color-text)' }}
            >
              {step.label}
            </p>
            {step.note && (
              <p className="mt-0.5 max-w-24 text-center text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                {step.note}
              </p>
            )}
          </div>
          {idx < steps.length - 1 && (
            <div
              className="mt-3.5 h-px flex-1"
              style={{ backgroundColor: step.state === 'done' ? 'var(--color-success, #10b981)' : 'var(--color-border)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
