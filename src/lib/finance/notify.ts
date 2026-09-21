// ============================================
// Zar30 - Financial Notification Helper
// ============================================
// رویداد notification بعد از COMMIT تراکنش — fire-and-forget
// شکست notification هرگز عملیات مالی را خراب نمی کند
// ============================================

import prisma from '@/lib/db/prisma'
import { logger } from '@/lib/logger/logger'

export function notifyFinancial(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): void {
  prisma.notification
    .create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined,
        channel: 'IN_APP',
      },
    })
    .catch((err) => {
      logger.error({ err, userId, type }, 'Financial notification failed')
    })
}
