import { PRIORITY_LABELS, STATUS_LABELS, type ItemPriority, type ItemStatus } from '../types'

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className={`badge badge-status-${status}`}>{STATUS_LABELS[status]}</span>
}

export function PriorityBadge({ priority }: { priority: ItemPriority }) {
  return <span className={`badge badge-priority-${priority}`}>优先级 {PRIORITY_LABELS[priority]}</span>
}
