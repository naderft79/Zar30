import type { Metadata } from 'next'
import { AdminTicketDetailClient } from '@/components/admin/ticket-detail-client'

export const metadata: Metadata = {
  title: 'جزئیات تیکت',
}

export default function AdminTicketDetailPage() {
  return <AdminTicketDetailClient />
}

// بیلد موبایل (static export) — id واقعی در runtime با client routing حل می‌شود
export function generateStaticParams() {
  return [{ id: '_' }]
}
