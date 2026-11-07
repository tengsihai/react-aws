/**
 * 后端时间字段形如 "2026-11-07 05:30:00"，没有时区后缀。
 * 这里原样展示，并做一点格式美化，避免浏览器按本地时区二次解释造成偏移。
 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  // 兼容可能出现的 ISO 形式，统一成 "YYYY-MM-DD HH:MM:SS"
  return value.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '')
}

/** 格式化金额展示，空值回退到 0.00 */
export function formatAmount(value: string | null | undefined): string {
  return `¥ ${value && value.trim() ? value : '0.00'}`
}

/** 把任意 JSON 值格式化成可读文本，用于详情页展示 */
export function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '空'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** 统一提取错误提示文案 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return '发生未知错误，请稍后重试'
}
