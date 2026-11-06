import { NavLink, Outlet } from 'react-router-dom'

/** 全站布局：顶部导航 + 主体内容区 */
export function Layout() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  // 环境标识由 CI 注入（dev / stg / prod），本地开发默认 local
  const appEnv = import.meta.env.VITE_APP_ENV?.trim() || 'local'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <NavLink to="/items" className="brand" aria-label="TaskFlow 首页">
            <span className="brand-mark" aria-hidden="true">
              TF
            </span>
            <span className="brand-text">
              <strong>TaskFlow</strong>
              <small>事项管理</small>
            </span>
          </NavLink>

          <span className={`env-badge env-badge-${appEnv}`} title="当前部署环境">
            {appEnv}
          </span>

          <nav className="nav" aria-label="主导航">
            <NavLink
              to="/items"
              end
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              事项列表
            </NavLink>
            <NavLink
              to="/items/new"
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              新建事项
            </NavLink>
          </nav>

          <a
            className="repo-link"
            href="https://github.com/tengsihai/react-aws"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="app-main">
        {!apiBaseUrl && (
          <div className="banner banner-warning" role="alert">
            未检测到 <code>VITE_API_BASE_URL</code>，接口请求将失败。请在 <code>.env.local</code>{' '}
            中配置 API Gateway 地址后重启开发服务器。
          </div>
        )}
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>React + Amazon CloudFront / S3 + API Gateway / Lambda</span>
        <span className="dot-sep">·</span>
        <span>通过 GitHub Actions 自动发布</span>
      </footer>
    </div>
  )
}
