// ============================================
// Zar30 - Admin User Subpage: اعتبارها
// ============================================

import type { Metadata } from 'next'
import { UserCreditSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'اعتبار کاربر' }

export default function Page() {
  return <UserCreditSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
