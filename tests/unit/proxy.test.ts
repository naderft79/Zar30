// ============================================
// Zar30 - Proxy Unit Tests (Request ID propagation)
// ============================================
// X-Request-Id باید هم روی request (برای route handler/audit) و هم روی response باشد
// ============================================

import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

// Next internals: request headers اصلاح‌شده به‌صورت x-middleware-request-* روی response قرار می‌گیرند
const MW_REQ_ID = 'x-middleware-request-x-request-id'

describe('proxy — request id propagation', () => {
  it('request id جدید تولید و روی request + response ست می‌شود', () => {
    const req = new NextRequest('http://localhost/api/v1/health')
    const res = proxy(req)

    const responseId = res.headers.get('x-request-id')
    expect(responseId).toBeTruthy()
    // handlerها این header را در req.headers می‌بینند
    expect(res.headers.get(MW_REQ_ID)).toBe(responseId)
  })

  it('x-request-id ارسالی کلاینت حفظ می‌شود', () => {
    const req = new NextRequest('http://localhost/api/v1/health', {
      headers: { 'x-request-id': 'req-fixed-123' },
    })
    const res = proxy(req)

    expect(res.headers.get('x-request-id')).toBe('req-fixed-123')
    expect(res.headers.get(MW_REQ_ID)).toBe('req-fixed-123')
  })

  it('x-request-id نامعتبر/بیش‌ازحد جایگزین می‌شود', () => {
    const malicious = `bad id with spaces${'x'.repeat(200)}`
    const res = proxy(
      new NextRequest('http://localhost/api/v1/health', {
        headers: { 'x-request-id': malicious },
      }),
    )
    const id = res.headers.get('x-request-id')
    expect(id).toBeTruthy()
    expect(id).not.toBe(malicious)
    expect(id).toMatch(/^[A-Za-z0-9._:-]{1,128}$/)
    expect(res.headers.get(MW_REQ_ID)).toBe(id)
  })

  it('security headers حفظ می‌شوند', () => {
    const res = proxy(new NextRequest('http://localhost/'))
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('redirect هم X-Request-Id و security header دارد', () => {
    const res = proxy(new NextRequest('http://localhost/dashboard'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
    expect(res.headers.get('x-request-id')).toBeTruthy()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
