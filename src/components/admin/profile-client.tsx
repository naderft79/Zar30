// ============================================
// Zar30 - Admin Profile Client
// ============================================
// هویت مدیر + نقش و permissionهای resolve‌شده + نشست‌ها + آخرین اقدامات
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconDeviceDesktop, IconKey, IconScript, IconShieldCheck } from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'

interface Profile {
  id: string
  role: string
  roleLabel: string
  active: boolean
  permissions: string[]
  overrides: { grant: string[]; revoke: string[] }
  user: {
    id: string
    mobile: string
    firstName: string | null
    lastName: string | null
    email: string | null
    lastLoginAt: string | null
    createdAt: string
  }
  sessions: {
    id: string
    deviceInfo: string | null
    ip: string | null
    userAgent: string | null
    createdAt: string
  }[]
  recentActions: {
    action: string
    entityType: string
    entityId: string | null
    createdAt: string
  }[]
}

function Field({
  label,
  value,
  ltr,
}: {
  label: string
  value: string | null | undefined
  ltr?: boolean
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <p className="text-muted-foreground text-[10px]">{label}</p>
      <p className="text-foreground mt-0.5 text-xs font-medium" dir={ltr ? 'ltr' : undefined}>
        {value ?? '—'}
      </p>
    </div>
  )
}

export function AdminProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ profile: Profile }>('/api/v1/admin/profile')
      if (cancelled) return
      if (res.ok && res.data?.profile) setProfile(res.data.profile)
      else setError(res.error ?? 'بارگذاری ناموفق بود')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <p
        role="alert"
        className="border-error/30 bg-error/5 text-error rounded-xl border p-4 text-xs"
      >
        {error}
      </p>
    )
  }

  if (!profile) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  const name =
    [profile.user.firstName, profile.user.lastName].filter(Boolean).join(' ') || profile.user.mobile

  return (
    <div className="space-y-6">
      <AdminPageHeader title="پروفایل مدیر" eyebrow="مدیریت سیستم" />

      {/* ===== هویت ===== */}
      <section className="bg-card border-border/60 rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <span className="from-gold-500/30 to-gold-600/20 text-gold-700 dark:text-gold-300 ring-gold-500/30 flex size-14 items-center justify-center rounded-full bg-gradient-to-bl text-lg font-bold ring-1">
            {name.slice(0, 2)}
          </span>
          <div>
            <p className="text-base font-bold">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="bg-gold-500/10 text-gold-700 dark:text-gold-300 rounded-md px-2 py-0.5 text-[11px] font-medium">
                {profile.roleLabel}
              </span>
              <AdminStatus status={profile.active ? 'ACTIVE' : 'BLOCKED'} />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Field label="موبایل" value={profile.user.mobile} ltr />
          <Field label="ایمیل" value={profile.user.email} ltr />
          <Field
            label="آخرین ورود"
            value={
              profile.user.lastLoginAt
                ? new Date(profile.user.lastLoginAt).toLocaleString('fa-IR')
                : null
            }
          />
          <Field
            label="عضویت در تیم"
            value={new Date(profile.user.createdAt).toLocaleDateString('fa-IR')}
          />
        </div>
      </section>

      {/* ===== دسترسی‌ها ===== */}
      <section className="bg-card border-border/60 rounded-xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <IconKey className="text-gold-500 size-4" aria-hidden="true" />
          دسترسی‌ها — {toPersianDigits(profile.permissions.length)} permission
        </h2>
        {(profile.overrides.grant.length > 0 || profile.overrides.revoke.length > 0) && (
          <div className="border-warning/30 bg-warning/5 mb-3 rounded-lg border p-3 text-[11px]">
            {profile.overrides.grant.length > 0 && (
              <p>
                grant:{' '}
                <span dir="ltr" className="font-mono">
                  {profile.overrides.grant.join(', ')}
                </span>
              </p>
            )}
            {profile.overrides.revoke.length > 0 && (
              <p>
                revoke:{' '}
                <span dir="ltr" className="font-mono">
                  {profile.overrides.revoke.join(', ')}
                </span>
              </p>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {profile.permissions.map((p) => (
            <span
              key={p}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[9px]"
              dir="ltr"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===== نشست‌ها ===== */}
        <section className="bg-card border-border/60 rounded-xl border p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <IconDeviceDesktop className="text-muted-foreground size-4" aria-hidden="true" />
            نشست‌های فعال — {toPersianDigits(profile.sessions.length)}
          </h2>
          {profile.sessions.length === 0 ? (
            <p className="text-muted-foreground text-xs">نشستی یافت نشد</p>
          ) : (
            <ul className="space-y-2">
              {profile.sessions.map((s) => (
                <li key={s.id} className="bg-muted/40 rounded-lg p-3">
                  <p
                    className="text-muted-foreground truncate text-[11px]"
                    title={s.userAgent ?? ''}
                  >
                    {s.deviceInfo ?? s.userAgent ?? 'دستگاه نامشخص'}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[9px] tabular-nums" dir="ltr">
                    {s.ip ?? '—'} · {new Date(s.createdAt).toLocaleString('fa-IR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ===== آخرین اقدامات ===== */}
        <section className="bg-card border-border/60 rounded-xl border p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <IconScript className="text-muted-foreground size-4" aria-hidden="true" />
            آخرین اقدامات ممیزی‌شده
          </h2>
          {profile.recentActions.length === 0 ? (
            <p className="text-muted-foreground text-xs">اقدامی ثبت نشده است</p>
          ) : (
            <ul className="space-y-1.5">
              {profile.recentActions.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <IconShieldCheck
                      className="text-muted-foreground size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate" dir="ltr">
                      {a.action}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[9px]">
                    {new Date(a.createdAt).toLocaleString('fa-IR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
