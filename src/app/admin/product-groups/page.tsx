import type { Metadata } from 'next'
import { AdminProductGroupsClient } from '@/components/admin/product-groups-client'

export const metadata: Metadata = {
  title: 'دسته‌بندی محصولات',
}

export default function AdminProductGroupsPage() {
  return <AdminProductGroupsClient />
}
