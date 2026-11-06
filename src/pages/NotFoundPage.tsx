import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="empty-state card">
      <div className="empty-icon" aria-hidden="true">
        404
      </div>
      <h2>页面不存在</h2>
      <p>你访问的地址可能已被移除，或者输入有误。</p>
      <Link className="btn btn-primary" to="/items">
        返回事项列表
      </Link>
    </div>
  )
}
