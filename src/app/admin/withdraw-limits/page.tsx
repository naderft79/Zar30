import type { Metadata } from 'next'
import { AdminLimitsClient } from '@/components/admin/limits-client'

export const metadata: Metadata = {
  title: 'محدودیت برداشت',
}

export default function AdminWithdrawLimitsPage() {
  return (
    <AdminLimitsClient
      scope="WITHDRAW"
      title="محدودیت‌های برداشت"
      description="قوانین سقف برداشت تومانی بر اساس سطح KYC و دوره — قانون سطح‌مشخص بر «همه سطوح» مقدم است"
    />
  )
}
