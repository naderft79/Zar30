import type { Metadata } from 'next'
import { AdminTransfersClient } from '@/components/admin/transfers-client'

export const metadata: Metadata = {
  title: 'انتقال دارایی',
}

export default function AdminTransfersPage() {
  return <AdminTransfersClient />
}
