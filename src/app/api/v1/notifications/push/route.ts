// ============================================
// Zar30 - POST|DELETE /api/v1/notifications/push
// ============================================
// ثبت/لغو اشتراک Web Push — endpoint یکتا per device (upsert)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseBody } from '@/lib/api/request'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import prisma from '@/lib/db/prisma'
import { pushSubscribeSchema, pushUnsubscribeSchema } from '@/lib/validators/notifications'

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const input = await parseBody(req, pushSubscribeSchema)

  await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: auth.userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent,
    },
    update: {
      // endpoint ممکن است مالکش عوض شود (logout/login دیگر روی همان دستگاه)
      userId: auth.userId,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent,
      lastSeen: new Date(),
    },
  })
  return ok({ subscribed: true })
})

export const DELETE = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const input = await parseBody(req, pushUnsubscribeSchema)

  // فقط اشتراک متعلق به خود کاربر پاک می‌شود
  const res = await prisma.pushSubscription.deleteMany({
    where: { endpoint: input.endpoint, userId: auth.userId },
  })
  if (res.count === 0) throw ApiError.notFound('اشتراک یافت نشد')
  return ok({ subscribed: false })
})
