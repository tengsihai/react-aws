import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { ItemForm } from '../components/ItemForm'
import { ErrorState, LoadingState } from '../components/States'
import { useToast } from '../components/ToastProvider'
import { getErrorMessage } from '../lib/format'
import type { Item, ItemCreateInput, ItemUpdateInput } from '../types'

/** 编辑页（改）：提交为部分更新，业务编号只读 */
export function ItemEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const itemId = Number(id)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isInteger(itemId) || itemId <= 0) {
      setLoadError('记录 ID 不合法')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      setItem(await itemsApi.get(itemId))
    } catch (err) {
      setLoadError(getErrorMessage(err))
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    void load()
  }, [load])

  const handleSubmit = async (values: ItemCreateInput) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // 只提交可更新字段，biz_no 不发送（后端会忽略）
      const patch: ItemUpdateInput = {
        name: values.name,
        status: values.status,
        amount: values.amount,
        remark: values.remark,
        payload: values.payload,
      }
      const updated = await itemsApi.update(itemId, patch)
      showToast('记录已更新')
      navigate(`/items/${updated.id}`, { replace: true })
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
          <h1>编辑记录</h1>
          <p className="subtitle">仅提交修改的字段，业务编号不可变更。</p>
        </div>
      </div>

      {loading ? (
        <LoadingState rows={1} />
      ) : loadError || !item ? (
        <ErrorState message={loadError ?? '未找到该记录'} onRetry={() => void load()} />
      ) : (
        <ItemForm
          mode="edit"
          initialValues={{
            biz_no: item.biz_no,
            name: item.name,
            status: item.status,
            amount: item.amount,
            remark: item.remark,
            payload: item.payload,
          }}
          submitLabel="保存修改"
          submitting={submitting}
          error={submitError}
          onSubmit={(values) => void handleSubmit(values)}
          onCancel={() => navigate(`/items/${item.id}`)}
        />
      )}
    </>
  )
}
