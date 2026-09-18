// ============================================
// Zarnama - Dashboard Client
// ============================================
// پروفایل + نشست‌های فعال + خروج — Client Component
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Monitor, ShieldCheck, Smartphone } from 'lucide-react'
import { apiDelete, apiGet, apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/shared/logo'

interface UserProfile {
  id: string
  mobile: string
  kycLevel: string
  status: string
}

interface SessionInfo {
  id: string
  ip: string | null
  userAgent: string | null
  deviceInfo: string | null
  createdAt: string
  expiresAt: string
}

const KYC_LABELS: Record<string, string> = {
  LEVEL_0: 'احراز نشده',
  LEVEL_1: 'سطح ۱ — موبایل تایید شده',
  LEVEL_2: 'سطح ۲ — هویتی',
  LEVEL_3: 'سطح ۳ — کامل',
}

export function DashboardClient() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      let me = await apiGet<{ user: UserProfile }>('/api/v1/auth/me')
      if (!me.ok) {
        // access token منقضی شده؟ → تلاش refresh با refresh cookie
        const refreshed = await apiPost('/api/v1/auth/refresh', {})
        if (refreshed.ok) me = await apiGet<{ user: UserProfile }>('/api/v1/auth/me')
      }
      if (!me.ok) {
        router.push('/login')
        return
      }
      if (cancelled) return
      setUser(me.data!.user)
      const list = await apiGet<{ sessions: SessionInfo[] }>('/api/v1/auth/sessions')
      if (cancelled) return
      if (list.ok) setSessions(list.data!.sessions)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function revoke(id: string) {
    const result = await apiDelete(`/api/v1/auth/sessions/${id}`)
    if (!result.ok) {
      setError(result.error ?? 'لغو نشست ناموفق بود')
      return
    }
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  async function logout() {
    await apiPost('/api/v1/auth/logout')
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">در حال بارگذاری…</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/50 flex h-16 items-center justify-between border-b px-4 sm:px-6">
        <Link href="/">
          <Logo size="md" />
        </Link>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="ml-2 size-4" />
          خروج
        </Button>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 py-8 sm:px-6">
        <h1 className="text-foreground text-2xl font-bold">داشبورد</h1>

        {error && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}

        {/* پروفایل */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="text-gold size-5" />
              پروفایل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">شماره موبایل</span>
              <span className="text-foreground font-medium" dir="ltr">
                {user?.mobile}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">سطح احراز هویت</span>
              <Badge variant="secondary">
                {KYC_LABELS[user?.kycLevel ?? ''] ?? user?.kycLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* نشست‌های فعال */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Monitor className="text-gold size-5" />
              نشست‌های فعال ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 && (
              <p className="text-muted-foreground text-sm">نشست فعالی یافت نشد.</p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className="border-border/60 flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Smartphone className="text-muted-foreground size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm">
                      {s.deviceInfo || s.userAgent || 'دستگاه نامشخص'}
                    </p>
                    <p className="text-muted-foreground text-xs" dir="ltr">
                      {s.ip ?? '—'} · {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => revoke(s.id)}>
                  لغو
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
