import type { Metadata } from 'next'
import { AdminDepositsClient } from '@/components/admin/deposits-list-client'

export const metadata: Metadata = {
  title: 'واریزها',
}

export default function AdminDepositsPage() {
  return <AdminDepositsClient />
}
