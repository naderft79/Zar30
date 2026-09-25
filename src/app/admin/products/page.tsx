import type { Metadata } from 'next'
import { AdminProductsClient } from '@/components/admin/products-client'

export const metadata: Metadata = {
  title: 'محصولات فروشگاه',
}

export default function AdminProductsPage() {
  return <AdminProductsClient />
}
