// ============================================
// Zar30 - Admin KYC Integration Tests
// ============================================
// list pagination/filter + detail redaction (بدون ciphertext/storage internals)
// ============================================

import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'
import { kycService } from '@/lib/services/kyc.service'
import { getAdminKycDetail, listAdminKyc } from '@/lib/services/admin-kyc.service'

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }
const VALID_NC = '0499370899'
const VALID_IBAN = 'IR110170000000101234567890'
const VALID_CARD = '6037991122334455'
const BIRTH = '1990-06-15T00:00:00.000Z'

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 7),
])

function uniqueMobile() {
  return `0914${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function createVerifiedUser() {
  const mobile = uniqueMobile()
  await register({ mobile, password: 'Test@1234' }, meta)
  const code = await redis.get(`devotp:${mobile}`)
  await verifyRegisterOtp(mobile, code!, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile } })
}

async function createSubmittedKyc() {
  const user = await createVerifiedUser()
  await kycService.start(user.id, meta)
  await kycService.updateDraft(
    user.id,
    { firstName: 'متقاضی', lastName: 'آزمون', birthDate: BIRTH },
    meta,
  )
  await kycService.updateDraft(user.id, { nationalCode: VALID_NC, shenasnamehNo: '555' }, meta)
  await kycService.updateDraft(user.id, { cardNumber: VALID_CARD, iban: VALID_IBAN }, meta)
  await kycService.uploadDocument(user.id, 'ID_CARD_FRONT', 'id.png', 'image/png', PNG, meta)
  const sub = await kycService.submit(user.id, meta)
  return { user, submissionId: sub!.id }
}

describe('Admin KYC Service (DB واقعی)', () => {
  it('list — pagination و فیلتر status', async () => {
    const { submissionId } = await createSubmittedKyc()

    const page = await listAdminKyc({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(page.rows.length).toBeLessThanOrEqual(10)
    expect(page.total).toBeGreaterThanOrEqual(1)

    const submitted = await listAdminKyc({
      page: 1,
      limit: 100,
      status: 'SUBMITTED',
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(submitted.rows.some((r) => r.id === submissionId)).toBe(true)

    const rejected = await listAdminKyc({
      page: 1,
      limit: 100,
      status: 'REJECTED',
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(rejected.rows.some((r) => r.id === submissionId)).toBe(false)

    // جستجو با شناسه پرونده
    const byId = await listAdminKyc({
      page: 1,
      limit: 20,
      q: submissionId.slice(0, 12),
      sortBy: 'createdAt',
      direction: 'desc',
    })
    expect(byId.rows.some((r) => r.id === submissionId)).toBe(true)
  })

  it('detail — هیچ ciphertext/storage internal در خروجی نیست؛ بانک فقط masked', async () => {
    const { user, submissionId } = await createSubmittedKyc()

    const detail = await getAdminKycDetail(submissionId)
    expect(detail.id).toBe(submissionId)
    expect(detail.user.id).toBe(user.id)
    expect(detail.nationalCode).toBe(VALID_NC)

    // serialization کامل را بررسی کن — هیچ کلید حساسی نباید باشد
    const serialized = JSON.stringify(detail)
    for (const forbidden of [
      'cardNumberEnc',
      'ibanEnc',
      'storageKey',
      'sha256',
      VALID_CARD,
      VALID_IBAN,
    ]) {
      expect(serialized).not.toContain(forbidden)
    }

    // بانک فقط masked
    expect(detail.bank.bankComplete).toBe(true)
    expect(detail.bank.cardMasked).toContain('•')
    expect(detail.bank.ibanMasked).toContain('IR11')
    expect(detail.bank.cardMasked!.endsWith('4455')).toBe(true) // فقط ۴ رقم آخر

    // مدارک بدون storageKey
    expect(detail.documents.length).toBe(1)
    expect(detail.documents[0]!.kind).toBe('ID_CARD_FRONT')
  })

  it('detail ناموجود → 404', async () => {
    await expect(getAdminKycDetail('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      /یافت نشد/,
    )
  })
})
