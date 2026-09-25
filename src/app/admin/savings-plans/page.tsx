import type { Metadata } from 'next'
import { AdminSavingsPlansClient } from '@/components/admin/savings-plans-client'

export const metadata: Metadata = {
  title: 'خرید خودکار',
}

export default function AdminSavingsPlansPage() {
  return <AdminSavingsPlansClient />
}
