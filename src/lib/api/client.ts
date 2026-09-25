// ============================================
// Zar30 - Browser API Client
// ============================================
// fetch wrapper برای فرم‌های client-side — cookie-based auth
// status: کد HTTP پاسخ — در network error (fetch throw) ست نمی‌شود
// ============================================

'use client'

import { isNativeApp } from '@/lib/mobile/capacitor'
import {
  clearNativeTokens,
  getNativeAccessToken,
  getNativeRefreshToken,
  saveNativeTokens,
} from '@/lib/mobile/auth'

// base URL سرور برای native — در WebView مسیر نسبی به https://localhost می‌رسد
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

function resolveUrl(path: string): string {
  return isNativeApp() ? `${API_BASE}${path}` : path
}

// روی native توکن با Bearer ارسال می‌شود؛ روی web cookie کافی است
async function authHeader(): Promise<Record<string, string>> {
  const token = await getNativeAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// پاسخ‌های دارای توکن (login/refresh) روی native ذخیره می‌شوند
function captureAuthTokens(json: unknown) {
  const data = (json as { data?: { accessToken?: unknown; refreshToken?: unknown } } | null)?.data
  if (typeof data?.accessToken === 'string' && typeof data.refreshToken === 'string') {
    void saveNativeTokens(data.accessToken, data.refreshToken)
  }
}

// خروج موفق → توکن‌های native پاک می‌شوند
function handleLogout(path: string, ok: boolean) {
  if (ok && path.includes('/auth/logout')) void clearNativeTokens()
}

export interface ApiMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
  /** HTTP status پاسخ — برای network error تعریف‌نشده است */
  status?: number
  meta?: ApiMeta
}

interface ApiSuccessBody<T> {
  success: true
  data: T
  meta?: ApiMeta
}

interface ApiErrorBody {
  success: false
  error: { title?: string; detail?: string }
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(resolveUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()), ...headers },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return {
        ok: false,
        status: res.status,
        error: err?.detail ?? err?.title ?? 'خطایی رخ داد — دوباره تلاش کنید',
      }
    }
    captureAuthTokens(json)
    handleLogout(path, res.ok)
    return { ok: true, status: res.status, data: json.data, meta: json.meta }
  } catch {
    return { ok: false, error: 'خطای اتصال — اینترنت خود را بررسی کنید' }
  }
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(resolveUrl(path), {
      headers: await authHeader(),
      credentials: 'include',
    })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? err?.title ?? 'خطایی رخ داد' }
    }
    captureAuthTokens(json)
    return { ok: true, status: res.status, data: json.data, meta: json.meta }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(resolveUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? err?.title ?? 'خطایی رخ داد' }
    }
    return { ok: true, status: res.status, data: json.data, meta: json.meta }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(resolveUrl(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? err?.title ?? 'خطایی رخ داد' }
    }
    return { ok: true, status: res.status, data: json.data, meta: json.meta }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

export async function apiDelete<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(resolveUrl(path), {
      method: 'DELETE',
      headers: await authHeader(),
      credentials: 'include',
    })
    // 204 No Content — بدون body؛ موفقیت مستقیم
    if (res.status === 204) return { ok: true, status: 204 }
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? 'خطایی رخ داد' }
    }
    return { ok: true, status: res.status, data: json.data, meta: json.meta }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

// آپلود فایل (multipart) — برای مدارک KYC
export async function apiUpload<T>(path: string, form: FormData): Promise<ApiResult<T>> {
  try {
    const res = await fetch(resolveUrl(path), {
      method: 'POST',
      headers: await authHeader(),
      credentials: 'include',
      body: form,
    })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return {
        ok: false,
        status: res.status,
        error: err?.detail ?? err?.title ?? 'آپلود ناموفق بود',
      }
    }
    return { ok: true, status: res.status, data: json.data, meta: json.meta }
  } catch {
    return { ok: false, error: 'خطای اتصال — اینترنت خود را بررسی کنید' }
  }
}

// access token منقضی (401) → یک بار refresh و retry
// فقط 401 باعث refresh می‌شود؛ 403 و خطاهای validation همان‌طور برمی‌گردند
export async function apiGetWithRefresh<T>(path: string): Promise<ApiResult<T>> {
  let res = await apiGet<T>(path)
  if (res.status === 401) {
    // روی native توکن refresh از Preferences در body ارسال می‌شود (cookie نیست)
    const refreshToken = await getNativeRefreshToken()
    const refreshed = await apiPost('/api/v1/auth/refresh', refreshToken ? { refreshToken } : {})
    if (refreshed.ok) {
      res = await apiGet<T>(path)
    } else if (isNativeApp()) {
      // refresh ناموفق → نشست مرده است؛ توکن‌ها پاک شوند تا کاربر به login برود
      await clearNativeTokens()
    }
  }
  return res
}
