// ============================================
// Zar30 - Gold Delivery Service (Assets v2)
// ============================================
// درخواست تحویل فیزیکی طلا — فاز مینیمال:
//   طلا قفل نمی‌شود؛ فقط در زمان ثبت موجودی آزاد ≥ گرم درخواستی چک می‌شود
//   پردازش/تایید/رد توسط ادمین در فاز بعد
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { Decimal } from './money'
import { notifyFinancial } from './notify'

export async function createDeliveryRequest(
  userId: string,
  input: { grams: string; method: 'POST' | 'PICKUP'; addressId?: string },
) {
  const grams = new Decimal(input.grams)
  if (grams.lte(0)) throw ApiError.badRequest('مقدار طلا باید مثبت باشد')

  // موجودی آزاد طلا — درخواست بیشتر از موجودی رد می‌شود
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { assetAccounts: true },
  })
  const gold = wallet?.assetAccounts.find((a) => a.assetType === 'GOLD')
  const available = new Decimal(gold?.balance ?? 0)
  if (grams.gt(available)) {
    throw ApiError.badRequest('موجودی طلای آزاد شما برای این درخواست کافی نیست')
  }

  if (input.method === 'POST') {
    if (!input.addressId) throw ApiError.badRequest('برای ارسال پستی انتخاب آدرس الزامی است')
    const address = await prisma.address.findFirst({
      where: { id: input.addressId, userId },
    })
    if (!address) throw ApiError.badRequest('آدرس انتخاب‌شده متعلق به شما نیست')
  }

  const request = await prisma.goldDeliveryRequest.create({
    data: {
      userId,
      grams,
      method: input.method,
      addressId: input.method === 'POST' ? input.addressId : null,
    },
    include: { address: true },
  })

  notifyFinancial(userId, 'delivery_requested', 'درخواست تحویل فیزیکی طلا ثبت شد', '', {
    deliveryRequestId: request.id,
    grams: grams.toString(),
    method: input.method,
  })

  return request
}

export async function listDeliveryRequests(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.goldDeliveryRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { address: { select: { city: true, province: true } } },
    }),
    prisma.goldDeliveryRequest.count({ where: { userId } }),
  ])
  return { items, total }
}

export async function cancelDeliveryRequest(userId: string, id: string) {
  const request = await prisma.goldDeliveryRequest.findFirst({ where: { id, userId } })
  if (!request) throw ApiError.notFound('درخواست تحویل یافت نشد')
  if (request.status !== 'PENDING') {
    throw ApiError.badRequest('فقط درخواست‌های در انتظار بررسی قابل لغو هستند')
  }
  return prisma.goldDeliveryRequest.update({
    where: { id: request.id },
    data: { status: 'CANCELLED' },
  })
}
