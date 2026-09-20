// ============================================
// Zar30 - Browser API Client
// ============================================
// fetch wrapper برای فرم‌های client-side — cookie-based auth
// status: کد HTTP پاسخ — در network error (fetch throw) ست نمی‌شود
// ============================================

'use client'

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
  /** HTTP status پاسخ — برای network error تعریف‌نشده است */
  status?: number
}

interface ApiSuccessBody<T> {
  success: true
  data: T
}

interface ApiErrorBody {
  success: false
  error: { title?: string; detail?: string }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    return { ok: true, status: res.status, data: json.data }
  } catch {
    return { ok: false, error: 'خطای اتصال — اینترنت خود را بررسی کنید' }
  }
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { credentials: 'include' })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? err?.title ?? 'خطایی رخ داد' }
    }
    return { ok: true, status: res.status, data: json.data }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

export async function apiPut<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? err?.title ?? 'خطایی رخ داد' }
    }
    return { ok: true, status: res.status, data: json.data }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

export async function apiDelete<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { method: 'DELETE', credentials: 'include' })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return { ok: false, status: res.status, error: err?.detail ?? 'خطایی رخ داد' }
    }
    return { ok: true, status: res.status, data: json.data }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}

// آپلود فایل (multipart) — برای مدارک KYC
export async function apiUpload<T>(path: string, form: FormData): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { method: 'POST', credentials: 'include', body: form })
    const json = (await res.json().catch(() => null)) as ApiSuccessBody<T> | ApiErrorBody | null
    if (!res.ok || !json?.success) {
      const err = json && !json.success ? json.error : undefined
      return {
        ok: false,
        status: res.status,
        error: err?.detail ?? err?.title ?? 'آپلود ناموفق بود',
      }
    }
    return { ok: true, status: res.status, data: json.data }
  } catch {
    return { ok: false, error: 'خطای اتصال — اینترنت خود را بررسی کنید' }
  }
}

// access token منقضی (401) → یک بار refresh و retry
// فقط 401 باعث refresh می‌شود؛ 403 و خطاهای validation همان‌طور برمی‌گردند
export async function apiGetWithRefresh<T>(path: string): Promise<ApiResult<T>> {
  let res = await apiGet<T>(path)
  if (res.status === 401) {
    const refreshed = await apiPost('/api/v1/auth/refresh', {})
    if (refreshed.ok) res = await apiGet<T>(path)
  }
  return res
}
