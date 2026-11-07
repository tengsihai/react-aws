import type { ItemStatus } from '../types'
import { STATUS_LABELS } from '../types'

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`badge badge-status-${status}`}>
      {STATUS_LABELS[status] ?? '未知状态'}
    </span>
  )
}

/** 金额统一按两位小数展示，值本身仍是字符串，不做数值运算 */
export function formatAmount(amount: string): string {
  return `¥ ${amount}`
}
