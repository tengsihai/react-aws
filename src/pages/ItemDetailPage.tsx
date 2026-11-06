import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState, LoadingState } from '../components/States'
import { useToast } from '../components/ToastProvider'
import { formatDate, formatDateTime, getErrorMessage } from '../lib/format'
import type { Item } from '../types'

/** 详情页（查单条）：展示完整信息，并提供编辑 / 删除入口 */
export function ItemDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await itemsApi.get(id)
      setItem(data.item)
    } catch (err) {
      setError(getErrorMessage(err))
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await itemsApi.remove(id)
      showToast('事项已删除')
      navigate('/items', { replace: true })
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="page-head">
          <div>
            <Link to="/items" className="back-link">
              ← 返回列表
            </Link>
            <h1>事项详情</h1>
          </div>
        </div>
        <LoadingState rows={1} />
      </>
    )
  }

  if (error || !item) {
    return (
      <>
        <div className="page-head">
          <div>
            <Link to="/items" className="back-link">
              ← 返回列表
            </Link>
            <h1>事项详情</h1>
          </div>
        </div>
        <ErrorState message={error ?? '未找到该事项'} onRetry={() => void load()} />
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/items" className="back-link">
            ← 返回列表
          </Link>
          <h1>{item.title}</h1>
          <div className="item-meta">
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            <span className="meta-text">更新于 {formatDateTime(item.updatedAt)}</span>
          </div>
        </div>
        <div className="page-actions">
          <Link className="btn btn-ghost" to={`/items/${item.id}/edit`}>
            编辑
          </Link>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
            删除
          </button>
        </div>
      </div>

      <div className="card detail-card">
        <dl className="detail-grid">
          <div>
            <dt>状态</dt>
            <dd>
              <StatusBadge status={item.status} />
            </dd>
          </div>
          <div>
            <dt>优先级</dt>
            <dd>
              <PriorityBadge priority={item.priority} />
            </dd>
          </div>
          <div>
            <dt>截止日期</dt>
            <dd>{formatDate(item.dueDate)}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{formatDateTime(item.createdAt)}</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{formatDateTime(item.updatedAt)}</dd>
          </div>
          <div>
            <dt>事项 ID</dt>
            <dd className="mono">{item.id}</dd>
          </div>
        </dl>

        <section className="detail-description-block">
          <h2>描述</h2>
          <p className="detail-description">{item.description || '暂无描述'}</p>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="删除事项"
        description={`确定要删除「${item.title}」吗？删除后无法恢复。`}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
