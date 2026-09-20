// ============================================
// Zar30 - Admin KYC List Page
// ============================================

import type { Metadata } from 'next'
import { AdminKycListClient } from '@/components/admin/kyc-list-client'

export const metadata: Metadata = {
  title: 'احراز هویت',
}

export default function AdminKycPage() {
  return <AdminKycListClient />
}
