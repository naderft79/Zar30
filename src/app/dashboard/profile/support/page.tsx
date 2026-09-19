import type { Metadata } from 'next'
import { SupportClient } from '@/components/panel/support-client'

export const metadata: Metadata = { title: 'پشتیبانی' }

export default function ProfileSupportPage() {
  return <SupportClient />
}
