import type { Metadata } from 'next'
import { AdminSettingsClient } from '@/components/admin/settings-client'

export const metadata: Metadata = {
  title: 'تنظیمات سامانه',
}

export default function AdminSettingsPage() {
  return <AdminSettingsClient />
}
