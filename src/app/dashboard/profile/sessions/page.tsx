import type { Metadata } from 'next'
import { SessionsClient } from '@/components/panel/sessions-client'

export const metadata: Metadata = { title: 'دستگاه‌ها و نشست‌ها' }

export default function ProfileSessionsPage() {
  return <SessionsClient />
}
