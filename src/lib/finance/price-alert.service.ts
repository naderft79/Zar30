// ============================================
// Zar30 - Price Alert Service (Assets v2)
// ============================================
// هشدار قیمت طلا — سمت سرور با هر price snapshot جدید چک می‌شود
//   ABOVE: قیمت خرید >= آستانه   |   BELOW: قیمت خرید <= آستانه
// بعد از trigger غیرفعال می‌شود (active=false) — notification IN_APP
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { notifyFinancial } from './notify'
import { logger } from '@/lib/logger/logger'

const MAX_ACTIVE_ALERTS = 20

export async function listPriceAlerts(userId: string) {
  return prisma.priceAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createPriceAlert(
  userId: string,
  input: { direction: 'ABOVE' | 'BELOW'; targetPrice: bigint },
) {
  const active = await prisma.priceAlert.count({ where: { userId, active: true } })
  if (active >= MAX_ACTIVE_ALERTS) {
    throw ApiError.badRequest(`حداکثر ${MAX_ACTIVE_ALERTS} هشدار فعال قابل ثبت است`)
  }
  return prisma.priceAlert.create({
    data: {
      userId,
      direction: input.direction,
      targetPrice: input.targetPrice,
    },
  })
}

export async function deletePriceAlert(userId: string, id: string) {
  const alert = await prisma.priceAlert.findFirst({ where: { id, userId } })
  if (!alert) throw ApiError.notFound('هشدار قیمت یافت نشد')
  await prisma.priceAlert.delete({ where: { id: alert.id } })
}

// با هر snapshot قیمت جدید صدا زده می‌شود — fire-and-forget در price-service
export async function checkPriceAlerts(buyPriceToman: bigint): Promise<void> {
  const triggered = await prisma.priceAlert.findMany({
    where: {
      active: true,
      OR: [
        { direction: 'ABOVE', targetPrice: { lte: buyPriceToman } },
        { direction: 'BELOW', targetPrice: { gte: buyPriceToman } },
      ],
    },
    take: 500,
  })
  if (triggered.length === 0) return

  for (const alert of triggered) {
    // غیرفعال‌سازی اتمیک — هر هشدار فقط یک‌بار فایر می‌شود
    const updated = await prisma.priceAlert.updateMany({
      where: { id: alert.id, active: true },
      data: { active: false, triggeredAt: new Date() },
    })
    if (updated.count === 0) continue
    notifyFinancial(
      alert.userId,
      'price_alert',
      alert.direction === 'ABOVE'
        ? 'قیمت طلا به سقف هشدار شما رسید'
        : 'قیمت طلا به کف هشدار شما رسید',
      '',
      {
        direction: alert.direction,
        targetPrice: alert.targetPrice.toString(),
        currentPrice: buyPriceToman.toString(),
      },
    )
  }
  logger.info(
    { count: triggered.length, price: buyPriceToman.toString() },
    'Price alerts triggered',
  )
}
