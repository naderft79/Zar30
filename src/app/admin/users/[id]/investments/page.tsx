// ============================================
// Zar30 - Admin User Subpage: زرکار (سرمایه‌گذاری)
// ============================================

import type { Metadata } from 'next'
import { UserInvestmentsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'زرکار کاربر' }

export default function Page() {
  return <UserInvestmentsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
