// ============================================
// Zarnama - Dashboard Page
// ============================================
// پنل کاربری پایه — پروفایل + مدیریت نشست‌ها
// ============================================

import type { Metadata } from 'next'
import { DashboardClient } from '@/components/auth/dashboard-client'

export const metadata: Metadata = {
  title: 'داشبورد',
  robots: { index: false },
}

export default function DashboardPage() {
  return <DashboardClient />
}
