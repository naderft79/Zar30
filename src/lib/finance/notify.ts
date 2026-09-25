// ============================================
// Zar30 - Financial Notification Helper
// ============================================
// رویداد notification بعد از COMMIT تراکنش — fire-and-forget
// شکست notification هرگز عملیات مالی را خراب نمی کند
// ============================================

import { notifyUser } from '@/lib/services/notification.service'

export function notifyFinancial(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): void {
  // رکورد DB + Web Push — هر دو fail-open
  void notifyUser({ userId, type, title, body, data })
}
