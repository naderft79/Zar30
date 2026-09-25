// ============================================
// Zar30 - Admin Theme Toggle
// ============================================
// دکمه سوییچ light/dark در هدر مرکز عملیات — انیمیشن آیکون + ترنزیشن نرم رنگ‌ها
// آیکون با keyframe animation کار می‌کند تا در لحظه تعویض تم زیر transition رنگ‌ها نرود
// ============================================

'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { IconMoon, IconSun } from '@tabler/icons-react'

// تشخیص mount بدون effect — server=false / client=true (hydration-safe)
const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

export function AdminThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  function toggle() {
    // ترنزیشن نرم رنگ‌ها فقط در لحظه تعویض تم — بعد از انیمیشن کلاس برداشته می‌شود
    const root = document.documentElement
    root.classList.add('theme-animating')
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    window.setTimeout(() => root.classList.remove('theme-animating'), 450)
  }

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
      title={isDark ? 'حالت روشن' : 'حالت تیره'}
      className="border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* remount با key → انیمیشن ورود در هر تعویض تم اجرا می‌شود */}
      {isDark ? (
        <IconMoon
          key="moon"
          aria-hidden="true"
          className="animate-theme-icon-in size-[18px]"
          stroke={1.75}
        />
      ) : (
        <IconSun
          key="sun"
          aria-hidden="true"
          className="animate-theme-icon-in size-[18px]"
          stroke={1.75}
        />
      )}
    </button>
  )
}
