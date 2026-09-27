// ============================================
// Zar30 - Admin User Subpage: مشکوک (ریسک)
// ============================================

import type { Metadata } from 'next'
import { UserRiskSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'ریسک کاربر' }

export default function Page() {
  return <UserRiskSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
