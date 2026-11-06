/** 把 ISO 时间格式化为中文可读时间 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 格式化截止日期（YYYY-MM-DD） */
export function formatDate(value: string | null | undefined): string {
  return value ? value : '未设置'
}

/** 统一提取错误提示文案 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return '发生未知错误，请稍后重试'
}
