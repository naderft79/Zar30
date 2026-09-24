// ============================================
// Zar30 - Assets Client (Real Wallet)
// ============================================
// موجودی واقعی از /api/v1/wallet — واریز/برداشت با Idempotency-Key
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconChartPie, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { useOnlineStatus } from './offline-indicator'
import { AssetsHero, type AssetsAction } from './assets-hero'
import { WalletCards, type WalletCardsData } from './wallet-cards'
import { BankCards, type BankAccountRow } from './bank-cards'
import { DepositSheet } from './deposit-sheet'
import { WithdrawSheet } from './withdraw-sheet'
import { TransferSheet } from './transfer-sheet'
import { DeliverySheet } from './delivery-sheet'
import { HistoryTabs } from './history-tabs'
import { SipCard } from './sip-card'
import { PriceAlertsCard } from './price-alerts-card'

interface SummaryData extends WalletCardsData {
  priceChange24h: number | null
}

export function AssetsClient() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([])
  const [loading, setLoading] = useState(true)

  // شیت‌های مالی — ?action=deposit|withdraw ورود سریع از داشبورد
  const [sheet, setSheet] = useState<'deposit' | 'withdraw' | 'transfer' | 'delivery' | null>(
    () => {
      if (typeof window === 'undefined') return null
      const a = new URLSearchParams(window.location.search).get('action')
      return a === 'deposit' || a === 'withdraw' ? a : null
    },
  )
  // آفلاین → اکشن مالی غیرفعال (واریز/برداشت بدون اتصال واقعی ممکن نیست)
  const online = useOnlineStatus()
  // وضعیت برگشت از درگاه پرداخت — ?payment=success|cancelled|expired|failed|replayed
  const [error] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const p = new URLSearchParams(window.location.search).get('payment')
    if (p === 'cancelled') return 'پرداخت توسط شما لغو شد'
    if (p === 'expired') return 'مهلت پرداخت به پایان رسیده بود — لطفاً دوباره تلاش کنید'
    if (p === 'failed' || p === 'invalid')
      return 'پرداخت ناموفق بود — در صورت کسر مبلغ، طبق قوانین درگاه برگشت داده می‌شود'
    return null
  })
  const [success] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const p = new URLSearchParams(window.location.search).get('payment')
    if (p === 'success') return 'پرداخت شما با موفقیت انجام شد — موجودی کیف پول شارژ شد'
    if (p === 'replayed') return 'این پرداخت قبلاً با موفقیت ثبت شده است'
    return null
  })

  async function loadAll() {
    const [summaryRes, bankRes] = await Promise.all([
      apiGetWithRefresh<{ summary: SummaryData }>('/api/v1/wallet/summary'),
      apiGetWithRefresh<{ accounts: BankAccountRow[] }>('/api/v1/bank-accounts'),
    ])
    if (summaryRes.ok && summaryRes.data) setSummary(summaryRes.data.summary)
    if (bankRes.ok) setBankAccounts(bankRes.data?.accounts ?? [])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [summaryRes, bankRes] = await Promise.all([
        apiGetWithRefresh<{ summary: SummaryData }>('/api/v1/wallet/summary'),
        apiGetWithRefresh<{ accounts: BankAccountRow[] }>('/api/v1/bank-accounts'),
      ])
      if (cancelled) return
      if (summaryRes.ok && summaryRes.data) setSummary(summaryRes.data.summary)
      if (bankRes.ok) setBankAccounts(bankRes.data?.accounts ?? [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ارزش کل = تومان آزاد + ارزش طلا با نرخ فروش لحظه‌ای
  const goldValue =
    summary?.sellPrice != null ? Number(summary.goldBalance) * Number(summary.sellPrice) : 0
  const totalValue = Number(summary?.tomanBalance ?? 0) + goldValue

  function handleHeroAction(action: AssetsAction) {
    setSheet(action)
  }

  return (
    <div className="animate-stagger space-y-5">
      {/* هیروی سورمه‌ای — ارزش کل + ۴ اکشن مالی */}
      <AssetsHero
        totalValue={Math.round(totalValue)}
        changePercent={summary?.priceChange24h ?? null}
        loading={loading}
        online={online}
        onAction={handleHeroAction}
      />

      {/* کارت‌های کیف — طلا (سود/زیان)، تومان، اقساط */}
      <WalletCards
        data={
          summary ?? {
            goldBalance: '0',
            goldLocked: '0',
            tomanBalance: '0',
            tomanLocked: '0',
            sellPrice: null,
            avgBuyPrice: null,
            installments: { activeContracts: 0, totalPayable: '0', paid: '0', remaining: '0' },
          }
        }
        loading={loading}
      />

      {/* کارت‌های بانکی — اسکرول افقی + افزودن/حذف/پیش‌فرض */}
      <BankCards accounts={bankAccounts} online={online} onChanged={() => void loadAll()} />

      {/* ابزارهای سرمایه‌گذاری — خرید خودکار + هشدار قیمت */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SipCard online={online} onChanged={() => void loadAll()} />
        <PriceAlertsCard
          online={online}
          currentPrice={summary?.sellPrice != null ? Number(summary.sellPrice) : null}
          onChanged={() => void loadAll()}
        />
      </div>

      {/* شیت‌های واریز/برداشت */}
      <DepositSheet
        open={sheet === 'deposit'}
        onClose={() => setSheet(null)}
        online={online}
        onCompleted={() => void loadAll()}
      />
      <WithdrawSheet
        open={sheet === 'withdraw'}
        onClose={() => setSheet(null)}
        online={online}
        accounts={bankAccounts}
        onCompleted={() => void loadAll()}
      />
      <TransferSheet
        open={sheet === 'transfer'}
        onClose={() => setSheet(null)}
        online={online}
        onCompleted={() => void loadAll()}
      />
      <DeliverySheet
        open={sheet === 'delivery'}
        onClose={() => setSheet(null)}
        online={online}
        onCompleted={() => void loadAll()}
      />

      {error && (
        <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-success flex items-center gap-1.5 text-xs">
          <IconCircleCheck className="size-3.5" aria-hidden="true" />
          {success}
        </p>
      )}

      {/* سوابق تب‌دار + ترکیب دارایی */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <HistoryTabs />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconChartPie className="text-gold-600 size-5" stroke={1.75} />
              ترکیب دارایی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Number(summary?.goldBalance ?? 0) === 0 && Number(summary?.tomanBalance ?? 0) === 0 ? (
              <EmptyState
                icon={IconChartPie}
                title="دارایی فعالی ندارید"
                description="نمودار ترکیب طلا و تومان پس از اولین تراکنش نمایش داده می‌شود."
              />
            ) : (
              <dl className="divide-border/40 divide-y text-xs">
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground">طلای آب‌شده</dt>
                  <dd className="text-foreground font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(summary?.goldBalance ?? '0')} گرم
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground">تومان</dt>
                  <dd className="text-foreground font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(summary?.tomanBalance ?? '0')} تومان
                  </dd>
                </div>
                {Number(summary?.goldLocked ?? 0) + Number(summary?.tomanLocked ?? 0) > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-muted-foreground">مسدود شده</dt>
                    <dd className="text-foreground font-semibold tabular-nums" dir="ltr">
                      {formatExactAmount(summary?.tomanLocked ?? '0')} تومان +{' '}
                      {formatExactAmount(summary?.goldLocked ?? '0')} گرم
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
