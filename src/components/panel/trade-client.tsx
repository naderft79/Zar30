// ============================================
// Zarnama - Trade Client — Preview (بدون Financial Logic)
// ============================================

'use client'

import { ArrowDownLeft, ArrowUpLeft, History, LineChart, Repeat, Timer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'

export function TradeClient() {
  return (
    <div className="animate-stagger space-y-5">
      {/* اکشن‌های اصلی معامله — preview */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
          <CardContent className="flex flex-col items-center gap-3 pt-6 pb-5 text-center">
            <div className="bg-gold-500/15 text-gold-600 dark:text-gold-400 flex size-12 items-center justify-center rounded-2xl">
              <ArrowDownLeft className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-foreground font-semibold">خرید طلا</p>
              <p className="text-muted-foreground mt-0.5 text-xs">طلای آب‌شده ۱۸ عیار</p>
            </div>
            <StatusBadge tone="gold" dot={false}>
              به‌زودی
            </StatusBadge>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-3 pt-6 pb-5 text-center">
            <div className="bg-navy-500/10 text-navy-500 dark:bg-navy-400/15 dark:text-navy-200 flex size-12 items-center justify-center rounded-2xl">
              <ArrowUpLeft className="size-6" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-foreground font-semibold">فروش طلا</p>
              <p className="text-muted-foreground mt-0.5 text-xs">تسویه فوری به کیف پول</p>
            </div>
            <StatusBadge tone="gold" dot={false}>
              به‌زودی
            </StatusBadge>
          </CardContent>
        </Card>
      </div>

      {/* قیمت لحظه‌ای — empty state (داده واقعی در Phase Trading) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChart className="text-gold-500 size-5" strokeWidth={1.75} />
            قیمت لحظه‌ای طلا
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Timer}
            title="قیمت لحظه‌ای به‌زودی فعال می‌شود"
            description="پس از راه‌اندازی موتور قیمت‌گذاری، نرخ لحظه‌ای خرید و فروش طلای آب‌شده اینجا نمایش داده می‌شود."
            badge="به‌زودی — پیش‌نمایش"
          />
        </CardContent>
      </Card>

      {/* سفارش‌های باز + تاریخچه */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="text-gold-500 size-5" strokeWidth={1.75} />
              سفارش‌های باز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Repeat}
              title="سفارش بازی ندارید"
              description="سفارش‌های در حال انجام شما اینجا نمایش داده می‌شوند."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="text-gold-500 size-5" strokeWidth={1.75} />
              تاریخچه معاملات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={History}
              title="هنوز معامله‌ای انجام نداده‌اید"
              description="پس از اولین خرید یا فروش، تاریخچه کامل معاملات شما اینجا ثبت می‌شود."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
