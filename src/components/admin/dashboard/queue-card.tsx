// ============================================
// Zar30 - Queue Card — کارت صف pending با ردیف‌های actionable و SLA
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { IconAlertTriangle } from '@tabler/icons-react'
import { AdminWidget } from './widget'
import { apiGetWithRefresh } from '@/lib/api/client'
import type { QueueRow, QueueSummaryItem } from '@/lib/services/admin-dashboard.service'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

function ageLabel(sec: number): string {
  if (sec < 60) return 'کمتر از ۱ دقیقه'
  if (sec < 3600) return `${toPersianDigits(Math.floor(sec / 60))} دقیقه`
  if (sec < 86400) return `${toPersianDigits(Math.floor(sec / 3600))} ساعت`
  return `${toPersianDigits(Math.floor(sec / 86400))} روز`
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'همین حالا'
  if (min < 60) return `${toPersianDigits(min)} دقیقه پیش`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${toPersianDigits(hr)} ساعت پیش`
  return `${toPersianDigits(Math.floor(hr / 24))} روز پیش`
}

export interface QueueCardProps {
  queue: QueueSummaryItem
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  /** اکشن‌های اضافی روی هر ردیف — در فاز ۷ وصل می‌شود */
  rowActions?: (row: QueueRow) => React.ReactNode
  onRefresh?: () => void
}

export function QueueCard({ queue, icon: QueueIcon, rowActions, onRefresh }: QueueCardProps) {
  const [rows, setRows] = useState<QueueRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ rows: QueueRow[] }>(
      `/api/v1/admin/dashboard/queues/${queue.key}`,
    )
    if (!res.ok) {
      setError(res.error ?? 'خطا در بارگذاری')
      return
    }
    setError(null)
    setRows(res.data!.rows)
  }, [queue.key])

  useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [load])

  const slaColor =
    queue.sla === 'breach'
      ? 'text-error'
      : queue.sla === 'warning'
        ? 'text-warning'
        : 'text-muted-foreground'

  return (
    <AdminWidget
      id={`queue-${queue.key}`}
      title={queue.label}
      icon={QueueIcon}
      permission={queue.permission}
      viewAllHref={queue.href}
      onRefresh={() => {
        void load()
        onRefresh?.()
      }}
      subtitle={
        queue.oldestAgeSec !== null ? `قدیمی‌ترین: ${ageLabel(queue.oldestAgeSec)}` : 'صف خالی است'
      }
      footer={
        queue.sla !== 'ok' ? (
          <span className={cn('inline-flex items-center gap-1 font-semibold', slaColor)}>
            <IconAlertTriangle className="size-3" strokeWidth={2} aria-hidden="true" />
            {queue.sla === 'breach' ? 'SLA نقض شده' : 'نزدیک به SLA'}
          </span>
        ) : undefined
      }
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span
          className={cn(
            'text-2xl font-bold tabular-nums',
            queue.count > 0 ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {toPersianDigits(queue.count)}
        </span>
      </div>

      {rows === null ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-9 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <p className="border-error/30 bg-error/5 text-error rounded-lg border border-dashed px-3 py-2 text-[11px]">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[11px]">
          موردی در صف نیست
        </p>
      ) : (
        <ul className="divide-border/40 divide-y">
          {rows.map((row) => (
            <li key={row.id} className="group py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <Link
                  href={row.href}
                  className="focus-visible:ring-ring min-w-0 flex-1 rounded-md focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground truncate text-xs font-semibold">
                      {row.title}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
                      {relTime(row.at)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate text-[10px]">
                      {row.subtitle}
                    </span>
                    {row.amount && (
                      <span className="text-gold-700 dark:text-gold-300 text-[11px] font-bold tabular-nums">
                        {formatExactAmount(row.amount)} تومان
                      </span>
                    )}
                  </span>
                </Link>
                {rowActions && (
                  <div className="flex shrink-0 items-center gap-0.5">{rowActions(row)}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminWidget>
  )
}
