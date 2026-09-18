// ============================================
// Zarnama - User Panel Layout (Phase 3)
// ============================================
// همه صفحات /dashboard/* داخل PanelShell — sidebar (desktop) + bottom nav (mobile)
// ============================================

import type { Metadata } from 'next'
import { PanelShell } from '@/components/panel/panel-shell'

export const metadata: Metadata = {
  title: { template: '%s | زرنما', default: 'پنل کاربری | زرنما' },
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>
}
