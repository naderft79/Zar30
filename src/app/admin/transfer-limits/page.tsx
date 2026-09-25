import type { Metadata } from 'next'
import { AdminLimitsClient } from '@/components/admin/limits-client'

export const metadata: Metadata = {
  title: 'محدودیت انتقال',
}

export default function AdminTransferLimitsPage() {
  return (
    <AdminLimitsClient
      scope="TRANSFER"
      title="محدودیت‌های انتقال"
      description="قوانین سقف انتقال طلا بین کاربران بر اساس سطح KYC و دوره"
    />
  )
}
