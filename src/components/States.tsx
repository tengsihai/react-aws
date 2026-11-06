/** 加载骨架屏 */
export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-list" aria-label="加载中" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-row card" key={index}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text short" />
        </div>
      ))}
    </div>
  )
}

/** 空数据占位 */
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state card">
      <div className="empty-icon" aria-hidden="true">
        ✦
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

/** 错误提示 + 重试按钮 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="banner banner-error banner-block" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  )
}
