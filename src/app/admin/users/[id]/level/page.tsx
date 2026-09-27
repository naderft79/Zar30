// ============================================
// Zar30 - Admin User Subpage: تغییر سطح
// ============================================

import type { Metadata } from 'next'
import { UserLevelSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'تغییر سطح کاربر' }

export default function Page() {
  return <UserLevelSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
