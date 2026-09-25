import type { Metadata } from 'next'
import { AdminCoinHoldingsClient } from '@/components/admin/coin-holdings-client'

export const metadata: Metadata = {
  title: 'موجودی سکه و شمش',
}

export default function AdminCoinHoldingsPage() {
  return <AdminCoinHoldingsClient />
}
