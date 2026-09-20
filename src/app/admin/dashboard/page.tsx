// ============================================
// Zar30 - Admin Dashboard Page
// ============================================

import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'داشبورد عملیاتی',
}

export default function AdminDashboardPage() {
  return <AdminDashboard />
}
