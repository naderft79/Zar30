// ============================================
// Zar30 - Admin User Subpage: کارمزد
// ============================================

import type { Metadata } from 'next'
import { UserFeesSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'کارمزد کاربر' }

export default function Page() {
  return <UserFeesSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
