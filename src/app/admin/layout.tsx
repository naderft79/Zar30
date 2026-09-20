// ============================================
// Zar30 - Admin Layout (مرکز عملیات)
// ============================================
// همه صفحات /admin/* داخل AdminShell — noindex؛ فقط ادمین فعال
// ============================================

import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = {
  title: { template: '%s | مرکز عملیات', default: 'مرکز عملیات | زرسی' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
