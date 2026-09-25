import type { Metadata } from 'next'
import { AdminRolesClient } from '@/components/admin/roles-client'

export const metadata: Metadata = {
  title: 'نقش‌ها و دسترسی‌ها',
}

export default function AdminRolesPage() {
  return <AdminRolesClient />
}
