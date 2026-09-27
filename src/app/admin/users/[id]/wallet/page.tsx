// ============================================
// Zar30 - Admin User Subpage: کیف پول طلایی و تومانی
// ============================================

import type { Metadata } from 'next'
import { UserWalletSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'کیف پول کاربر' }

export default function Page() {
  return <UserWalletSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
