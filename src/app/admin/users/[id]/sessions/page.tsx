// ============================================
// Zar30 - Admin User Subpage: نشست‌ها
// ============================================

import type { Metadata } from 'next'
import { UserSessionsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'نشست‌های کاربر' }

export default function Page() {
  return <UserSessionsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
