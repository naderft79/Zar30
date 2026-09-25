// ============================================
// Zar30 - Logo Component
// ============================================
// لوگوی برند زرسی — نماد طلا + نام فارسی
// ============================================

import { cn } from 'cn'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  /** کلاس رنگ متن — پیش‌فرض text-foreground؛ روی سطوح تیره مقدار روشن بدهید */
  textClassName?: string
}

const sizes = {
  sm: { icon: 'h-7', text: 'text-lg' },
  md: { icon: 'h-9', text: 'text-xl' },
  lg: { icon: 'h-12', text: 'text-2xl' },
}

export function Logo({ className, size = 'md', showText = true, textClassName }: LogoProps) {
  const s = sizes[size]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {/* نماد زرسی — Z30 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand-mark.png" alt="" className={cn(s.icon, 'w-auto shrink-0')} />
      {showText && (
        <span className={cn('text-foreground font-bold', s.text, textClassName)}>زرسی</span>
      )}
    </span>
  )
}
