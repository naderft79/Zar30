// ============================================
// Zar30 - Admin KYC Detail Page
// ============================================

import type { Metadata } from 'next'
import { AdminKycDetailClient } from '@/components/admin/kyc-detail-client'

export const metadata: Metadata = {
  title: 'پرونده احراز هویت',
}

export default function AdminKycDetailPage() {
  return <AdminKycDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
