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
