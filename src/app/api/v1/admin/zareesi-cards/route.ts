// ============================================
// Zar30 - /api/v1/admin/zareesi-cards
// ============================================
// GET → لیست همه سفارش‌های کارت زرسی (ادمین) با فیلتر وضعیت و جستجو
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import prisma from '@/lib/db/prisma'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DELIVERY_READ)
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const q = url.searchParams.get('q')?.trim()

  const cards = await prisma.zareesiCard.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { cardNumber: { contains: q, mode: 'insensitive' } },
              { holderName: { contains: q } },
              { user: { mobile: { contains: q } } },
              { user: { firstName: { contains: q } } },
              { user: { lastName: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      user: { select: { mobile: true, firstName: true, lastName: true } },
      address: { select: { city: true, province: true, address: true } },
    },
  })

  return ok({
    cards: cards.map((c) => ({
      ...c,
      feeGold: String(c.feeGold),
      feeToman: String(c.feeToman),
      user: {
        name: [c.user.firstName, c.user.lastName].filter(Boolean).join(' ') || '—',
        mobile: c.user.mobile,
      },
    })),
  })
})
