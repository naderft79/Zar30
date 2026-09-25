import type { Metadata } from 'next'
import { AdminRiskClient } from '@/components/admin/risk-client'

export const metadata: Metadata = {
  title: 'مدیریت ریسک',
}

export default function AdminRiskPage() {
  return <AdminRiskClient />
}
