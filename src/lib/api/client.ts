// ============================================
// Zarnama - Browser API Client
// ============================================
// fetch wrapper برای فرم‌های client-side — cookie-based auth
// ============================================

'use client'

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
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
      return { ok: false, error: err?.detail ?? err?.title ?? 'خطایی رخ داد — دوباره تلاش کنید' }
    }
    return { ok: true, data: json.data }
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
      return { ok: false, error: err?.detail ?? err?.title ?? 'خطایی رخ داد' }
    }
    return { ok: true, data: json.data }
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
      return { ok: false, error: err?.detail ?? 'خطایی رخ داد' }
    }
    return { ok: true, data: json.data }
  } catch {
    return { ok: false, error: 'خطای اتصال' }
  }
}
