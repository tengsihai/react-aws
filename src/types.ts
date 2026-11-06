/** 事项状态：待处理 / 进行中 / 已完成 */
export const ITEM_STATUSES = ['todo', 'doing', 'done'] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

/** 事项优先级 */
export const ITEM_PRIORITIES = ['low', 'medium', 'high'] as const
export type ItemPriority = (typeof ITEM_PRIORITIES)[number]

/** 一条事项记录（与后端 Lambda 返回的数据结构保持一致） */
export interface Item {
  id: string
  title: string
  description: string
  status: ItemStatus
  priority: ItemPriority
  /** 截止日期，格式 YYYY-MM-DD，可为空 */
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

/** 新建 / 编辑表单提交的数据 */
export interface ItemInput {
  title: string
  description: string
  status: ItemStatus
  priority: ItemPriority
  dueDate: string | null
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  todo: '待处理',
  doing: '进行中',
  done: '已完成',
}

export const PRIORITY_LABELS: Record<ItemPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

/** 表单默认值 */
export const EMPTY_ITEM_INPUT: ItemInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
}
