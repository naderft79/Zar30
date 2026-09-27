// ============================================
// Zar30 - /api/v1/admin/investments/plans
// ============================================
// مدیریت طرح‌های سوددهی زرکار — GET/POST/PUT
// permissions: investments.read / investments.manage — strict audit
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta, parseBody } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { z } from 'zod'
import { ApiError } from '@/lib/errors/api-error'
import { writeAuditStrict } from '@/lib/audit/audit'
import { toJsonSafe } from '@/lib/finance/money'
import prisma from '@/lib/db/prisma'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.INVESTMENTS_READ)
  const plans = await prisma.investmentPlan.findMany({ orderBy: { durationDays: 'asc' } })
  return ok({
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      durationDays: p.durationDays,
      minGoldGram: p.minGoldGram.toString(),
      rate: p.rate.toString(),
      active: p.active,
    })),
  })
})

const planSchema = z.object({
  name: z.string().min(2).max(80),
  durationDays: z.number().int().min(7).max(3650),
  minGoldGram: z.string().regex(/^\d+(\.\d{1,8})?$/, 'minGoldGram باید عدد مثبت باشد'),
  // نرخ کل سود در کل مدت طرح (درصد) — نه سالانه
  rate: z.number().min(0).max(100),
  // نوع نرخ — FIXED ثابت است؛ VARIABLE برای شاخص‌گذاری آینده
  interestRateType: z.enum(['FIXED', 'VARIABLE']).default('FIXED'),
})

const updateSchema = planSchema.partial().extend({
  id: z.string().min(1),
  active: z.boolean().optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.INVESTMENTS_MANAGE)
  const input = await parseBody(req, planSchema)

  const plan = await prisma.investmentPlan.create({
    data: {
      name: input.name,
      durationDays: input.durationDays,
      minGoldGram: input.minGoldGram,
      rate: input.rate,
      interestRateType: input.interestRateType,
    },
  })

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'investment.plan_create',
    entityType: 'investment_plan',
    entityId: plan.id,
    after: toJsonSafe(input),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  return created({ id: plan.id })
})

export const PUT = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.INVESTMENTS_MANAGE)
  const input = await parseBody(req, updateSchema)
  const { id, ...rest } = input

  const before = await prisma.investmentPlan.findUnique({ where: { id } })
  if (!before) throw ApiError.notFound('طرح یافت نشد')

  const data: Record<string, unknown> = {}
  if (rest.name !== undefined) data.name = rest.name
  if (rest.durationDays !== undefined) data.durationDays = rest.durationDays
  if (rest.minGoldGram !== undefined) data.minGoldGram = rest.minGoldGram
  if (rest.rate !== undefined) data.rate = rest.rate
  if (rest.active !== undefined) data.active = rest.active

  const plan = await prisma.investmentPlan.update({ where: { id }, data })

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'investment.plan_update',
    entityType: 'investment_plan',
    entityId: id,
    before: { name: before.name, rate: before.rate.toString(), active: before.active },
    after: toJsonSafe(data as Record<string, unknown>),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  return ok({ id: plan.id })
})
