// ============================================
// Zar30 - Admin User Subpage: ارسال پیامک
// ============================================

import type { Metadata } from 'next'
import { UserMessageSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'ارسال پیامک به کاربر' }

export default function Page() {
  return <UserMessageSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
