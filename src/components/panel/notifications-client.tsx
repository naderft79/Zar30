// ============================================
// Zarnama - Notifications Center (Phase 3.1 — Premium Redesign)
// ============================================
// مرکز اعلان — از طریق bell در Header در دسترس است (nav item نیست)
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
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

export function NotificationsClient() {
  const [items, setItems] = useState<NotificationView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          <div className="divide-border/40 divide-y">
            {items?.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={cn(
                  'hover:bg-muted/50 flex w-full items-start justify-between gap-3 rounded-lg px-2 py-3.5 text-right transition-colors',
                  !n.read && 'bg-gold-500/5',
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  {/* نشانگر unread — dot طلایی */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full transition-colors',
                      n.read ? 'bg-border-strong/40' : 'bg-gold-500 animate-pulse-soft',
                    )}
                  />
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
                <span className="text-muted-foreground shrink-0 text-[11px]" dir="ltr">
                  {new Date(n.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
