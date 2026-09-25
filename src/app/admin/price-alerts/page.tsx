import type { Metadata } from 'next'
import { AdminPriceAlertsClient } from '@/components/admin/price-alerts-client'

export const metadata: Metadata = {
  title: 'هشدارهای قیمت',
}

export default function AdminPriceAlertsPage() {
  return <AdminPriceAlertsClient />
}
