// ============================================
// Zarnama - Assets (دارایی) — Preview
// ============================================
// مقصد سوم قرارداد ناوبری — کیف پول، موجودی، تراکنش‌ها
// Phase 3.1: فقط Preview — هیچ Financial Logic نیست
// ============================================

import type { Metadata } from 'next'
import { PageHeader } from '@/components/panel/page-header'
import { AssetsClient } from '@/components/panel/assets-client'

export const metadata: Metadata = { title: 'دارایی' }

export default function AssetsPage() {
  return (
    <>
      <PageHeader title="دارایی" description="کیف پول، موجودی و تاریخچه مالی" />
      <AssetsClient />
    </>
  )
}
