import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { itemsApi } from '../api/items'
import { ItemForm } from '../components/ItemForm'
import { useToast } from '../components/ToastProvider'
import { getErrorMessage } from '../lib/format'
import type { ItemCreateInput } from '../types'

const EMPTY_VALUES: ItemCreateInput = {
  biz_no: '',
  name: '',
  status: 0,
  amount: '0.00',
  remark: null,
  payload: null,
}

/** 新建页（增） */
export function ItemCreatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: ItemCreateInput) => {
    setSubmitting(true)
    setError(null)
    try {
      const item = await itemsApi.create(values)
      showToast('记录创建成功')
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
          <h1>新建记录</h1>
          <p className="subtitle">业务编号与名称为必填项，其余字段可稍后补充。</p>
        </div>
      </div>

      <ItemForm
        mode="create"
        initialValues={EMPTY_VALUES}
        submitLabel="创建记录"
        submitting={submitting}
        error={error}
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => navigate('/items')}
      />
    </>
  )
}
