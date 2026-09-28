import type { Metadata } from 'next'
import { ZareesiCardClient } from '@/components/panel/zareesi-card-client'

export const metadata: Metadata = { title: 'کارت زرسی — خرید با طلا' }

export default function ZareesiCardPage() {
  return <ZareesiCardClient />
}
