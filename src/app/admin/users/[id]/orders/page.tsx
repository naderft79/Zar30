// ============================================
// Zar30 - Admin User Subpage: سفارشات
// ============================================

import type { Metadata } from 'next'
import { UserOrdersSection } from '@/components/admin/user-sections'

export const metadata: Metadata = { title: 'سفارشات کاربر' }

export default function Page() {
  return <UserOrdersSection />
}

export function generateStaticParams() {
  return [{ id: '_' }]
}
