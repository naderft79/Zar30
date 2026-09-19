// ============================================
// Zarnama - Security Center (Phase 3.1 — Premium Redesign)
// ============================================
// نشست‌های فعال + تغییر رمز + رویدادهای امنیتی + 2FA readiness
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  History,
  KeyRound,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { SkeletonListItem } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from './page-header'

interface SecurityEvent {
  id: string
  action: string
  ip: string | null
  userAgent: string | null
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTERED: 'ثبت‌نام',
  MOBILE_VERIFIED: 'تایید موبایل',
  USER_LOGIN: 'ورود',
  USER_LOGOUT: 'خروج',
  SECURITY_SESSION_REVOKED: 'لغو نشست',
  SESSION_REVOKE: 'لغو نشست',
  SESSION_REVOKE_OTHERS: 'خروج از سایر نشست‌ها',
  SESSION_REVOKE_ALL: 'خروج از همه نشست‌ها',
  SECURITY_PASSWORD_RESET: 'بازیابی رمز عبور',
  SECURITY_PASSWORD_CHANGED: 'تغییر رمز عبور',
  PROFILE_UPDATE: 'به‌روزرسانی پروفایل',
  REFRESH_REUSE_DETECTED: 'شناسایی استفاده مجدد توکن',
}

export function SecurityClient() {
  const { user } = usePanelUser()
  const [events, setEvents] = useState<SecurityEvent[] | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ events: SecurityEvent[] }>(
        '/api/v1/users/security-events',
      )
      if (!cancelled && res.ok) setEvents(res.data!.events)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)
    setSaving(true)
    const res = await apiPost('/api/v1/auth/password/change', {
      currentPassword,
      newPassword,
    })
    setSaving(false)
    if (!res.ok) {
      setPwMsg({ ok: false, text: res.error ?? 'تغییر رمز ناموفق بود' })
      return
    }
    setPwMsg({ ok: true, text: 'رمز عبور تغییر کرد — سایر نشست‌ها لغو شدند' })
    setCurrentPassword('')
    setNewPassword('')
  }

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="مرکز امنیت" description="مدیریت امنیت حساب و دسترسی‌ها" />

      <div className="grid gap-5 md:grid-cols-2">
        {/* وضعیت امنیت حساب */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="text-gold-500 size-5" strokeWidth={1.75} />
              وضعیت امنیت حساب
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-border/40 divide-y text-sm">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground flex items-center gap-2">
                <Smartphone className="size-4" />
                تایید موبایل (OTP)
              </span>
              <StatusBadge tone={user.mobileVerifiedAt ? 'success' : 'warning'}>
                {user.mobileVerifiedAt ? 'فعال' : 'غیرفعال'}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="size-4" />
                احراز دو مرحله‌ای (2FA)
              </span>
              <StatusBadge tone="gold" dot={false}>
                به‌زودی
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground flex items-center gap-2">
                <MonitorSmartphone className="size-4" />
                مدیریت نشست‌ها
              </span>
              <Link
                href="/dashboard/profile/sessions"
                className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                مشاهده
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* تغییر رمز عبور */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="text-gold-500 size-5" strokeWidth={1.75} />
              تغییر رمز عبور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-3" noValidate>
              <Input
                type="password"
                placeholder="رمز عبور فعلی"
                dir="ltr"
                className="text-left"
                autoComplete="current-password"
                aria-label="رمز عبور فعلی"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="رمز عبور جدید (حداقل ۸ کاراکتر)"
                dir="ltr"
                className="text-left"
                autoComplete="new-password"
                aria-label="رمز عبور جدید"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {pwMsg && (
                <p
                  role="alert"
                  className={
                    pwMsg.ok
                      ? 'bg-success/10 text-success rounded-lg px-3 py-2 text-sm'
                      : 'bg-error/10 text-error rounded-lg px-3 py-2 text-sm'
                  }
                >
                  {pwMsg.text}
                </p>
              )}
              <Button
                type="submit"
                variant="gold"
                size="sm"
                disabled={saving || !currentPassword || !newPassword}
              >
                {saving ? 'در حال تغییر…' : 'تغییر رمز'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* رویدادهای امنیتی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="text-gold-500 size-5" strokeWidth={1.75} />
            رویدادهای امنیتی اخیر
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events === null && (
            <div className="divide-border/40 divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </div>
          )}
          {events?.length === 0 && <EmptyState icon={History} title="رویدادی ثبت نشده است" />}
          <div className="divide-border/40 divide-y">
            {events?.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-foreground">{ACTION_LABELS[ev.action] ?? ev.action}</span>
                <span className="text-muted-foreground text-xs" dir="ltr">
                  {ev.ip ?? '—'} · {new Date(ev.createdAt).toLocaleString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
