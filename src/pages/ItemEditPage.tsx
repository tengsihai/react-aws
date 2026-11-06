import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { ItemForm } from '../components/ItemForm'
import { ErrorState, LoadingState } from '../components/States'
import { useToast } from '../components/ToastProvider'
import { getErrorMessage } from '../lib/format'
import type { Item, ItemInput } from '../types'

/** 编辑页（改） */
export function ItemEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await itemsApi.get(id)
      setItem(data.item)
    } catch (err) {
      setLoadError(getErrorMessage(err))
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (input: ItemInput) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const data = await itemsApi.update(id, input)
      showToast('事项已更新')
      navigate(`/items/${data.item.id}`, { replace: true })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to={`/items/${id}`} className="back-link">
            ← 返回详情
          </Link>
          <h1>编辑事项</h1>
          <p className="subtitle">修改后点击「保存修改」立即生效。</p>
        </div>
      </div>

      {loading ? (
        <LoadingState rows={1} />
      ) : loadError || !item ? (
        <ErrorState message={loadError ?? '未找到该事项'} onRetry={() => void load()} />
      ) : (
        <ItemForm
          initialValue={{
            title: item.title,
            description: item.description,
            status: item.status,
            priority: item.priority,
            dueDate: item.dueDate,
          }}
          submitLabel="保存修改"
          submitting={submitting}
          error={submitError}
          onSubmit={(input) => void handleSubmit(input)}
          onCancel={() => navigate(`/items/${item.id}`)}
        />
      )}
    </>
  )
}
