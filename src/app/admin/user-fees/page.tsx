import type { Metadata } from 'next'
import { AdminUserFeesClient } from '@/components/admin/user-fees-client'

export const metadata: Metadata = {
  title: 'کارمزدهای فردی',
}

export default function AdminUserFeesPage() {
  return <AdminUserFeesClient />
}
