// ============================================
// Zar30 - Wealth Hero — کارت موجودی اصلی داشبورد
// ============================================
// سطح ممتاز «Luxury Private Banking»: گرافیت لایه‌ای + halo طلایی
// الگوی مرجع: موجودی بزرگ + visibility toggle + اکشن‌های داخل کارت
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Eye, EyeOff, Package, TrendingUp } from 'lucide-react'
import { HandDeposit, HandWithdraw, Vault } from '@phosphor-icons/react'
import { FinancialNumber } from '@/components/financial/financial-number'
import { TrendBadge } from '@/components/financial/trend-badge'
import { toPersianWords } from '@/lib/utils/format'
import { cn } from 'cn'

interface WealthHeroProps {
  /** تاریخ امروز یا context کوتاه */
  dateLabel?: string
  totalValue: number | string
  goldGrams: number | string
  tomanBalance: number | string
  /** موجودی مسدودشده تومانی */
  lockedToman?: number | string
  changePercent?: number
  loading?: boolean
  className?: string
}

// اکشن‌های مالی داخل کارت — ورود سریع به مقصدهای اصلی
const HERO_ACTIONS = [
  { href: '/dashboard/assets?action=deposit', label: 'واریز', icon: HandDeposit },
  { href: '/dashboard/assets?action=withdraw', label: 'انتقال', icon: HandWithdraw },
  { href: '/dashboard/assets', label: 'مدیریت دارایی', icon: Vault },
] as const

// بنرهای چرخان داخل کارت — هر ۵ ثانیه بنر بعدی
const HERO_BANNERS = [
  {
    href: '/dashboard/trade',
    kicker: 'سرمایه‌گذاری طلای آب‌شده',
    title: 'همراه شما در مسیر سرمایه‌گذاری امن',
    description: 'خرید آنی، شفاف و بدون واسطه — حتی با مبالغ بسیار کم',
    icon: TrendingUp,
  },
  {
    href: '/dashboard/installments',
    kicker: 'طلای قسطی',
    title: 'طلای ۱۸ عیار را قسطی بخرید',
    description: 'پرداخت مرحله‌ای و آسان، مالکیت کامل طلا',
    icon: CalendarClock,
  },
  {
    href: '/dashboard/assets',
    kicker: 'تحویل فیزیکی طلا',
    title: 'طلای دیجیتال شما، قابل تحویل فیزیکی',
    description: 'درخواست تحویل طلای فیزیکی از کیف پول طلایی',
    icon: Package,
  },
] as const

const BANNER_INTERVAL_MS = 5_000

// متن تک‌خط — اگر از عرض بنر بیشتر شد، به‌صورت نوشته متحرک (marquee) نمایش داده می‌شود
function MarqueeLine({ text, className }: { text: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [overflow, setOverflow] = useState(false)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const el = textRef.current
    if (!wrap || !el) return
    const check = () => {
      const over = el.scrollWidth > wrap.clientWidth + 2
      setOverflow(over)
      if (over) setDistance(el.scrollWidth - wrap.clientWidth)
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [text])

  if (!overflow) {
    return (
      <div ref={wrapRef} className="overflow-hidden">
        <p ref={textRef} className={cn('truncate', className)}>
          {text}
        </p>
      </div>
    )
  }

  // دو کپی پیاپی + حرکت +50% → لوپ یک‌پارچه (RTL: overflow سمت چپ است)
  const duration = Math.max(6, Math.round(distance / 40))
  return (
    <div ref={wrapRef} className="overflow-hidden">
      <p
        ref={textRef}
        className={cn('marquee-track inline-flex whitespace-nowrap', className)}
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
      >
        <span className="pe-10">{text}</span>
        <span className="pe-10" aria-hidden="true">
          {text}
        </span>
      </p>
    </div>
  )
}

export function WealthHero({
  dateLabel,
  totalValue,
  changePercent,
  loading = false,
  className,
}: WealthHeroProps) {
  // مخفی‌سازی مقادیر مالی — الگوی رایج اپ‌های بانکی
  const [hidden, setHidden] = useState(false)
  // چرخش خودکار بنرها
  const [bannerIdx, setBannerIdx] = useState(0)
  // بعد از تعامل دستی کاربر، چرخش خودکار متوقف می‌شود
  const [autoRotate, setAutoRotate] = useState(true)
  useEffect(() => {
    if (!autoRotate) return
    const t = setInterval(
      () => setBannerIdx((i) => (i + 1) % HERO_BANNERS.length),
      BANNER_INTERVAL_MS,
    )
    return () => clearInterval(t)
  }, [autoRotate])

  // جابه‌جایی بنر با سوایپ لمسی/درag موس — RTL: چپ→بعدی، راست→قبلی
  const touchStartX = useRef<number | null>(null)

  function goBanner(dir: 1 | -1) {
    setAutoRotate(false)
    setBannerIdx((i) => (i + dir + HERO_BANNERS.length) % HERO_BANNERS.length)
  }

  function onSwipeStart(clientX: number) {
    touchStartX.current = clientX
  }

  function onSwipeEnd(clientX: number) {
    if (touchStartX.current === null) return
    const dx = clientX - touchStartX.current
    touchStartX.current = null
    // RTL: سوایپ به چپ → بنر بعدی، سوایپ به راست → قبلی
    if (dx <= -40) goBanner(1)
    else if (dx >= 40) goBanner(-1)
  }

  const banner = HERO_BANNERS[bannerIdx]!
  const BannerIcon = banner.icon

  return (
    <section
      aria-label="خلاصه دارایی"
      className={cn(
        'surface-wealth gold-rings relative overflow-hidden rounded-3xl border p-4 sm:p-5',
        className,
      )}
    >
      {/* halo تزئینی — صرفاً بصری */}
      <div
        aria-hidden="true"
        className="from-gold-500/15 pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-gradient-to-br to-transparent blur-2xl"
      />

      {/* ردیف بالا — تاریخ امروز */}
      {dateLabel && (
        <div className="relative flex justify-end">
          <span className="bg-cream-50/8 ring-cream-50/12 text-cream-200/90 rounded-full px-3 py-1 text-[11px] font-medium tabular-nums ring-1">
            {dateLabel}
          </span>
        </div>
      )}

      {/* موجودی کل — عدد شاخص + چشم */}
      <div className="relative mt-3">
        <div className="mb-1.5 flex items-center gap-2">
          <p className="text-cream-300/80 text-label">موجودی کل</p>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? 'نمایش موجودی' : 'مخفی کردن موجودی'}
            aria-pressed={hidden}
            className="text-cream-300/60 hover:text-gold-300 focus-visible:ring-ring ms-1 flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2"
          >
            {hidden ? (
              <EyeOff className="size-4" strokeWidth={1.75} />
            ) : (
              <Eye className="size-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
        {loading ? (
          <div className="skeleton-shimmer h-12 w-64 rounded-lg" />
        ) : hidden ? (
          <p className="text-cream-50 text-3xl font-extrabold tracking-widest sm:text-4xl">
            ••••••
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1.5">
            <FinancialNumber
              value={totalValue}
              unit="تومان"
              size="xl"
              decimals={0}
              animate
              className="text-cream-50 text-4xl sm:text-5xl"
              unitClassName="text-gold-400 text-base font-bold sm:text-lg"
            />
            {changePercent !== undefined && (
              <TrendBadge value={changePercent} caption="۲۴ ساعت اخیر" className="mb-2" />
            )}
          </div>
        )}
        {/* موجودی به حروف — زیر عدد */}
        {!loading && !hidden && Number(totalValue) > 0 && (
          <p className="text-cream-300/55 mt-1.5 text-[11px] sm:text-xs">
            {toPersianWords(totalValue)} تومان
          </p>
        )}
      </div>

      {/* اکشن‌های مالی — شیشه‌ای سورمه‌ای، بدون سایه/نئون/طلایی */}
      <div className="relative mt-4 grid grid-cols-3 gap-2.5">
        {HERO_ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group bg-navy-300/20 ring-cream-50/15 hover:bg-navy-300/30 focus-visible:ring-cream-50/40 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl ring-1 backdrop-blur-xl transition-colors duration-(--duration-normal) ease-(--ease-out) ring-inset focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon className="text-cream-50 size-6 shrink-0" weight="duotone" aria-hidden="true" />
            <span className="text-cream-50 text-[11px] font-bold sm:text-xs">{label}</span>
          </Link>
        ))}
      </div>

      {/* بنر چرخان — سفید، داخل کارت؛ هر ۵ ثانیه + سوایپ لمسی */}
      <div
        className="relative mt-4"
        onTouchStart={(e) => onSwipeStart(e.touches[0]!.clientX)}
        onTouchEnd={(e) => onSwipeEnd(e.changedTouches[0]!.clientX)}
      >
        <Link
          key={bannerIdx}
          href={banner.href}
          className="animate-fade-up bg-cream-50 focus-visible:ring-gold-500/70 flex items-center justify-between gap-3 rounded-2xl px-4 py-4 transition-transform duration-(--duration-normal) ease-(--ease-spring) hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none sm:px-5"
        >
          {/* حداکثر ۳ خط — متن بلند به‌صورت متحرک نمایش داده می‌شود */}
          <div className="min-w-0 space-y-1">
            <MarqueeLine text={banner.kicker} className="text-gold-600 text-[10px] font-bold" />
            <MarqueeLine
              text={banner.title}
              className="text-navy-800 text-sm leading-5 font-extrabold sm:text-base"
            />
            <MarqueeLine
              text={banner.description}
              className="text-navy-800/55 text-[11px] leading-4.5 sm:text-xs"
            />
          </div>
          <span className="from-gold-400/20 to-gold-600/20 text-gold-600 ring-gold-500/25 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-bl ring-1 sm:size-12">
            <BannerIcon className="size-5" strokeWidth={1.75} />
          </span>
        </Link>
        {/* نشانگر بنرها — قابل کلیک */}
        <div
          className="mt-2 flex items-center justify-center gap-1.5"
          role="tablist"
          aria-label="بنرها"
        >
          {HERO_BANNERS.map((b, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === bannerIdx}
              aria-label={b.kicker}
              onClick={() => {
                setAutoRotate(false)
                setBannerIdx(i)
              }}
              className={cn(
                'h-1 rounded-full transition-all duration-(--duration-normal)',
                i === bannerIdx ? 'bg-gold-400 w-4' : 'bg-cream-50/25 hover:bg-cream-50/40 w-1',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
