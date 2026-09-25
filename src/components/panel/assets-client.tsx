// ============================================
// Zar30 - Assets Client (Real Wallet)
// ============================================
// موجودی واقعی از /api/v1/wallet — واریز/برداشت با Idempotency-Key
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconChartPie, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { apiGetWithRefresh } from '@/lib/api/client'
import { usePanelCache, writePanelCache } from '@/lib/panel-cache'
import { formatExactAmount } from '@/lib/utils/format'
import { useOnlineStatus } from './offline-indicator'
import { usePanelUser } from './panel-shell'
import { AssetsHero, type AssetsAction } from './assets-hero'
import { WalletCards, type WalletCardsData } from './wallet-cards'
import { BankCards, type BankAccountRow } from './bank-cards'
import { HistoryTabs } from './history-tabs'

// صفحات مستقل عملیات مالی — ?action=… ورود سریع قدیمی به آن‌ها هدایت می‌شود
const ACTION_ROUTES: Record<AssetsAction, string> = {
  deposit: '/dashboard/deposit',
  withdraw: '/dashboard/withdraw',
  transfer: '/dashboard/transfer',
  delivery: '/dashboard/delivery',
}

interface SummaryData extends WalletCardsData {
  priceChange24h: number | null
}

export function AssetsClient() {
  const router = useRouter()
  const { user } = usePanelUser()
  // null = fetch اولیه هنوز تمام نشده؛ کش محلی بلافاصله overlay می‌شود
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[] | null>(null)
  const [booted, setBooted] = useState(false)

  const uid = user.id
  const cachedSummary = usePanelCache<SummaryData>(`summary:${uid}`)
  const cachedBank = usePanelCache<BankAccountRow[]>(`bank:${uid}`)
  const shownSummary = summary ?? cachedSummary
  const shownBank = bankAccounts ?? cachedBank ?? []
  const loading = shownSummary === null && !booted

  // لینک قدیمی /dashboard/assets?action=… → صفحه مستقل اکشن
  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get('action')
    const route = ACTION_ROUTES[a as AssetsAction]
    if (route) router.replace(route)
  }, [router])
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
    if (summaryRes.ok && summaryRes.data) {
      setSummary(summaryRes.data.summary)
      writePanelCache(`summary:${uid}`, summaryRes.data.summary)
    }
    if (bankRes.ok) {
      const next = bankRes.data?.accounts ?? []
      setBankAccounts(next)
      writePanelCache(`bank:${uid}`, next)
    }
    setBooted(true)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [summaryRes, bankRes] = await Promise.all([
        apiGetWithRefresh<{ summary: SummaryData }>('/api/v1/wallet/summary'),
        apiGetWithRefresh<{ accounts: BankAccountRow[] }>('/api/v1/bank-accounts'),
      ])
      if (cancelled) return
      if (summaryRes.ok && summaryRes.data) {
        setSummary(summaryRes.data.summary)
        writePanelCache(`summary:${uid}`, summaryRes.data.summary)
      }
      if (bankRes.ok) {
        const next = bankRes.data?.accounts ?? []
        setBankAccounts(next)
        writePanelCache(`bank:${uid}`, next)
      }
      setBooted(true)
    })()
    return () => {
      cancelled = true
    }
  }, [uid])

  // ارزش کل = تومان آزاد + ارزش طلا با نرخ فروش لحظه‌ای
  const goldValue =
    shownSummary?.sellPrice != null
      ? Number(shownSummary.goldBalance) * Number(shownSummary.sellPrice)
      : 0
  const totalValue = Number(shownSummary?.tomanBalance ?? 0) + goldValue

  function handleHeroAction(action: AssetsAction) {
    router.push(ACTION_ROUTES[action])
  }

  return (
    <div className="animate-stagger space-y-5">
      {/* هیروی سورمه‌ای — ارزش کل + ۴ اکشن مالی */}
      <AssetsHero
        totalValue={Math.round(totalValue)}
        changePercent={shownSummary?.priceChange24h ?? null}
        loading={loading}
        online={online}
        onAction={handleHeroAction}
      />

      {/* کارت‌های کیف — طلا (سود/زیان) + تومان */}
      <WalletCards
        data={
          shownSummary ?? {
            goldBalance: '0',
            goldLocked: '0',
            tomanBalance: '0',
            tomanLocked: '0',
            sellPrice: null,
            avgBuyPrice: null,
          }
        }
        loading={loading}
      />

      {/* کارت‌های بانکی — اسکرول افقی + افزودن/حذف/پیش‌فرض */}
      <BankCards accounts={shownBank} online={online} onChanged={() => void loadAll()} />

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
            {loading ? (
              <div className="skeleton-shimmer h-24 rounded-lg" />
            ) : Number(shownSummary?.goldBalance ?? 0) === 0 &&
              Number(shownSummary?.tomanBalance ?? 0) === 0 ? (
              <EmptyState
                icon={IconChartPie}
                title="دارایی فعالی ندارید"
                description="نمودار ترکیب طلا و تومان پس از اولین تراکنش نمایش داده می‌شود."
              />
            ) : (
              <div className="space-y-4">
                {/* نوار ترکیب — سهم طلا و تومان از ارزش کل */}
                {(() => {
                  const goldPct = totalValue > 0 ? Math.round((goldValue / totalValue) * 100) : 0
                  const tomanPct = 100 - goldPct
                  return (
                    <>
                      <div
                        className="bg-muted/60 flex h-3.5 w-full overflow-hidden rounded-full"
                        role="img"
                        aria-label={`ترکیب دارایی: ${goldPct} درصد طلا، ${tomanPct} درصد تومان`}
                      >
                        <div
                          className="bg-gold-500 h-full transition-all duration-500"
                          style={{ width: `${goldPct}%` }}
                        />
                        <div
                          className="bg-navy-700 h-full transition-all duration-500"
                          style={{ width: `${tomanPct}%` }}
                        />
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span
                              className="bg-gold-500 size-2.5 rounded-full"
                              aria-hidden="true"
                            />
                            طلای آب‌شده
                          </span>
                          <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                            {formatExactAmount(shownSummary?.goldBalance ?? '0')} گرم · {goldPct}٪
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <span
                              className="bg-navy-700 size-2.5 rounded-full"
                              aria-hidden="true"
                            />
                            تومان
                          </span>
                          <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                            {formatExactAmount(shownSummary?.tomanBalance ?? '0')} تومان ·{' '}
                            {tomanPct}٪
                          </span>
                        </div>
                        {Number(shownSummary?.goldLocked ?? 0) +
                          Number(shownSummary?.tomanLocked ?? 0) >
                          0 && (
                          <div className="border-border/50 flex items-center justify-between border-t pt-2.5">
                            <span className="text-muted-foreground">مسدود شده</span>
                            <span className="text-foreground font-semibold tabular-nums" dir="ltr">
                              {formatExactAmount(shownSummary?.tomanLocked ?? '0')} تومان +{' '}
                              {formatExactAmount(shownSummary?.goldLocked ?? '0')} گرم
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
