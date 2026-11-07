import { useId, useState, type FormEvent } from 'react'
import {
  ITEM_STATUSES,
  MAX_BIZ_NO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REMARK_LENGTH,
  STATUS_LABELS,
  type ItemCreateInput,
  type ItemStatus,
} from '../types'

interface ItemFormProps {
  /** create：biz_no 可填；edit：biz_no 只读，其余字段可改 */
  mode: 'create' | 'edit'
  initialValues: ItemCreateInput
  submitLabel: string
  submitting: boolean
  error: string | null
  onSubmit: (values: ItemCreateInput) => void
  onCancel: () => void
}

/** 服务端金额上限：绝对值 ≤ 9999999999999999.99 */
const AMOUNT_PATTERN = /^-?\d+(\.\d{1,2})?$/
const AMOUNT_MAX = 9999999999999999.99

/** 新建 / 编辑共用的表单组件 */
export function ItemForm({
  mode,
  initialValues,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const fieldId = useId()
  const [bizNo, setBizNo] = useState(initialValues.biz_no)
  const [name, setName] = useState(initialValues.name)
  const [status, setStatus] = useState<ItemStatus>(initialValues.status)
  const [amount, setAmount] = useState(initialValues.amount)
  const [remark, setRemark] = useState(initialValues.remark ?? '')
  // payload 用文本框编辑，提交时再解析成 JSON
  const [payloadText, setPayloadText] = useState(
    initialValues.payload == null ? '' : JSON.stringify(initialValues.payload, null, 2),
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedBizNo = bizNo.trim()
    const trimmedName = name.trim()
    const trimmedAmount = amount.trim() || '0.00'

    if (mode === 'create' && !trimmedBizNo) {
      setValidationError('请填写业务编号')
      return
    }
    if (trimmedBizNo.length > MAX_BIZ_NO_LENGTH) {
      setValidationError(`业务编号不能超过 ${MAX_BIZ_NO_LENGTH} 个字符`)
      return
    }
    if (!trimmedName) {
      setValidationError('请填写名称')
      return
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      setValidationError(`名称不能超过 ${MAX_NAME_LENGTH} 个字符`)
      return
    }
    if (!AMOUNT_PATTERN.test(trimmedAmount)) {
      setValidationError('金额格式不正确，最多两位小数')
      return
    }
    if (Math.abs(Number(trimmedAmount)) > AMOUNT_MAX) {
      setValidationError('金额超出允许范围')
      return
    }
    if (remark.length > MAX_REMARK_LENGTH) {
      setValidationError(`备注不能超过 ${MAX_REMARK_LENGTH} 个字符`)
      return
    }

    // payload 允许留空（null），填写时必须是合法 JSON
    let payload: unknown = null
    if (payloadText.trim()) {
      try {
        payload = JSON.parse(payloadText)
      } catch {
        setValidationError('payload 不是合法的 JSON')
        return
      }
    }

    setValidationError(null)
    onSubmit({
      biz_no: trimmedBizNo,
      name: trimmedName,
      status,
      amount: trimmedAmount,
      remark: remark.trim() ? remark.trim() : null,
      payload,
    })
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {(validationError || error) && (
        <div className="banner banner-error" role="alert">
          {validationError ?? error}
        </div>
      )}

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`${fieldId}-biz-no`}>
            业务编号 <span className="required">*</span>
          </label>
          <input
            id={`${fieldId}-biz-no`}
            className="input"
            type="text"
            value={bizNo}
            maxLength={MAX_BIZ_NO_LENGTH}
            placeholder="例如 BIZ-0001"
            onChange={(event) => setBizNo(event.target.value)}
            // 创建后不可修改，后端也会忽略该字段
            disabled={submitting || mode === 'edit'}
            readOnly={mode === 'edit'}
            autoFocus={mode === 'create'}
          />
          <span className="field-hint">
            {mode === 'edit' ? '业务编号创建后不可修改' : '全局唯一，创建后不可修改'}
          </span>
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-status`}>状态</label>
          <select
            id={`${fieldId}-status`}
            className="input"
            value={status}
            onChange={(event) => setStatus(Number(event.target.value) as ItemStatus)}
            disabled={submitting}
          >
            {ITEM_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-amount`}>金额</label>
          <input
            id={`${fieldId}-amount`}
            className="input"
            type="text"
            inputMode="decimal"
            value={amount}
            placeholder="0.00"
            onChange={(event) => setAmount(event.target.value)}
            disabled={submitting}
          />
          <span className="field-hint">最多两位小数，留空按 0.00 处理</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${fieldId}-name`}>
          名称 <span className="required">*</span>
        </label>
        <input
          id={`${fieldId}-name`}
          className="input"
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder="例如：发布链路自检记录"
          onChange={(event) => setName(event.target.value)}
          disabled={submitting}
          autoFocus={mode === 'edit'}
        />
        <span className="field-hint">
          {name.length}/{MAX_NAME_LENGTH}
        </span>
      </div>

      <div className="field">
        <label htmlFor={`${fieldId}-remark`}>备注</label>
        <textarea
          id={`${fieldId}-remark`}
          className="input textarea textarea-sm"
          rows={3}
          value={remark}
          maxLength={MAX_REMARK_LENGTH}
          placeholder="可选的补充说明"
          onChange={(event) => setRemark(event.target.value)}
          disabled={submitting}
        />
        <span className="field-hint">
          {remark.length}/{MAX_REMARK_LENGTH}
        </span>
      </div>

      <div className="field">
        <label htmlFor={`${fieldId}-payload`}>扩展数据（JSON）</label>
        <textarea
          id={`${fieldId}-payload`}
          className="input textarea mono"
          rows={6}
          value={payloadText}
          placeholder={'可选，例如：\n{ "source": "web" }'}
          onChange={(event) => setPayloadText(event.target.value)}
          disabled={submitting}
          spellCheck={false}
        />
        <span className="field-hint">留空表示不设置；填写时必须是合法 JSON</span>
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
