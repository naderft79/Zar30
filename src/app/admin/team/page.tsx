import type { Metadata } from 'next'
import { AdminTeamClient } from '@/components/admin/platform-list-clients'
export const metadata: Metadata = { title: 'تیم ادمین' }
export default function Page() {
  return <AdminTeamClient />
}
