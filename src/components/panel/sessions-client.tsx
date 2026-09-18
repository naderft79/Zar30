// ============================================
// Zarnama - Sessions Management (Phase 3)
// ============================================
// نشست‌های فعال — device/browser/IP/current + revoke + logout others
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { MonitorSmartphone, Smartphone, Monitor, Tablet, LogOut } from 'lucide-react'
import { apiDelete, apiGetWithRefresh } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface SessionView {
  id: string
  ip: string | null
  userAgent: string | null
  device: string
  os: string
  browser: string
  isCurrent: boolean
  createdAt: string
  expiresAt: string
}

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: MonitorSmartphone,
}

export function SessionsClient() {
  const [sessions, setSessions] = useState<SessionView[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const res = await apiGetWithRefresh<{ sessions: SessionView[] }>('/api/v1/users/sessions')
    if (res.ok) setSessions(res.data!.sessions)
    else setError(res.error ?? 'بارگذاری نشست‌ها ناموفق بود')
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ sessions: SessionView[] }>('/api/v1/users/sessions')
      if (cancelled) return
      if (res.ok) setSessions(res.data!.sessions)
      else setError(res.error ?? 'بارگذاری نشست‌ها ناموفق بود')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function revoke(id: string) {
    const res = await apiDelete(`/api/v1/users/sessions/${id}`)
    if (!res.ok) {
      setError(res.error ?? 'لغو نشست ناموفق بود')
      return
    }
    setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null)
  }

  async function logoutOthers() {
    setBusy(true)
    const res = await apiDelete<{ revoked: number }>('/api/v1/users/sessions')
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'خروج از سایر نشست‌ها ناموفق بود')
      return
    }
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-foreground text-2xl font-bold">نشست‌های فعال</h1>
        <Button variant="outline" size="sm" onClick={logoutOthers} disabled={busy}>
          <LogOut className="ml-2 size-4" />
          خروج از سایر نشست‌ها
        </Button>
      </div>

      {error && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MonitorSmartphone className="text-gold size-5" />
            دستگاه‌های متصل ({sessions?.length ?? '…'})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions === null && !error && (
            <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
          )}
          {sessions?.length === 0 && (
            <p className="text-muted-foreground text-sm">نشست فعالی یافت نشد.</p>
          )}
          {sessions?.map((s) => {
            const Icon = DEVICE_ICONS[s.device] ?? MonitorSmartphone
            return (
              <div
                key={s.id}
                className="border-border/60 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground flex items-center gap-2 text-sm">
                      <span className="truncate">
                        {s.browser} · {s.os}
                      </span>
                      {s.isCurrent && (
                        <Badge variant="secondary" className="text-xs">
                          نشست جاری
                        </Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs" dir="ltr">
                      {s.ip ?? '—'} · {new Date(s.createdAt).toLocaleString('fa-IR')}
                    </p>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button variant="outline" size="sm" onClick={() => revoke(s.id)}>
                    لغو
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
