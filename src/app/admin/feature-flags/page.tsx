import type { Metadata } from 'next'
import { AdminFeatureFlagsClient } from '@/components/admin/platform-list-clients'
export const metadata: Metadata = { title: 'Feature Flags' }
export default function Page() {
  return <AdminFeatureFlagsClient />
}
