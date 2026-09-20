'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import { formatAmount } from '@/lib/utils/format'

// ============================================
// Financial Number — عدد مالی با سلسله‌مراتب بصری
// tabular-nums + ارقام فارسی + count-up اختیاری
// ============================================

interface FinancialNumberProps {
  value: number | string
  /** واحد — مثلاً «تومان» یا «گرم» */
  unit?: string
  digits?: 'fa' | 'en'
  decimals?: number
  /** اندازه بصری */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * انیمیشن count-up — فقط برای نمایش‌های غیربحرانی (داشبورد، خلاصه).
   * برای مقادیر بحرانی تراکنش false بماند تا ابهام ایجاد نشود.
   */
  animate?: boolean
  className?: string
  unitClassName?: string
}

const sizeClasses = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-bold',
  lg: 'text-xl font-bold',
  xl: 'text-3xl font-extrabold',
}

const unitSizeClasses = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
}

// آیا کاربر کاهش حرکت را ترجیح می‌دهد؟
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function FinancialNumber({
  value,
  unit,
  digits = 'fa',
  decimals,
  size = 'md',
  animate = false,
  className,
  unitClassName,
}: FinancialNumberProps) {
  const target = typeof value === 'string' ? Number(value) : value
  const animating = animate && !prefersReducedMotion() && Number.isFinite(target)

  // display فقط حین انیمیشن مصرف می‌شود؛ بدون انیمیشن همان target رندر می‌شود
  const [display, setDisplay] = useState(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animating || display === target) return

    const from = display
    const start = performance.now()
    const duration = 600

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (target - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // display عمداً در deps نیست — مبدأ انیمیشن همان مقدار لحظه شروع است
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, animating])

  const shown = animating ? display : target

  return (
    <span
      data-slot="financial-number"
      data-financial
      className={cn('tnum inline-flex items-baseline gap-1', sizeClasses[size], className)}
      dir="rtl"
    >
      <span>{formatAmount(shown, { digits, decimals })}</span>
      {unit && (
        <span
          className={cn('text-muted-foreground font-normal', unitSizeClasses[size], unitClassName)}
        >
          {unit}
        </span>
      )}
    </span>
  )
}
