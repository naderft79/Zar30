// ============================================
// Zarnama - Referral Preview (Phase 3)
// ============================================
// کد دعوت + آمار — Commission Engine در Phase بعدی
// ============================================

'use client'

import { useState } from 'react'
import { Copy, Gift, Users } from 'lucide-react'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-bold">معرفی دوستان</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="text-gold size-5" />
            کد دعوت شما
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-border/60 flex items-center justify-between rounded-lg border p-4">
            <span className="text-foreground font-mono text-xl font-bold tracking-widest" dir="ltr">
              {user.referralCode}
            </span>
            <button
              onClick={copy}
              className="text-muted-foreground hover:text-gold inline-flex items-center gap-1 text-sm transition-colors"
            >
              <Copy className="size-4" />
              {copied ? 'کپی شد' : 'کپی'}
            </button>
          </div>
          <p className="text-muted-foreground text-sm">
            این کد را با دوستان خود به اشتراک بگذارید تا هنگام ثبت‌نام از آن استفاده کنند.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="text-gold size-5" />
            آمار معرفی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-border/60 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <p className="text-muted-foreground text-sm">
              آمار دعوت‌ها و پاداش معرفی به‌زودی فعال می‌شود
            </p>
            <Badge variant="outline" className="text-xs">
              به‌زودی — پیش‌نمایش
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
