import type { Metadata } from 'next'
import { AdminRateLimitsClient } from '@/components/admin/rate-limits-client'

export const metadata: Metadata = {
  title: 'Rate Limiting',
}

export default function AdminRateLimitsPage() {
  return <AdminRateLimitsClient />
}
