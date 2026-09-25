import type { Metadata } from 'next'
import { PageHeader } from '@/components/panel/page-header'
import { SavingsClient } from '@/components/panel/savings-client'

export const metadata: Metadata = { title: 'خرید خودکار طلا' }

export default function SavingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="خرید خودکار طلا"
        description="پس‌انداز خودکار — هر روز، هفته یا ماه به‌صورت خودکار طلا بخرید"
      />
      <SavingsClient />
    </div>
  )
}
