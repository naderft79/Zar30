// ============================================
// Zar30 - Transactions (تراکنش‌ها)
// ============================================
// صفحه کامل سوابق تراکنش‌ها — فیلتر + صفحه‌بندی + رسید
// ============================================

import type { Metadata } from 'next'
import { PageHeader } from '@/components/panel/page-header'
import { TransactionsClient } from '@/components/panel/transactions-client'

export const metadata: Metadata = { title: 'تراکنش‌ها' }

export default function TransactionsPage() {
  return (
    <>
      <PageHeader title="تراکنش‌ها" description="تاریخچه کامل رویدادهای مالی کیف پول" />
      <TransactionsClient />
    </>
  )
}
