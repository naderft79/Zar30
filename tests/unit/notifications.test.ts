// ============================================
// Zar30 - Push/Notifications Validator Tests
// ============================================

import { describe, expect, it } from 'vitest'
import { pushSubscribeSchema, pushUnsubscribeSchema } from '@/lib/validators/notifications'
import { createAddressSchema } from '@/lib/validators/bank'

const VALID_SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'BPxdf1ytest_key_data', auth: 'auth_secret_16bytes' },
}

describe('pushSubscribeSchema', () => {
  it('اشتراک معتبر را قبول می‌کند', () => {
    const v = pushSubscribeSchema.parse(VALID_SUB)
    expect(v.endpoint).toBe(VALID_SUB.endpoint)
    expect(v.userAgent).toBeUndefined()
  })

  it('endpoint غیر URL رد می‌شود', () => {
    expect(pushSubscribeSchema.safeParse({ ...VALID_SUB, endpoint: 'not-a-url' }).success).toBe(
      false,
    )
  })

  it('بدون keys رد می‌شود', () => {
    expect(pushSubscribeSchema.safeParse({ endpoint: VALID_SUB.endpoint }).success).toBe(false)
  })

  it('keys خالی رد می‌شود', () => {
    expect(
      pushSubscribeSchema.safeParse({ ...VALID_SUB, keys: { p256dh: '', auth: '' } }).success,
    ).toBe(false)
  })
})

describe('pushUnsubscribeSchema', () => {
  it('endpoint معتبر قبول می‌کند', () => {
    expect(pushUnsubscribeSchema.parse({ endpoint: VALID_SUB.endpoint }).endpoint).toBe(
      VALID_SUB.endpoint,
    )
  })

  it('endpoint نامعتبر رد می‌شود', () => {
    expect(pushUnsubscribeSchema.safeParse({ endpoint: '' }).success).toBe(false)
  })
})

describe('createAddressSchema — مختصات جغرافیایی', () => {
  const base = {
    recipientName: 'نام گیرنده آزمایشی',
    mobile: '09123456789',
    address: 'تهران، خیابان آزمایشی، پلاک ۱۲، واحد ۳',
    postalCode: '1234567890',
  }

  it('بدون مختصات معتبر است (اختیاری)', () => {
    const v = createAddressSchema.parse(base)
    expect(v.latitude).toBeUndefined()
  })

  it('مختصات معتبر ایران قبول می‌شود', () => {
    const v = createAddressSchema.parse({ ...base, latitude: 35.6892, longitude: 51.389 })
    expect(v.latitude).toBeCloseTo(35.6892)
  })

  it('مختصات خارج از محدوده زمین رد می‌شود', () => {
    expect(createAddressSchema.safeParse({ ...base, latitude: 91 }).success).toBe(false)
    expect(createAddressSchema.safeParse({ ...base, longitude: -181 }).success).toBe(false)
  })
})
