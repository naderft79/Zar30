// ============================================
// Zar30 - Quick Actions — اکشن‌های سریع داشبورد
// ============================================

'use client'

import Link from 'next/link'
import {
  IconBell,
  IconChartLine,
  IconFileExport,
  IconGauge,
  IconUserPlus,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/admin-shell'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'

interface QuickAction {
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  href: string
  permission: Permission
}

const ACTIONS: QuickAction[] = [
  {
    label: 'ارسال اعلان',
    icon: IconBell,
    href: '/admin/notifications?compose=1',
    permission: PERMISSIONS.NOTIFICATIONS_SEND,
  },
  {
    label: 'ثبت قیمت',
    icon: IconChartLine,
    href: '/admin/pricing',
    permission: PERMISSIONS.PRICING_UPDATE,
  },
  {
    label: 'خروجی گزارش',
    icon: IconFileExport,
    href: '/admin/reports',
    permission: PERMISSIONS.REPORTS_EXPORT,
  },
  {
    label: 'سلامت سیستم',
    icon: IconGauge,
    href: '/admin/system/health',
    permission: PERMISSIONS.SYSTEM_READ,
  },
  {
    label: 'مدیریت تیم',
    icon: IconUserPlus,
    href: '/admin/team',
    permission: PERMISSIONS.TEAM_READ,
  },
]

export function QuickActions() {
  const { admin } = useAdmin()
  const visible = ACTIONS.filter((a) => hasPermission(admin.permissions, a.permission))
  if (visible.length === 0) return null

  return (
    <div className="border-border/60 bg-card rounded-xl border p-4">
      <h2 className="text-foreground mb-3 text-sm font-bold">دسترسی سریع</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="border-border/60 bg-muted/30 text-foreground hover:border-gold-500/40 hover:bg-muted hover:text-gold-700 dark:hover:text-gold-300 focus-visible:ring-ring flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <a.icon
              className="text-muted-foreground size-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className="truncate">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
