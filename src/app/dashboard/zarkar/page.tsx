import type { Metadata } from 'next'
import { ZarkarClient } from '@/components/panel/zarkar-client'

export const metadata: Metadata = { title: 'زرکار — سپرده طلا' }

export default function ZarkarPage() {
  return <ZarkarClient />
}
