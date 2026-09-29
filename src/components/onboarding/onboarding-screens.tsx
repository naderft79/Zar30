// ============================================
// Zar30 - Onboarding Screens (Mobile + Desktop)
// ============================================
// ۴ اسکرین معرفی قبل از ورود/ثبت‌نام
// فقط transform/opacity برای animation performance
// ============================================

'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ONBOARDING_SLIDES, ONBOARDING_STORAGE_KEY } from './onboarding-data'
import {
  SecurityIllustration,
  TradeIllustration,
  InvestIllustration,
  DeliveryIllustration,
} from './onboarding-illustrations'
import { cn } from '@/lib/utils/utils'

const ILLUSTRATIONS = [
  SecurityIllustration,
  TradeIllustration,
  InvestIllustration,
  DeliveryIllustration,
]

// چک می‌کند آیا کاربر قبلاً onboarding را دیده است
function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function markOnboardingCompleted() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
  } catch {
    // ignore storage errors
  }
}

// وضعیت «دیده‌شده» از localStorage — server همیشه false تا hydration یکدست بماند
const subscribeNoop = () => () => {}
function useOnboardingCompleted(): boolean {
  return useSyncExternalStore(subscribeNoop, hasCompletedOnboarding, () => false)
}

export function OnboardingScreens() {
  const router = useRouter()
  const completed = useOnboardingCompleted()
  const [slide, setSlide] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // کاربر قبلاً معرفی را دیده — مستقیم به ورود
    if (completed) router.replace('/login')
  }, [completed, router])

  const goTo = useCallback(
    (index: number, dir: 'next' | 'prev') => {
      if (isAnimating || index === slide || index < 0 || index >= ONBOARDING_SLIDES.length) return
      setDirection(dir)
      setIsAnimating(true)
      setSlide(index)
      setTimeout(() => setIsAnimating(false), 350)
    },
    [isAnimating, slide],
  )

  const next = useCallback(() => {
    if (slide === ONBOARDING_SLIDES.length - 1) {
      markOnboardingCompleted()
      router.push('/login')
      return
    }
    goTo(slide + 1, 'next')
  }, [goTo, router, slide])

  const prev = useCallback(() => {
    if (slide > 0) goTo(slide - 1, 'prev')
  }, [goTo, slide])

  const skip = useCallback(() => {
    markOnboardingCompleted()
    router.push('/login')
  }, [router])

  // پشتیبانی از swipe در موبایل
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0]?.clientX ?? null)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX ?? null)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe && slide < ONBOARDING_SLIDES.length - 1) next()
    if (isRightSwipe && slide > 0) prev()
  }

  if (completed) {
    // در حال انتقال به ورود — نمایش اسکلتون برای جلوگیری از flicker
    return (
      <div className="bg-background flex h-dvh w-full items-center justify-center">
        <div className="bg-muted skeleton-shimmer size-56 rounded-3xl" />
      </div>
    )
  }

  const currentData = ONBOARDING_SLIDES[slide]!
  const CurrentIllustration = ILLUSTRATIONS[slide]!
  const isLast = slide === ONBOARDING_SLIDES.length - 1

  return (
    <div
      className="bg-background relative flex h-dvh w-full flex-col overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* هالو تزئینی ملایم */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(212_175_55/0.12),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 right-0 h-64 w-64 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(53_84_138/0.08),transparent_70%)]"
        aria-hidden="true"
      />

      {/* دکمه رد کردن */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
        <button
          type="button"
          onClick={skip}
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          aria-label="رد کردن معرفی"
        >
          رد کردن
        </button>
        <div className="flex items-center gap-1">
          {ONBOARDING_SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === slide ? 'bg-gold-500 w-5' : 'bg-border w-1.5',
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      </header>

      {/* محتوای اصلی */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 sm:px-8">
        <div className="w-full max-w-md">
          <div
            key={currentData.id}
            className={cn(
              'flex flex-col items-center text-center',
              'animate-slide-enter',
              direction === 'prev' && 'animate-slide-enter-reverse',
            )}
          >
            <CurrentIllustration className="mb-6 sm:mb-8" />

            <h1 className="text-foreground mb-3 text-2xl font-extrabold text-balance sm:text-3xl">
              {currentData.title}
            </h1>
            <p className="text-muted-foreground max-w-xs text-[15px] leading-7 text-pretty sm:max-w-sm">
              {currentData.description}
            </p>

            {/* هایلایت‌ها */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {currentData.highlights.map((text) => (
                <span
                  key={text}
                  className="bg-gold-100/60 text-gold-700 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* دکمه‌های پایین */}
      <footer className="relative z-10 flex flex-col items-center gap-4 px-6 pb-6 sm:pb-8">
        {/* navigation dots برای accessibility */}
        <div
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="اسلایدهای معرفی"
        >
          {ONBOARDING_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`اسلاید ${i + 1}: ${s.title}`}
              onClick={() => goTo(i, i > slide ? 'next' : 'prev')}
              className={cn(
                'focus-visible:ring-gold-500 h-2 rounded-full transition-all duration-300 focus-visible:ring-2',
                i === slide ? 'bg-gold-500 w-6' : 'bg-border hover:bg-muted-foreground/40 w-2',
              )}
            />
          ))}
        </div>

        <div className="flex w-full max-w-md items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={prev}
            disabled={slide === 0}
            className="flex-1"
            aria-label="اسلاید قبلی"
          >
            <IconChevronRight className="size-4" />
            قبلی
          </Button>
          <Button
            type="button"
            variant={isLast ? 'gold' : 'default'}
            size="lg"
            onClick={next}
            className="flex-1"
            aria-label={isLast ? 'شروع کنید' : 'اسلاید بعدی'}
          >
            {isLast ? 'شروع کنید' : 'بعدی'}
            <IconChevronLeft className="size-4" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
