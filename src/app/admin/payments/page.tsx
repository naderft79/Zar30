import type { Metadata } from 'next'
import { AdminPaymentsClient } from '@/components/admin/payments-client'

export const metadata: Metadata = {
  title: 'پرداخت‌های درگاه',
}

export default function AdminPaymentsPage() {
  return <AdminPaymentsClient />
}
