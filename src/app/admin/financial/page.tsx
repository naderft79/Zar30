import type { Metadata } from 'next'
import { AdminFinancialClient } from '@/components/admin/financial-client'

export const metadata: Metadata = {
  title: 'دفتر کل حسابداری',
}

export default function AdminFinancialPage() {
  return <AdminFinancialClient />
}
