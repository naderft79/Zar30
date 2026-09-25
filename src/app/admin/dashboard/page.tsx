// ============================================
// Zar30 - Admin Dashboard Page (V2)
// ============================================
// Suspense الزامی — AdminDashboard از useSearchParams استفاده می‌کند
// ============================================

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'مرکز فرماندهی',
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4" aria-busy="true">
          <div className="skeleton-shimmer h-10 w-48 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-32 rounded-xl" />
            ))}
          </div>
          <div className="skeleton-shimmer h-64 rounded-xl" />
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  )
}
