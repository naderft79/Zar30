// ============================================
// Zar30 - Admin User Subpage: تحویل فیزیکی
// ============================================

import type { Metadata } from 'next'
import { UserDeliveriesSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'تحویل فیزیکی کاربر' }

export default function Page() {
  return <UserDeliveriesSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
