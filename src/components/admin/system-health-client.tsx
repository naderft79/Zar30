// ============================================
// Zar30 - Admin System Health Client
// ============================================
// وضعیت DB/Redis + uptime + صف‌های عملیاتی — auto-refresh هر ۳۰s
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconActivity, IconCheck, IconRefresh, IconX } from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

interface Health {
  status: 'healthy' | 'degraded'
  checks: { name: string; ok: boolean; latencyMs?: number; detail?: string }[]
  uptimeSeconds: number
  runtime: { node: string; env: string }
  queues: {
    pendingKyc: number
    pendingWithdrawals: number
    pendingOrders: number
    openTickets: number
    unreviewedRisk: number
  }
  checkedAt: string
}

const QUEUE_LABELS: Record<keyof Health['queues'], string> = {
  pendingKyc: 'KYC در انتظار',
  pendingWithdrawals: 'برداشت در انتظار',
  pendingOrders: 'سفارش در انتظار',
  openTickets: 'تیکت باز',
  unreviewedRisk: 'رویداد ریسک بررسی‌نشده',
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d) parts.push(`${toPersianDigits(d)} روز`)
  if (h) parts.push(`${toPersianDigits(h)} ساعت`)
  parts.push(`${toPersianDigits(m)} دقیقه`)
  return parts.join(' و ')
}

export function AdminSystemHealthClient() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(manual = false) {
    if (manual) setRefreshing(true)
    const res = await apiGetWithRefresh<{ health: Health }>('/api/v1/admin/system/health')
    setRefreshing(false)
    if (res.ok && res.data?.health) {
      setHealth(res.data.health)
      setError(null)
    } else {
      setError(res.error ?? 'بارگذاری ناموفق بود')
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ health: Health }>('/api/v1/admin/system/health')
      if (!cancelled && res.ok && res.data?.health) setHealth(res.data.health)
      else if (!cancelled) setError(res.error ?? 'بارگذاری ناموفق بود')
    })()
    const t = setInterval(() => {
      if (!cancelled) void load()
    }, 30_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="سلامت سیستم"
        eyebrow="مدیریت سیستم"
        description="وضعیت زیرساخت — PostgreSQL و Redis — + صف‌های عملیاتی؛ هر ۳۰ ثانیه به‌روز می‌شود"
        actions={
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="border-border/60 text-foreground hover:bg-muted flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-60"
          >
            <IconRefresh
              className={`size-4 ${refreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            به‌روزرسانی
          </button>
        }
      />

      {error && !health && (
        <p
          role="alert"
          className="border-error/30 bg-error/5 text-error rounded-xl border p-4 text-xs"
        >
          {error}
        </p>
      )}

      {health ? (
        <div className="space-y-6">
          {/* ===== وضعیت کلی ===== */}
          <div
            className={`rounded-2xl border p-5 ${
              health.status === 'healthy'
                ? 'border-success/30 bg-success/5'
                : 'border-error/30 bg-error/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {health.status === 'healthy' ? (
                <IconCheck className="text-success size-6" aria-hidden="true" />
              ) : (
                <IconX className="text-error size-6" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {health.status === 'healthy'
                    ? 'همه سرویس‌ها سالم‌اند'
                    : 'اختلال در برخی سرویس‌ها'}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  آخرین بررسی: {new Date(health.checkedAt).toLocaleString('fa-IR')} · uptime{' '}
                  {formatUptime(health.uptimeSeconds)} · Node {health.runtime.node} ·{' '}
                  {health.runtime.env}
                </p>
              </div>
            </div>
          </div>

          {/* ===== چک‌های سرویس ===== */}
          <div className="grid gap-3 sm:grid-cols-2">
            {health.checks.map((c) => (
              <div
                key={c.name}
                className="bg-card border-border/60 flex items-center justify-between rounded-xl border p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      c.ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}
                  >
                    {c.ok ? (
                      <IconCheck className="size-4" aria-hidden="true" />
                    ) : (
                      <IconX className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-bold" dir="ltr">
                      {c.name}
                    </p>
                    {c.latencyMs !== undefined && (
                      <p className="text-muted-foreground text-[10px] tabular-nums">
                        {toPersianDigits(c.latencyMs)}ms
                      </p>
                    )}
                    {c.detail && (
                      <p
                        className="text-error max-w-48 truncate text-[9px]"
                        dir="ltr"
                        title={c.detail}
                      >
                        {c.detail}
                      </p>
                    )}
                  </div>
                </div>
                <AdminStatusDot ok={c.ok} />
              </div>
            ))}
          </div>

          {/* ===== صف‌های عملیاتی ===== */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <IconActivity className="text-muted-foreground size-4" aria-hidden="true" />
              صف‌های عملیاتی
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(health.queues).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-card border-border/60 rounded-xl border p-3 text-center"
                >
                  <p
                    className={`text-lg font-bold tabular-nums ${value > 0 ? 'text-warning' : 'text-success'}`}
                  >
                    {toPersianDigits(value)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">
                    {QUEUE_LABELS[key as keyof Health['queues']]}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        !error && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function AdminStatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-label={ok ? 'سالم' : 'خطا'}
      className={`size-2.5 rounded-full ${ok ? 'bg-success animate-pulse-soft' : 'bg-error'}`}
    />
  )
}
