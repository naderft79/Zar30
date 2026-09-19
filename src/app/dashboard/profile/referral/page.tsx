import type { Metadata } from 'next'
import { ReferralClient } from '@/components/panel/referral-client'

export const metadata: Metadata = { title: 'معرفی دوستان' }

export default function ProfileReferralPage() {
  return <ReferralClient />
}
