import type { Metadata } from 'next'
import { SecurityClient } from '@/components/panel/security-client'

export const metadata: Metadata = { title: 'مرکز امنیت | زرنما' }

export default function SecurityPage() {
  return <SecurityClient />
}
