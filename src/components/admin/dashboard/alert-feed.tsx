// ============================================
// Zar30 - Alert Feed — هشدارهای عملیاتی (تراکنش ناموفق، مغایرت)
// ============================================

'use client'

import Link from 'next/link'
import { IconBellExclamation, IconCircleFilled } from '@tabler/icons-react'
import { AdminWidget } from './widget'
import type { DashboardAlert } from '@/lib/services/admin-dashboard.service'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

const SEVERITY_STYLE: Record<DashboardAlert['severity'], string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'همین حالا'
  if (min < 60) return `${toPersianDigits(min)} دقیقه پیش`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${toPersianDigits(hr)} ساعت پیش`
  return new Date(iso).toLocaleDateString('fa-IR')
}

export function AlertFeed({ alerts, loading }: { alerts: DashboardAlert[]; loading?: boolean }) {
  return (
    <AdminWidget
      id="alerts"
      title="هشدارها"
      icon={IconBellExclamation}
      loading={loading}
      skeletonHeight="h-24"
    >
      {alerts.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[11px]">
          هشدار فعالی نیست — همه‌چیز عادی است
        </p>
      ) : (
        <ul className="divide-border/40 divide-y">
          {alerts.map((a) => (
            <li key={a.id} className="py-2 first:pt-0 last:pb-0">
              <Link
                href={a.href}
                className="hover:bg-muted/50 focus-visible:ring-ring -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <IconCircleFilled
                  className={cn('mt-1 size-2 shrink-0', SEVERITY_STYLE[a.severity])}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="text-foreground block truncate text-xs font-semibold">
                    {a.title}
                  </span>
                  {a.detail && (
                    <span className="text-muted-foreground mt-0.5 block truncate text-[10px]">
                      {a.detail}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                  {relTime(a.at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminWidget>
  )
}
