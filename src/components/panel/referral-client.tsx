// ============================================
// Zar30 - Referral (Phase 3.1 — Premium Redesign)
// ============================================
// کد دعوت + آمار — Commission Engine در Phase بعدی
// ============================================

'use client'

import { useState } from 'react'
import { Copy, Gift, Users } from 'lucide-react'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from './page-header'

export function ReferralClient() {
  const { user } = usePanelUser()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(user.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard ممکن است در بعضی contextها در دسترس نباشد
    }
  }

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="معرفی دوستان" description="کد دعوت و پاداش معرفی" />

      {/* کد دعوت — کارت طلایی برجسته */}
      <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="text-gold-500 size-5" strokeWidth={1.75} />
            کد دعوت شما
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-gold-500/30 bg-elevated flex items-center justify-between rounded-xl border p-4 shadow-xs">
            <span className="text-foreground font-mono text-xl font-bold tabular-nums" dir="ltr">
              {user.referralCode}
            </span>
            <button
              onClick={copy}
              className="text-muted-foreground hover:text-gold-600 dark:hover:text-gold-400 focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Copy className="size-4" />
              {copied ? 'کپی شد' : 'کپی'}
            </button>
          </div>
          <p className="text-muted-foreground text-xs leading-5">
            این کد را با دوستان خود به اشتراک بگذارید تا هنگام ثبت‌نام از آن استفاده کنند.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="text-gold-500 size-5" strokeWidth={1.75} />
            آمار معرفی
          </CardTitle>
        </CardHeader>
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
