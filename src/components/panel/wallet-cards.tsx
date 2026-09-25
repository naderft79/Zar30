// ============================================
// Zar30 - Wallet Cards — کارت‌های کیف صفحه دارایی
// ============================================
// طلا: گرم آزاد/مسدود + ارزش لحظه‌ای (نرخ فروش) + سود/زیان نسبت به میانگین خرید
// تومان: موجودی آزاد/مسدود
// ============================================

'use client'

import Link from 'next/link'
import { IconCoins, IconTrendingDown, IconTrendingUp, IconWallet } from '@tabler/icons-react'
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* ===== کارت موجودی طلا — گرادیانت طلایی ===== */}
      <Card className="border-gold-700/50 from-gold-600 to-gold-700 bg-gradient-to-br">
        <CardContent className="space-y-3 p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <IconCoins className="size-6 shrink-0 text-white sm:size-7" stroke={1.75} />
              <p className="text-xs font-bold text-white">موجودی طلا</p>
            </div>
            {goldValue != null && pnl != null && !hidden && (
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold tabular-nums',
                  pnl >= 0 ? 'text-success' : 'text-error',
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
            <div className="skeleton-shimmer h-8 w-32 rounded-lg" />
          ) : (
            <div>
              <Masked hidden={hidden}>
                <FinancialNumber
                  value={data.goldBalance}
                  unit="گرم"
                  decimals={4}
                  className="text-lg text-white sm:text-2xl"
                  unitClassName="text-[10px] font-medium text-white/70 sm:text-xs"
                />
              </Masked>
              {!hidden && Number(data.goldLocked) > 0 && (
                <p className="mt-0.5 text-[10px] text-white/70 tabular-nums" dir="ltr">
                  {formatExactAmount(data.goldLocked)} گرم مسدود
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-1 border-t border-white/20 pt-2.5 text-[11px]">
            <span className="text-white/70">ارزش لحظه‌ای</span>
            {goldValue != null ? (
              <Masked hidden={hidden}>
                <span className="font-bold text-white tabular-nums" dir="ltr">
                  {formatExactAmount(String(Math.round(goldValue)))}{' '}
                  <span className="font-normal text-white/70">تومان</span>
                </span>
              </Masked>
            ) : (
              <span className="text-white/70">—</span>
            )}
          </div>
          {pnl != null && (
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-white/70">سود/زیان</span>
              <Masked hidden={hidden}>
                <span
                  className={cn(
                    'font-bold tabular-nums',
                    pnl >= 0 ? 'text-emerald-100' : 'text-red-100',
                  )}
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

      {/* ===== کارت موجودی تومانی — گرادیانت سبز ===== */}
      <Card className="border-success/40 from-success bg-gradient-to-br via-[#177f45] to-[#0d5c30]">
        <CardContent className="space-y-3 p-3.5 sm:p-5">
          <div className="flex items-center gap-2">
            <IconWallet className="size-6 shrink-0 text-white sm:size-7" stroke={1.75} />
            <p className="text-xs font-bold text-white">موجودی تومانی</p>
          </div>

          {loading ? (
            <div className="skeleton-shimmer h-8 w-32 rounded-lg" />
          ) : (
            <div>
              <Masked hidden={hidden}>
                <FinancialNumber
                  value={data.tomanBalance}
                  unit="تومان"
                  decimals={0}
                  className="text-lg text-white sm:text-2xl"
                  unitClassName="text-[10px] font-medium text-white/70 sm:text-xs"
                />
              </Masked>
              {!hidden && Number(data.tomanLocked) > 0 && (
                <p className="mt-0.5 text-[10px] text-white/70 tabular-nums" dir="ltr">
                  {formatExactAmount(data.tomanLocked)} تومان مسدود
                </p>
              )}
            </div>
          )}

          <div className="border-t border-white/20 pt-2.5">
            <Link
              href="/dashboard/trade?side=buy"
              className="text-[11px] font-semibold text-white transition-colors hover:text-white/80"
            >
              خرید طلا با موجودی تومانی ←
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
