import type { Metadata } from 'next'
import { ProfileClient } from '@/components/panel/profile-client'

export const metadata: Metadata = { title: 'پروفایل | زرنما' }

export default function ProfilePage() {
  return <ProfileClient />
}
