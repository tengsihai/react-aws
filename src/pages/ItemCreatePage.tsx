import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { ItemForm } from '../components/ItemForm'
import { useToast } from '../components/ToastProvider'
import { getErrorMessage } from '../lib/format'
import type { ItemInput } from '../types'

/** 新建页（增） */
export function ItemCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (input: ItemInput) => {
    setSubmitting(true)
    setError(null)
    try {
      const { item } = await itemsApi.create(input)
      showToast('事项创建成功')
      navigate(`/items/${item.id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/items" className="back-link">
            ← 返回列表
          </Link>
          <h1>新建事项</h1>
          <p className="subtitle">填写标题后即可创建，其余字段可稍后补充。</p>
        </div>
      </div>

      <ItemForm
        submitLabel="创建事项"
        submitting={submitting}
        error={error}
        onSubmit={(input) => void handleSubmit(input)}
        onCancel={() => navigate('/items')}
      />
    </>
  )
}
