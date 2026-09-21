// ============================================
// Zar30 - Scroll Reveal (Landing)
// ============================================
// ورود بخش‌ها هنگام ورود به viewport — فقط opacity/translateY
// یک‌بار اجرا (once) + stagger با --reveal-delay
// کنترلر مشترک مبتنی بر scroll با rAF — برخلاف IO،
// پرش آنی (anchor/End) را هم پوشش می‌دهد
// ============================================

'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from 'cn'

// ---------- کنترلر مشترک (یک listener برای همه revealها) ----------
const pending = new Set<HTMLElement>()
let ticking = false
let inited = false

/** خط فعال‌سازی — عنصری که top آن از این خط رد شود reveal می‌شود */
const ACTIVATION_RATIO = 0.92

function runCheck() {
  const line = window.innerHeight * ACTIVATION_RATIO
  for (const el of pending) {
    if (el.getBoundingClientRect().top < line) {
      el.classList.add('is-visible')
      pending.delete(el)
    }
  }
  ticking = false
  if (pending.size === 0) teardown()
}

function requestCheck() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(runCheck)
  }
}

function teardown() {
  window.removeEventListener('scroll', requestCheck, { passive: true } as EventListenerOptions)
  window.removeEventListener('resize', requestCheck)
  inited = false
}

function ensureListener() {
  if (inited) return
  inited = true
  window.addEventListener('scroll', requestCheck, { passive: true })
  window.addEventListener('resize', requestCheck)
}

// ---------- کامپوننت ----------
interface RevealProps {
  children: ReactNode
  className?: string
  /** تأخیر ورود به میلی‌ثانیه — برای stagger */
  delay?: number
  as?: 'div' | 'section' | 'li' | 'article'
}

export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // motion کاهش‌یافته → بدون انیمیشن، نمایش مستقیم
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    pending.add(el)
    ensureListener()
    requestCheck()
    return () => {
      pending.delete(el)
    }
  }, [])

  return (
    <Tag
      // @ts-expect-error — ref عمومی برای tagهای مختلف
      ref={ref}
      className={cn('reveal', className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}
