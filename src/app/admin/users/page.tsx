// ============================================
// Zar30 - Admin Users List Page
// ============================================

import type { Metadata } from 'next'
import { AdminUsersClient } from '@/components/admin/users-client'

export const metadata: Metadata = {
  title: 'کاربران',
}

export default function AdminUsersPage() {
  return <AdminUsersClient />
}
