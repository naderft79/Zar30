// ============================================
// Zar30 - Notifications Center (Full Panel Redesign)
// ============================================
// مرکز اعلان — فیلتر «همه / خوانده‌نشده» + آیکون دسته‌بندی + unread state
// از طریق bell در Header در دسترس است (nav item نیست)
// ============================================

'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  BellOff,
  CalendarClock,
  Repeat,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { SkeletonListItem } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from './page-header'
import { cn } from 'cn'

interface NotificationView {
  id: string
  type: string
  title: string
  body: string
  channel: string
  read: boolean
  createdAt: string
}

// دسته‌بندی بصری اعلان بر اساس نوع — یک خانواده آیکون (Lucide)
const TYPE_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  SECURITY: { icon: ShieldCheck, className: 'bg-error/10 text-error' },
  ORDER: { icon: Repeat, className: 'bg-gold-500/15 text-gold-600 dark:text-gold-400' },
  TRANSACTION: { icon: Wallet, className: 'bg-info/10 text-info' },
  INSTALLMENT: { icon: CalendarClock, className: 'bg-navy-500/10 text-navy-300' },
}

function typeVisual(type: string) {
  const key = Object.keys(TYPE_ICONS).find((k) => type.toUpperCase().includes(k))
  return key ? TYPE_ICONS[key]! : { icon: Bell, className: 'bg-muted text-muted-foreground' }
}

type Filter = 'all' | 'unread'

export function NotificationsClient() {
  const [items, setItems] = useState<NotificationView[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ notifications: NotificationView[] }>(
        '/api/v1/users/notifications',
      )
      if (cancelled) return
      if (res.ok) setItems(res.data!.notifications)
      else setError(res.error ?? 'بارگذاری اعلان‌ها ناموفق بود')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function markRead(n: NotificationView) {
    if (n.read) return
    const res = await apiPost(`/api/v1/users/notifications/${n.id}/read`)
    if (res.ok) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? prev)
    }
  }

  const unreadCount = items?.filter((n) => !n.read).length ?? 0
  const visible = items?.filter((n) => filter === 'all' || !n.read) ?? []

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader
        title="اعلان‌ها"
        description={
          unreadCount > 0 ? `${unreadCount} اعلان خوانده‌نشده` : 'مرکز اعلان‌های حساب شما'
        }
      />

      {error && (
        <p role="alert" className="bg-error/10 text-error rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {/* فیلترها — tablist ساده */}
      <div
        role="tablist"
        aria-label="فیلتر اعلان‌ها"
        className="bg-muted/50 border-border/60 inline-flex rounded-xl border p-1"
      >
        {(
          [
            { key: 'all', label: 'همه' },
            { key: 'unread', label: 'خوانده‌نشده' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-(--duration-fast)',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              filter === t.key
                ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span className="bg-gold-500/20 mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="text-gold-500 size-5" strokeWidth={1.75} />
            اعلان‌های اخیر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items === null && !error && (
            <div className="divide-border/40 divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          )}
          {items?.length === 0 && (
            <EmptyState
              icon={BellOff}
              title="اعلان جدیدی ندارید"
              description="اطلاعیه‌های مهم حساب، معاملات و امنیت اینجا نمایش داده می‌شوند."
            />
          )}
          {items !== null && items.length > 0 && visible.length === 0 && (
            <EmptyState icon={BellOff} title="اعلان خوانده‌نشده‌ای ندارید" />
          )}
          <div className="divide-border/40 divide-y">
            {visible.map((n) => {
              const visual = typeVisual(n.type)
              const Icon = visual.icon
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    'hover:bg-muted/50 flex w-full items-start justify-between gap-3 rounded-lg px-2 py-3.5 text-right transition-colors',
                    'focus-visible:bg-muted focus-visible:outline-none',
                    !n.read && 'bg-gold-500/5',
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {/* آیکون دسته‌بندی */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg',
                        visual.className,
                      )}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-foreground flex flex-wrap items-center gap-2 text-sm font-medium">
                        {n.title}
                        {!n.read && (
                          <StatusBadge tone="gold" dot={false}>
                            جدید
                          </StatusBadge>
                        )}
                      </p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-5">
                        {n.body}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-muted-foreground text-[11px]" dir="ltr">
                      {new Date(n.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                    {!n.read && (
                      <span
                        aria-hidden="true"
                        className="bg-gold-500 animate-pulse-soft size-1.5 rounded-full"
                      />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
