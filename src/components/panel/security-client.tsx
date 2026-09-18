// ============================================
// Zarnama - Security Center (Phase 3)
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
import { Badge } from '@/components/ui/badge'

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
  const [events, setEvents] = useState<SecurityEvent[]>([])
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
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-bold">مرکز امنیت</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Account security status */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="text-gold size-5" />
              وضعیت امنیت حساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Smartphone className="size-4" />
                تایید موبایل (OTP)
              </span>
              <Badge variant={user.mobileVerifiedAt ? 'secondary' : 'outline'}>
                {user.mobileVerifiedAt ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="size-4" />
                احراز دو مرحله‌ای (2FA)
              </span>
              <Badge variant="outline" className="text-xs">
                به‌زودی
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <MonitorSmartphone className="size-4" />
                مدیریت نشست‌ها
              </span>
              <Link
                href="/dashboard/sessions"
                className="text-gold inline-flex items-center gap-1 text-sm hover:underline"
              >
                مشاهده
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Password change */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="text-gold size-5" />
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
                      ? 'bg-secondary/50 text-foreground rounded-md px-3 py-2 text-sm'
                      : 'bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm'
                  }
                >
                  {pwMsg.text}
                </p>
              )}
              <Button type="submit" size="sm" disabled={saving || !currentPassword || !newPassword}>
                {saving ? 'در حال تغییر…' : 'تغییر رمز'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Security events */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="text-gold size-5" />
            رویدادهای امنیتی اخیر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 && (
            <p className="text-muted-foreground text-sm">رویدادی ثبت نشده است.</p>
          )}
          {events.map((ev) => (
            <div
              key={ev.id}
              className="border-border/40 flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0"
            >
              <span className="text-foreground">{ACTION_LABELS[ev.action] ?? ev.action}</span>
              <span className="text-muted-foreground text-xs" dir="ltr">
                {ev.ip ?? '—'} · {new Date(ev.createdAt).toLocaleString('fa-IR')}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
