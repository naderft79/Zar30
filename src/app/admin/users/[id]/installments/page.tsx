// ============================================
// Zar30 - Admin User Subpage: قسطی
// ============================================

import type { Metadata } from 'next'
import { UserInstallmentsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'خرید قسطی کاربر' }

export default function Page() {
  return <UserInstallmentsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
