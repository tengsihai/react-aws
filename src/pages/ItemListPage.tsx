import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { useToast } from '../components/ToastProvider'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { formatDateTime, getErrorMessage } from '../lib/format'
import type { Item, ItemStatus } from '../types'

const STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '待处理' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

/** 列表页（查）：支持状态筛选、关键字搜索、跳转详情 / 编辑、删除 */
export function ItemListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const [pendingDelete, setPendingDelete] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 用自增序号丢弃过期响应，避免快速切换筛选时旧数据覆盖新数据
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const currentId = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await itemsApi.list({
        status: statusFilter === 'all' ? undefined : (statusFilter as ItemStatus),
        q: debouncedKeyword.trim() || undefined,
      })
      if (currentId !== requestId.current) return
      setItems(data.items)
      setError(null)
    } catch (err) {
      if (currentId !== requestId.current) return
      setError(getErrorMessage(err))
    } finally {
      if (currentId === requestId.current) setLoading(false)
    }
  }, [statusFilter, debouncedKeyword])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await itemsApi.remove(pendingDelete.id)
      setPendingDelete(null)
      showToast('事项已删除')
      await load()
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const hasFilter = statusFilter !== 'all' || keyword.trim() !== ''

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">事项管理</p>
          <h1>全部事项</h1>
          <p className="subtitle">
            {loading ? '正在加载…' : `共 ${items.length} 条记录${hasFilter ? '（已筛选）' : ''}`}
          </p>
        </div>
        <Link className="btn btn-primary" to="/items/new">
          <span aria-hidden="true">＋</span> 新建事项
        </Link>
      </div>

      <div className="toolbar card">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            className="input search-input"
            type="search"
            placeholder="搜索标题或描述…"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="搜索事项"
          />
        </div>

        <div className="segmented" role="group" aria-label="按状态筛选">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`segmented-item${statusFilter === filter.value ? ' is-active' : ''}`}
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {loading ? (
        <LoadingState />
      ) : items.length === 0 && !error ? (
        <EmptyState
          title={hasFilter ? '没有符合条件的事项' : '还没有任何事项'}
          description={
            hasFilter ? '试试调整搜索关键字或状态筛选。' : '点击右上角「新建事项」创建第一条记录。'
          }
        />
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <article
              key={item.id}
              className="item-row card"
              onClick={() => navigate(`/items/${item.id}`)}
            >
              <div className="item-main">
                <div className="item-title-line">
                  <span className={`status-dot status-dot-${item.status}`} aria-hidden="true" />
                  <h2>
                    <Link to={`/items/${item.id}`} className="item-title-link">
                      {item.title}
                    </Link>
                  </h2>
                </div>
                <p className="item-desc">{item.description || '暂无描述'}</p>
                <div className="item-meta">
                  <StatusBadge status={item.status} />
                  <PriorityBadge priority={item.priority} />
                  {item.dueDate && <span className="meta-text">截止 {item.dueDate}</span>}
                  <span className="meta-text">更新于 {formatDateTime(item.updatedAt)}</span>
                </div>
              </div>

              <div className="item-actions" onClick={(event) => event.stopPropagation()}>
                <Link className="btn btn-ghost btn-sm" to={`/items/${item.id}/edit`}>
                  编辑
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger-ghost"
                  onClick={() => setPendingDelete(item)}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除事项"
        description={`确定要删除「${pendingDelete?.title ?? ''}」吗？删除后无法恢复。`}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
