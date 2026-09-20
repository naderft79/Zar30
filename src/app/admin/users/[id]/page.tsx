// ============================================
// Zar30 - Admin User Detail Page
// ============================================

import type { Metadata } from 'next'
import { AdminUserDetailClient } from '@/components/admin/user-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات کاربر',
}

export default function AdminUserDetailPage() {
  return <AdminUserDetailClient />
}
