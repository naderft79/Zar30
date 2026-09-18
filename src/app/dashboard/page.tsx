import type { Metadata } from 'next'
import { DashboardOverview } from '@/components/panel/dashboard-overview'

export const metadata: Metadata = { title: 'داشبورد | زرنما' }

export default function DashboardPage() {
  return <DashboardOverview />
}
