// ============================================
// Zar30 - Referral (Full Panel Redesign)
// ============================================
// کد دعوت + لینک + آمار — Commission Engine در Phase بعدی
// ============================================

'use client'

import { useState } from 'react'
import { Check, Copy, Gift, Link2, TrendingUp, Users } from 'lucide-react'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from './page-header'

export function ReferralClient() {
  const { user } = usePanelUser()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const referralLink = `https://zar30.com/register?ref=${user.referralCode}`

  async function copy(text: string, which: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard ممکن است در بعضی contextها در دسترس نباشد
    }
  }

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="معرفی دوستان" description="کد دعوت و پاداش معرفی" />

      {/* کد دعوت — کارت طلایی برجسته */}
      <Card className="surface-wealth relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="text-gold-500 size-5" strokeWidth={1.75} />
            کد دعوت شما
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="border-gold-500/30 bg-elevated/80 flex items-center justify-between gap-3 rounded-xl border p-4 shadow-xs">
            <span className="text-foreground font-mono text-xl font-bold tabular-nums" dir="ltr">
              {user.referralCode}
            </span>
            <button
              onClick={() => copy(user.referralCode, 'code')}
              className="text-muted-foreground hover:text-gold-600 dark:hover:text-gold-400 focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {copied === 'code' ? (
                <Check className="text-success size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied === 'code' ? 'کپی شد' : 'کپی'}
            </button>
          </div>
          {/* لینک دعوت */}
          <div className="border-border/60 bg-muted/30 flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
              <Link2 className="size-4 shrink-0" />
              <span className="truncate font-mono tabular-nums" dir="ltr">
                {referralLink}
              </span>
            </span>
            <button
              onClick={() => copy(referralLink, 'link')}
              aria-label="کپی لینک دعوت"
              className="text-muted-foreground hover:text-gold-600 dark:hover:text-gold-400 focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {copied === 'link' ? (
                <Check className="text-success size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied === 'link' ? 'کپی شد' : 'کپی لینک'}
            </button>
          </div>
          <p className="text-muted-foreground text-xs leading-5">
            این کد یا لینک را با دوستان خود به اشتراک بگذارید تا هنگام ثبت‌نام از آن استفاده کنند.
          </p>
        </CardContent>
      </Card>

      {/* آمار معرفی — پیش‌نمایش (بدون داده مالی جعلی) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <span className="bg-gold-500/15 text-gold-600 dark:text-gold-400 flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <Users className="size-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-label">دعوت‌های موفق</p>
              <p className="text-financial-lg text-foreground mt-1 tabular-nums">—</p>
            </div>
            <StatusBadge tone="gold" dot={false} className="mr-auto">
              به‌زودی
            </StatusBadge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <span className="bg-gold-500/15 text-gold-600 dark:text-gold-400 flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <TrendingUp className="size-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-label">پاداش معرفی</p>
              <p className="text-financial-lg text-foreground mt-1 tabular-nums">—</p>
            </div>
            <StatusBadge tone="gold" dot={false} className="mr-auto">
              به‌زودی
            </StatusBadge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <EmptyState
            icon={Users}
            title="آمار معرفی به‌زودی فعال می‌شود"
            description="تعداد دعوت‌های موفق و پاداش معرفی پس از راه‌اندازی موتور کمیسیون اینجا نمایش داده می‌شود."
            badge="به‌زودی — پیش‌نمایش"
          />
        </CardContent>
      </Card>
    </div>
  )
}
