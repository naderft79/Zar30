import type { Metadata } from 'next'
import { AdminProfileClient } from '@/components/admin/profile-client'

export const metadata: Metadata = {
  title: 'پروفایل مدیر',
}

export default function AdminProfilePage() {
  return <AdminProfileClient />
}
