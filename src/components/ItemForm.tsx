import { useId, useState, type FormEvent } from 'react'
import {
  EMPTY_ITEM_INPUT,
  ITEM_PRIORITIES,
  ITEM_STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type ItemInput,
} from '../types'

interface ItemFormProps {
  initialValue?: ItemInput
  submitLabel: string
  submitting: boolean
  error: string | null
  onSubmit: (value: ItemInput) => void
  onCancel: () => void
}

const MAX_TITLE_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 1000

/** 新建 / 编辑共用的表单组件 */
export function ItemForm({
  initialValue = EMPTY_ITEM_INPUT,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const fieldId = useId()
  const [values, setValues] = useState<ItemInput>(initialValue)
  const [validationError, setValidationError] = useState<string | null>(null)

  const update = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = values.title.trim()
    if (!title) {
      setValidationError('请填写事项标题')
      return
    }
    setValidationError(null)
    onSubmit({
      ...values,
      title,
      description: values.description.trim(),
      dueDate: values.dueDate || null,
    })
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {(validationError || error) && (
        <div className="banner banner-error" role="alert">
          {validationError ?? error}
        </div>
      )}

      <div className="field">
        <label htmlFor={`${fieldId}-title`}>
          标题 <span className="required">*</span>
        </label>
        <input
          id={`${fieldId}-title`}
          className="input"
          type="text"
          value={values.title}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="例如：整理第三季度需求评审材料"
          onChange={(event) => update('title', event.target.value)}
          disabled={submitting}
          autoFocus
        />
        <span className="field-hint">
          {values.title.length}/{MAX_TITLE_LENGTH}
        </span>
      </div>

      <div className="field">
        <label htmlFor={`${fieldId}-description`}>描述</label>
        <textarea
          id={`${fieldId}-description`}
          className="input textarea"
          rows={5}
          value={values.description}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="补充事项背景、目标或备注信息"
          onChange={(event) => update('description', event.target.value)}
          disabled={submitting}
        />
        <span className="field-hint">
          {values.description.length}/{MAX_DESCRIPTION_LENGTH}
        </span>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`${fieldId}-status`}>状态</label>
          <select
            id={`${fieldId}-status`}
            className="input"
            value={values.status}
            onChange={(event) => update('status', event.target.value as ItemInput['status'])}
            disabled={submitting}
          >
            {ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-priority`}>优先级</label>
          <select
            id={`${fieldId}-priority`}
            className="input"
            value={values.priority}
            onChange={(event) => update('priority', event.target.value as ItemInput['priority'])}
            disabled={submitting}
          >
            {ITEM_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-dueDate`}>截止日期</label>
          <input
            id={`${fieldId}-dueDate`}
            className="input"
            type="date"
            value={values.dueDate ?? ''}
            onChange={(event) => update('dueDate', event.target.value || null)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          取消
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '提交中…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
