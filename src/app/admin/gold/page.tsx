import type { Metadata } from 'next'
import { AdminGoldClient } from '@/components/admin/gold-client'

export const metadata: Metadata = {
  title: 'دارایی طلا',
}

export default function AdminGoldPage() {
  return <AdminGoldClient />
}
