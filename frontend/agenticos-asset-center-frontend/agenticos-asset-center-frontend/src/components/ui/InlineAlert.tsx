/**
 * 页面内嵌提示条组件（Inline Alert）—— 系统唯一的公共实现，请勿重复造轮子！
 *
 * 使用场景：表单字段级就地校验错误 / 页面内嵌的短提示（如"字段不能为空"、"xx 必填"），
 * 不随滚动离开，固定在内容流中展示。从 `@/components/ui`（即 `web/src/components/ui/index.ts`）导入：
 *
 *   import { InlineAlert } from '@/components/ui'
 *
 *   {errorMessage && <InlineAlert type="error">{errorMessage}</InlineAlert>}   // 就地展示错误
 *   <InlineAlert type="warning">当前为只读模式</InlineAlert>
 *   <InlineAlert type="success">配置已生效</InlineAlert>
 *   <InlineAlert type="info">说明性文字</InlineAlert>
 *
 * type 可选：'info' | 'success' | 'warning' | 'error'（默认 'info'），
 * 配色统一走 CSS 变量（--color-{type} / --color-{type}-light），禁止硬编码色值。
 * 无障碍：error 类型渲染 role="alert"，其余渲染 role="status"。
 *
 * 与 Message 的分工（务必区分）：
 *   - InlineAlert：页面内嵌提示条，用于"表单字段级就地校验错误 / 页面内短提示" —— 本组件
 *   - Message：全局浮层 toast，用于"操作结果"反馈（提交/删除/启停等动作的成败），见 Message.tsx
 *
 * 操作结果反馈（成功/失败）请用 Message，不要用本组件。
 */
import { clsx } from 'clsx'
import { ReactNode } from 'react'

export type InlineAlertType = 'info' | 'success' | 'warning' | 'error'

export interface InlineAlertProps {
  type?: InlineAlertType
  children: ReactNode
  className?: string
}

const TYPE_STYLES: Record<InlineAlertType, { color: string; background: string; border: string }> = {
  info: {
    color: 'var(--color-info)',
    background: 'var(--color-info-light)',
    border: 'color-mix(in srgb, var(--color-info) 24%, transparent)',
  },
  success: {
    color: 'var(--color-success)',
    background: 'var(--color-success-light)',
    border: 'color-mix(in srgb, var(--color-success) 24%, transparent)',
  },
  warning: {
    color: 'var(--color-warning)',
    background: 'var(--color-warning-light)',
    border: 'color-mix(in srgb, var(--color-warning) 26%, transparent)',
  },
  error: {
    color: 'var(--color-error)',
    background: 'var(--color-error-light)',
    border: 'color-mix(in srgb, var(--color-error) 26%, transparent)',
  },
}

export function InlineAlert({ type = 'info', children, className }: InlineAlertProps) {
  const styles = TYPE_STYLES[type]
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={clsx('rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed', className)}
      style={{ backgroundColor: styles.background, borderColor: styles.border, color: styles.color }}
    >
      {children}
    </div>
  )
}
