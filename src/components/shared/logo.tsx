// ============================================
// Zarnama - Logo Component
// ============================================
// لوگوی برند زرنما — نماد طلا + نام فارسی
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
  sm: { icon: 'size-7', text: 'text-lg' },
  md: { icon: 'size-9', text: 'text-xl' },
  lg: { icon: 'size-12', text: 'text-2xl' },
}

export function Logo({ className, size = 'md', showText = true, textClassName }: LogoProps) {
  const s = sizes[size]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {/* نماد زرنما — سکه طلا با حرف ز */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={cn(s.icon, 'shrink-0')}
        aria-hidden="true"
        role="img"
      >
        <circle cx="24" cy="24" r="22" fill="url(#zarnama-gold)" />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="#0f1a33"
          strokeWidth="1.5"
          opacity="0.35"
        />
        <path
          d="M15 16h18l-11.5 16H34"
          fill="none"
          stroke="#0f1a33"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient
            id="zarnama-gold"
            x1="8"
            y1="6"
            x2="40"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#e0c25a" />
            <stop offset="0.5" stopColor="#c9a227" />
            <stop offset="1" stopColor="#a0801c" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={cn('text-foreground font-bold', s.text, textClassName)}>زرنما</span>
      )}
    </span>
  )
}
