// ============================================
// Zar30 - Web Push Sender (VAPID)
// ============================================
// ارسال Web Push به اشتراک‌های کاربر — fail-open:
// شکست push هرگز flow اصلی (مالی/عملیاتی) را خراب نمی کند
// اشتراک‌های منقضی (404/410) خودکار پاک می شوند
// ============================================

import webpush, { type PushSubscription as WebPushSubscription } from 'web-push'
import prisma from '@/lib/db/prisma'
import { env } from '@/lib/config/env'
import { logger } from '@/lib/logger/logger'

export interface PushPayload {
  title: string
  body: string
  /** URL نسبی — با کلیک روی اعلان باز می شود */
  url?: string
  tag?: string
  data?: Record<string, unknown>
}

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    return false
  }
  webpush.setVapidDetails(env.VAPID_SUBJECT, publicKey, privateKey)
  configured = true
  return true
}

export function isWebPushEnabled(): boolean {
  return ensureConfigured()
}

// ارسال به یک endpoint — مدیریت اشتراک مرده
async function sendToEndpoint(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<void> {
  const target: WebPushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  }
  try {
    await webpush.sendNotification(target, JSON.stringify(payload), { TTL: 3600 })
    await prisma.pushSubscription
      .update({ where: { id: sub.id }, data: { lastSeen: new Date() } })
      .catch(() => {})
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) {
      // اشتراک منقضی/لغوشده — پاک کن تا دوباره تلاش نشود
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      logger.info({ endpoint: sub.endpoint.slice(0, 60) }, 'Stale push subscription removed')
    } else {
      logger.warn({ err, subscriptionId: sub.id }, 'Web push send failed')
    }
  }
}

// ارسال به همه دستگاه‌های یک کاربر — موازی، isolated
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!ensureConfigured()) return 0
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })
  await Promise.allSettled(subs.map((s) => sendToEndpoint(s, payload)))
  return subs.length
}

// ارسال به گروهی از کاربران — برای broadcast
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  if (!ensureConfigured() || userIds.length === 0) return 0
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })
  await Promise.allSettled(subs.map((s) => sendToEndpoint(s, payload)))
  return subs.length
}
