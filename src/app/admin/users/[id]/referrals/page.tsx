// ============================================
// Zar30 - Admin User Subpage: دعوت دوستان
// ============================================

import type { Metadata } from 'next'
import { UserReferralsSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'دعوت دوستان کاربر' }

export default function Page() {
  return <UserReferralsSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
