// ============================================
// Zar30 - Admin Fees & Limits Service (Phase 2)
// ============================================
// کارمزدها (قواعد گروهی + override فردی)، محدودیت‌ها (LimitRule) و سطوح KYC
// ============================================

import type { KycLevel, Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import type { AdminLimitListQuery } from '@/lib/validators/admin-commerce'
import type {
  adminFeeRuleSchema,
  adminKycLevelSchema,
  adminLimitRuleSchema,
  adminUserFeeSchema,
} from '@/lib/validators/admin-commerce'
import type { z } from 'zod'

interface AdminActCtx {
  adminId: string
  adminRole: string
}

interface AuditMeta {
  ip?: string
  userAgent?: string
  requestId?: string
}

// ---------- Fee Rules ----------

export interface AdminFeeRuleRow {
  id: string
  name: string
  kind: string
  kycLevel: string | null
  minVolumeToman: string | null
  buyFeeBps: number
  sellFeeBps: number
  priority: number
  active: boolean
  createdAt: string
}

export async function listAdminFeeRules(): Promise<AdminFeeRuleRow[]> {
  const rows = await prisma.feeRule.findMany({
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    kycLevel: r.kycLevel,
    minVolumeToman: r.minVolumeToman?.toString() ?? null,
    buyFeeBps: r.buyFeeBps,
    sellFeeBps: r.sellFeeBps,
    priority: r.priority,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function upsertAdminFeeRule(
  ctx: AdminActCtx,
  input: z.infer<typeof adminFeeRuleSchema>,
  meta: AuditMeta,
  id?: string,
): Promise<{ id: string }> {
  const data = {
    name: input.name,
    kind: input.kind,
    kycLevel: (input.kycLevel ?? null) as KycLevel | null,
    minVolumeToman: input.minVolumeToman ?? null,
    buyFeeBps: input.buyFeeBps,
    sellFeeBps: input.sellFeeBps,
    priority: input.priority,
    active: input.active,
  }
  const row = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.feeRule.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('قانون کارمزد یافت نشد')
    const saved = id
      ? await tx.feeRule.update({ where: { id }, data })
      : await tx.feeRule.create({ data })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: id ? 'fee_rule.update' : 'fee_rule.create',
        entityType: 'fee_rule',
        entityId: saved.id,
        before: before ?? undefined,
        after: { ...data, minVolumeToman: data.minVolumeToman?.toString() },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: row.id }
}

export async function deleteAdminFeeRule(ctx: AdminActCtx, id: string, meta: AuditMeta) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.feeRule.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('قانون کارمزد یافت نشد')
    await tx.feeRule.delete({ where: { id } })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'fee_rule.delete',
        entityType: 'fee_rule',
        entityId: id,
        before,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { id, deleted: true }
}

// ---------- User Fee Overrides ----------

export interface AdminUserFeeRow {
  id: string
  userId: string
  buyFeeBps: number | null
  sellFeeBps: number | null
  note: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

export async function listAdminUserFees(
  page: number,
  limit: number,
  q?: string,
): Promise<{ rows: AdminUserFeeRow[]; total: number }> {
  const where: Prisma.UserFeeOverrideWhereInput = {
    ...(q && {
      OR: [
        { user: { mobile: { contains: q } } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.userFeeOverride.count({ where }),
    prisma.userFeeOverride.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        buyFeeBps: true,
        sellFeeBps: true,
        note: true,
        createdAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      buyFeeBps: r.buyFeeBps,
      sellFeeBps: r.sellFeeBps,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      user: {
        id: r.user.id,
        mobile: r.user.mobile,
        name: [r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || r.user.mobile,
      },
    })),
  }
}

export async function upsertAdminUserFee(
  ctx: AdminActCtx,
  input: z.infer<typeof adminUserFeeSchema>,
  meta: AuditMeta,
): Promise<{ id: string }> {
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } })
  if (!user) throw ApiError.badRequest('کاربر یافت نشد')

  const data = {
    buyFeeBps: input.buyFeeBps ?? null,
    sellFeeBps: input.sellFeeBps ?? null,
    note: input.note ?? null,
    createdBy: ctx.adminId,
  }
  const row = await prisma.$transaction(async (tx) => {
    const before = await tx.userFeeOverride.findUnique({ where: { userId: input.userId } })
    const saved = await tx.userFeeOverride.upsert({
      where: { userId: input.userId },
      update: { buyFeeBps: data.buyFeeBps, sellFeeBps: data.sellFeeBps, note: data.note },
      create: { userId: input.userId, ...data },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: before ? 'user_fee.update' : 'user_fee.create',
        entityType: 'user_fee_override',
        entityId: saved.id,
        targetUserId: input.userId,
        before: before ?? undefined,
        after: data,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: row.id }
}

export async function deleteAdminUserFee(ctx: AdminActCtx, id: string, meta: AuditMeta) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.userFeeOverride.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('override یافت نشد')
    await tx.userFeeOverride.delete({ where: { id } })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'user_fee.delete',
        entityType: 'user_fee_override',
        entityId: id,
        targetUserId: before.userId,
        before,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { id, deleted: true }
}

// ---------- Limit Rules ----------

export interface AdminLimitRuleRow {
  id: string
  scope: string
  kycLevel: string | null
  period: string
  amountToman: string | null
  amountGold: string | null
  active: boolean
  createdAt: string
}

export async function listAdminLimitRules(
  input: AdminLimitListQuery,
): Promise<{ rows: AdminLimitRuleRow[]; total: number }> {
  const where: Prisma.LimitRuleWhereInput = {
    ...(input.scope && { scope: input.scope }),
    ...(input.kycLevel && { kycLevel: input.kycLevel }),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.limitRule.count({ where }),
    prisma.limitRule.findMany({
      where,
      orderBy: [{ scope: 'asc' }, { period: 'asc' }, { createdAt: input.direction }],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      scope: r.scope,
      kycLevel: r.kycLevel,
      period: r.period,
      amountToman: r.amountToman?.toString() ?? null,
      amountGold: r.amountGold?.toString() ?? null,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

export async function upsertAdminLimitRule(
  ctx: AdminActCtx,
  input: z.infer<typeof adminLimitRuleSchema>,
  meta: AuditMeta,
  id?: string,
): Promise<{ id: string }> {
  const data = {
    scope: input.scope,
    kycLevel: (input.kycLevel ?? null) as KycLevel | null,
    period: input.period,
    amountToman: input.amountToman ?? null,
    amountGold: input.amountGold ?? null,
    active: input.active,
  }
  const row = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.limitRule.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('قانون محدودیت یافت نشد')
    const saved = id
      ? await tx.limitRule.update({ where: { id }, data })
      : await tx.limitRule.create({ data })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: id ? 'limit_rule.update' : 'limit_rule.create',
        entityType: 'limit_rule',
        entityId: saved.id,
        before: before
          ? {
              ...before,
              amountToman: before.amountToman?.toString(),
              amountGold: before.amountGold?.toString(),
            }
          : undefined,
        after: {
          ...data,
          amountToman: data.amountToman?.toString(),
          amountGold: data.amountGold?.toString(),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: row.id }
}

export async function deleteAdminLimitRule(ctx: AdminActCtx, id: string, meta: AuditMeta) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.limitRule.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('قانون محدودیت یافت نشد')
    await tx.limitRule.delete({ where: { id } })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'limit_rule.delete',
        entityType: 'limit_rule',
        entityId: id,
        before: {
          scope: before.scope,
          period: before.period,
          amountToman: before.amountToman?.toString(),
          amountGold: before.amountGold?.toString(),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { id, deleted: true }
}

// ---------- KYC Levels ----------

export interface AdminKycLevelRow {
  id: string
  level: string
  name: string
  rank: number
  description: string | null
  usersCount: number
}

export async function listAdminKycLevels(): Promise<AdminKycLevelRow[]> {
  const [configs, counts] = await prisma.$transaction([
    prisma.kycLevelConfig.findMany({ orderBy: { rank: 'asc' } }),
    prisma.user.groupBy({
      by: ['kycLevel'],
      orderBy: { kycLevel: 'asc' },
      _count: { _all: true },
    }),
  ])
  const countByLevel = new Map(
    counts.map((c) => [c.kycLevel, typeof c._count === 'object' ? (c._count._all ?? 0) : 0]),
  )
  const configured = new Set(configs.map((c) => c.level))

  const rows: AdminKycLevelRow[] = configs.map((c) => ({
    id: c.id,
    level: c.level,
    name: c.name,
    rank: c.rank,
    description: c.description,
    usersCount: countByLevel.get(c.level) ?? 0,
  }))

  // سطح‌های بدون پیکربندی هم با نام پیش‌فرض نمایش داده می‌شوند
  const defaults: Record<string, { name: string; rank: number }> = {
    LEVEL_0: { name: 'سطح ۰ — ثبت‌نام', rank: 0 },
    LEVEL_1: { name: 'سطح ۱ — موبایل تایید شده', rank: 1 },
    LEVEL_2: { name: 'سطح ۲ — احراز هویت', rank: 2 },
    LEVEL_3: { name: 'سطح ۳ — کامل', rank: 3 },
  }
  for (const [level, def] of Object.entries(defaults)) {
    if (!configured.has(level as KycLevel)) {
      rows.push({
        id: `virtual:${level}`,
        level,
        name: def.name,
        rank: def.rank,
        description: null,
        usersCount: countByLevel.get(level as KycLevel) ?? 0,
      })
    }
  }
  return rows.sort((a, b) => a.rank - b.rank)
}

export async function upsertAdminKycLevel(
  ctx: AdminActCtx,
  input: z.infer<typeof adminKycLevelSchema>,
  meta: AuditMeta,
): Promise<{ id: string }> {
  const row = await prisma.$transaction(async (tx) => {
    const before = await tx.kycLevelConfig.findUnique({ where: { level: input.level } })
    const saved = await tx.kycLevelConfig.upsert({
      where: { level: input.level },
      update: { name: input.name, rank: input.rank, description: input.description ?? null },
      create: {
        level: input.level,
        name: input.name,
        rank: input.rank,
        description: input.description ?? null,
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: before ? 'kyc_level.update' : 'kyc_level.create',
        entityType: 'kyc_level_config',
        entityId: saved.id,
        before: before ?? undefined,
        after: input,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: row.id }
}
