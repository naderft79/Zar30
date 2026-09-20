import type { Metadata } from 'next'
import { AdminWalletsClient } from '@/components/admin/wallets-list-client'

export const metadata: Metadata = {
  title: 'کیف پول‌ها',
}

export default function AdminWalletsPage() {
  return <AdminWalletsClient />
}
