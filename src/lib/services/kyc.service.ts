// ============================================
// Zar30 - KYC Service (Phase 4)
// ============================================
// State Machine رسمی:
//   NOT_STARTED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW
//     → APPROVED | REJECTED | NEEDS_RESUBMISSION
//   NEEDS_RESUBMISSION/REJECTED → submission جدید (history immutable)
// تمام انتقال‌ها server-side و با AuditLog انجام می‌شوند
// ============================================

import { randomUUID } from 'node:crypto'
import type { KycStatus, KycDocKind } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { writeAudit } from '@/lib/audit/audit'
import { logger } from '@/lib/logger/logger'
import {
  encryptBuffer,
  decryptBuffer,
  encryptString,
  decryptString,
  sha256Hex,
} from '@/lib/crypto/aes-gcm'
import { storagePut, storageGet, storageDelete } from '@/lib/storage/s3'
import {
  kycDraftSchema,
  KYC_DOC_KINDS,
  KYC_MAX_FILE_BYTES,
  KYC_ALLOWED_MIME,
} from '@/lib/validators/kyc'

interface Meta {
  ip?: string
  userAgent?: string
}

// ---- انتقال‌های مجاز state machine — منع هر جهش نامعتبر ----
const ALLOWED_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION'],
  APPROVED: [],
  REJECTED: [],
  NEEDS_RESUBMISSION: [],
}

function assertTransition(from: KycStatus, to: KycStatus) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw ApiError.conflict(`انتقال وضعیت ${from} → ${to} مجاز نیست`)
  }
}

// ---- MIME magic bytes — امنیت آپلود، نه فقط header ----
function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return 'image/png'
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp'
  return null
}

const docSelect = {
  id: true,
  kind: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
} as const

const submissionSelect = {
  id: true,
  level: true,
  status: true,
  firstName: true,
  lastName: true,
  nationalCode: true,
  shenasnamehNo: true,
  birthDate: true,
  currentStep: true,
  submittedAt: true,
  rejectionReason: true,
  createdAt: true,
  cardNumberEnc: true,
  ibanEnc: true,
  documents: { select: docSelect },
} as const

// مقادیر حساس بانکی هرگز plaintext برنمی‌گردند — فقط masked برای نمایش مرور
function maskIban(ibanEnc: string | null): string | null {
  if (!ibanEnc) return null
  const iban = decryptString(ibanEnc)
  if (!iban) return null
  return `${iban.slice(0, 4)}••••••••••••••${iban.slice(-4)}`
}

function maskCard(cardEnc: string | null): string | null {
  if (!cardEnc) return null
  const card = decryptString(cardEnc)
  if (!card) return null
  return `${card.slice(0, 4)}••••••••${card.slice(-4)}`
}

type RawSubmission = {
  cardNumberEnc?: string | null
  ibanEnc?: string | null
  [k: string]: unknown
}

// حذف فیلدهای رمزنگاری‌شده از پاسخ + افزودن masked equivalents
function toPublic<T extends RawSubmission | null | undefined>(s: T) {
  if (!s) return s
  const { cardNumberEnc, ibanEnc, ...rest } = s
  return {
    ...rest,
    bankComplete: !!(cardNumberEnc && ibanEnc),
    cardMasked: maskCard(cardNumberEnc ?? null),
    ibanMasked: maskIban(ibanEnc ?? null),
  }
}

export const kycService = {
  // ---- وضعیت فعلی کاربر — آخرین submission + تاریخچه ----
  async getStatus(userId: string) {
    const submissions = await prisma.kycSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { ...submissionSelect, documents: { select: docSelect } },
      take: 10,
    })
    const active = submissions.find((s) =>
      ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_RESUBMISSION'].includes(s.status),
    )
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kycLevel: true },
    })
    return {
      kycLevel: user?.kycLevel ?? 'LEVEL_0',
      active: toPublic(active),
      history: submissions.map(toPublic),
    }
  },

  // ---- شروع/ادامه draft — idempotent ----
  async start(userId: string, meta: Meta) {
    const existing = await prisma.kycSubmission.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      select: submissionSelect,
    })
    if (existing) return existing

    const locked = await prisma.kycSubmission.findFirst({
      where: { userId, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      select: { id: true },
    })
    if (locked) throw ApiError.conflict('درخواست احراز هویت شما در حال بررسی است')

    // prefill از آخرین submission قبلی (rejected/needs_resubmission) — مدارک باید مجدد آپلود شوند
    const prev = await prisma.kycSubmission.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        firstName: true,
        lastName: true,
        nationalCode: true,
        shenasnamehNo: true,
        birthDate: true,
        cardNumberEnc: true,
        ibanEnc: true,
      },
    })

    const submission = await prisma.kycSubmission.create({
      data: {
        userId,
        level: 'LEVEL_2',
        status: 'IN_PROGRESS',
        firstName: prev?.firstName,
        lastName: prev?.lastName,
        nationalCode: prev?.nationalCode,
        shenasnamehNo: prev?.shenasnamehNo,
        birthDate: prev?.birthDate,
        cardNumberEnc: prev?.cardNumberEnc,
        ibanEnc: prev?.ibanEnc,
      },
      select: submissionSelect,
    })
    await writeAudit({
      actorType: 'user',
      actorId: userId,
      action: 'KYC_STARTED',
      entityType: 'kyc_submission',
      entityId: submission.id,
      after: { level: submission.level },
      ...meta,
    })
    return toPublic(submission)
  },

  // ---- ذخیره draft — فقط در IN_PROGRESS ----
  async updateDraft(userId: string, input: unknown, _meta: Meta) {
    const draft = await prisma.kycSubmission.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      select: { id: true },
    })
    if (!draft) throw ApiError.conflict('ابتدا احراز هویت را شروع کنید')

    const parsed = kycDraftSchema.safeParse(input)
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
    }
    const d = parsed.data

    const submission = await prisma.kycSubmission.update({
      where: { id: draft.id },
      data: {
        ...(d.firstName !== undefined && { firstName: d.firstName }),
        ...(d.lastName !== undefined && { lastName: d.lastName }),
        ...(d.birthDate !== undefined && { birthDate: d.birthDate }),
        ...(d.nationalCode !== undefined && { nationalCode: d.nationalCode }),
        ...(d.shenasnamehNo !== undefined && { shenasnamehNo: d.shenasnamehNo }),
        // داده بانکی — رمزنگاری در حال استراحت
        ...(d.cardNumber !== undefined && { cardNumberEnc: encryptString(d.cardNumber) }),
        ...(d.iban !== undefined && { ibanEnc: encryptString(d.iban) }),
        ...(d.currentStep !== undefined && { currentStep: d.currentStep }),
      },
      select: submissionSelect,
    })
    return toPublic(submission)
  },

  // ---- آپلود مدرک — MIME sniff + size + encrypt + private storage ----
  async uploadDocument(
    userId: string,
    kind: string,
    fileName: string,
    declaredMime: string,
    data: Buffer,
    meta: Meta,
  ) {
    if (!(KYC_DOC_KINDS as readonly string[]).includes(kind)) {
      throw ApiError.badRequest('نوع مدرک نامعتبر است')
    }
    const draft = await prisma.kycSubmission.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      select: { id: true },
    })
    if (!draft) throw ApiError.conflict('مدرک فقط در وضعیت «در حال تکمیل» قابل آپلود است')

    if (data.length === 0) throw ApiError.badRequest('فایل خالی است')
    if (data.length > KYC_MAX_FILE_BYTES) {
      throw ApiError.badRequest('حجم فایل بیش از ۵ مگابایت است')
    }
    // MIME واقعی از محتوا — نه فقط header کلاینت
    const sniffed = sniffMime(data)
    if (!sniffed || !(KYC_ALLOWED_MIME as readonly string[]).includes(sniffed)) {
      throw ApiError.badRequest('فرمت فایل مجاز نیست (فقط JPEG / PNG / WebP)')
    }
    if (declaredMime && declaredMime !== sniffed) {
      throw ApiError.badRequest('نوع فایل با محتوا مطابقت ندارد')
    }

    // یک مدرک از هر kind — جایگزینی مجاز است (حذف قبلی)
    const prev = await prisma.kycDocument.findFirst({
      where: { submissionId: draft.id, kind: kind as KycDocKind },
      select: { id: true, storageKey: true },
    })

    const docId = randomUUID()
    const storageKey = `kyc/${userId}/${draft.id}/${docId}`
    await storagePut(storageKey, encryptBuffer(data), 'application/octet-stream')

    const doc = await prisma.kycDocument.create({
      data: {
        id: docId,
        submissionId: draft.id,
        kind: kind as KycDocKind,
        storageKey,
        fileName: fileName.slice(0, 120),
        mimeType: sniffed,
        sizeBytes: data.length,
        sha256: sha256Hex(data),
        encrypted: true,
      },
      select: docSelect,
    })

    if (prev) {
      await prisma.kycDocument.delete({ where: { id: prev.id } })
      await storageDelete(prev.storageKey).catch((err) =>
        logger.warn({ err, key: prev.storageKey }, 'Orphaned KYC object delete failed'),
      )
    }

    await writeAudit({
      actorType: 'user',
      actorId: userId,
      action: 'KYC_DOC_UPLOADED',
      entityType: 'kyc_document',
      entityId: doc.id,
      after: { kind, mimeType: sniffed, sizeBytes: data.length, sha256: sha256Hex(data) },
      ...meta,
    })
    return doc
  },

  // ---- حذف مدرک — فقط مالک، فقط در draft ----
  async deleteDocument(userId: string, docId: string, meta: Meta) {
    const doc = await prisma.kycDocument.findUnique({
      where: { id: docId },
      select: {
        id: true,
        storageKey: true,
        submission: { select: { userId: true, status: true } },
      },
    })
    if (!doc || doc.submission.userId !== userId) throw ApiError.notFound('مدرک یافت نشد')
    if (doc.submission.status !== 'IN_PROGRESS') {
      throw ApiError.conflict('مدرک پس از ارسال قابل حذف نیست')
    }
    await prisma.kycDocument.delete({ where: { id: doc.id } })
    await storageDelete(doc.storageKey).catch((err) =>
      logger.warn({ err, key: doc.storageKey }, 'KYC object delete failed'),
    )
    await writeAudit({
      actorType: 'user',
      actorId: userId,
      action: 'KYC_DOC_DELETED',
      entityType: 'kyc_document',
      entityId: doc.id,
      ...meta,
    })
  },

  // ---- دانلود مدرک — مالک یا ادمین؛ decrypt + stream ----
  async getDocument(userId: string, docId: string, isAdmin = false) {
    const doc = await prisma.kycDocument.findUnique({
      where: { id: docId },
      select: {
        storageKey: true,
        mimeType: true,
        fileName: true,
        submission: { select: { userId: true } },
      },
    })
    if (!doc || (!isAdmin && doc.submission.userId !== userId)) {
      throw ApiError.notFound('مدرک یافت نشد')
    }
    const payload = await storageGet(doc.storageKey)
    if (!payload) throw ApiError.notFound('فایل در فضای ذخیره‌سازی یافت نشد')
    return { data: decryptBuffer(payload), mimeType: doc.mimeType, fileName: doc.fileName }
  },

  // ---- ارسال نهایی — کامل‌بودن همه مراحل الزامی است ----
  async submit(userId: string, meta: Meta) {
    const draft = await prisma.kycSubmission.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        nationalCode: true,
        shenasnamehNo: true,
        cardNumberEnc: true,
        ibanEnc: true,
        documents: { select: { kind: true } },
      },
    })
    if (!draft) throw ApiError.conflict('درخواستی برای ارسال وجود ندارد')

    const missing: string[] = []
    if (!draft.firstName || !draft.lastName || !draft.birthDate) missing.push('اطلاعات شخصی')
    if (!draft.nationalCode || !draft.shenasnamehNo) missing.push('اطلاعات هویتی')
    if (!draft.cardNumberEnc || !draft.ibanEnc) missing.push('اطلاعات بانکی')
    if (!draft.documents.some((d) => d.kind === 'ID_CARD_FRONT')) missing.push('تصویر کارت ملی')
    if (missing.length) {
      throw ApiError.unprocessableEntity(`مراحل ناقص: ${missing.join('، ')}`)
    }

    assertTransition('IN_PROGRESS', 'SUBMITTED')
    const submission = await prisma.kycSubmission.update({
      where: { id: draft.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      select: submissionSelect,
    })
    await writeAudit({
      actorType: 'user',
      actorId: userId,
      action: 'KYC_SUBMITTED',
      entityType: 'kyc_submission',
      entityId: submission.id,
      before: { status: 'IN_PROGRESS' },
      after: { status: 'SUBMITTED' },
      ...meta,
    })
    return toPublic(submission)
  },

  // ================= ADMIN REVIEW =================

  // صف بررسی — فقط admin
  async reviewQueue() {
    return prisma.kycSubmission.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      orderBy: { submittedAt: 'asc' },
      select: {
        id: true,
        level: true,
        status: true,
        submittedAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    })
  },

  // گرفتن پرونده برای بررسی — SUBMITTED → UNDER_REVIEW
  async claim(adminId: string, submissionId: string, meta: Meta) {
    const sub = await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
      select: { status: true },
    })
    if (!sub) throw ApiError.notFound('درخواست یافت نشد')
    assertTransition(sub.status, 'UNDER_REVIEW')
    const updated = await prisma.kycSubmission.update({
      where: { id: submissionId },
      data: { status: 'UNDER_REVIEW', reviewedBy: adminId },
      select: submissionSelect,
    })
    await writeAudit({
      actorType: 'admin',
      actorId: adminId,
      action: 'KYC_UNDER_REVIEW',
      entityType: 'kyc_submission',
      entityId: submissionId,
      ...meta,
    })
    return toPublic(updated)
  },

  // تصمیم نهایی — approve / reject / request_changes
  async review(
    adminId: string,
    submissionId: string,
    decision: 'approve' | 'reject' | 'request_changes',
    reason: string | undefined,
    meta: Meta,
  ) {
    const sub = await prisma.kycSubmission.findUnique({
      where: { id: submissionId },
      select: { status: true, userId: true, level: true },
    })
    if (!sub) throw ApiError.notFound('درخواست یافت نشد')

    const target: KycStatus =
      decision === 'approve'
        ? 'APPROVED'
        : decision === 'reject'
          ? 'REJECTED'
          : 'NEEDS_RESUBMISSION'
    // اجازه بررسی مستقیم از SUBMITTED هم (claim اختیاری)
    const from: KycStatus = sub.status === 'SUBMITTED' ? 'SUBMITTED' : sub.status
    const allowed =
      from === 'UNDER_REVIEW'
        ? ALLOWED_TRANSITIONS.UNDER_REVIEW.includes(target)
        : from === 'SUBMITTED'
          ? ['APPROVED', 'REJECTED', 'NEEDS_RESUBMISSION'].includes(target)
          : false
    if (!allowed) throw ApiError.conflict(`وضعیت ${sub.status} قابل بررسی نیست`)
    if (decision !== 'approve' && !reason?.trim()) {
      throw ApiError.badRequest('دلیل رد یا بازگشت الزامی است')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.kycSubmission.update({
        where: { id: submissionId },
        data: {
          status: target,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: decision === 'approve' ? null : (reason ?? null),
        },
        select: submissionSelect,
      })
      if (decision === 'approve') {
        // ارتقای سطح KYC کاربر — اثر مالی واقعی تصمیم ادمین
        await tx.user.update({
          where: { id: sub.userId },
          data: { kycLevel: sub.level },
        })
      }
      // اعلان درون‌برنامه‌ای نتیجه
      const notif = {
        approve: {
          type: 'kyc_approved',
          title: 'احراز هویت تایید شد',
          body: 'احراز هویت شما با موفقیت تایید شد. سقف خدمات حساب شما ارتقا یافت.',
        },
        reject: {
          type: 'kyc_rejected',
          title: 'احراز هویت رد شد',
          body: `درخواست احراز هویت شما رد شد. دلیل: ${reason}`,
        },
        request_changes: {
          type: 'kyc_resubmission',
          title: 'نیاز به اصلاح احراز هویت',
          body: `درخواست شما نیاز به اصلاح دارد. دلیل: ${reason}`,
        },
      }[decision]
      await tx.notification.create({
        data: { userId: sub.userId, ...notif, channel: 'IN_APP', status: 'SENT' },
      })
      return s
    })

    await writeAudit({
      actorType: 'admin',
      actorId: adminId,
      action:
        decision === 'approve'
          ? 'KYC_APPROVED'
          : decision === 'reject'
            ? 'KYC_REJECTED'
            : 'KYC_NEEDS_RESUBMISSION',
      entityType: 'kyc_submission',
      entityId: submissionId,
      before: { status: sub.status },
      after: { status: target, reason },
      ...meta,
    })
    return toPublic(updated)
  },
}
