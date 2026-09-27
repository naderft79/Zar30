// ============================================
// Zar30 - Admin User Subpage: انتقال‌ها
// ============================================

import type { Metadata } from 'next'
import { UserTransfersSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'انتقال‌های کاربر' }

export default function Page() {
  return <UserTransfersSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
