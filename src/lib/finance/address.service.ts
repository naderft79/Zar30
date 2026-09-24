// ============================================
// Zar30 - Address Book Service (Assets v2)
// ============================================
// دفترچه آدرس کاربر — برای درخواست‌های تحویل فیزیکی طلا
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'

const MAX_ADDRESSES = 10

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createAddress(
  userId: string,
  input: {
    title?: string
    recipientName: string
    mobile: string
    province?: string
    city?: string
    address: string
    postalCode: string
    isDefault?: boolean
  },
) {
  const count = await prisma.address.count({ where: { userId } })
  if (count >= MAX_ADDRESSES) {
    throw ApiError.badRequest(`حداکثر ${MAX_ADDRESSES} آدرس قابل ثبت است`)
  }

  const makeDefault = input.isDefault || count === 0
  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
    }
    return tx.address.create({
      data: { userId, ...input, isDefault: makeDefault },
    })
  })
}

export async function deleteAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } })
  if (!address) throw ApiError.notFound('آدرس یافت نشد')
  await prisma.address.delete({ where: { id: address.id } })
}

export async function setDefaultAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } })
  if (!address) throw ApiError.notFound('آدرس یافت نشد')
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: address.id }, data: { isDefault: true } }),
  ])
}
