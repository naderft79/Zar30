// ============================================
// Zar30 - Savings Page Client (خرید خودکار طلا)
// ============================================
// زیرصفحه پروفایل — مدیریت طرح‌های SIP (کارت مشترک با منطق کامل)
// ============================================

'use client'

import { SipCard } from './sip-card'
import { useOnlineStatus } from './offline-indicator'

export function SavingsClient() {
  const online = useOnlineStatus()
  return <SipCard online={online} />
}
