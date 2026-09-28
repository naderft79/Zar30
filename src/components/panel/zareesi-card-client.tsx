// ============================================
// Zar30 - Zareesi Card Client (کارت زرسی)
// ============================================
// کارت اعتباری فیزیکی که با موجودی طلایی کیف پول خرید می‌کند
// سه رنگ: طلایی، سورمه‌ای، کرمی — پیش‌نمایش ۳بعدی واقع‌گرایانه
// جریان سفارش: انتخاب رنگ → نام حک‌شده → ارسال → تایید و کسر کارمزد
// ============================================

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconArrowRight,
  IconCheck,
  IconCoin,
  IconLoader2,
  IconLock,
  IconPackage,
  IconShieldCheck,
  IconSparkles,
  IconTruckDelivery,
  IconX,
} from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatGoldAmount, formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { usePanelUser } from './panel-shell'
import { cn } from 'cn'

// ---------- انواع ----------
interface ZareesiCardDto {
  id: string
  color: 'GOLD' | 'NAVY' | 'CREAM'
  status: string
  cardNumber: string
  holderName: string
  shippingMethod: string
  feeGold: string
  feeToman: string
  trackingCode: string | null
  rejectedReason: string | null
  activatedAt: string | null
  createdAt: string
  address?: { city: string; province: string; address: string } | null
}

interface ZareesiConfigDto {
  feeGold: string
  feePost: string
  maxActiveCards: number
}

interface AddressDto {
  id: string
  title: string | null
  city: string | null
  province: string | null
  address: string
  isDefault: boolean
}

type ColorKey = 'GOLD' | 'NAVY' | 'CREAM'

const COLOR_META: Record<
  ColorKey,
  { label: string; tagline: string; chip: string; ring: string; dot: string }
> = {
  GOLD: {
    label: 'طلایی',
    tagline: 'نشان افتخار — برای دارایی‌های درشت',
    chip: 'from-[#f7e7b0] via-[#d4af37] to-[#8a6d1a]',
    ring: 'ring-[#d4af37]/60',
    dot: 'bg-gradient-to-br from-[#f7e7b0] to-[#b8860b]',
  },
  NAVY: {
    label: 'سورمه‌ای',
    tagline: 'کلاسیک و رسمی — محبوب‌ترین انتخاب',
    chip: 'from-[#1e3a8a] via-[#172554] to-[#0b1220]',
    ring: 'ring-[#3b82f6]/50',
    dot: 'bg-gradient-to-br from-[#3b82f6] to-[#0b1220]',
  },
  CREAM: {
    label: 'کرمی',
    tagline: 'مینیمال و شیک — لطافت در سادگی',
    chip: 'from-[#fdf6e3] via-[#ecd9b0] to-[#c9a86a]',
    ring: 'ring-[#d4b483]/60',
    dot: 'bg-gradient-to-br from-[#fdf6e3] to-[#c9a86a]',
  },
}

const STATUS_META: Record<string, { label: string; cls: string; step: number }> = {
  PENDING: { label: 'در انتظار تایید', cls: 'bg-warning/10 text-warning', step: 1 },
  APPROVED: { label: 'تاییدشده', cls: 'bg-info/10 text-info', step: 2 },
  PRODUCTION: { label: 'در حال تولید', cls: 'bg-info/10 text-info', step: 3 },
  SHIPPED: { label: 'ارسال‌شده', cls: 'bg-primary/10 text-primary', step: 4 },
  ACTIVE: { label: 'فعال', cls: 'bg-success/10 text-success', step: 5 },
  REJECTED: { label: 'ردشده', cls: 'bg-error/10 text-error', step: 0 },
  BLOCKED: { label: 'مسدود', cls: 'bg-error/10 text-error', step: 5 },
}

// ---------- پیش‌نمایش کارت ۳بعدی ----------
function CardFace({
  color,
  holder,
  flipped,
  className,
}: {
  color: ColorKey
  holder: string
  flipped: boolean
  className?: string
}) {
  const m = COLOR_META[color]
  const isCream = color === 'CREAM'
  const isNavy = color === 'NAVY'
  return (
    <div
      className={cn(
        'relative aspect-[1.586/1] w-full rounded-[1.4rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] transition-transform duration-700 select-none [transform-style:preserve-3d]',
        flipped && '[transform:rotateY(180deg)]',
        className,
      )}
    >
      {/* روی کارت */}
      <div
        className={cn(
          'absolute inset-0 overflow-hidden rounded-[1.4rem] bg-gradient-to-bl [backface-visibility:hidden]',
          m.chip,
          color === 'CREAM' && 'text-[#3d2f14]',
          color === 'GOLD' && 'text-[#241a04]',
          color === 'NAVY' && 'text-[#dbe7ff]',
        )}
      >
        {/* بافت هندسی */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden="true">
          <defs>
            <pattern
              id={`p-${color}`}
              width="26"
              height="26"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="26" height="26" fill="none" />
              <circle cx="13" cy="13" r="1.4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-${color})`} />
        </svg>
        {/* هاله نور */}
        <div className="absolute -top-1/2 -right-1/4 h-[200%] w-[80%] rotate-[25deg] bg-gradient-to-b from-white/35 to-transparent blur-2xl" />
        <div className="absolute -bottom-3/4 -left-1/4 h-[160%] w-[60%] rotate-12 bg-gradient-to-t from-black/25 to-transparent blur-xl" />

        {/* سربرگ */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
          <div>
            <p
              className={cn(
                'text-[10px] font-bold tracking-[0.3em]',
                isCream || isNavy ? 'opacity-70' : 'opacity-60',
              )}
            >
              ZAR30
            </p>
            <p className="mt-0.5 text-lg font-black tracking-tight">
              زرسی <span className="text-[11px] font-medium opacity-70">Zareesi Card</span>
            </p>
          </div>
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-xl',
              isNavy ? 'bg-white/15' : 'bg-black/10',
              'backdrop-blur-sm',
            )}
          >
            <IconCoin
              className={cn(
                'size-5',
                color === 'GOLD'
                  ? 'text-[#6b4f0a]'
                  : color === 'NAVY'
                    ? 'text-gold-300'
                    : 'text-[#8a6d1a]',
              )}
              stroke={1.6}
            />
          </div>
        </div>

        {/* چیپ طلایی + موج */}
        <div className="absolute top-[42%] right-5 flex items-center gap-2">
          <div className="h-7 w-10 rounded-md bg-gradient-to-br from-[#f5d576] via-[#c9971c] to-[#8a6d1a] shadow-inner">
            <div className="grid h-full w-full grid-cols-3 gap-px p-1 opacity-60">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-[1px] border border-[#6b4f0a]/40" />
              ))}
            </div>
          </div>
          <svg width="26" height="20" viewBox="0 0 26 20" className="opacity-80" aria-hidden="true">
            <path
              d="M4 6a9 9 0 0 1 0 8M8.5 3.5a13 13 0 0 1 0 13M13 1a17 17 0 0 1 0 18M17.5 3.5a13 13 0 0 1 0 13M22 6a9 9 0 0 1 0 8"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* شماره کارت */}
        <p
          dir="ltr"
          className="absolute inset-x-0 top-[62%] px-5 text-center font-mono text-sm font-semibold tracking-[0.22em] sm:text-base"
        >
          ZRC •••• ••••
        </p>

        {/* دارنده */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
          <div>
            <p className={cn('text-[8px] tracking-widest', 'opacity-60')}>CARD HOLDER</p>
            <p className="text-sm font-bold">{holder || 'نام شما'}</p>
          </div>
          <div className="flex -space-x-1.5" aria-hidden="true">
            <span
              className={cn('size-5 rounded-full', isNavy ? 'bg-gold-400/80' : 'bg-black/25')}
            />
            <span className={cn('size-5 rounded-full', isNavy ? 'bg-white/40' : 'bg-white/50')} />
            <span
              className={cn('size-5 rounded-full', isNavy ? 'bg-gold-400/40' : 'bg-black/15')}
            />
          </div>
        </div>
      </div>

      {/* پشت کارت */}
      <div
        className={cn(
          'absolute inset-0 [transform:rotateY(180deg)] overflow-hidden rounded-[1.4rem] bg-gradient-to-bl [backface-visibility:hidden]',
          isCream
            ? 'from-[#efe0c0] to-[#c9a86a] text-[#3d2f14]'
            : color === 'GOLD'
              ? 'from-[#3a2c08] via-[#241a04] to-[#100c02] text-[#e8d48b]'
              : 'from-[#0b1220] via-[#060b18] to-black text-[#dbe7ff]',
        )}
      >
        <div className="mt-6 h-10 w-full bg-black/80" />
        <div className="mx-4 mt-4 flex h-8 items-center justify-end rounded bg-white/90 px-3">
          <span className="font-mono text-xs tracking-widest text-black/70" dir="ltr">
            CVV •••
          </span>
        </div>
        <p className="mt-4 px-5 text-[9px] leading-5 opacity-70">
          این کارت وابسته به موجودی طلایی کیف پول زر۳۰ شماست و در هر خرید، معادل ریالی طلا به‌صورت
          لحظه‌ای تسویه می‌شود. در صورت گمشدن فوراً از پنل مسدود کنید.
        </p>
        <p className="absolute bottom-3 left-4 text-[9px] tracking-widest opacity-60" dir="ltr">
          zar30.ir/zareesi
        </p>
      </div>
    </div>
  )
}

// ---------- صفحه اصلی ----------
export function ZareesiCardClient() {
  const { user } = usePanelUser()
  const [cards, setCards] = useState<ZareesiCardDto[] | null>(null)
  const [config, setConfig] = useState<ZareesiConfigDto | null>(null)
  const [goldBalance, setGoldBalance] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<AddressDto[]>([])
  const [color, setColor] = useState<ColorKey>('GOLD')
  const [holder, setHolder] = useState('')
  const [shipping, setShipping] = useState<'POST' | 'PICKUP'>('POST')
  const [addressId, setAddressId] = useState('')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)

  const load = useCallback(async () => {
    const [res, walletRes, addrRes] = await Promise.all([
      apiGetWithRefresh<{ cards: ZareesiCardDto[]; config: ZareesiConfigDto }>(
        '/api/v1/zareesi-cards',
      ),
      apiGetWithRefresh<{ accounts: { assetType: string; balance: string }[] }>('/api/v1/wallet'),
      apiGetWithRefresh<{ addresses: AddressDto[] }>('/api/v1/addresses'),
    ])
    if (res.ok && res.data) {
      setCards(res.data.cards)
      setConfig(res.data.config)
    }
    if (walletRes.ok && walletRes.data?.accounts) {
      setGoldBalance(walletRes.data.accounts.find((a) => a.assetType === 'GOLD')?.balance ?? '0')
    }
    if (addrRes.ok && addrRes.data) {
      setAddresses(addrRes.data.addresses)
      const def = addrRes.data.addresses.find((a) => a.isDefault)
      if (def) setAddressId(def.id)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await load()
      if (cancelled) return
      if (user && !holder) {
        setHolder([user.firstName, user.lastName].filter(Boolean).join(' ').trim())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load, user, holder])

  const activeCount = useMemo(
    () =>
      (cards ?? []).filter((c) =>
        ['PENDING', 'APPROVED', 'PRODUCTION', 'SHIPPED', 'ACTIVE'].includes(c.status),
      ).length,
    [cards],
  )
  const canOrder = activeCount < (config?.maxActiveCards ?? 3)
  const feeGold = config?.feeGold ?? '0'
  const feePost = BigInt(config?.feePost ?? '0')
  const hasGold = Number(goldBalance ?? '0') >= Number(feeGold)

  async function order() {
    if (busy || !agree) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPost<{ card: ZareesiCardDto }>('/api/v1/zareesi-cards', {
      color,
      holderName: holder,
      shippingMethod: shipping,
      deliveryAddressId: shipping === 'POST' ? addressId : undefined,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت سفارش ناموفق بود')
      return
    }
    setDone(`سفارش کارت زرسی ثبت شد — شماره پیگیری: ${res.data?.card.cardNumber}`)
    setAgree(false)
    await load()
  }

  async function cancel(id: string) {
    if (busy) return
    setBusy(true)
    setError(null)
    const res = await apiPost(`/api/v1/zareesi-cards/${id}/cancel`, {})
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'لغو ناموفق بود')
      return
    }
    setDone('سفارش لغو شد و کارمزد به کیف پول شما برگشت خورد.')
    await load()
  }

  const holderName = holder || 'نام شما'

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-24">
      {/* ---------- هیرو ---------- */}
      <section className="border-gold-500/20 from-gold-500/10 relative overflow-hidden rounded-3xl border bg-gradient-to-bl via-transparent to-transparent p-6 text-center sm:p-8">
        <div className="bg-gold-400/15 pointer-events-none absolute -top-24 right-1/2 size-64 translate-x-1/2 rounded-full blur-3xl" />
        <span className="border-gold-500/30 bg-gold-500/10 text-gold-600 dark:text-gold-400 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold">
          <IconSparkles className="size-3.5" /> خدمت جدید زر۳۰
        </span>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">
          کارت{' '}
          <span className="from-gold-600 via-gold-400 to-gold-600 dark:from-gold-300 dark:via-gold-200 dark:to-gold-400 bg-gradient-to-l bg-clip-text text-transparent">
            زرسی
          </span>{' '}
          — خرید با طلا، بدون تبدیل
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-7">
          کارت فلزی اختصاصی شما که مستقیم به موجودی طلایی کیف پول وصل است؛ در هر فروشگاهی کارت را
          بزنید و معادل ریالی از طلای شما تسویه می‌شود — بدون فریز شدن سرمایه، بدون کارمزد تبدیل.
        </p>

        {/* سه کارت چیده‌شده */}
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <div className="w-24 translate-y-2 rotate-[-8deg] opacity-90 transition-transform hover:rotate-0 sm:w-32">
            <CardFace color="NAVY" holder={holderName} flipped={false} />
          </div>
          <div className="z-10 w-28 scale-110 transition-transform hover:scale-[1.15] sm:w-36">
            <CardFace color="GOLD" holder={holderName} flipped={false} />
          </div>
          <div className="w-24 translate-y-2 rotate-[8deg] opacity-90 transition-transform hover:rotate-0 sm:w-32">
            <CardFace color="CREAM" holder={holderName} flipped={false} />
          </div>
        </div>

        {/* ویژگی‌ها */}
        <div className="mt-8 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {[
            { icon: IconCoin, t: 'خرید با موجودی طلایی' },
            { icon: IconShieldCheck, t: 'فلزی و امن' },
            { icon: IconTruckDelivery, t: 'ارسال به سراسر کشور' },
            { icon: IconLock, t: 'مسدودسازی فوری' },
          ].map((f) => (
            <div
              key={f.t}
              className="bg-card/60 border-border/60 flex flex-col items-center gap-1.5 rounded-xl border p-3 backdrop-blur"
            >
              <f.icon className="text-gold-500 size-5" stroke={1.6} />
              <span className="text-foreground font-medium">{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- موجودی + کارمزد ---------- */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card border-border/60 rounded-2xl border p-4">
          <p className="text-muted-foreground text-[11px]">موجودی طلایی شما</p>
          <p className="mt-1 text-lg font-black tabular-nums">
            {goldBalance ? `${formatGoldAmount(goldBalance)} گرم` : '—'}
          </p>
        </div>
        <div className="bg-card border-border/60 rounded-2xl border p-4">
          <p className="text-muted-foreground text-[11px]">کارمزد صدور (یک‌بار)</p>
          <p className="mt-1 text-lg font-black tabular-nums">
            {config ? `${formatGoldAmount(feeGold)} گرم` : '—'}
          </p>
        </div>
        <div className="bg-card border-border/60 rounded-2xl border p-4">
          <p className="text-muted-foreground text-[11px]">کارمزد ارسال پستی</p>
          <p className="mt-1 text-lg font-black tabular-nums">
            {config ? `${formatExactAmount(feePost.toString())} تومان` : '—'}
          </p>
        </div>
      </section>

      {/* ---------- فرم سفارش ---------- */}
      {canOrder ? (
        <section className="bg-card border-border/60 rounded-3xl border p-5 sm:p-6">
          <h2 className="text-foreground text-base font-black">سفارش کارت زرسی</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            رنگ، نام حک‌شده و روش ارسال را انتخاب کنید —{' '}
            {toPersianDigits(config?.maxActiveCards ?? 3)} کارت فعال همزمان.
          </p>

          {/* انتخاب رنگ */}
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {(Object.keys(COLOR_META) as ColorKey[]).map((c) => {
              const m = COLOR_META[c]
              const selected = color === c
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'group relative rounded-2xl border p-3 text-center transition-all',
                    selected
                      ? cn('border-transparent ring-2', m.ring)
                      : 'border-border/60 hover:border-border',
                  )}
                >
                  <div
                    className={cn(
                      'mx-auto h-14 w-20 rounded-lg bg-gradient-to-bl shadow-md transition-transform group-hover:scale-105 sm:w-24',
                      m.chip,
                    )}
                  />
                  <p className="text-foreground mt-2 text-xs font-bold">{m.label}</p>
                  <p className="text-muted-foreground mt-0.5 hidden text-[10px] leading-4 sm:block">
                    {m.tagline}
                  </p>
                  {selected && (
                    <span className="bg-success absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full text-white">
                      <IconCheck className="size-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* نام حک‌شده */}
          <div className="mt-5">
            <label
              htmlFor="zareesi-holder"
              className="text-muted-foreground mb-1.5 block text-[11px] font-medium"
            >
              نام حک‌شده روی کارت (فارسی)
            </label>
            <div className="flex gap-2">
              <input
                id="zareesi-holder"
                value={holder}
                onChange={(e) => setHolder(e.target.value.slice(0, 40))}
                placeholder="مثلاً: سارا محمدی"
                className="border-border/60 bg-background text-foreground focus-visible:ring-ring h-11 flex-1 rounded-xl border px-4 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="border-border/60 text-muted-foreground hover:text-foreground hover:border-border rounded-xl border px-4 text-xs font-medium transition-colors"
              >
                {flipped ? 'روی کارت' : 'پشت کارت'}
              </button>
            </div>
          </div>

          {/* پیش‌نمایش بزرگ */}
          <div className="mt-5 flex justify-center [perspective:1200px]">
            <div className="w-full max-w-xs">
              <CardFace color={color} holder={holderName} flipped={flipped} />
            </div>
          </div>

          {/* روش ارسال */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(
              [
                {
                  key: 'POST',
                  label: 'پست پیشتاز',
                  desc: 'ارسال به آدرس شما',
                  icon: IconTruckDelivery,
                },
                {
                  key: 'PICKUP',
                  label: 'تحویل حضوری',
                  desc: 'تحویل در دفتر زر۳۰',
                  icon: IconPackage,
                },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setShipping(s.key)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-start transition-all',
                  shipping === s.key
                    ? 'border-gold-500/50 bg-gold-500/5 ring-gold-500/30 ring-1'
                    : 'border-border/60 hover:border-border',
                )}
              >
                <s.icon
                  className={cn(
                    'size-5',
                    shipping === s.key ? 'text-gold-500' : 'text-muted-foreground',
                  )}
                  stroke={1.6}
                />
                <div>
                  <p className="text-foreground text-xs font-bold">{s.label}</p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* آدرس */}
          {shipping === 'POST' && (
            <div className="mt-4">
              {addresses.length > 0 ? (
                <select
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                  className="border-border/60 bg-background text-foreground focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title ? `${a.title} — ` : ''}
                      {a.province}، {a.city}
                    </option>
                  ))}
                </select>
              ) : (
                <Link
                  href="/dashboard/delivery"
                  className="border-warning/40 bg-warning/5 text-warning flex items-center justify-between rounded-xl border border-dashed p-3 text-xs"
                >
                  <span>هنوز آدرسی ثبت نکرده‌اید — برای ارسال پستی آدرس لازم است.</span>
                  <IconArrowRight className="size-4 shrink-0" />
                </Link>
              )}
            </div>
          )}

          {/* موجودی کافی نیست */}
          {!hasGold && (
            <div className="border-error/30 bg-error/5 text-error mt-4 rounded-xl border p-3 text-xs leading-6">
              موجودی طلایی شما برای کارمزد صدور ({formatGoldAmount(feeGold)} گرم) کافی نیست.{' '}
              <Link href="/dashboard/deposit" className="underline underline-offset-4">
                ابتدا کیف پول طلایی خود را شارژ کنید ←
              </Link>
            </div>
          )}

          {/* تاییدیه */}
          <label className="text-muted-foreground mt-4 flex cursor-pointer items-start gap-2.5 text-xs leading-6">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="accent-gold-500 mt-1 size-4"
            />
            <span>
              کارمزد صدور به‌صورت لحظه‌ای از کیف پول طلایی من کسر می‌شود و{' '}
              <strong className="text-foreground">در صورت رد درخواست، کامل برگشت می‌خورد</strong>.
              مشخصات حک‌شده را تایید می‌کنم.
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="border-error/30 bg-error/5 text-error mt-3 rounded-xl border p-3 text-xs"
            >
              {error}
            </p>
          )}
          {done && (
            <p
              role="status"
              className="border-success/30 bg-success/5 text-success mt-3 rounded-xl border p-3 text-xs"
            >
              {done}
            </p>
          )}

          <button
            type="button"
            onClick={() => void order()}
            disabled={
              busy ||
              !agree ||
              !holder.trim() ||
              !hasGold ||
              (shipping === 'POST' && (!addressId || addresses.length === 0))
            }
            className="from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 shadow-gold-500/25 mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l text-sm font-black text-white shadow-lg transition-all disabled:pointer-events-none disabled:opacity-40"
          >
            {busy ? (
              <IconLoader2 className="size-5 animate-spin" />
            ) : (
              <IconSparkles className="size-5" />
            )}
            {busy ? 'در حال ثبت…' : 'ثبت سفارش کارت زرسی'}
          </button>
        </section>
      ) : (
        <section className="border-warning/30 bg-warning/5 rounded-2xl border p-4 text-xs leading-6">
          به سقف {toPersianDigits(config?.maxActiveCards ?? 3)} کارت فعال رسیده‌اید. برای سفارش کارت
          جدید ابتدا یکی از کارت‌های فعلی را منتظر بمانید یا به پشتیبانی اطلاع دهید.
        </section>
      )}

      {/* ---------- کارت‌های من ---------- */}
      <section>
        <h2 className="text-foreground mb-3 text-base font-black">کارت‌های من</h2>
        {!cards ? (
          <div className="skeleton-shimmer h-24 rounded-2xl" />
        ) : cards.length === 0 ? (
          <p className="text-muted-foreground border-border/60 rounded-2xl border border-dashed p-6 text-center text-xs">
            هنوز کارتی سفارش نداده‌اید — اولین کارت زرسی خود را بالای همین صفحه سفارش دهید.
          </p>
        ) : (
          <ul className="space-y-3">
            {cards.map((c) => {
              const st = STATUS_META[c.status] ?? {
                label: c.status,
                cls: 'bg-muted text-muted-foreground',
                step: 1,
              }
              const m = COLOR_META[c.color]
              const cancellable = c.status === 'PENDING'
              return (
                <li key={c.id} className="bg-card border-border/60 rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-8 w-12 rounded-md bg-gradient-to-bl shadow', m.chip)} />
                      <div>
                        <p className="text-foreground text-sm font-bold">کارت {m.label}</p>
                        <p
                          className="text-muted-foreground mt-0.5 font-mono text-[10px] tracking-wider"
                          dir="ltr"
                        >
                          {c.cardNumber}
                        </p>
                      </div>
                    </div>
                    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', st.cls)}>
                      {st.label}
                    </span>
                  </div>

                  {/* ریل وضعیت */}
                  {c.status !== 'REJECTED' && c.status !== 'BLOCKED' && (
                    <div className="mt-4 flex items-center gap-1">
                      {['ثبت', 'تایید', 'تولید', 'ارسال', 'فعال'].map((label, i) => {
                        const stepNo = i + 1
                        const reached = st.step >= stepNo
                        return (
                          <div key={label} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className={cn(
                                'h-1 w-full rounded-full',
                                reached ? 'bg-gold-500' : 'bg-border',
                              )}
                            />
                            <span
                              className={cn(
                                'text-[9px]',
                                reached
                                  ? 'text-gold-600 dark:text-gold-400 font-bold'
                                  : 'text-muted-foreground',
                              )}
                            >
                              {label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                    <span>
                      حک‌شده: <strong className="text-foreground">{c.holderName}</strong>
                    </span>
                    <span>کارمزد: {formatGoldAmount(c.feeGold)} گرم</span>
                    {c.trackingCode && (
                      <span dir="ltr" className="font-mono">
                        رهگیری: {c.trackingCode}
                      </span>
                    )}
                    <span>{new Date(c.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>

                  {c.rejectedReason && (
                    <p className="text-error mt-2 text-[11px]">دلیل رد/لغو: {c.rejectedReason}</p>
                  )}

                  {cancellable && (
                    <button
                      type="button"
                      onClick={() => void cancel(c.id)}
                      disabled={busy}
                      className="text-error hover:bg-error/10 mt-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-40"
                    >
                      <IconX className="size-3.5" /> لغو سفارش و برگشت کارمزد
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ---------- سوالات ---------- */}
      <section className="bg-card border-border/60 rounded-3xl border p-5">
        <h2 className="text-foreground text-sm font-black">سوالات پرتکرار</h2>
        <div className="mt-3 space-y-3 text-xs leading-6">
          {[
            [
              'چطور با کارت زرسی خرید می‌کنم؟',
              'کارت به موجودی طلایی کیف پول شما وصله. موقع پرداخت در فروشگاه، مبلغ خرید به ریال از طلای شما به قیمت لحظه‌ای تسویه می‌شود — طلا حرکت می‌کند، نه پول نقد.',
            ],
            [
              'اگر قیمت طلا تغییر کند چه؟',
              'تسویه لحظه‌ای است؛ هر خرید با قیمت همان لحظه محاسبه می‌شود و طلا کمتر یا بیشتر نمی‌شود — فقط معادل ریالی آن جابه‌جا می‌شود.',
            ],
            [
              'کارمزد سالانه دارد؟',
              'خیر — فقط یک‌بار کارمزد صدور به گرم طلا پرداخت می‌کنید. نگهداری و تسویه رایگان است.',
            ],
            [
              'گم شدن کارت چه کنم؟',
              'از همین صفحه یا پشتیبانی، کارت را فوراً مسدود کنید؛ طلای شما در کیف پول امن می‌ماند و کارت جدید صادر می‌شود.',
            ],
          ].map(([q, a]) => (
            <details key={q} className="group">
              <summary className="text-foreground cursor-pointer list-none font-bold transition-colors [&::-webkit-details-marker]:hidden">
                <span className="text-gold-500 ml-1.5 inline-block transition-transform group-open:rotate-90">
                  ▸
                </span>
                {q}
              </summary>
              <p className="text-muted-foreground mt-1.5 pr-4">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
