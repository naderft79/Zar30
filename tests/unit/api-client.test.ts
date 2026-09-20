// ============================================
// Zar30 - Browser API Client Unit Tests
// ============================================
// apiDelete باید 204 No Content را موفقیت بشناسد — بدون JSON body
// ============================================

import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiDelete } from '@/lib/api/client'

describe('apiDelete', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('204 No Content → ok:true با status 204 (بدون parse بدنه)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    )
    const res = await apiDelete('/api/v1/kyc/documents/abc')
    expect(res).toEqual({ ok: true, status: 204 })
  })

  it('204 غیر-DELETE JSON درخواست نمی‌شود — خطای JSON روی بدنه خالی خطا نیست', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await apiDelete('/x')
    expect(res.ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/x', {
      method: 'DELETE',
      credentials: 'include',
    })
  })

  it('پاسخ خطای JSON → ok:false با detail و status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false, error: { detail: 'مدرک یافت نشد' } }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )
    const res = await apiDelete('/x')
    expect(res.ok).toBe(false)
    expect(res.status).toBe(404)
    expect(res.error).toBe('مدرک یافت نشد')
  })

  it('network error → ok:false بدون status ساختگی', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    )
    const res = await apiDelete('/x')
    expect(res.ok).toBe(false)
    expect(res.status).toBeUndefined()
  })
})
