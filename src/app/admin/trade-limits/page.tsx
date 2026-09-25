import type { Metadata } from 'next'
import { AdminLimitsClient } from '@/components/admin/limits-client'

export const metadata: Metadata = {
  title: 'محدودیت معاملات',
}

export default function AdminTradeLimitsPage() {
  return (
    <AdminLimitsClient
      scope="TRADE"
      title="محدودیت‌های معاملات"
      description="قوانین سقف خرید/فروش روزانه و ماهانه بر اساس سطح KYC — مبلغ تومانی یا وزن طلا"
    />
  )
}
