// ============================================
// Zar30 - Admin User Subpage: ویرایش مشخصات
// ============================================

import type { Metadata } from 'next'
import { UserProfileEditSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'ویرایش مشخصات کاربر' }

export default function Page() {
  return <UserProfileEditSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
