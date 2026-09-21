// ============================================
// Zar30 - Admin Catch-All
// ============================================
// routeهای بدون صفحه واقعی → admin/not-found داخل AdminShell
// (به‌جای ۴۰۴ root که layout ادمین را از دست می‌دهد)
// ============================================

import { notFound } from 'next/navigation'

export default function AdminCatchAll() {
  notFound()
}
