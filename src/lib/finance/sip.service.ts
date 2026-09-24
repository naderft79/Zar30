// ============================================
// Zar30 - Recurring Buy Plan (SIP) Service (Assets v2)
// ============================================
// خرید خودکار طلا — هر plan دارای nextRunAt است؛ endpoint کرون
// (با Authorization: Bearer CRON_SECRET) پلن‌های due را اجرا می‌کند:
//   موفق → خرید طلا از سرویس order + ریست شمارنده شکست
//   ناموفق → ثبت lastError + بعد از ۳ شکست پیاپی غیرفعال
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'
import { buyGold } from './order.service'
import { notifyFinancial } from './notify'

const MIN_PLAN_TOMAN = BigInt(process.env.MIN_SIP_TOMAN ?? '10000')
const MAX_FAILURES = 3

function nextRunDate(now: Date, frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'): Date {
  const next = new Date(now)
  if (frequency === 'DAILY') next.setDate(next.getDate() + 1)
  else if (frequency === 'WEEKLY') next.setDate(next.getDate() + 7)
  else next.setMonth(next.getMonth() + 1)
  return next
}

export async function listSavingsPlans(userId: string) {
  return prisma.recurringBuyPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createSavingsPlan(
  userId: string,
  input: { tomanAmount: bigint; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' },
) {
  if (input.tomanAmount < MIN_PLAN_TOMAN) {
    throw ApiError.badRequest(
      `حداقل مبلغ هر اجرای خرید خودکار ${MIN_PLAN_TOMAN.toLocaleString('en')} تومان است`,
    )
  }
  return prisma.recurringBuyPlan.create({
    data: {
      userId,
      tomanAmount: input.tomanAmount,
      frequency: input.frequency,
      nextRunAt: nextRunDate(new Date(), input.frequency),
    },
  })
}

export async function setSavingsPlanActive(userId: string, id: string, active: boolean) {
  const plan = await prisma.recurringBuyPlan.findFirst({ where: { id, userId } })
  if (!plan) throw ApiError.notFound('طرح خرید خودکار یافت نشد')
  return prisma.recurringBuyPlan.update({
    where: { id: plan.id },
    data: {
      active,
      // فعال‌سازی دوباره شمارنده شکست را صفر می‌کند و از سررسید بعدی ادامه می‌دهد
      consecutiveFailures: active ? 0 : plan.consecutiveFailures,
      nextRunAt: active ? nextRunDate(new Date(), plan.frequency) : plan.nextRunAt,
    },
  })
}

export async function deleteSavingsPlan(userId: string, id: string) {
  const plan = await prisma.recurringBuyPlan.findFirst({ where: { id, userId } })
  if (!plan) throw ApiError.notFound('طرح خرید خودکار یافت نشد')
  await prisma.recurringBuyPlan.delete({ where: { id: plan.id } })
}

// اجرای پلن‌های سررسیدشده — فقط از endpoint کرون با secret صدا زده می‌شود
export async function runDueSavingsPlans(
  now = new Date(),
): Promise<{ processed: number; failed: number }> {
  const due = await prisma.recurringBuyPlan.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    include: { user: { select: { kycLevel: true } } },
    take: 200,
  })
  let processed = 0
  let failed = 0

  for (const plan of due) {
    try {
      const order = await buyGold(
        { userId: plan.userId, kycLevel: plan.user.kycLevel },
        { tomanAmount: plan.tomanAmount },
      )
      await prisma.recurringBuyPlan.update({
        where: { id: plan.id },
        data: {
          nextRunAt: nextRunDate(now, plan.frequency),
          lastRunAt: now,
          lastOrderId: order.id,
          lastError: null,
          consecutiveFailures: 0,
        },
      })
      processed++
    } catch (err) {
      failed++
      const failures = plan.consecutiveFailures + 1
      await prisma.recurringBuyPlan.update({
        where: { id: plan.id },
        data: {
          nextRunAt: nextRunDate(now, plan.frequency),
          lastRunAt: now,
          lastError: err instanceof Error ? err.message.slice(0, 500) : 'unknown error',
          consecutiveFailures: failures,
          // بعد از شکست‌های پیاپی (معمولاً کمبود موجودی) طرح غیرفعال می‌شود
          active: failures < MAX_FAILURES,
        },
      })
      logger.warn({ planId: plan.id, failures, err }, 'SIP run failed')
      if (failures >= MAX_FAILURES) {
        notifyFinancial(
          plan.userId,
          'sip_paused',
          'خرید خودکار شما به دلیل شکست‌های پیاپی متوقف شد',
          '',
          { planId: plan.id },
        )
      }
    }
  }
  return { processed, failed }
}
