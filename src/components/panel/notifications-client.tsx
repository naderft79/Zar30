// ============================================
// Zarnama - Notifications Center (Phase 3)
// ============================================
// لیست اعلان‌ها + read/unread — engine کامل در Phase بعدی
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-bold">اعلان‌ها</h1>

      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="text-gold size-5" />
            اعلان‌های اخیر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {items === null && !error && (
            <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
          )}
          {items?.length === 0 && (
            <div className="border-border/60 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
              <BellOff className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">اعلانی وجود ندارد</p>
            </div>
          )}
          {items?.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n)}
              className="border-border/40 hover:bg-muted/50 flex w-full items-start justify-between gap-3 border-b py-3 text-right last:border-0"
            >
              <div className="min-w-0">
                <p className="text-foreground flex items-center gap-2 text-sm font-medium">
                  {n.title}
                  {!n.read && (
                    <Badge variant="secondary" className="text-xs">
                      جدید
                    </Badge>
                  )}
                </p>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{n.body}</p>
              </div>
              <span className="text-muted-foreground shrink-0 text-xs" dir="ltr">
                {new Date(n.createdAt).toLocaleDateString('fa-IR')}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
