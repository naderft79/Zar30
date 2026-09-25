import type { Metadata } from 'next'
import { AdminFraudClient } from '@/components/admin/fraud-client'

export const metadata: Metadata = {
  title: 'تقلب',
}

export default function AdminFraudPage() {
  return <AdminFraudClient />
}
