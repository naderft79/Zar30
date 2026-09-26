// ============================================
// Zar30 - Trade Terminal — Orders History (Card)
// ============================================
// تنها بخشی از صفحه که Card استاندارد پنل می‌گیرد — تاریخچه
// pagination واقعی از meta + فیلتر نوع + ردیف کامل با قیمت/کارمزد
// ============================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import { IconArrowDownLeft, IconArrowUpLeft, IconHistory, IconRepeat } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiGetWithRefresh, type ApiMeta } from '@/lib/api/client'
import { formatExactAmount, formatGoldAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

interface OrderRow {
  id: string
  type: 'BUY' | 'SELL'
  goldAmount: string
  tomanAmount: string
  unitPrice: string
  fee: string
  total: string
  status: string
  createdAt: string
}

type TypeFilter = 'ALL' | 'BUY' | 'SELL'

const PAGE_SIZE = 10

const STATUS_FA: Record<string, string> = {
  FILLED: 'انجام‌شده',
  REVERSED: 'برگشت‌خورده',
  PENDING: 'در انتظار',
}

interface OrdersHistoryProps {
  refreshKey?: number
  className?: string
}

export function OrdersHistory({ refreshKey = 0, className }: OrdersHistoryProps) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ orders: OrderRow[] }>(
        `/api/v1/orders?page=${page}&limit=${PAGE_SIZE}`,
      )
      if (cancelled) return
      if (res.ok) {
        setOrders(res.data?.orders ?? [])
        const meta = res.meta as ApiMeta | undefined
        setTotalPages(meta?.totalPages ?? 1)
      }
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [page, refreshKey])

  const visible = useMemo(
    () => (typeFilter === 'ALL' ? orders : orders.filter((o) => o.type === typeFilter)),
    [orders, typeFilter],
  )

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconHistory className="text-gold-600 size-5" stroke={1.75} />
          تاریخچه معاملات
        </CardTitle>
        <div className="bg-muted/60 inline-flex rounded-lg p-0.5">
          {(
            [
              { key: 'ALL' as const, label: 'همه' },
              { key: 'BUY' as const, label: 'خرید' },
              { key: 'SELL' as const, label: 'فروش' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              aria-pressed={typeFilter === key}
              className={cn(
                'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors',
                typeFilter === key
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <div className="skeleton-shimmer h-24 rounded-xl" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={IconRepeat}
            title={
              typeFilter === 'ALL'
                ? 'هنوز معامله‌ای انجام نداده‌اید'
                : typeFilter === 'BUY'
                  ? 'خریدی در این صفحه نیست'
                  : 'فروشی در این صفحه نیست'
            }
            description="پس از اولین معامله، تاریخچه کامل شما اینجا ثبت می‌شود."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {visible.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {o.type === 'BUY' ? (
                    <IconArrowDownLeft className="text-gold-600 size-6 shrink-0" stroke={1.75} />
                  ) : (
                    <IconArrowUpLeft
                      className="text-muted-foreground size-6 shrink-0"
                      stroke={1.75}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground text-xs font-semibold">
                      {o.type === 'BUY' ? 'خرید' : 'فروش'} —{' '}
                      <span className="tabular-nums" dir="ltr">
                        {formatGoldAmount(o.goldAmount)} گرم
                      </span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums" dir="ltr">
                      واحد: {formatExactAmount(o.unitPrice)} · کارمزد: {formatExactAmount(o.fee)}
                    </p>
                    <p className="text-muted-foreground/80 text-[10px] tabular-nums">
                      {new Date(o.createdAt).toLocaleString('fa-IR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-left">
                  <p
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      o.type === 'BUY' ? 'text-foreground' : 'text-success',
                    )}
                    dir="ltr"
                  >
                    {o.type === 'BUY' ? '−' : '+'}
                    {formatExactAmount(o.total)}{' '}
                    <span className="text-muted-foreground">تومان</span>
                  </p>
                  <StatusBadge
                    tone={
                      o.status === 'FILLED' ? 'gold' : o.status === 'REVERSED' ? 'error' : 'neutral'
                    }
                    dot={false}
                    className="mt-1"
                  >
                    {STATUS_FA[o.status] ?? o.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="border-border/40 mt-2 flex items-center justify-between border-t pt-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-gold-700 disabled:text-muted-foreground/50 text-[11px] font-semibold transition-colors"
            >
              قبلی
            </button>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-gold-700 disabled:text-muted-foreground/50 text-[11px] font-semibold transition-colors"
            >
              بعدی
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
