// ============================================
// Zar30 - Sessions Management (Phase 3.1 — Premium Redesign)
// ============================================
// نشست‌های فعال — device/browser/IP/current + revoke + logout others
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { LogOut, Monitor, MonitorSmartphone, Smartphone, Tablet } from 'lucide-react'
import { apiDelete, apiGetWithRefresh } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { SkeletonListItem } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from './page-header'
import { cn } from 'cn'

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
    <div className="animate-stagger space-y-5">
      <PageHeader
        title="دستگاه‌ها و نشست‌ها"
        description="دستگاه‌های متصل به حساب شما را مدیریت کنید"
        actions={
          <Button variant="outline" size="sm" onClick={logoutOthers} disabled={busy}>
            <LogOut className="size-4" />
            خروج از سایر نشست‌ها
          </Button>
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
            <MonitorSmartphone className="text-gold-500 size-5" strokeWidth={1.75} />
            دستگاه‌های متصل
            {sessions !== null && (
              <StatusBadge tone="neutral" dot={false}>
                {sessions.length} نشست
              </StatusBadge>
            )}
          </CardTitle>
          {/* خلاصه نشست جاری — همیشه نمایان (desktop table + mobile cards هر دو) */}
          {(() => {
            const current = sessions?.find((s) => s.isCurrent)
            return current ? (
              <p className="text-muted-foreground mt-2 text-xs">
                نشست جاری: {current.browser} · {current.os}
              </p>
            ) : null
          })()}
        </CardHeader>
        <CardContent>
          {sessions === null && !error && (
            <div className="divide-border/40 divide-y">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          )}
          {sessions?.length === 0 && (
            <EmptyState icon={MonitorSmartphone} title="نشست فعالی یافت نشد" />
          )}

          {/* ===== Desktop — جدول داده premium ===== */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/60 text-muted-foreground border-b text-xs">
                  <th scope="col" className="py-3 pr-1 text-right font-medium">
                    دستگاه
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    مرورگر / سیستم‌عامل
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    نشانی IP
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    شروع نشست
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    وضعیت
                  </th>
                  <th scope="col" className="py-3 pl-1 text-left font-medium">
                    <span className="sr-only">عملیات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {sessions?.map((s) => {
                  const Icon = DEVICE_ICONS[s.device] ?? MonitorSmartphone
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        'transition-colors',
                        s.isCurrent ? 'bg-gold-500/5' : 'hover:bg-muted/40',
                      )}
                    >
                      <td className="py-3.5 pr-1">
                        <span
                          className={cn(
                            'inline-flex size-9 items-center justify-center rounded-lg',
                            s.isCurrent
                              ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          <Icon className="size-4.5" strokeWidth={1.75} />
                        </span>
                      </td>
                      <td className="text-foreground py-3.5 font-medium">
                        {s.browser} · {s.os}
                      </td>
                      <td className="text-muted-foreground py-3.5 text-xs tabular-nums" dir="ltr">
                        {s.ip ?? '—'}
                      </td>
                      <td className="text-muted-foreground py-3.5 text-xs">
                        {new Date(s.createdAt).toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3.5">
                        {s.isCurrent ? (
                          <StatusBadge tone="gold" dot={false}>
                            نشست جاری
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral" dot={false}>
                            فعال
                          </StatusBadge>
                        )}
                      </td>
                      <td className="py-3.5 pl-1 text-left">
                        {!s.isCurrent && (
                          <Button variant="outline" size="sm" onClick={() => revoke(s.id)}>
                            لغو
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ===== Mobile — کارت‌های تعاملی ===== */}
          <div className="space-y-3 md:hidden">
            {sessions?.map((s) => {
              const Icon = DEVICE_ICONS[s.device] ?? MonitorSmartphone
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors',
                    s.isCurrent
                      ? 'border-gold-500/30 bg-gold-500/5'
                      : 'border-border/60 bg-muted/20',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                        s.isCurrent
                          ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span className="truncate">
                          {s.browser} · {s.os}
                        </span>
                        {s.isCurrent && (
                          <StatusBadge tone="gold" dot={false}>
                            نشست جاری
                          </StatusBadge>
                        )}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs" dir="ltr">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
