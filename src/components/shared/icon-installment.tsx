// ============================================
// Zar30 - آیکون اقساط — تصویر ۳بعدی تقویم
// ============================================
// آیکون برند اقساط در همه جا (nav، کارت‌ها، بنر، تراکنش) این تصویر است.
// امضای props با آیکون‌های Tabler سازگار است تا drop-in replacement باشد.
// ============================================

import type { ComponentType, CSSProperties } from 'react'

// زیرمجموعه پراپ‌های پرکاربرد آیکون — با TablerIcon سازگار
export interface AppIconProps {
  className?: string
  stroke?: number | string
  strokeWidth?: number | string
  size?: number | string
  style?: CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
}
export type AppIcon = ComponentType<AppIconProps>

export function IconInstallment({ className, style }: AppIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/3d-calendar.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
    />
  )
}

// آیکون اعتبار فوری — تصویر ۳بعدی پول
export function IconInstantCredit({ className, style }: AppIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/money-stack.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
    />
  )
}

// آیکون تحویل فیزیکی — تصویر ۳بعدی جعبه طلا
export function IconDelivery({ className, style }: AppIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/gold-box.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
    />
  )
}

// آیکون خانه — تصویر ۳بعدی خانه
export function IconHome3d({ className, style }: AppIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/3d-house.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
    />
  )
}

// آیکون کیف پول — تصویر ۳بعدی کیف پول
export function IconWallet3d({ className, style }: AppIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/wallet.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
    />
  )
}

// آیکون زرکار — تصویر ۳بعدی شمش طلا
export function IconZarkar({ className, style }: AppIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/gold.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={style}
    />
  )
}
