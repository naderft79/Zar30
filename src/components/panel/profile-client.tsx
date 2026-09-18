// ============================================
// Zarnama - Profile Page (Phase 3)
// ============================================
// مشاهده + ویرایش profile واقعی — PUT /api/v1/users/profile
// ============================================

'use client'

import { useState } from 'react'
import { Mail, Save, Smartphone, UserRound } from 'lucide-react'
import { apiPut } from '@/lib/api/client'
import { usePanelUser, type PanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const KYC_LABELS: Record<string, string> = {
  LEVEL_0: 'احراز نشده',
  LEVEL_1: 'سطح ۱ — موبایل تایید شده',
  LEVEL_2: 'سطح ۲ — هویتی',
  LEVEL_3: 'سطح ۳ — کامل',
}

export function ProfileClient() {
  const { user, reload } = usePanelUser()
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(user.firstName ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await apiPut<{ user: PanelUser }>('/api/v1/users/profile', {
      firstName: firstName || null,
      lastName: lastName || null,
      email: email || null,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error ?? 'به‌روزرسانی ناموفق بود')
      return
    }
    await reload()
    setEditing(false)
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('fa-IR')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-bold">پروفایل</h1>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            ویرایش
          </Button>
        )}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="text-gold size-5" />
            اطلاعات حساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={save} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pf-first"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    نام
                  </label>
                  <Input
                    id="pf-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={64}
                  />
                </div>
                <div>
                  <label
                    htmlFor="pf-last"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    نام خانوادگی
                  </label>
                  <Input
                    id="pf-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={64}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="pf-email"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  ایمیل (اختیاری)
                </label>
                <Input
                  id="pf-email"
                  type="email"
                  dir="ltr"
                  className="text-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
                >
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  <Save className="ml-2 size-4" />
                  {saving ? 'در حال ذخیره…' : 'ذخیره'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  انصراف
                </Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-3 text-sm">
              {[
                ['نام', user.firstName ?? '—'],
                ['نام خانوادگی', user.lastName ?? '—'],
                ['شماره موبایل', user.mobile],
                ['ایمیل', user.email ?? '—'],
                ['تاریخ عضویت', joinDate],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-2">
                    {label === 'شماره موبایل' && <Smartphone className="size-4" />}
                    {label === 'ایمیل' && <Mail className="size-4" />}
                    {label}
                  </dt>
                  <dd
                    className="text-foreground font-medium"
                    dir={label === 'ایمیل' || label === 'شماره موبایل' ? 'ltr' : undefined}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">وضعیت حساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">وضعیت حساب</span>
            <Badge variant="secondary">{user.status === 'ACTIVE' ? 'فعال' : user.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">سطح احراز هویت</span>
            <Badge variant="secondary">{KYC_LABELS[user.kycLevel] ?? user.kycLevel}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تایید موبایل</span>
            <Badge variant={user.mobileVerifiedAt ? 'secondary' : 'outline'}>
              {user.mobileVerifiedAt ? 'تایید شده' : 'تایید نشده'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
