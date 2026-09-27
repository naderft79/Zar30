// ============================================
// Zar30 - Admin User Subpage: کارت و شبا
// ============================================

import type { Metadata } from 'next'
import { UserBankAccountsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'کارت و شبا کاربر' }

export default function Page() {
  return <UserBankAccountsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
