import type { Metadata } from 'next'
import { PlansManager } from '@/components/admin/installment-plans-manager'

export const metadata: Metadata = {
  title: 'مدیریت طرح‌های اقساطی',
}

export default function AdminInstallmentPlansPage() {
  return <PlansManager />
}
