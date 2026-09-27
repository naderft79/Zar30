// ============================================
// Zar30 - Admin User Subpage: تراکنش‌های درگاه
// ============================================

import type { Metadata } from 'next'
import { UserPaymentsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'تراکنش‌های درگاه کاربر' }

export default function Page() {
  return <UserPaymentsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
