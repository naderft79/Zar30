// ============================================
// Zar30 - Assets (دارایی) — Preview
// ============================================
// مقصد سوم قرارداد ناوبری — کیف پول، موجودی، تراکنش‌ها
// Phase 3.1: فقط Preview — هیچ Financial Logic نیست
// ============================================

import type { Metadata } from 'next'
import { AssetsClient } from '@/components/panel/assets-client'

export const metadata: Metadata = { title: 'دارایی' }

export default function AssetsPage() {
  return <AssetsClient />
}
