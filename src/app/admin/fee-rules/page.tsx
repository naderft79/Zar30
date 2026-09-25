import type { Metadata } from 'next'
import { AdminFeeRulesClient } from '@/components/admin/fee-rules-client'

export const metadata: Metadata = {
  title: 'قواعد کارمزد',
}

export default function AdminFeeRulesPage() {
  return <AdminFeeRulesClient />
}
