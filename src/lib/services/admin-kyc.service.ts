// ============================================
// Zar30 - Admin KYC Service
// ============================================
// لیست/جزئیات پرونده‌های KYC برای مرکز عملیات
// داده بانکی: فقط masked + completion flag — ciphertext/plaintext هرگز برنمی‌گردد
// ============================================

import type { KycLevel, KycStatus, Prisma, UserStatus } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { kycBankPresentation, type KycBankPresentation } from '@/lib/kyc/presentation'
import type { AdminKycListQuery } from '@/lib/validators/admin'

export interface AdminKycListRow {
  id: string
  status: KycStatus
  level: KycLevel
  submittedAt: string | null
  reviewedAt: string | null
  createdAt: string
  applicant: {
    id: string
    mobile: string
    firstName: string | null
    lastName: string | null
  }
  reviewer: { id: string; firstName: string | null; lastName: string | null } | null
  documentsCount: number
}

export interface AdminKycDetail {
  id: string
  status: KycStatus
  level: KycLevel
  currentStep: number
  firstName: string | null
  lastName: string | null
  nationalCode: string | null
  shenasnamehNo: string | null
  birthDate: string | null
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    mobile: string
    firstName: string | null
    lastName: string | null
    kycLevel: KycLevel
    status: UserStatus
  }
  reviewer: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
  documents: {
    id: string
    kind: string
    fileName: string
    mimeType: string
    sizeBytes: number
    createdAt: string
  }[]
  bank: KycBankPresentation
}

export async function listAdminKyc(
  input: AdminKycListQuery,
): Promise<{ rows: AdminKycListRow[]; total: number }> {
  const where = {
    ...(input.status && { status: input.status }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' as const } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' as const } } },
        { user: { firstName: { contains: input.q, mode: 'insensitive' as const } } },
        { user: { lastName: { contains: input.q, mode: 'insensitive' as const } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  // فیلدهای nullable (submittedAt/reviewedAt) همیشه nulls-last مرتب می‌شوند
  const orderBy: Prisma.KycSubmissionOrderByWithRelationInput =
    input.sortBy === 'createdAt'
      ? { createdAt: input.direction }
      : { [input.sortBy]: { sort: input.direction, nulls: 'last' } }

  const [total, rows] = await prisma.$transaction([
    prisma.kycSubmission.count({ where }),
    prisma.kycSubmission.findMany({
      where,
      orderBy,
      skip,
      take: input.limit,
      select: {
        id: true,
        status: true,
        level: true,
        submittedAt: true,
        reviewedAt: true,
        createdAt: true,
        user: {
          select: { id: true, mobile: true, firstName: true, lastName: true },
        },
        reviewer: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { documents: true } },
      },
    }),
  ])

  return {
    total,
    rows: rows.map((s) => ({
      id: s.id,
      status: s.status,
      level: s.level,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      reviewedAt: s.reviewedAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
      applicant: s.user,
      reviewer: s.reviewer
        ? {
            id: s.reviewer.id,
            firstName: s.reviewer.user.firstName,
            lastName: s.reviewer.user.lastName,
          }
        : null,
      documentsCount: s._count.documents,
    })),
  }
}

export async function getAdminKycDetail(id: string): Promise<AdminKycDetail> {
  const s = await prisma.kycSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      level: true,
      currentStep: true,
      firstName: true,
      lastName: true,
      nationalCode: true,
      shenasnamehNo: true,
      birthDate: true,
      submittedAt: true,
      reviewedAt: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
      cardNumberEnc: true,
      ibanEnc: true,
      user: {
        select: {
          id: true,
          mobile: true,
          firstName: true,
          lastName: true,
          kycLevel: true,
          status: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      documents: {
        select: {
          id: true,
          kind: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!s) throw ApiError.notFound('پرونده احراز هویت یافت نشد')

  return {
    id: s.id,
    status: s.status,
    level: s.level,
    currentStep: s.currentStep,
    firstName: s.firstName,
    lastName: s.lastName,
    nationalCode: s.nationalCode,
    shenasnamehNo: s.shenasnamehNo,
    birthDate: s.birthDate?.toISOString() ?? null,
    submittedAt: s.submittedAt?.toISOString() ?? null,
    reviewedAt: s.reviewedAt?.toISOString() ?? null,
    rejectionReason: s.rejectionReason,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    user: s.user,
    reviewer: s.reviewer
      ? {
          id: s.reviewer.id,
          firstName: s.reviewer.user.firstName,
          lastName: s.reviewer.user.lastName,
        }
      : null,
    // storageKey و sha256 عمداً در select نیستند — مسیر داخلی و اثرانگشت لو نمی‌رود
    documents: s.documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      createdAt: d.createdAt.toISOString(),
    })),
    // فقط masked + completion — بدون ciphertext
    bank: kycBankPresentation(s.cardNumberEnc, s.ibanEnc),
  }
}
