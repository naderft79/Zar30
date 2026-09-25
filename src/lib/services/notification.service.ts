// ============================================
// Zar30 - Notification Fan-out Service
// ============================================
// نقطه واحد ساخت اعلان: رکورد DB (IN_APP) + تلاش Web Push
// push fail-open است — هرگز flow اصلی را خراب نمی کند
// ============================================

import prisma from '@/lib/db/prisma'
import { logger } from '@/lib/logger/logger'
import { sendPushToUser, sendPushToUsers, type PushPayload } from '@/lib/push/webpush'

export interface NotifyInput {
  userId: string
  type: string
  title: string
  body: string
  /** لینک مقصد با کلیک روی اعلان — مثل /dashboard/transactions */
  url?: string
  data?: Record<string, unknown>
}

// اعلان تکی — رکورد + push به همه دستگاه‌های کاربر
export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: new Date(),
        data: input.data ? JSON.parse(JSON.stringify(input.data)) : undefined,
      },
    })
  } catch (err) {
    logger.error({ err, userId: input.userId, type: input.type }, 'Notification create failed')
    return
  }

  const payload: PushPayload = {
    title: input.title,
    body: input.body,
    url: input.url ?? '/dashboard/notifications',
    tag: input.type,
    data: input.data,
  }
  sendPushToUser(input.userId, payload).catch((err) =>
    logger.warn({ err, userId: input.userId }, 'Push dispatch failed'),
  )
}

// اعلان گروهی — برای broadcast ادمین (بدون بلاک‌کردن پاسخ API)
export function notifyUsersPushOnly(userIds: string[], payload: PushPayload): void {
  sendPushToUsers(userIds, payload).catch((err) =>
    logger.warn({ err, count: userIds.length }, 'Broadcast push dispatch failed'),
  )
}
