import type { Item, ItemCreateInput, ItemUpdateInput } from '../types'

/** 构建时注入的 API Base URL（已包含 /dev 这类 stage 前缀，见 .env.example） */
const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')

/** 后端统一的错误响应体 */
interface ErrorBody {
  code?: string
  message?: string
}

export class ApiError extends Error {
  /** HTTP 状态码；0 表示请求未到达服务端（网络错误 / 未配置地址） */
  readonly status: number
  /** 后端错误码，如 VALIDATION_ERROR、NOT_FOUND */
  readonly code: string

  constructor(message: string, status: number, code = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new ApiError('未配置 VITE_API_BASE_URL，请先填写后端地址', 0)
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
    // 网络层错误：断网、DNS 失败、CORS 预检被拦截等
    throw new ApiError('网络请求失败，请检查网络或跨域配置', 0)
  }

  // 删除成功返回 204，无响应体
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const error = (body ?? {}) as ErrorBody
    throw new ApiError(
      error.message || `请求失败（HTTP ${response.status}）`,
      response.status,
      error.code ?? '',
    )
  }

  return body as T
}

export interface ListParams {
  /** 每页条数，1–100，默认 20 */
  limit?: number
  /** 跳过条数，默认 0 */
  offset?: number
}

export interface ListResult {
  items: Item[]
  /** 未删除记录总数，翻页以它为准 */
  total: number
  limit: number
  offset: number
}

interface SingleResponse {
  data: Item
}

interface ListResponse {
  data: Item[]
  meta: { total: number; limit: number; offset: number }
}

export const itemsApi = {
  /** 分页列表，按 id 倒序 */
  async list({ limit = 20, offset = 0 }: ListParams = {}): Promise<ListResult> {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const body = await request<ListResponse>(`/items?${query}`)
    return {
      items: body.data ?? [],
      total: body.meta?.total ?? 0,
      limit: body.meta?.limit ?? limit,
      offset: body.meta?.offset ?? offset,
    }
  },

  /** 单条查询 */
  async get(id: number): Promise<Item> {
    const body = await request<SingleResponse>(`/items/${id}`)
    return body.data
  },

  /** 新增 */
  async create(input: ItemCreateInput): Promise<Item> {
    const body = await request<SingleResponse>('/items', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return body.data
  },

  /** 部分更新：只提交要修改的字段 */
  async update(id: number, patch: ItemUpdateInput): Promise<Item> {
    const body = await request<SingleResponse>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    })
    return body.data
  },

  /** 软删除 */
  async remove(id: number): Promise<void> {
    await request<void>(`/items/${id}`, { method: 'DELETE' })
  },
}
