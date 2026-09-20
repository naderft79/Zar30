import type { Metadata } from 'next'
import { AdminPricingClient } from '@/components/admin/pricing-client'

export const metadata: Metadata = {
  title: 'قیمت‌گذاری',
}

export default function AdminPricingPage() {
  return <AdminPricingClient />
}
