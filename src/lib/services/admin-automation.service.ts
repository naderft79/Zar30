// ============================================
// Zar30 - Admin Automation Service (Phase 3)
// ============================================
// SIP (خرید خودکار)، هشدارهای قیمت، رویدادهای امنیتی، Rate Limit Config
// همه mutationها audit log + در صورت لزوم اعلان به کاربر دارند
// ============================================

import type { Prisma, RateLimitScope } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import { notifyFinancial } from '@/lib/finance/notify'
import { formatToman } from '@/lib/utils/utils'
import type {
  AdminAlertListQuery,
  AdminSecurityEventsQuery,
  AdminSipListQuery,
} from '@/lib/validators/admin-automation'
import type { adminRateLimitSchema } from '@/lib/validators/admin-automation'
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

// ---------- Savings Plans (SIP) ----------

export interface AdminSipRow {
  id: string
  tomanAmount: string
  frequency: string
  nextRunAt: string
  lastRunAt: string | null
  lastError: string | null
  consecutiveFailures: number
  active: boolean
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

export async function listAdminSavingsPlans(
  input: AdminSipListQuery,
): Promise<{ rows: AdminSipRow[]; total: number }> {
  const where: Prisma.RecurringBuyPlanWhereInput = {
    ...(input.frequency && { frequency: input.frequency }),
    ...(input.status === 'active' && { active: true, consecutiveFailures: 0 }),
    ...(input.status === 'paused' && { active: false }),
    ...(input.status === 'failing' && { consecutiveFailures: { gt: 0 } }),
    ...(input.q && {
      OR: [
        { user: { mobile: { contains: input.q } } },
        { user: { firstName: { contains: input.q, mode: 'insensitive' } } },
        { user: { lastName: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.recurringBuyPlan.count({ where }),
    prisma.recurringBuyPlan.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      include: {
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((p) => ({
      id: p.id,
      tomanAmount: p.tomanAmount.toString(),
      frequency: p.frequency,
      nextRunAt: p.nextRunAt.toISOString(),
      lastRunAt: p.lastRunAt?.toISOString() ?? null,
      lastError: p.lastError,
      consecutiveFailures: p.consecutiveFailures,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
      user: serializeUser(p.user),
    })),
  }
}

export async function setAdminSavingsPlanActive(
  ctx: AdminActCtx,
  id: string,
  active: boolean,
  meta: AuditMeta,
  reason?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const plan = await tx.recurringBuyPlan.findUnique({ where: { id } })
    if (!plan) throw ApiError.notFound('طرح خرید خودکار یافت نشد')

    const saved = await tx.recurringBuyPlan.update({
      where: { id },
      data: {
        active,
        // فعال‌سازی توسط ادمین شمارنده شکست را صفر می‌کند
        ...(active ? { consecutiveFailures: 0, lastError: null } : {}),
      },
    })

    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: active ? 'savings_plan.resume' : 'savings_plan.pause',
        entityType: 'recurring_buy_plan',
        entityId: id,
        targetUserId: plan.userId,
        before: { active: plan.active, consecutiveFailures: plan.consecutiveFailures },
        after: { active, reason },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return { plan, saved }
  })

  // اعلان بعد از commit — fire-and-forget
  notifyFinancial(
    result.plan.userId,
    active ? 'PLAN_RESUMED' : 'PLAN_PAUSED',
    active ? 'فعال‌سازی خرید خودکار' : 'توقف خرید خودکار',
    active
      ? `طرح خرید خودکار ${formatToman(result.plan.tomanAmount)} تومانی شما توسط پشتیبانی فعال شد.`
      : `طرح خرید خودکار ${formatToman(result.plan.tomanAmount)} تومانی شما توسط پشتیبانی متوقف شد.${reason ? ` دلیل: ${reason}` : ''}`,
    { planId: id },
  )

  return { id, active: result.saved.active }
}

// ---------- Price Alerts ----------

export interface AdminAlertRow {
  id: string
  targetPrice: string
  direction: string
  active: boolean
  triggeredAt: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

export async function listAdminPriceAlerts(
  input: AdminAlertListQuery,
): Promise<{ rows: AdminAlertRow[]; total: number }> {
  const where: Prisma.PriceAlertWhereInput = {
    ...(input.alertDirection && { direction: input.alertDirection }),
    ...(input.status === 'active' && { active: true, triggeredAt: null }),
    ...(input.status === 'triggered' && { triggeredAt: { not: null } }),
    ...(input.status === 'inactive' && { active: false }),
    ...(input.q && {
      OR: [
        { user: { mobile: { contains: input.q } } },
        { user: { firstName: { contains: input.q, mode: 'insensitive' } } },
        { user: { lastName: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.priceAlert.count({ where }),
    prisma.priceAlert.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      include: {
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((a) => ({
      id: a.id,
      targetPrice: a.targetPrice.toString(),
      direction: a.direction,
      active: a.active,
      triggeredAt: a.triggeredAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      user: serializeUser(a.user),
    })),
  }
}

// ---------- Security Events ----------

// اکشن‌های امنیتی در audit_logs — منبع واحد برای صفحه امنیت ادمین
export const SECURITY_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_REGISTERED',
  'MOBILE_VERIFIED',
  'SESSION_REVOKE',
  'SESSION_REVOKE_ALL',
  'SESSION_REVOKE_OTHERS',
  'SECURITY_PASSWORD_CHANGED',
  'SECURITY_PASSWORD_RESET',
  'SECURITY_SESSION_REUSE',
  'SECURITY_SESSION_REVOKED',
] as const

export interface AdminSecurityEventRow {
  id: string
  action: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string } | null
}

export async function listAdminSecurityEvents(
  input: AdminSecurityEventsQuery,
): Promise<{ rows: AdminSecurityEventRow[]; total: number }> {
  const where: Prisma.AuditLogWhereInput = {
    action: input.action ?? { in: [...SECURITY_ACTIONS] },
    ...(input.q && {
      OR: [{ ip: { contains: input.q } }, { action: { contains: input.q, mode: 'insensitive' } }],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        action: true,
        actorId: true,
        ip: true,
        userAgent: true,
        createdAt: true,
      },
    }),
  ])

  // actorId کاربر را به اطلاعات کاربر وصل می‌کنیم
  const userIds = [...new Set(rows.map((r) => r.actorId).filter(Boolean))] as string[]
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, mobile: true, firstName: true, lastName: true },
      })
    : []
  const byId = new Map(users.map((u) => [u.id, serializeUser(u)]))

  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      action: r.action,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
      user: r.actorId ? (byId.get(r.actorId) ?? null) : null,
    })),
  }
}

// ---------- Rate Limit Config ----------

export interface AdminRateLimitRow {
  id: string
  key: string
  limit: number
  windowSeconds: number
  scope: string
  active: boolean
  updatedAt: string
}

export async function listAdminRateLimits(): Promise<AdminRateLimitRow[]> {
  const rows = await prisma.rateLimitConfig.findMany({ orderBy: { key: 'asc' } })
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    limit: r.limit,
    windowSeconds: r.windowSeconds,
    scope: r.scope,
    active: r.active,
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function upsertAdminRateLimit(
  ctx: AdminActCtx,
  input: z.infer<typeof adminRateLimitSchema>,
  meta: AuditMeta,
  id?: string,
): Promise<{ id: string }> {
  const data = {
    key: input.key,
    limit: input.limit,
    windowSeconds: input.windowSeconds,
    scope: input.scope as RateLimitScope,
    active: input.active,
  }
  const result = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.rateLimitConfig.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('قانون rate limit یافت نشد')
    // در ایجاد، تکراری بودن key جلوگیری می‌شود
    if (!id) {
      const dup = await tx.rateLimitConfig.findUnique({ where: { key: data.key } })
      if (dup) throw ApiError.badRequest('این key از قبل وجود دارد')
    }
    const row = id
      ? await tx.rateLimitConfig.update({ where: { id }, data })
      : await tx.rateLimitConfig.create({ data })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: id ? 'ratelimit.update' : 'ratelimit.create',
        entityType: 'rate_limit_config',
        entityId: row.id,
        before: before ?? undefined,
        after: data,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return row
  })
  return { id: result.id }
}

export async function deleteAdminRateLimit(ctx: AdminActCtx, id: string, meta: AuditMeta) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.rateLimitConfig.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('قانون rate limit یافت نشد')
    await tx.rateLimitConfig.delete({ where: { id } })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'ratelimit.delete',
        entityType: 'rate_limit_config',
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
