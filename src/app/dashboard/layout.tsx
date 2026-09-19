// ============================================
// Zar30 - User Panel Layout (Phase 3)
// ============================================
// همه صفحات /dashboard/* داخل PanelShell — sidebar (desktop) + bottom nav (mobile)
// ============================================

import type { Metadata } from 'next'
import { PanelShell } from '@/components/panel/panel-shell'

export const metadata: Metadata = {
  title: { template: '%s | زرسی', default: 'پنل کاربری | زرسی' },
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>
}
