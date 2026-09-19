// ============================================
// Zarnama - Assets Client — Preview (بدون Financial Logic)
// ============================================

'use client'

import { ArrowDownLeft, ArrowUpLeft, History, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BalanceCard } from '@/components/financial/balance-card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'

export function AssetsClient() {
  return (
    <div className="animate-stagger space-y-5">
      {/* کارت‌های موجودی — مقادیر واقعی با Financial Core در Phaseهای بعدی */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard variant="gold" amount={0} subtitle="طلای آب‌شده ۱۸ عیار" />
        <BalanceCard variant="fiat" amount={0} subtitle="کیف پول تومانی" />
        <BalanceCard
          variant="total"
          amount={0}
          subtitle="مجموع دارایی شما"
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      {/* اکشن‌های کیف پول — disabled تا Phase Financial */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="gold" disabled>
          <ArrowDownLeft className="size-4" />
          واریز
        </Button>
        <Button variant="outline" disabled>
          <ArrowUpLeft className="size-4" />
          برداشت
        </Button>
        <StatusBadge tone="gold" dot={false}>
          به‌زودی — پس از راه‌اندازی کیف پول
        </StatusBadge>
      </div>

      {/* تراکنش‌ها + ترکیب دارایی */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="text-gold-500 size-5" strokeWidth={1.75} />
              تراکنش‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={History}
              title="هنوز تراکنشی ثبت نشده است"
              description="واریز، برداشت، خرید و فروش شما با جزئیات کامل اینجا ثبت و نمایش داده می‌شود."
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="text-gold-500 size-5" strokeWidth={1.75} />
              ترکیب دارایی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PieChart}
              title="دارایی فعالی ندارید"
              description="نمودار ترکیب طلا و ریال پس از اولین تراکنش نمایش داده می‌شود."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
