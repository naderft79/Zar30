// ============================================
// Zar30 - /api/v1/admin/installments/plans
// ============================================
// GET  → لیست همه طرح‌ها — installments.read
// POST → ایجاد طرح — installments.manage
// PUT  → ویرایش/فعال/غیرفعال — installments.manage — strict audit
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
  await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_READ)
  const plans = await prisma.installmentPlan.findMany({ orderBy: { months: 'asc' } })
  return ok({
    plans: plans.map((p) => ({
      ...p,
      downPaymentPercent: p.downPaymentPercent.toString(),
      interestRate: p.interestRate.toString(),
      fee: p.fee.toString(),
      minAmount: p.minAmount.toString(),
      maxAmount: p.maxAmount.toString(),
      serviceFeePer10M: p.serviceFeePer10M.toString(),
    })),
  })
})

const planSchema = z.object({
  name: z.string().min(2).max(80),
  months: z.number().int().min(1).max(60),
  downPaymentPercent: z.number().min(0).max(90),
  interestRate: z.number().min(0).max(100),
  fee: z.number().min(0).max(100),
  minAmount: z.string().regex(/^\d+$/, 'minAmount باید عدد باشد'),
  maxAmount: z.string().regex(/^\d+$/, 'maxAmount باید عدد باشد'),
  /** هزینه خدمات به ازای هر ۱۰ میلیون تومان — تومان */
  serviceFeePer10M: z.string().regex(/^\d+$/, 'serviceFeePer10M باید عدد باشد'),
})

const updateSchema = planSchema.partial().extend({
  id: z.string().min(1),
  active: z.boolean().optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_MANAGE)
  const input = await parseBody(req, planSchema)
  if (BigInt(input.minAmount) > BigInt(input.maxAmount)) {
    throw ApiError.badRequest('minAmount نمی‌تواند بزرگ‌تر از maxAmount باشد')
  }

  const plan = await prisma.installmentPlan.create({
    data: {
      name: input.name,
      months: input.months,
      downPaymentPercent: input.downPaymentPercent,
      interestRate: input.interestRate,
      fee: input.fee,
      minAmount: BigInt(input.minAmount),
      maxAmount: BigInt(input.maxAmount),
      serviceFeePer10M: BigInt(input.serviceFeePer10M),
    },
  })

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'installment.plan_create',
    entityType: 'installment_plan',
    entityId: plan.id,
    after: toJsonSafe(input),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  return created({ id: plan.id })
})

export const PUT = withErrorHandler(async (req: Request) => {
  const admin = await requireAdminPermission(req, PERMISSIONS.INSTALLMENTS_MANAGE)
  const input = await parseBody(req, updateSchema)
  const { id, ...rest } = input

  const before = await prisma.installmentPlan.findUnique({ where: { id } })
  if (!before) throw ApiError.notFound('طرح یافت نشد')

  const data: Record<string, unknown> = {}
  if (rest.name !== undefined) data.name = rest.name
  if (rest.months !== undefined) data.months = rest.months
  if (rest.downPaymentPercent !== undefined) data.downPaymentPercent = rest.downPaymentPercent
  if (rest.interestRate !== undefined) data.interestRate = rest.interestRate
  if (rest.fee !== undefined) data.fee = rest.fee
  if (rest.minAmount !== undefined) data.minAmount = BigInt(rest.minAmount)
  if (rest.maxAmount !== undefined) data.maxAmount = BigInt(rest.maxAmount)
  if (rest.serviceFeePer10M !== undefined) data.serviceFeePer10M = BigInt(rest.serviceFeePer10M)
  if (rest.active !== undefined) data.active = rest.active

  const plan = await prisma.installmentPlan.update({ where: { id }, data })

  const meta = getSessionMeta(req)
  await writeAuditStrict({
    actorType: 'admin',
    actorId: admin.adminId,
    actorRole: admin.adminRole,
    action: 'installment.plan_update',
    entityType: 'installment_plan',
    entityId: id,
    before: {
      name: before.name,
      interestRate: before.interestRate.toString(),
      active: before.active,
    },
    after: toJsonSafe(data as Record<string, unknown>),
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })

  return ok({ id: plan.id })
})
