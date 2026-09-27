// ============================================
// Zar30 - Admin User Subpage: مسدود / فعال‌سازی
// ============================================

import type { Metadata } from 'next'
import { UserBlockSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'مسدودسازی کاربر' }

export default function Page() {
  return <UserBlockSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
