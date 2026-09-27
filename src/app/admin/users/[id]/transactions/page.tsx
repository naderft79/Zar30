// ============================================
// Zar30 - Admin User Subpage: تراکنش‌های مالی
// ============================================

import type { Metadata } from 'next'
import { UserTransactionsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'تراکنش‌های کاربر' }

export default function Page() {
  return <UserTransactionsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
