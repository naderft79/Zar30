import type { Metadata } from 'next'
import { SessionsClient } from '@/components/panel/sessions-client'

export const metadata: Metadata = { title: 'نشست‌ها | زرنما' }

export default function SessionsPage() {
  return <SessionsClient />
}
