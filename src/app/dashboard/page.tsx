import type { Metadata } from 'next'
import { DashboardOverview } from '@/components/panel/dashboard-overview'

export const metadata: Metadata = { title: 'داشبورد | زرسی' }

export default function DashboardPage() {
  return <DashboardOverview />
}
