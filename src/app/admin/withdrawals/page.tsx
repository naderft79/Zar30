import type { Metadata } from 'next'
import { AdminWithdrawalsClient } from '@/components/admin/withdrawals-list-client'

export const metadata: Metadata = {
  title: 'برداشت‌ها',
}

export default function AdminWithdrawalsPage() {
  return <AdminWithdrawalsClient />
}
