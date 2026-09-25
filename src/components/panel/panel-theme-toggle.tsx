// ============================================
// Zar30 - Panel Theme Toggle
// ============================================
// سوییچ light/dark در هدر پنل کاربر — کنار آیکون پشتیبانی/اعلان
// همان انیمیشن موج دایره‌ای نسخه ادمین (View Transition از محل دکمه)
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

export function PanelThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // موج دایره‌ای از مرکز دکمه — fallback به ترنزیشن نرم
    if (typeof document.startViewTransition === 'function' && !prefersReducedMotion) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )
      const transition = document.startViewTransition(() => setTheme(next))
      transition.ready
        .then(() => {
          root.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
            },
            {
              duration: 450,
              easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          )
        })
        .catch(() => {})
      return
    }

    root.classList.add('theme-animating')
    setTheme(next)
    window.setTimeout(() => root.classList.remove('theme-animating'), 300)
  }

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
      title={isDark ? 'حالت روشن' : 'حالت تیره'}
      className="text-muted-foreground hover:bg-muted hover:text-gold-600 focus-visible:ring-ring border-border/50 bg-card/60 flex size-9 items-center justify-center rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* remount با key → انیمیشن ورود در هر تعویض تم اجرا می‌شود */}
      {isDark ? (
        <IconMoon
          key="moon"
          aria-hidden="true"
          className="animate-theme-icon-in size-4.5"
          stroke={1.75}
        />
      ) : (
        <IconSun
          key="sun"
          aria-hidden="true"
          className="animate-theme-icon-in size-4.5"
          stroke={1.75}
        />
      )}
    </button>
  )
}
