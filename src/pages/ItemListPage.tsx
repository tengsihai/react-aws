import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { StatusBadge } from '../components/Badges'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { useToast } from '../components/ToastProvider'
import { formatAmount, formatDateTime, getErrorMessage } from '../lib/format'
import type { Item } from '../types'

/** 每页条数，后端允许 1–100 */
const PAGE_SIZE = 20

/** 列表页（查）：分页浏览、跳转详情 / 编辑、删除 */
export function ItemListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  /** 页码从 0 开始，对应接口的 offset */
  const [page, setPage] = useState(0)
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 丢弃过期响应，避免快速翻页时旧数据覆盖新数据
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const currentId = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await itemsApi.list({ limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      if (currentId !== requestId.current) return
      setItems(result.items)
      setTotal(result.total)
    } catch (err) {
      if (currentId !== requestId.current) return
      setError(getErrorMessage(err))
    } finally {
      if (currentId === requestId.current) setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await itemsApi.remove(pendingDelete.id)
      setPendingDelete(null)
      showToast('记录已删除')
      // 删掉的是当前页最后一条时，回退一页，避免停在空白页
      if (items.length === 1 && page > 0) {
        setPage((current) => current - 1)
      } else {
        await load()
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">自检记录</p>
          <h1>记录列表</h1>
          <p className="subtitle">
            {loading ? '正在加载…' : `共 ${total} 条记录`}
            {!loading && total > 0 && `，第 ${page + 1} / ${totalPages} 页`}
          </p>
        </div>
        <Link className="btn btn-primary" to="/items/new">
          <span aria-hidden="true">＋</span> 新建记录
        </Link>
      </div>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {loading ? (
        <LoadingState />
      ) : items.length === 0 && !error ? (
        <EmptyState
          title="还没有任何记录"
          description="点击右上角「新建记录」创建第一条记录。"
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
                      {item.name}
                    </Link>
                  </h2>
                  <span className="biz-no mono">{item.biz_no}</span>
                </div>
                <p className="item-desc">{item.remark || '暂无备注'}</p>
                <div className="item-meta">
                  <StatusBadge status={item.status} />
                  <span className="meta-amount">{formatAmount(item.amount)}</span>
                  <span className="meta-text">更新于 {formatDateTime(item.updated_at)}</span>
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

      {total > PAGE_SIZE && (
        <div className="pagination card">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
          >
            上一页
          </button>
          <span className="pagination-info">
            第 {page + 1} / {totalPages} 页 · 共 {total} 条
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            下一页
          </button>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除记录"
        description={`确定要删除「${pendingDelete?.name ?? ''}」吗？该记录将不再出现在列表中。`}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
