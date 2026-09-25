// ============================================
// Zar30 - Dashboard Overview (Luxury Home)
// ============================================
// Mobile-first: Hero Balance Card → قیمت لحظه‌ای → بنر سرمایه‌گذاری →
// تراکنش‌های اخیر → کارت‌های وضعیت — همه با داده واقعی
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowDownLeft,
  IconArrowLeft,
  IconArrowUpLeft,
  IconBolt,
  IconCalendarClock,
  IconSparkles,
  IconGift,
  IconHistory,
  IconPackage,
  IconRepeat,
  IconWallet,
} from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { usePanelCache, writePanelCache } from '@/lib/panel-cache'
import { formatExactAmount } from '@/lib/utils/format'
import { usePanelUser } from './panel-shell'
import { DATA_REFRESH_EVENT } from './offline-indicator'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { WealthHero } from './wealth-hero'
import { PriceChart } from './price-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from 'cn'

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'واریز',
  WITHDRAW: 'برداشت',
  FEE: 'کارمزد',
  TRANSFER: 'انتقال',
  BUY: 'خرید طلا',
  SELL: 'فروش طلا',
}

const TX_STATUS: Record<string, string> = {
  PENDING: 'در انتظار',
  COMPLETED: 'موفق',
  FAILED: 'ناموفق',
  REVERSED: 'برگشت‌خورده',
}

interface WalletAccount {
  assetType: string
  balance: string
  lockedBalance: string
  available: string
}

interface TxRow {
  id: string
  type: string
  amount: string
  status: string
  createdAt: string
}

interface PriceData {
  buyPrice: number
  sellPrice: number
  isLive: boolean
  updatedAt: string
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gold-600 hover:text-gold-600 inline-flex items-center gap-1 text-xs font-medium transition-colors"
    >
      {children}
      <IconArrowLeft className="size-3.5" />
    </Link>
  )
}

// آیکون جهت تراکنش — واریزی طلایی/سبز، برداشتی خنثی
function txIcon(type: string) {
  if (type === 'DEPOSIT' || type === 'BUY') return IconArrowDownLeft
  if (type === 'WITHDRAW' || type === 'SELL') return IconArrowUpLeft
  if (type === 'TRANSFER') return IconRepeat
  return IconWallet
}

function isIncoming(type: string) {
  return type === 'DEPOSIT' || type === 'SELL'
}

// میان‌برهای خدمات — ۴ کارت مربعی زیر hero
const QUICK_SERVICES = [
  { label: 'زرکار', href: '/dashboard/zarkar', icon: IconSparkles },
  { label: 'خرید قسطی', href: '/dashboard/installments', icon: IconCalendarClock },
  { label: 'اعتبار فوری', href: '/dashboard/installments', icon: IconBolt },
  { label: 'تحویل فیزیکی', href: '/dashboard/assets', icon: IconPackage },
] as const

export function DashboardOverview() {
  const { user } = usePanelUser()
  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // null = هنوز fetch اولیه تمام نشده؛ کش محلی بلافاصله overlay می‌شود
  const [accounts, setAccounts] = useState<WalletAccount[] | null>(null)
  const [txs, setTxs] = useState<TxRow[] | null>(null)
  const [price, setPrice] = useState<PriceData | null>(null)
  const [booted, setBooted] = useState(false)

  // آخرین داده cached — موجودی بدون هیچ skeleton یا باکس خالی رندر می‌شود
  const uid = user.id
  const cachedAccounts = usePanelCache<WalletAccount[]>(`wallet:${uid}`)
  const cachedTxs = usePanelCache<TxRow[]>(`txs:${uid}`)
  const cachedPrice = usePanelCache<PriceData>('price')

  const shownAccounts = accounts ?? cachedAccounts ?? []
  const shownTxs = txs ?? cachedTxs ?? []
  const shownPrice = price ?? cachedPrice
  const walletReady = accounts !== null || cachedAccounts !== null
  const priceLoading = shownPrice === null && !booted
  const txLoading = shownTxs.length === 0 && !booted

  // تراکنش انتخاب‌شده — جزئیات در bottom sheet موبایل
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchAll = async () => {
      const [walletRes, txRes, priceRes] = await Promise.all([
        apiGetWithRefresh<{ accounts: WalletAccount[] }>('/api/v1/wallet'),
        apiGetWithRefresh<{ transactions: TxRow[] }>('/api/v1/wallet/transactions?limit=5'),
        apiGetWithRefresh<PriceData>('/api/v1/price'),
      ])
      if (cancelled) return
      if (walletRes.ok) {
        const next = walletRes.data?.accounts ?? []
        setAccounts(next)
        writePanelCache(`wallet:${uid}`, next)
      }
      if (txRes.ok) {
        const next = txRes.data?.transactions ?? []
        setTxs(next)
        writePanelCache(`txs:${uid}`, next)
      }
      if (priceRes.ok && priceRes.data) {
        setPrice(priceRes.data)
        writePanelCache('price', priceRes.data)
      }
      setBooted(true)
    }
    void fetchAll()
    // pull-to-refresh و reconnect → رفرش داده
    window.addEventListener(DATA_REFRESH_EVENT, fetchAll)
    return () => {
      cancelled = true
      window.removeEventListener(DATA_REFRESH_EVENT, fetchAll)
    }
  }, [uid])

  const toman = shownAccounts.find((a) => a.assetType === 'TOMAN')
  const gold = shownAccounts.find((a) => a.assetType === 'GOLD')
  // ارزش کل = موجودی تومانی + ارزش تقریبی طلا با نرخ فروش لحظه‌ای
  const goldValue = shownPrice && gold ? Number(gold.balance) * shownPrice.sellPrice : 0
  const totalValue = Number(toman?.balance ?? 0) + goldValue

  return (
    <div className="animate-stagger space-y-5">
      {/* ============ ۰. نوار قیمت لحظه‌ای — فشرده بالای صفحه ============ */}
      <div className="border-border/60 bg-card/70 flex items-center justify-between gap-3 rounded-full border px-4 py-2 shadow-sm backdrop-blur-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            {shownPrice?.isLive && (
              <span className="bg-success/60 absolute inline-flex h-full w-full animate-ping rounded-full" />
            )}
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                shownPrice?.isLive ? 'bg-success' : 'bg-muted-foreground/40',
              )}
            />
          </span>
          <p className="text-muted-foreground truncate text-[11px] font-medium sm:text-xs">
            طلای ۱۸ عیار · هر گرم
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {priceLoading ? (
            <div className="skeleton-shimmer h-5 w-32 rounded-md" />
          ) : shownPrice && shownPrice.buyPrice > 0 ? (
            <>
              <Link
                href="/dashboard/trade?side=buy"
                className="hover:bg-muted/60 focus-visible:ring-ring -mx-1.5 flex items-baseline gap-1.5 rounded-lg px-1.5 py-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="خرید طلا — رفتن به معاملات"
              >
                <span className="text-muted-foreground text-[10px]">خرید</span>
                <span
                  className="text-success text-sm font-bold tabular-nums sm:text-base"
                  dir="ltr"
                >
                  {formatExactAmount(String(Math.round(shownPrice.buyPrice)))}
                </span>
              </Link>
              <span className="bg-border h-4 w-px" aria-hidden="true" />
              <Link
                href="/dashboard/trade?side=sell"
                className="hover:bg-muted/60 focus-visible:ring-ring -mx-1.5 flex items-baseline gap-1.5 rounded-lg px-1.5 py-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label="فروش طلا — رفتن به معاملات"
              >
                <span className="text-muted-foreground text-[10px]">فروش</span>
                <span
                  className="text-gold-600 text-sm font-bold tabular-nums sm:text-base"
                  dir="ltr"
                >
                  {formatExactAmount(String(Math.round(shownPrice.sellPrice)))}
                </span>
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground text-[11px]">قیمت در دسترس نیست</p>
          )}
        </div>
      </div>

      {/* ============ ۱. Hero — کارت موجودی اصلی ============ */}
      <WealthHero
        dateLabel={today}
        totalValue={Math.round(totalValue)}
        goldGrams={gold?.balance ?? '0'}
        tomanBalance={toman?.available ?? '0'}
        lockedToman={toman?.lockedBalance ?? '0'}
        loading={!walletReady}
      />

      {/* ============ ۲. میان‌برهای خدمات — ۴ کارت مربعی ============ */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_SERVICES.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border-border/60 bg-card hover:border-gold-500/40 focus-visible:ring-ring flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border transition-all duration-(--duration-normal) hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
          >
            <s.icon className="text-gold-600 size-6 sm:size-7" stroke={1.5} />
            <span className="text-foreground text-[10px] font-medium sm:text-xs">{s.label}</span>
          </Link>
        ))}
      </div>

      {/* ============ ۲.۵ نمودار لحظه‌ای قیمت طلا ============ */}
      <PriceChart />

      {/* ============ ۳. تراکنش‌های اخیر — real stream ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconHistory className="text-gold-600 size-5" stroke={1.75} />
            تراکنش‌های اخیر
          </CardTitle>
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            <SectionLink href="/dashboard/assets">مشاهده همه</SectionLink>
          </div>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="skeleton-shimmer h-14 rounded-xl" />
              ))}
            </ul>
          ) : shownTxs.length === 0 ? (
            <EmptyState
              icon={IconHistory}
              title="هنوز تراکنشی ثبت نشده است"
              description="خرید، فروش، واریز و برداشت شما به‌صورت زمان‌بندی‌شده اینجا نمایش داده می‌شود."
              action={{ label: 'مشاهده دارایی', href: '/dashboard/assets' }}
            />
          ) : (
            <ul className="divide-border/40 divide-y">
              {shownTxs.map((t) => {
                const Icon = txIcon(t.type)
                const incoming = isIncoming(t.type)
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTx(t)}
                      className="hover:bg-muted/50 focus-visible:ring-ring -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-xl px-2 py-3.5 text-right transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon
                          className={cn(
                            'size-6 shrink-0',
                            incoming ? 'text-success' : 'text-gold-600',
                          )}
                          strokeWidth={1.75}
                        />
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-semibold">
                            {TX_LABELS[t.type] ?? t.type}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                            {new Date(t.createdAt).toLocaleString('fa-IR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            incoming ? 'text-success' : 'text-foreground',
                          )}
                          dir="ltr"
                        >
                          {incoming ? '+' : '-'}
                          {formatExactAmount(t.amount)}
                        </p>
                        <StatusBadge
                          tone={t.status === 'COMPLETED' ? 'success' : 'neutral'}
                          dot={false}
                          className="mt-1"
                        >
                          {TX_STATUS[t.status] ?? t.status}
                        </StatusBadge>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ============ ۵. معرفی دوستان ============ */}
      <div className="grid gap-5">
        <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconGift className="text-gold-600 size-5" stroke={1.75} />
              معرفی دوستان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">کد دعوت شما</span>
              <span className="text-foreground font-mono font-semibold tabular-nums" dir="ltr">
                {user.referralCode}
              </span>
            </div>
            <SectionLink href="/dashboard/profile/referral">جزئیات و پاداش</SectionLink>
          </CardContent>
        </Card>
      </div>

      {/* ============ جزئیات تراکنش — bottom sheet موبایل ============ */}
      <BottomSheet
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        title="جزئیات تراکنش"
      >
        {selectedTx && (
          <div className="space-y-4">
            {/* مبلغ بزرگ بالای شیت */}
            <div className="flex flex-col items-center gap-1 pt-1 pb-2">
              <p
                className={cn(
                  'text-2xl font-extrabold tabular-nums',
                  isIncoming(selectedTx.type) ? 'text-success' : 'text-foreground',
                )}
                dir="ltr"
              >
                {isIncoming(selectedTx.type) ? '+' : '-'}
                {formatExactAmount(selectedTx.amount)}
              </p>
              <p className="text-muted-foreground text-xs">
                {TX_LABELS[selectedTx.type] ?? selectedTx.type}
              </p>
            </div>
            <ul className="divide-border/40 divide-y text-sm">
              <li className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">وضعیت</span>
                <StatusBadge
                  tone={selectedTx.status === 'COMPLETED' ? 'success' : 'neutral'}
                  dot={false}
                >
                  {TX_STATUS[selectedTx.status] ?? selectedTx.status}
                </StatusBadge>
              </li>
              <li className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">تاریخ</span>
                <span className="text-foreground font-medium tabular-nums">
                  {new Date(selectedTx.createdAt).toLocaleString('fa-IR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </li>
              <li className="flex items-center justify-between gap-3 py-3">
                <span className="text-muted-foreground">شناسه</span>
                <span className="text-muted-foreground truncate font-mono text-[10px]" dir="ltr">
                  {selectedTx.id}
                </span>
              </li>
            </ul>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
