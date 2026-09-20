import type { Metadata } from 'next'
import { KycClient } from '@/components/panel/kyc-client'

export const metadata: Metadata = { title: 'احراز هویت' }

export default function KycPage() {
  return <KycClient />
}
