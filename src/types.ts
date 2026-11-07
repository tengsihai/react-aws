/**
 * 数据模型：与后端「自检记录 API」保持一致（表 t_migration_check）
 */

/** 状态：0=待处理，1=处理中，2=已完成 */
export const ITEM_STATUSES = [0, 1, 2] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const STATUS_LABELS: Record<ItemStatus, string> = {
  0: '待处理',
  1: '处理中',
  2: '已完成',
}

/** 一条记录（接口返回的字段原样使用） */
export interface Item {
  /** 自增主键，只读 */
  id: number
  /** 业务编号，全局唯一，创建后不可修改 */
  biz_no: string
  name: string
  status: ItemStatus
  /** 金额以字符串传输，避免精度丢失 */
  amount: string
  /** 任意可序列化的 JSON 值 */
  payload: unknown
  remark: string | null
  /** 接口返回的行恒为 0 */
  is_deleted: 0 | 1
  /** 服务端时间，格式 YYYY-MM-DD HH:MM:SS，无时区后缀 */
  created_at: string
  updated_at: string
}

/** 新建时提交的数据：只有 biz_no、name 必填 */
export interface ItemCreateInput {
  biz_no: string
  name: string
  status: ItemStatus
  amount: string
  remark: string | null
  payload: unknown
}

/** 更新为部分更新：未提交的字段保持不变，且 biz_no 不可修改 */
export type ItemUpdateInput = Partial<Omit<ItemCreateInput, 'biz_no'>>

export const MAX_BIZ_NO_LENGTH = 64
export const MAX_NAME_LENGTH = 128
export const MAX_REMARK_LENGTH = 255
