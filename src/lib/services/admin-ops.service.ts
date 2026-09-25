// ============================================
// Zar30 - Admin Ops Service (Phase 1)
// ============================================
// کارت‌های بانکی (block/unblock/delete)، انتقال‌های داخلی (flag/unflag)،
// پرداخت‌های درگاه و آدرس‌ها — read برای پرداخت/آدرس، mutation برای کارت و انتقال
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import { parseAdminDateBoundary } from '@/lib/utils/admin-time'
import type {
  AdminAddressListQuery,
  AdminBankAccountListQuery,
  AdminPaymentListQuery,
  AdminTransferListQuery,
} from '@/lib/validators/admin-ops'

// ---------- Types ----------

export interface AdminBankAccountRow {
  id: string
  bankCode: string
  bankName: string
  ibanMasked: string
  cardPanMasked: string | null
  isDefault: boolean
  blocked: boolean
  blockNote: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

export interface AdminTransferRow {
  id: string
  kind: string
  assetType: string
  tomanAmount: string | null
  goldAmount: string | null
  giftMessage: string | null
  status: string
  flagged: boolean
  flagReason: string | null
  createdAt: string
  sender: { id: string; mobile: string; name: string }
  recipient: { id: string; mobile: string; name: string }
}

export interface AdminTransferDetail extends AdminTransferRow {
  flagReasonDetail: string | null
  flaggedBy: { id: string; name: string } | null
  flaggedAt: string | null
  journalEntryId: string | null
  audit: AdminAuditRow[]
}

export interface AdminPaymentRow {
  id: string
  gateway: string
  amount: string
  status: string
  authority: string | null
  refId: string | null
  cardPanMasked: string | null
  failureReason: string | null
  verifiedAt: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

export interface AdminPaymentDetail extends AdminPaymentRow {
  description: string | null
  expiresAt: string
  transactionId: string | null
}

export interface AdminAddressRow {
  id: string
  title: string | null
  recipientName: string
  mobile: string
  province: string | null
  city: string | null
  address: string
  postalCode: string
  isDefault: boolean
  createdAt: string
  deliveriesCount: number
  user: { id: string; mobile: string; name: string }
}

interface AdminAuditRow {
  id: string
  action: string
  actorType: string
  actorRole: string | null
  reason: string | null
  createdAt: string
}

export interface AdminActCtx {
  adminId: string
  adminRole: string
}

export interface AuditMeta {
  ip?: string
  userAgent?: string
  requestId?: string
}

// ---------- Helpers ----------

function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, '')
  if (clean.length < 8) return '••••'
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`
}

function maskPan(pan: string | null): string | null {
  if (!pan) return null
  const clean = pan.replace(/\s+/g, '')
  if (clean.length < 10) return '••••'
  return `${clean.slice(0, 6)}••••${clean.slice(-4)}`
}

function serializeUser(u: {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
}) {
  return {
    id: u.id,
    mobile: u.mobile,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.mobile,
  }
}

const userSelect = { id: true, mobile: true, firstName: true, lastName: true } as const

function rangeFilter(from?: string, to?: string) {
  const createdAt: { gte?: Date; lte?: Date } = {}
  if (from) createdAt.gte = parseAdminDateBoundary(from, false)
  if (to) createdAt.lte = parseAdminDateBoundary(to, true)
  return Object.keys(createdAt).length ? { createdAt } : {}
}

async function auditsFor(entityType: string, entityId: string): Promise<AdminAuditRow[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      action: true,
      actorType: true,
      actorRole: true,
      reason: true,
      createdAt: true,
    },
  })
  return rows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))
}

// ---------- Bank Accounts ----------

export async function listAdminBankAccounts(
  input: AdminBankAccountListQuery,
): Promise<{ rows: AdminBankAccountRow[]; total: number }> {
  const where: Prisma.BankAccountWhereInput = {
    ...(input.bankCode && { bankCode: input.bankCode }),
    ...(input.blocked === 'true' && { blockedAt: { not: null } }),
    ...(input.blocked === 'false' && { blockedAt: null }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { iban: { contains: input.q, mode: 'insensitive' } },
        { cardPan: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.bankAccount.count({ where }),
    prisma.bankAccount.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        bankCode: true,
        bankName: true,
        iban: true,
        cardPan: true,
        isDefault: true,
        blockedAt: true,
        blockNote: true,
        createdAt: true,
        user: { select: userSelect },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      bankCode: r.bankCode,
      bankName: r.bankName,
      ibanMasked: maskIban(r.iban),
      cardPanMasked: maskPan(r.cardPan),
      isDefault: r.isDefault,
      blocked: r.blockedAt !== null,
      blockNote: r.blockNote,
      createdAt: r.createdAt.toISOString(),
      user: serializeUser(r.user),
    })),
  }
}

export interface AdminBankAccountDetail extends AdminBankAccountRow {
  iban: string
  cardPan: string | null
  alias: string | null
  audit: AdminAuditRow[]
}

export async function getAdminBankAccount(id: string): Promise<AdminBankAccountDetail | null> {
  const r = await prisma.bankAccount.findUnique({
    where: { id },
    select: {
      id: true,
      bankCode: true,
      bankName: true,
      iban: true,
      cardPan: true,
      alias: true,
      isDefault: true,
      blockedAt: true,
      blockNote: true,
      createdAt: true,
      user: { select: userSelect },
    },
  })
  if (!r) return null
  return {
    id: r.id,
    bankCode: r.bankCode,
    bankName: r.bankName,
    ibanMasked: maskIban(r.iban),
    cardPanMasked: maskPan(r.cardPan),
    // شبه‌عدد کامل فقط در detail و فقط برای نقش manage — audit مسیر بازدید نیست
    iban: r.iban,
    cardPan: r.cardPan,
    alias: r.alias,
    isDefault: r.isDefault,
    blocked: r.blockedAt !== null,
    blockNote: r.blockNote,
    createdAt: r.createdAt.toISOString(),
    user: serializeUser(r.user),
    audit: await auditsFor('bank_account', id),
  }
}

// مسدود/رفع‌مسدودی کارت — audit + fail-safe
export async function setBankAccountBlocked(
  ctx: AdminActCtx,
  id: string,
  blocked: boolean,
  note: string | undefined,
  meta: AuditMeta,
) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; userId: string; blockedAt: Date | null }[]>`
      SELECT id, "user_id" AS "userId", "blocked_at" AS "blockedAt"
      FROM bank_accounts WHERE id::text = ${id} FOR UPDATE
    `
    const row = rows[0]
    if (!row) throw ApiError.notFound('کارت بانکی یافت نشد')
    if (blocked && row.blockedAt) throw ApiError.badRequest('این کارت قبلاً مسدود شده است')
    if (!blocked && !row.blockedAt) throw ApiError.badRequest('این کارت مسدود نیست')

    const updated = await tx.bankAccount.update({
      where: { id },
      data: {
        blockedAt: blocked ? new Date() : null,
        blockNote: blocked ? note! : null,
      },
    })

    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: blocked ? 'bank_account.block' : 'bank_account.unblock',
        entityType: 'bank_account',
        entityId: id,
        targetUserId: row.userId,
        reason: note,
        before: { blockedAt: row.blockedAt?.toISOString() ?? null },
        after: {
          blockedAt: updated.blockedAt?.toISOString() ?? null,
          blockNote: updated.blockNote,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })

    return { id, blocked }
  })
}

// حذف کارت کاربر توسط ادمین — audit کامل
export async function deleteAdminBankAccount(
  ctx: AdminActCtx,
  id: string,
  reason: string,
  meta: AuditMeta,
) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      { id: string; userId: string; iban: string; isDefault: boolean }[]
    >`SELECT id, "user_id" AS "userId", iban, "is_default" AS "isDefault" FROM bank_accounts WHERE id::text = ${id} FOR UPDATE`
    const row = rows[0]
    if (!row) throw ApiError.notFound('کارت بانکی یافت نشد')

    await tx.bankAccount.delete({ where: { id } })

    // اگر پیش‌فرض بود، قدیمی‌ترین کارت پیش‌فرض شود
    if (row.isDefault) {
      const oldest = await tx.bankAccount.findFirst({
        where: { userId: row.userId },
        orderBy: { createdAt: 'asc' },
      })
      if (oldest) {
        await tx.bankAccount.update({ where: { id: oldest.id }, data: { isDefault: true } })
      }
    }

    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'bank_account.delete',
        entityType: 'bank_account',
        entityId: id,
        targetUserId: row.userId,
        reason,
        before: { iban: maskIban(row.iban), isDefault: row.isDefault },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })

    return { id, deleted: true }
  })
}

// ---------- Internal Transfers ----------

export async function listAdminTransfers(
  input: AdminTransferListQuery,
): Promise<{ rows: AdminTransferRow[]; total: number }> {
  const where: Prisma.InternalTransferWhereInput = {
    ...(input.kind && { kind: input.kind }),
    ...(input.assetType && { assetType: input.assetType }),
    ...(input.flagged === 'true' && { flaggedAt: { not: null } }),
    ...(input.flagged === 'false' && { flaggedAt: null }),
    ...rangeFilter(input.from, input.to),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { sender: { mobile: { contains: input.q } } },
        { recipient: { mobile: { contains: input.q } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.internalTransfer.count({ where }),
    prisma.internalTransfer.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        kind: true,
        assetType: true,
        tomanAmount: true,
        goldAmount: true,
        giftMessage: true,
        status: true,
        flaggedAt: true,
        flagReason: true,
        createdAt: true,
        sender: { select: userSelect },
        recipient: { select: userSelect },
      },
    }),
  ])
  return {
    total,
    rows: rows.map(serializeTransfer),
  }
}

function serializeTransfer(r: {
  id: string
  kind: string
  assetType: string
  tomanAmount: bigint | null
  goldAmount: { toString(): string } | null
  giftMessage: string | null
  status: string
  flaggedAt: Date | null
  flagReason: string | null
  createdAt: Date
  sender: { id: string; mobile: string; firstName: string | null; lastName: string | null }
  recipient: { id: string; mobile: string; firstName: string | null; lastName: string | null }
}): AdminTransferRow {
  return {
    id: r.id,
    kind: r.kind,
    assetType: r.assetType,
    tomanAmount: r.tomanAmount?.toString() ?? null,
    goldAmount: r.goldAmount?.toString() ?? null,
    giftMessage: r.giftMessage,
    status: r.status,
    flagged: r.flaggedAt !== null,
    flagReason: r.flagReason,
    createdAt: r.createdAt.toISOString(),
    sender: serializeUser(r.sender),
    recipient: serializeUser(r.recipient),
  }
}

export async function getAdminTransfer(id: string): Promise<AdminTransferDetail | null> {
  const r = await prisma.internalTransfer.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      assetType: true,
      tomanAmount: true,
      goldAmount: true,
      giftMessage: true,
      status: true,
      flaggedAt: true,
      flagReason: true,
      flaggedBy: true,
      journalEntryId: true,
      createdAt: true,
      sender: { select: userSelect },
      recipient: { select: userSelect },
    },
  })
  if (!r) return null

  let flaggerName: { id: string; name: string } | null = null
  if (r.flaggedBy) {
    const admin = await prisma.adminUser.findUnique({
      where: { id: r.flaggedBy },
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
    })
    if (admin) {
      flaggerName = {
        id: admin.id,
        name: [admin.user.firstName, admin.user.lastName].filter(Boolean).join(' ') || admin.id,
      }
    }
  }

  return {
    ...serializeTransfer(r),
    flagReasonDetail: r.flagReason,
    flaggedBy: flaggerName,
    flaggedAt: r.flaggedAt?.toISOString() ?? null,
    journalEntryId: r.journalEntryId,
    audit: await auditsFor('internal_transfer', id),
  }
}

// پرچم تقلب روی انتقال — فقط علامت‌گذاری، برگشت مالی جداست
export async function setTransferFlag(
  ctx: AdminActCtx,
  id: string,
  flagged: boolean,
  reason: string | undefined,
  meta: AuditMeta,
) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; flaggedAt: Date | null }[]>`
      SELECT id, "flagged_at" AS "flaggedAt" FROM internal_transfers WHERE id::text = ${id} FOR UPDATE
    `
    const row = rows[0]
    if (!row) throw ApiError.notFound('انتقال یافت نشد')
    if (flagged && row.flaggedAt) throw ApiError.badRequest('این انتقال قبلاً پرچم‌دار است')
    if (!flagged && !row.flaggedAt) throw ApiError.badRequest('این انتقال پرچم‌دار نیست')

    await tx.internalTransfer.update({
      where: { id },
      data: {
        flaggedAt: flagged ? new Date() : null,
        flagReason: flagged ? reason! : null,
        flaggedBy: flagged ? ctx.adminId : null,
      },
    })

    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: flagged ? 'transfer.flag' : 'transfer.unflag',
        entityType: 'internal_transfer',
        entityId: id,
        reason,
        before: { flaggedAt: row.flaggedAt?.toISOString() ?? null },
        after: { flagged },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })

    return { id, flagged }
  })
}

// ---------- Payments (درگاه) ----------

export async function listAdminPayments(
  input: AdminPaymentListQuery,
): Promise<{ rows: AdminPaymentRow[]; total: number }> {
  const where: Prisma.PaymentWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.gateway && { gateway: { contains: input.gateway, mode: 'insensitive' } }),
    ...rangeFilter(input.from, input.to),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { authority: { contains: input.q, mode: 'insensitive' } },
        { refId: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        gateway: true,
        amount: true,
        status: true,
        authority: true,
        refId: true,
        cardPan: true,
        failureReason: true,
        verifiedAt: true,
        createdAt: true,
        user: { select: userSelect },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      gateway: r.gateway,
      amount: r.amount.toString(),
      status: r.status,
      authority: r.authority,
      refId: r.refId,
      cardPanMasked: maskPan(r.cardPan),
      failureReason: r.failureReason,
      verifiedAt: r.verifiedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      user: serializeUser(r.user),
    })),
  }
}

export async function getAdminPayment(id: string): Promise<AdminPaymentDetail | null> {
  const r = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      gateway: true,
      amount: true,
      status: true,
      authority: true,
      refId: true,
      cardPan: true,
      description: true,
      failureReason: true,
      verifiedAt: true,
      expiresAt: true,
      createdAt: true,
      transactionId: true,
      user: { select: userSelect },
    },
  })
  if (!r) return null
  return {
    id: r.id,
    gateway: r.gateway,
    amount: r.amount.toString(),
    status: r.status,
    authority: r.authority,
    refId: r.refId,
    cardPanMasked: maskPan(r.cardPan),
    failureReason: r.failureReason,
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    description: r.description,
    expiresAt: r.expiresAt.toISOString(),
    transactionId: r.transactionId,
    createdAt: r.createdAt.toISOString(),
    user: serializeUser(r.user),
  }
}

// ---------- Addresses (read-only) ----------

export async function listAdminAddresses(
  input: AdminAddressListQuery,
): Promise<{ rows: AdminAddressRow[]; total: number }> {
  const where: Prisma.AddressWhereInput = {
    ...(input.province && { province: { contains: input.province, mode: 'insensitive' } }),
    ...(input.q && {
      OR: [
        { recipientName: { contains: input.q, mode: 'insensitive' } },
        { mobile: { contains: input.q } },
        { postalCode: { contains: input.q } },
        { user: { mobile: { contains: input.q } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.address.count({ where }),
    prisma.address.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        title: true,
        recipientName: true,
        mobile: true,
        province: true,
        city: true,
        address: true,
        postalCode: true,
        isDefault: true,
        createdAt: true,
        user: { select: userSelect },
        _count: { select: { deliveryRequests: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      recipientName: r.recipientName,
      mobile: r.mobile,
      province: r.province,
      city: r.city,
      address: r.address,
      postalCode: r.postalCode,
      isDefault: r.isDefault,
      createdAt: r.createdAt.toISOString(),
      deliveriesCount: r._count.deliveryRequests,
      user: serializeUser(r.user),
    })),
  }
}
