// ============================================
// Zar30 - KYC Integration Tests (Phase 4)
// ============================================
// State machine + Upload (MinIO واقعی) + IDOR + Admin Review — PostgreSQL واقعی
// ============================================

import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'
import { kycService } from '@/lib/services/kyc.service'

const meta = { ip: '127.0.0.1', userAgent: 'vitest' }
const VALID_NC = '0499370899'
const VALID_IBAN = 'IR110170000000101234567890'
const VALID_CARD = '6037991122334455'
const BIRTH = '1990-06-15T00:00:00.000Z'

// PNG 1x1 — magic bytes واقعی
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 7),
])
const EXE_FAKE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64, 0)]) // مجرمانه → reject

function uniqueMobile() {
  return `0912${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}

async function createVerifiedUser() {
  const mobile = uniqueMobile()
  await register({ mobile, password: 'Test@1234' }, meta)
  const code = await redis.get(`devotp:${mobile}`)
  await verifyRegisterOtp(mobile, code!, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile } })
}

async function fillDraft(userId: string) {
  await kycService.updateDraft(
    userId,
    { firstName: 'تست', lastName: 'کاربر', birthDate: BIRTH },
    meta,
  )
  await kycService.updateDraft(userId, { nationalCode: VALID_NC, shenasnamehNo: '12345' }, meta)
  await kycService.updateDraft(userId, { cardNumber: VALID_CARD, iban: VALID_IBAN }, meta)
  await kycService.uploadDocument(userId, 'ID_CARD_FRONT', 'id.png', 'image/png', PNG, meta)
}

describe('KYC Service (DB + MinIO واقعی)', () => {
  it('start — draft می‌سازد و idempotent است', async () => {
    const user = await createVerifiedUser()
    const s1 = await kycService.start(user.id, meta)
    const s2 = await kycService.start(user.id, meta)
    expect(s1!.id).toBe(s2!.id) // همان draft برمی‌گردد
    expect(s1!.status).toBe('IN_PROGRESS')
  })

  it('updateDraft — فقط در IN_PROGRESS + validation سرور', async () => {
    const user = await createVerifiedUser()
    // بدون start → conflict
    await expect(kycService.updateDraft(user.id, { firstName: 'x' }, meta)).rejects.toThrow()

    await kycService.start(user.id, meta)
    // کد ملی نامعتبر → reject
    await expect(
      kycService.updateDraft(user.id, { nationalCode: '1111111111' }, meta),
    ).rejects.toThrow()
    // شبا نامعتبر → reject
    await expect(
      kycService.updateDraft(user.id, { iban: 'IR000000000000000000000000' }, meta),
    ).rejects.toThrow()

    const s = await kycService.updateDraft(
      user.id,
      { nationalCode: VALID_NC, shenasnamehNo: '999' },
      meta,
    )
    expect(s!.nationalCode).toBe(VALID_NC)
  })

  it('uploadDocument — MIME sniff: exe/fake را رد می‌کند', async () => {
    const user = await createVerifiedUser()
    await kycService.start(user.id, meta)
    await expect(
      kycService.uploadDocument(user.id, 'ID_CARD_FRONT', 'x.png', 'image/png', EXE_FAKE, meta),
    ).rejects.toThrow(/فرمت|مجاز/)
    // kind نامعتبر
    await expect(
      kycService.uploadDocument(user.id, 'PASSPORT', 'x.png', 'image/png', PNG, meta),
    ).rejects.toThrow()
    // PNG واقعی قبول می‌شود
    const doc = await kycService.uploadDocument(
      user.id,
      'ID_CARD_FRONT',
      'id.png',
      'image/png',
      PNG,
      meta,
    )
    expect(doc.kind).toBe('ID_CARD_FRONT')
    expect(doc.mimeType).toBe('image/png')
  })

  it('submit — بدون مدرک اجباری رد می‌شود؛ کامل → SUBMITTED', async () => {
    const user = await createVerifiedUser()
    await kycService.start(user.id, meta)
    await kycService.updateDraft(
      user.id,
      {
        firstName: 'تست',
        lastName: 'کاربر',
        birthDate: BIRTH,
        nationalCode: VALID_NC,
        shenasnamehNo: '1',
        cardNumber: VALID_CARD,
        iban: VALID_IBAN,
      },
      meta,
    )
    // بدون کارت ملی → 422
    await expect(kycService.submit(user.id, meta)).rejects.toThrow(/ناقص|کارت ملی/)

    await kycService.uploadDocument(user.id, 'ID_CARD_FRONT', 'id.png', 'image/png', PNG, meta)
    const s = await kycService.submit(user.id, meta)
    expect(s!.status).toBe('SUBMITTED')

    // state machine: draft دیگر قابل ویرایش نیست
    await expect(kycService.updateDraft(user.id, { firstName: 'جدید' }, meta)).rejects.toThrow()
    // submit دوباره → conflict (draft وجود ندارد)
    await expect(kycService.submit(user.id, meta)).rejects.toThrow()
  })

  it('IDOR — کاربر دیگر به مدرک/حذف دسترسی ندارد', async () => {
    const userA = await createVerifiedUser()
    const userB = await createVerifiedUser()
    await kycService.start(userA.id, meta)
    const doc = await kycService.uploadDocument(
      userA.id,
      'ID_CARD_FRONT',
      'a.png',
      'image/png',
      PNG,
      meta,
    )

    // کاربر B نمی‌تواند دانلود کند
    await expect(kycService.getDocument(userB.id, doc.id)).rejects.toThrow(/یافت نشد/)
    // کاربر B نمی‌تواند حذف کند
    await expect(kycService.deleteDocument(userB.id, doc.id, meta)).rejects.toThrow()
    // خود کاربر A می‌تواند دانلود کند — decrypt درست
    const got = await kycService.getDocument(userA.id, doc.id)
    expect(got.data.equals(PNG)).toBe(true)
    expect(got.mimeType).toBe('image/png')
  })

  it('review — approve → ارتقای kycLevel + اعلان + audit', async () => {
    const user = await createVerifiedUser()
    const adminUser = await createVerifiedUser()
    const admin = await prisma.adminUser.create({
      data: { userId: adminUser.id, role: 'KYC', permissions: { kyc: ['review'] } },
    })

    await kycService.start(user.id, meta)
    await fillDraft(user.id)
    await kycService.submit(user.id, meta)

    const queue = await kycService.reviewQueue()
    const sub = queue.find((q) => q.user.id === user.id)!
    expect(sub.status).toBe('SUBMITTED')

    const approved = await kycService.review(
      admin.id,
      admin.role,
      sub.id,
      'approve',
      undefined,
      meta,
    )
    expect(approved!.status).toBe('APPROVED')

    // اثر واقعی: سطح کاربر ارتقا یافت
    const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(u.kycLevel).toBe('LEVEL_2')

    // اعلان نتیجه
    const notif = await prisma.notification.findFirst({
      where: { userId: user.id, type: 'kyc_approved' },
    })
    expect(notif).toBeTruthy()

    // audit
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: sub.id, action: 'KYC_APPROVED', actorId: admin.id },
    })
    expect(audit).toBeTruthy()
  })

  it('review — reject نیاز به دلیل دارد؛ resubmission دوباره draft می‌سازد', async () => {
    const user = await createVerifiedUser()
    const adminUser = await createVerifiedUser()
    const admin = await prisma.adminUser.create({
      data: { userId: adminUser.id, role: 'KYC', permissions: {} },
    })

    await kycService.start(user.id, meta)
    await fillDraft(user.id)
    const sub = await kycService.submit(user.id, meta)

    // reject بدون دلیل → 400
    await expect(
      kycService.review(admin.id, admin.role, sub!.id, 'reject', undefined, meta),
    ).rejects.toThrow(/دلیل/)

    const rejected = await kycService.review(
      admin.id,
      admin.role,
      sub!.id,
      'reject',
      'مدرک ناخوانا است',
      meta,
    )
    expect(rejected!.status).toBe('REJECTED')
    expect(rejected!.rejectionReason).toContain('ناخوانا')

    // resubmission — draft جدید با prefill
    const draft2 = await kycService.start(user.id, meta)
    expect(draft2!.id).not.toBe(sub!.id)
    expect(draft2!.status).toBe('IN_PROGRESS')
    expect(draft2!.nationalCode).toBe(VALID_NC) // prefill شده
  })

  it('transition نامعتبر — claim روی draft رد می‌شود', async () => {
    const user = await createVerifiedUser()
    const adminUser = await createVerifiedUser()
    const admin = await prisma.adminUser.create({
      data: { userId: adminUser.id, role: 'SUPPORT', permissions: {} },
    })
    const draft = await kycService.start(user.id, meta)
    await expect(kycService.claim(admin.id, admin.role, draft!.id, meta)).rejects.toThrow()
  })

  it('concurrency — دو review همزمان روی یک SUBMITTED؛ فقط یکی موفق', async () => {
    const user = await createVerifiedUser()
    const adminUserA = await createVerifiedUser()
    const adminUserB = await createVerifiedUser()
    const adminA = await prisma.adminUser.create({
      data: { userId: adminUserA.id, role: 'KYC', permissions: {} },
    })
    const adminB = await prisma.adminUser.create({
      data: { userId: adminUserB.id, role: 'KYC', permissions: {} },
    })

    await kycService.start(user.id, meta)
    await fillDraft(user.id)
    const sub = await kycService.submit(user.id, meta)

    // دو reviewer همزمان تصمیم می‌گیرند — predicate وضعیت فقط یکی را عبور می‌دهد
    const results = await Promise.allSettled([
      kycService.review(adminA.id, adminA.role, sub!.id, 'approve', undefined, meta),
      kycService.review(adminB.id, adminB.role, sub!.id, 'reject', 'مدرک ناخوانا', meta),
    ])
    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)

    // وضعیت نهایی terminal و یکتا است
    const final = await prisma.kycSubmission.findUniqueOrThrow({ where: { id: sub!.id } })
    expect(['APPROVED', 'REJECTED']).toContain(final.status)

    // دقیقاً یک notification نتیجه — نه بیشتر
    const notifs = await prisma.notification.findMany({
      where: { userId: user.id, type: { in: ['kyc_approved', 'kyc_rejected'] } },
    })
    expect(notifs).toHaveLength(1)

    // دقیقاً یک audit terminal — rollback برنده‌باز نمی‌شناسد
    const audits = await prisma.auditLog.findMany({
      where: {
        entityId: sub!.id,
        action: { in: ['KYC_APPROVED', 'KYC_REJECTED'] },
      },
    })
    expect(audits).toHaveLength(1)
    expect(audits[0]!.targetUserId).toBe(user.id)
    expect(audits[0]!.actorRole).toBe('KYC')
  })

  it('concurrency — دو claim همزمان؛ فقط یکی موفق', async () => {
    const user = await createVerifiedUser()
    const adminUserA = await createVerifiedUser()
    const adminUserB = await createVerifiedUser()
    const adminA = await prisma.adminUser.create({
      data: { userId: adminUserA.id, role: 'KYC', permissions: {} },
    })
    const adminB = await prisma.adminUser.create({
      data: { userId: adminUserB.id, role: 'KYC', permissions: {} },
    })

    await kycService.start(user.id, meta)
    await fillDraft(user.id)
    const sub = await kycService.submit(user.id, meta)

    const results = await Promise.allSettled([
      kycService.claim(adminA.id, adminA.role, sub!.id, meta),
      kycService.claim(adminB.id, adminB.role, sub!.id, meta),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1)

    const audits = await prisma.auditLog.findMany({
      where: { entityId: sub!.id, action: 'KYC_UNDER_REVIEW' },
    })
    expect(audits).toHaveLength(1)
  })
})
