import type { Item, ItemInput, ItemStatus } from '../types'

/** 构建时注入的 API Gateway 地址（见 .env.example / GitHub Actions） */
const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')

/** 后端约定的业务错误对象 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError('未配置 VITE_API_BASE_URL，请先部署后端或填写 .env.local', 0)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    // 网络层错误（断网、CORS 预检失败等）
    throw new ApiError('网络请求失败，请检查网络连接或接口地址', 0)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ?? `请求失败（HTTP ${response.status}）`
    throw new ApiError(message, response.status)
  }

  return data as T
}

export interface ListParams {
  status?: ItemStatus
  q?: string
}

export const itemsApi = {
  /** 查询列表，可按状态过滤、按关键字搜索 */
  list(params: ListParams = {}) {
    const search = new URLSearchParams()
    if (params.status) search.set('status', params.status)
    if (params.q) search.set('q', params.q)
    const query = search.toString()
    return request<{ items: Item[]; count: number }>(`/items${query ? `?${query}` : ''}`)
  },

  /** 查询单条 */
  get(id: string) {
    return request<{ item: Item }>(`/items/${encodeURIComponent(id)}`)
  },

  /** 新建 */
  create(input: ItemInput) {
    return request<{ item: Item }>('/items', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  /** 更新 */
  update(id: string, input: ItemInput) {
    return request<{ item: Item }>(`/items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  /** 删除 */
  remove(id: string) {
    return request<void>(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
