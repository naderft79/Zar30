// ============================================
// Zar30 - Admin User Subpage: همگام‌سازی سفارشات
// ============================================

import type { Metadata } from 'next'
import { UserSyncSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'همگام‌سازی سفارشات کاربر' }

export default function Page() {
  return <UserSyncSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
