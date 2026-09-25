import type { Metadata } from 'next'
import { AdminSeoClient } from '@/components/admin/seo-client'

export const metadata: Metadata = {
  title: 'سئو',
}

export default function AdminSeoPage() {
  return <AdminSeoClient />
}
