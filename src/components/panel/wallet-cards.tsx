// ============================================
// Zar30 - Wallet Cards — کارت‌های کیف صفحه دارایی
// ============================================
// طلا: گرم آزاد/مسدود + ارزش لحظه‌ای (نرخ فروش) + سود/زیان نسبت به میانگین خرید
// تومان: موجودی آزاد/مسدود
// اقساط: قراردادهای فعال + مانده قابل پرداخت
// ============================================

'use client'

import Link from 'next/link'
import {
  IconCalendarClock,
  IconCoins,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { FinancialNumber } from '@/components/financial/financial-number'
import { formatExactAmount } from '@/lib/utils/format'
import { useBalanceVisibility } from '@/lib/hooks/use-balance-visibility'
import { cn } from 'cn'

export interface WalletCardsData {
  goldBalance: string
  goldLocked: string
  tomanBalance: string
  tomanLocked: string
  sellPrice: string | null
  avgBuyPrice: number | null
  installments: {
    activeContracts: number
    totalPayable: string
    paid: string
    remaining: string
  }
}

interface WalletCardsProps {
  data: WalletCardsData
  loading?: boolean
}

function Masked({ children, hidden }: { children: React.ReactNode; hidden: boolean }) {
  if (hidden) return <span className="tracking-widest">••••••</span>
  return <>{children}</>
}

export function WalletCards({ data, loading = false }: WalletCardsProps) {
  const [hidden] = useBalanceVisibility()

  const goldGrams = Number(data.goldBalance)
  const sellPrice = data.sellPrice ? Number(data.sellPrice) : null
  const goldValue = sellPrice != null ? goldGrams * sellPrice : null

  // سود/زیان — ارزش فعلی طلا در برابر میانگین قیمت خرید کاربر
  const pnl =
    data.avgBuyPrice != null && sellPrice != null && goldGrams > 0
      ? goldGrams * (sellPrice - data.avgBuyPrice)
      : null
  const pnlPercent =
    pnl != null && data.avgBuyPrice! > 0
      ? ((sellPrice! - data.avgBuyPrice!) / data.avgBuyPrice!) * 100
      : null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* ===== کارت طلای آب‌شده ===== */}
      <Card className="border-gold-500/25">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-gold-500/12 flex size-9 items-center justify-center rounded-xl">
                <IconCoins className="text-gold-600 size-5" stroke={1.75} />
              </span>
              <p className="text-foreground text-xs font-bold">طلای آب‌شده ۱۸ عیار</p>
            </div>
            {goldValue != null && pnl != null && !hidden && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
                  pnl >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
                )}
                dir="ltr"
              >
                {pnl >= 0 ? (
                  <IconTrendingUp className="size-3" aria-hidden="true" />
                ) : (
                  <IconTrendingDown className="size-3" aria-hidden="true" />
                )}
                {pnlPercent != null && `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}٪`}
              </span>
            )}
          </div>

          {loading ? (
            <div className="skeleton-shimmer h-8 w-40 rounded-lg" />
          ) : (
            <div>
              <Masked hidden={hidden}>
                <FinancialNumber
                  value={data.goldBalance}
                  unit="گرم"
                  decimals={4}
                  className="text-foreground text-2xl"
                  unitClassName="text-muted-foreground text-xs font-medium"
                />
              </Masked>
              {!hidden && Number(data.goldLocked) > 0 && (
                <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums" dir="ltr">
                  {formatExactAmount(data.goldLocked)} گرم مسدود
                </p>
              )}
            </div>
          )}

          <div className="border-border/50 flex items-center justify-between border-t pt-2.5 text-[11px]">
            <span className="text-muted-foreground">ارزش لحظه‌ای</span>
            {goldValue != null ? (
              <Masked hidden={hidden}>
                <span className="text-foreground font-bold tabular-nums" dir="ltr">
                  {formatExactAmount(String(Math.round(goldValue)))}{' '}
                  <span className="text-muted-foreground font-normal">تومان</span>
                </span>
              </Masked>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          {pnl != null && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">سود/زیان</span>
              <Masked hidden={hidden}>
                <span
                  className={cn('font-bold tabular-nums', pnl >= 0 ? 'text-success' : 'text-error')}
                  dir="ltr"
                >
                  {pnl >= 0 ? '+' : ''}
                  {formatExactAmount(String(Math.round(pnl)))}
                </span>
              </Masked>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== کارت کیف تومانی ===== */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="bg-navy-800/8 flex size-9 items-center justify-center rounded-xl">
              <IconWallet className="text-navy-700 size-5" stroke={1.75} />
            </span>
            <p className="text-foreground text-xs font-bold">کیف پول تومانی</p>
          </div>

          {loading ? (
            <div className="skeleton-shimmer h-8 w-40 rounded-lg" />
          ) : (
            <div>
              <Masked hidden={hidden}>
                <FinancialNumber
                  value={data.tomanBalance}
                  unit="تومان"
                  decimals={0}
                  className="text-foreground text-2xl"
                  unitClassName="text-muted-foreground text-xs font-medium"
                />
              </Masked>
              {!hidden && Number(data.tomanLocked) > 0 && (
                <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums" dir="ltr">
                  {formatExactAmount(data.tomanLocked)} تومان مسدود
                </p>
              )}
            </div>
          )}

          <div className="border-border/50 border-t pt-2.5">
            <Link
              href="/dashboard/trade?side=buy"
              className="text-gold-600 hover:text-gold-700 text-[11px] font-semibold transition-colors"
            >
              خرید طلا با موجودی تومانی ←
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ===== کارت اقساط ===== */}
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="bg-navy-800/8 flex size-9 items-center justify-center rounded-xl">
              <IconCalendarClock className="text-navy-700 size-5" stroke={1.75} />
            </span>
            <p className="text-foreground text-xs font-bold">خرید اقساطی</p>
          </div>

          {loading ? (
            <div className="skeleton-shimmer h-8 w-40 rounded-lg" />
          ) : data.installments.activeContracts === 0 ? (
            <p className="text-muted-foreground text-[11px] leading-5">
              قرارداد اقساطی فعالی ندارید — طلای ۱۸ عیار را قسطی بخرید.
            </p>
          ) : (
            <div>
              <Masked hidden={hidden}>
                <FinancialNumber
                  value={data.installments.remaining}
                  unit="تومان"
                  decimals={0}
                  className="text-foreground text-2xl"
                  unitClassName="text-muted-foreground text-xs font-medium"
                />
              </Masked>
              <p className="text-muted-foreground mt-0.5 text-[10px]">
                مانده {data.installments.activeContracts} قرارداد فعال
              </p>
            </div>
          )}

          <div className="border-border/50 border-t pt-2.5">
            <Link
              href="/dashboard/installments"
              className="text-gold-600 hover:text-gold-700 text-[11px] font-semibold transition-colors"
            >
              {data.installments.activeContracts > 0 ? 'مدیریت اقساط ←' : 'شروع خرید قسطی ←'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
