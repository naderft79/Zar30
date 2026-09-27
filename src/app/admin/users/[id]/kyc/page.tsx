// ============================================
// Zar30 - Admin User Subpage: احراز هویت
// ============================================

import type { Metadata } from 'next'
import { UserKycSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'احراز هویت کاربر' }

export default function Page() {
  return <UserKycSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
