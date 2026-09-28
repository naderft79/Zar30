import type { Metadata } from 'next'
import { AdminZareesiClient } from '@/components/admin/zareesi-list-client'

export const metadata: Metadata = {
  title: 'کارت زرسی',
}

export default function AdminZareesiPage() {
  return <AdminZareesiClient />
}
