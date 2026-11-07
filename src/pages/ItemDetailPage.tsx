import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { StatusBadge } from '../components/Badges'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState, LoadingState } from '../components/States'
import { useToast } from '../components/ToastProvider'
import { formatAmount, formatDateTime, formatJson, getErrorMessage } from '../lib/format'
import type { Item } from '../types'

/** 详情页（查单条）：展示完整字段，并提供编辑 / 删除入口 */
export function ItemDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const itemId = Number(id)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isInteger(itemId) || itemId <= 0) {
      setError('记录 ID 不合法')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setItem(await itemsApi.get(itemId))
    } catch (err) {
      setError(getErrorMessage(err))
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await itemsApi.remove(itemId)
      showToast('记录已删除')
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
            <h1>记录详情</h1>
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
            <h1>记录详情</h1>
          </div>
        </div>
        <ErrorState message={error ?? '未找到该记录'} onRetry={() => void load()} />
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
          <h1>{item.name}</h1>
          <div className="item-meta">
            <StatusBadge status={item.status} />
            <span className="biz-no mono">{item.biz_no}</span>
            <span className="meta-text">更新于 {formatDateTime(item.updated_at)}</span>
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
            <dt>ID</dt>
            <dd className="mono">{item.id}</dd>
          </div>
          <div>
            <dt>业务编号</dt>
            <dd className="mono">{item.biz_no}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>
              <StatusBadge status={item.status} />
            </dd>
          </div>
          <div>
            <dt>金额</dt>
            <dd className="mono">{formatAmount(item.amount)}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{formatDateTime(item.created_at)}</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{formatDateTime(item.updated_at)}</dd>
          </div>
        </dl>

        <section className="detail-description-block">
          <h2>备注</h2>
          <p className="detail-description">{item.remark || '暂无备注'}</p>
        </section>

        <section className="detail-description-block">
          <h2>扩展数据（payload）</h2>
          <pre className="payload-block">{formatJson(item.payload)}</pre>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="删除记录"
        description={`确定要删除「${item.name}」吗？删除后该记录将不再出现在列表中。`}
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
