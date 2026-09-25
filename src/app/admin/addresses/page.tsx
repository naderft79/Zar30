import type { Metadata } from 'next'
import { AdminAddressesClient } from '@/components/admin/addresses-client'

export const metadata: Metadata = {
  title: 'آدرس‌ها',
}

export default function AdminAddressesPage() {
  return <AdminAddressesClient />
}
