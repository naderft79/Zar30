import type { Metadata } from 'next'
import { AdminLevelsClient } from '@/components/admin/levels-client'

export const metadata: Metadata = {
  title: 'سطوح کاربران',
}

export default function AdminLevelsPage() {
  return <AdminLevelsClient />
}
