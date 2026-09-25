// ============================================
// Zar30 - Feed Widgets — audit + broadcast + online + health
// ============================================

'use client'

import { IconActivity, IconBroadcast, IconHeartbeat, IconUsers } from '@tabler/icons-react'
import { AdminWidget } from './widget'
import type { DashboardFeeds, HealthProbe } from '@/lib/services/admin-dashboard.service'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'همین حالا'
  if (min < 60) return `${toPersianDigits(min)}د پیش`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${toPersianDigits(hr)}س پیش`
  return new Date(iso).toLocaleDateString('fa-IR')
}

const ACTION_LABELS: Record<string, string> = {
  'kyc.approve': 'تایید KYC',
  'kyc.reject': 'رد KYC',
  'withdrawals.approve': 'تایید برداشت',
  'withdrawals.reject': 'رد برداشت',
  'orders.reverse': 'برگشت سفارش',
  'system.kill_switch.halt': 'توقف اضطراری',
  'system.kill_switch.resume': 'از سرگیری',
  'dashboard.note.add': 'یادداشت جدید',
  'dashboard.note.delete': 'حذف یادداشت',
  'settings.update': 'ویرایش تنظیمات',
  'seo.update': 'ویرایش SEO',
  'notification.broadcast': 'اعلان گروهی',
  'team.member.update': 'ویرایش عضو تیم',
}

// ============================================
// Audit Feed — آخرین اقدامات ادمین
// ============================================

export function AuditFeedWidget({
  feeds,
  loading,
  error,
  onRefresh,
}: {
  feeds: DashboardFeeds | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  const rows = feeds?.audit ?? []

  return (
    <AdminWidget
      id="feed-audit"
      title="فعالیت‌های اخیر تیم"
      icon={IconActivity}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      skeletonHeight="h-48"
      viewAllHref="/admin/audit-logs"
    >
      {rows.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[11px]">
          فعالیتی ثبت نشده
        </p>
      ) : (
        <ul className="divide-border/40 divide-y">
          {rows.map((a) => (
            <li key={a.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-foreground truncate text-xs font-semibold">
                    {ACTION_LABELS[a.action] ?? a.action}
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                    {a.actor} · {a.entityType}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-[9px] tabular-nums">
                  {relTime(a.at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminWidget>
  )
}

// ============================================
// Broadcast Feed — آخرین اعلان‌های گروهی
// ============================================

const CHANNEL_LABEL: Record<string, string> = {
  IN_APP: 'داخل برنامه',
  PUSH: 'Push',
  SMS: 'پیامک',
  EMAIL: 'ایمیل',
}

const STATUS_STYLE: Record<string, string> = {
  SENT: 'bg-success/10 text-success',
  DELIVERED: 'bg-success/10 text-success',
  QUEUED: 'bg-warning/10 text-warning',
  FAILED: 'bg-error/10 text-error',
  READ: 'bg-info/10 text-info',
}

export function BroadcastFeedWidget({
  feeds,
  loading,
  error,
  onRefresh,
}: {
  feeds: DashboardFeeds | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  const rows = feeds?.broadcasts ?? []

  return (
    <AdminWidget
      id="feed-broadcast"
      title="اعلان‌های گروهی اخیر"
      icon={IconBroadcast}
      permission={PERMISSIONS.NOTIFICATIONS_READ}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      skeletonHeight="h-40"
      viewAllHref="/admin/notifications"
    >
      {rows.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[11px]">
          اعلانی ارسال نشده
        </p>
      ) : (
        <ul className="divide-border/40 divide-y">
          {rows.map((b) => (
            <li key={b.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-foreground truncate text-xs font-semibold">{b.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">
                    {CHANNEL_LABEL[b.channel] ?? b.channel} · {relTime(b.at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold',
                    STATUS_STYLE[b.status] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {b.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminWidget>
  )
}

// ============================================
// Online Admins — مدیران آنلاین ۵ دقیقه اخیر
// ============================================

export function OnlineAdminsWidget({
  feeds,
  loading,
  error,
}: {
  feeds: DashboardFeeds | null
  loading?: boolean
  error?: string | null
}) {
  const online = feeds?.onlineAdmins

  return (
    <AdminWidget
      id="feed-online"
      title="مدیران آنلاین"
      subtitle="۵ دقیقه اخیر"
      icon={IconUsers}
      loading={loading}
      error={error}
      skeletonHeight="h-32"
      viewAllHref="/admin/team"
    >
      {online && (
        <div>
          <p className="text-foreground mb-3 text-2xl font-bold tabular-nums">
            {toPersianDigits(online.count)}
          </p>
          {online.admins.length === 0 ? (
            <p className="text-muted-foreground text-[11px]">مدیر آنلاینی نیست</p>
          ) : (
            <ul className="space-y-1.5">
              {online.admins.slice(0, 5).map((a) => (
                <li key={a.adminId} className="flex items-center justify-between gap-2">
                  <span className="text-foreground truncate text-xs">
                    {a.name ?? a.mobile ?? '—'}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[9px]">{a.roleLabel}</span>
                </li>
              ))}
              {online.admins.length > 5 && (
                <li className="text-muted-foreground pt-1 text-[9px]">
                  + {toPersianDigits(online.admins.length - 5)} مدیر دیگر
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </AdminWidget>
  )
}

// ============================================
// Health Compact — DB + Redis
// ============================================

function ProbeDot({ probe }: { probe: HealthProbe }) {
  return (
    <span
      className={cn(
        'inline-block size-2 rounded-full',
        probe.ok ? 'bg-success' : 'bg-error animate-pulse-soft',
      )}
      aria-label={probe.ok ? `${probe.name} سالم` : `${probe.name} قطع`}
    />
  )
}

export function HealthWidget({
  health,
  loading,
}: {
  health: { db: HealthProbe; redis: HealthProbe; uptimeSeconds: number } | null
  loading?: boolean
}) {
  const uptimeH = health ? Math.floor(health.uptimeSeconds / 3600) : null

  return (
    <AdminWidget
      id="health"
      title="سلامت سیستم"
      icon={IconHeartbeat}
      loading={loading}
      skeletonHeight="h-20"
      viewAllHref="/admin/system/health"
    >
      {health && (
        <div className="space-y-2">
          {[
            { probe: health.db, label: 'PostgreSQL' },
            { probe: health.redis, label: 'Redis' },
          ].map(({ probe, label }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ProbeDot probe={probe} />
                <span className="text-foreground text-xs font-medium">{label}</span>
              </span>
              <span className="text-muted-foreground text-[10px] tabular-nums">
                {probe.ok && probe.latencyMs !== undefined
                  ? `${toPersianDigits(probe.latencyMs)}ms`
                  : probe.ok
                    ? 'سالم'
                    : 'قطع'}
              </span>
            </div>
          ))}
          <div className="border-border/40 flex items-center justify-between border-t pt-2">
            <span className="text-muted-foreground text-[10px]">آپ‌تایم</span>
            <span className="text-foreground text-[10px] font-semibold tabular-nums">
              {uptimeH !== null ? `${toPersianDigits(uptimeH)} ساعت` : '—'}
            </span>
          </div>
        </div>
      )}
    </AdminWidget>
  )
}
