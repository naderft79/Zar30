// ============================================
// Zar30 - Admin Risk Service (Phase 4)
// ============================================
// ارزیابی قوانین ریسک پویا → ثبت RiskEvent — dedupe per user+rule+window
// جمع‌بندی امتیاز کاربر = مجموع score رویدادهای باز (بررسی‌نشده + ۳۰ روز اخیر)
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'
import { toAuditData } from '@/lib/audit/audit'
import type { AdminRiskEventsQuery, AdminFraudQuery } from '@/lib/validators/admin-risk'
import type { adminRiskRuleSchema } from '@/lib/validators/admin-risk'
import type { z } from 'zod'
import { Decimal } from '@/lib/finance/money'
import { formatGoldAmount } from '@/lib/utils/format'

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

// ---------- Risk Rules CRUD ----------

export interface AdminRiskRuleRow {
  id: string
  name: string
  metric: string
  threshold: string
  windowHours: number
  scoreWeight: number
  active: boolean
  eventsCount: number
  createdAt: string
}

export async function listAdminRiskRules(): Promise<AdminRiskRuleRow[]> {
  const rows = await prisma.riskRule.findMany({
    orderBy: [{ active: 'desc' }, { scoreWeight: 'desc' }],
    include: { _count: { select: { events: true } } },
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric,
    threshold: r.threshold.toString(),
    windowHours: r.windowHours,
    scoreWeight: r.scoreWeight,
    active: r.active,
    eventsCount: r._count.events,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function upsertAdminRiskRule(
  ctx: AdminActCtx,
  input: z.infer<typeof adminRiskRuleSchema>,
  meta: AuditMeta,
  id?: string,
): Promise<{ id: string }> {
  const data = {
    name: input.name,
    metric: input.metric,
    threshold: new Decimal(input.threshold),
    windowHours: input.windowHours,
    scoreWeight: input.scoreWeight,
    active: input.active,
  }
  const result = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.riskRule.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('قانون ریسک یافت نشد')
    const row = id
      ? await tx.riskRule.update({ where: { id }, data })
      : await tx.riskRule.create({ data })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: id ? 'risk_rule.update' : 'risk_rule.create',
        entityType: 'risk_rule',
        entityId: row.id,
        before: before
          ? { name: before.name, metric: before.metric, threshold: before.threshold.toString() }
          : undefined,
        after: { ...data, threshold: data.threshold.toString() },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return row
  })
  return { id: result.id }
}

export async function deleteAdminRiskRule(ctx: AdminActCtx, id: string, meta: AuditMeta) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.riskRule.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('قانون ریسک یافت نشد')
    await tx.riskRule.delete({ where: { id } })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'risk_rule.delete',
        entityType: 'risk_rule',
        entityId: id,
        before: { name: before.name, metric: before.metric },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })
  return { id, deleted: true }
}

// ---------- Risk Evaluation ----------

// مقدار یک متریک برای یک کاربر در بازه زمانی — همه‌ی aggregateها دقیق و سمت DB
async function metricValue(metric: string, userId: string, since: Date): Promise<Decimal> {
  switch (metric) {
    case 'WITHDRAW_SUM': {
      const r = await prisma.withdrawalRequest.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED', 'PAID'] },
          createdAt: { gte: since },
        },
      })
      return new Decimal((r._sum.amount ?? 0n).toString())
    }
    case 'TRADE_SUM': {
      const r = await prisma.order.aggregate({
        _sum: { total: true },
        where: { userId, status: 'FILLED', createdAt: { gte: since } },
      })
      return new Decimal((r._sum.total ?? 0n).toString())
    }
    case 'TRANSFER_COUNT': {
      const n = await prisma.internalTransfer.count({
        where: { senderId: userId, createdAt: { gte: since } },
      })
      return new Decimal(n)
    }
    case 'TRANSFER_GOLD': {
      const r = await prisma.internalTransfer.aggregate({
        _sum: { goldAmount: true },
        where: { senderId: userId, createdAt: { gte: since } },
      })
      return new Decimal(r._sum.goldAmount ?? 0)
    }
    case 'FAILED_PAYMENTS': {
      const n = await prisma.payment.count({
        where: { userId, status: 'FAILED', createdAt: { gte: since } },
      })
      return new Decimal(n)
    }
    case 'FLAGGED_TRANSFERS': {
      const n = await prisma.internalTransfer.count({
        where: { senderId: userId, flaggedAt: { not: null } },
      })
      return new Decimal(n)
    }
    case 'BLOCKED_CARDS': {
      const n = await prisma.bankAccount.count({
        where: { userId, blockedAt: { not: null } },
      })
      return new Decimal(n)
    }
    case 'LOGIN_IP_CHANGES': {
      const logs = await prisma.auditLog.findMany({
        where: {
          actorId: userId,
          action: 'USER_LOGIN',
          createdAt: { gte: since },
          ip: { not: null },
        },
        select: { ip: true },
        take: 500,
      })
      return new Decimal(new Set(logs.map((l) => l.ip)).size)
    }
    default:
      return new Decimal(0)
  }
}

// ارزیابی قوانین فعال برای یک کاربر — رویدادهای تکراری در همان بازه ثبت نمی‌شوند
export async function evaluateUserRisk(userId: string): Promise<{ eventsCreated: number }> {
  const rules = await prisma.riskRule.findMany({ where: { active: true } })
  let created = 0
  for (const rule of rules) {
    const since = new Date(Date.now() - rule.windowHours * 60 * 60 * 1000)
    // dedupe: اگر در همین بازه برای این قانون رویداد ثبت شده، دوباره نثبت
    const dup = await prisma.riskEvent.findFirst({
      where: { userId, ruleId: rule.id, createdAt: { gte: since } },
      select: { id: true },
    })
    if (dup) continue
    const value = await metricValue(rule.metric, userId, since)
    if (value.gt(rule.threshold)) {
      await prisma.riskEvent.create({
        data: {
          userId,
          ruleId: rule.id,
          metric: rule.metric,
          score: rule.scoreWeight,
          detail: {
            value: value.toString(),
            threshold: rule.threshold.toString(),
            windowHours: rule.windowHours,
          },
        },
      })
      created += 1
    }
  }
  return { eventsCreated: created }
}

// ارزیابی غیربلوکی پس از عملیات مالی — خطا هرگز نباید عملیات موفق را خراب کند
export function triggerRiskEvaluation(userId: string): void {
  void evaluateUserRisk(userId).catch((err) =>
    logger.error({ err, userId }, 'Risk evaluation failed'),
  )
}

// اسکن دسته‌ای — کاربران با فعالیت اخیر (۲۴h)
export async function runAdminRiskScan(
  ctx: AdminActCtx,
  meta: AuditMeta,
): Promise<{ scanned: number; eventsCreated: number }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [orderUsers, transferUsers, withdrawalUsers] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.internalTransfer.findMany({
      where: { createdAt: { gte: since } },
      select: { senderId: true },
      distinct: ['senderId'],
    }),
    prisma.withdrawalRequest.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ])
  const userIds = [
    ...new Set([
      ...orderUsers.map((u) => u.userId),
      ...transferUsers.map((u) => u.senderId),
      ...withdrawalUsers.map((u) => u.userId),
    ]),
  ].slice(0, 200)

  let eventsCreated = 0
  for (const userId of userIds) {
    const r = await evaluateUserRisk(userId)
    eventsCreated += r.eventsCreated
  }

  await prisma.auditLog.create({
    data: toAuditData({
      actorType: 'admin',
      actorId: ctx.adminId,
      actorRole: ctx.adminRole,
      action: 'risk.scan',
      entityType: 'risk_scan',
      entityId: undefined,
      after: { scanned: userIds.length, eventsCreated },
      ip: meta.ip,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    }),
  })

  return { scanned: userIds.length, eventsCreated }
}

// ---------- Risk Events ----------

export interface AdminRiskEventRow {
  id: string
  metric: string
  score: number
  detail: Record<string, string> | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  ruleName: string | null
  user: { id: string; mobile: string; name: string } | null
  userScore: number
}

export async function listAdminRiskEvents(
  input: AdminRiskEventsQuery,
): Promise<{ rows: AdminRiskEventRow[]; total: number }> {
  const where: Prisma.RiskEventWhereInput = {
    ...(input.status === 'open' && { reviewedAt: null }),
    ...(input.status === 'reviewed' && { reviewedAt: { not: null } }),
    ...(input.minScore != null && { score: { gte: input.minScore } }),
    ...(input.q && { user: { mobile: { contains: input.q } } }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.riskEvent.count({ where }),
    prisma.riskEvent.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      include: {
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
        rule: { select: { name: true } },
      },
    }),
  ])

  // امتیاز تجمیعی هر کاربر — رویدادهای ۳۰ روز اخیر
  const userIds = [...new Set(rows.map((r) => r.userId))]
  const scoreSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const scores = userIds.length
    ? await prisma.riskEvent.groupBy({
        by: ['userId'],
        orderBy: { userId: 'asc' },
        where: { userId: { in: userIds }, createdAt: { gte: scoreSince } },
        _sum: { score: true },
      })
    : []
  const scoreByUser = new Map(scores.map((s) => [s.userId, s._sum.score ?? 0]))

  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      metric: r.metric,
      score: r.score,
      detail: (r.detail as Record<string, string> | null) ?? null,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      reviewNote: r.reviewNote,
      createdAt: r.createdAt.toISOString(),
      ruleName: r.rule?.name ?? null,
      user: r.user ? serializeUser(r.user) : null,
      userScore: scoreByUser.get(r.userId) ?? 0,
    })),
  }
}

export async function reviewAdminRiskEvent(
  ctx: AdminActCtx,
  id: string,
  note: string | undefined,
  meta: AuditMeta,
) {
  const event = await prisma.$transaction(async (tx) => {
    const before = await tx.riskEvent.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('رویداد ریسک یافت نشد')
    if (before.reviewedAt) throw ApiError.badRequest('این رویداد قبلاً بررسی شده است')
    const saved = await tx.riskEvent.update({
      where: { id },
      data: { reviewedAt: new Date(), reviewedBy: ctx.adminId, reviewNote: note ?? null },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'risk_event.review',
        entityType: 'risk_event',
        entityId: id,
        targetUserId: before.userId,
        before: { metric: before.metric, score: before.score },
        after: { note },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return saved
  })
  return { id: event.id, reviewed: true }
}

// ---------- Fraud Signals ----------

// فید ترکیبی تقلب: انتقال‌های پرچم‌دار + کارت‌های مسدود + رویدادهای باز با امتیاز بالا
export async function listAdminFraudSignals(input: AdminFraudQuery) {
  const skip = (input.page - 1) * input.limit
  const userMatch = input.q
    ? {
        OR: [
          { mobile: { contains: input.q } },
          { firstName: { contains: input.q, mode: 'insensitive' as const } },
          { lastName: { contains: input.q, mode: 'insensitive' as const } },
        ],
      }
    : undefined

  const [flaggedTransfers, blockedCards] = await Promise.all([
    prisma.internalTransfer.findMany({
      where: { flaggedAt: { not: null }, ...(userMatch && { sender: userMatch }) },
      orderBy: { flaggedAt: input.direction },
      take: 50,
      include: {
        sender: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
    prisma.bankAccount.findMany({
      where: { blockedAt: { not: null }, ...(userMatch && { user: userMatch }) },
      orderBy: { blockedAt: input.direction },
      take: 50,
      include: {
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
  ])

  const signals = [
    ...flaggedTransfers.map((t) => ({
      id: `flag-${t.id}`,
      kind: 'FLAGGED_TRANSFER' as const,
      user: serializeUser(t.sender),
      label: `انتقال پرچم‌دار ${t.goldAmount ? `${formatGoldAmount(t.goldAmount.toString())} گرم` : `${t.tomanAmount?.toString() ?? '0'} تومان`}`,
      detail: t.flagReason ?? 'بدون دلیل ثبت‌شده',
      at: (t.flaggedAt ?? t.createdAt).toISOString(),
      href: `/admin/transfers/${t.id}`,
    })),
    ...blockedCards.map((b) => ({
      id: `card-${b.id}`,
      kind: 'BLOCKED_CARD' as const,
      user: serializeUser(b.user),
      label: `کارت مسدود — ${b.bankName}`,
      detail: b.blockNote ?? 'بدون یادداشت',
      at: (b.blockedAt ?? b.createdAt).toISOString(),
      href: `/admin/bank-accounts/${b.id}`,
    })),
  ]
    .sort((a, b) =>
      input.direction === 'desc' ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at),
    )
    .slice(skip, skip + input.limit)

  return { rows: signals, total: flaggedTransfers.length + blockedCards.length }
}
