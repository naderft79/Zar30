import type { Metadata } from 'next'
import { AdminDiscountsClient } from '@/components/admin/discounts-client'

export const metadata: Metadata = {
  title: 'کدهای تخفیف',
}

export default function AdminDiscountsPage() {
  return <AdminDiscountsClient />
}
