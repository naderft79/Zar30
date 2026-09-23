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
  IconGift,
  IconHistory,
  IconRepeat,
  IconWallet,
} from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { usePanelUser } from './panel-shell'
import { WealthHero } from './wealth-hero'
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

export function DashboardOverview() {
  const { user } = usePanelUser()
  const today = new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const [accounts, setAccounts] = useState<WalletAccount[]>([])
  const [txs, setTxs] = useState<TxRow[]>([])
  const [price, setPrice] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [walletRes, txRes, priceRes] = await Promise.all([
        apiGetWithRefresh<{ accounts: WalletAccount[] }>('/api/v1/wallet'),
        apiGetWithRefresh<{ transactions: TxRow[] }>('/api/v1/wallet/transactions?limit=5'),
        apiGetWithRefresh<PriceData>('/api/v1/price'),
      ])
      if (cancelled) return
      if (walletRes.ok) setAccounts(walletRes.data?.accounts ?? [])
      if (txRes.ok) setTxs(txRes.data?.transactions ?? [])
      if (priceRes.ok && priceRes.data) setPrice(priceRes.data)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toman = accounts.find((a) => a.assetType === 'TOMAN')
  const gold = accounts.find((a) => a.assetType === 'GOLD')
  // ارزش کل = موجودی تومانی + ارزش تقریبی طلا با نرخ فروش لحظه‌ای
  const goldValue = price && gold ? Number(gold.balance) * price.sellPrice : 0
  const totalValue = Number(toman?.balance ?? 0) + goldValue

  return (
    <div className="animate-stagger space-y-5">
      {/* ============ ۰. نوار قیمت لحظه‌ای — فشرده بالای صفحه ============ */}
      <div className="border-border/60 bg-card/70 flex items-center justify-between gap-3 rounded-full border px-4 py-2 shadow-sm backdrop-blur-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            {price?.isLive && (
              <span className="bg-success/60 absolute inline-flex h-full w-full animate-ping rounded-full" />
            )}
            <span
              className={cn(
                'relative inline-flex size-2 rounded-full',
                price?.isLive ? 'bg-success' : 'bg-muted-foreground/40',
              )}
            />
          </span>
          <p className="text-muted-foreground truncate text-[11px] font-medium sm:text-xs">
            طلای ۱۸ عیار · هر گرم
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          {loading ? (
            <div className="skeleton-shimmer h-5 w-32 rounded-md" />
          ) : price && price.buyPrice > 0 ? (
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
                  {formatExactAmount(String(Math.round(price.buyPrice)))}
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
                  {formatExactAmount(String(Math.round(price.sellPrice)))}
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
        loading={loading}
      />

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
          {loading ? (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="skeleton-shimmer h-14 rounded-xl" />
              ))}
            </ul>
          ) : txs.length === 0 ? (
            <EmptyState
              icon={IconHistory}
              title="هنوز تراکنشی ثبت نشده است"
              description="خرید، فروش، واریز و برداشت شما به‌صورت زمان‌بندی‌شده اینجا نمایش داده می‌شود."
              action={{ label: 'مشاهده دارایی', href: '/dashboard/assets' }}
            />
          ) : (
            <ul className="divide-border/40 divide-y">
              {txs.map((t) => {
                const Icon = txIcon(t.type)
                const incoming = isIncoming(t.type)
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl',
                          incoming ? 'bg-success/12 text-success' : 'bg-gold-500/12 text-gold-600',
                        )}
                      >
                        <Icon className="size-4.5" strokeWidth={1.75} />
                      </span>
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
    </div>
  )
}
