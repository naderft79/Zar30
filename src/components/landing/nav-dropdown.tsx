// ============================================
// Zar30 - Nav Dropdown (Landing Header)
// ============================================
// Dropdown تمیز سبک Gerami — opacity + translateY کوچک، 200ms
// باز/بسته با hover و keyboard (Escape می‌بندد؛ focus مدیریت می‌شود)
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { NavLink } from '@/lib/data/landing'
import { cn } from 'cn'

interface NavDropdownProps {
  label: string
  items: NavLink[]
}

export function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // hover با تأخیر کوتاه بسته می‌شود تا پرش نداشته باشیم
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  function openNow() {
    cancelClose()
    setOpen(true)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // کلیک بیرون → بسته شود
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative" onMouseEnter={openNow} onMouseLeave={scheduleClose}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        onFocus={openNow}
        className="text-navy-700 hover:text-navy-950 focus-visible:ring-gold-500/40 inline-flex h-11 items-center gap-1 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2"
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'text-navy-400 size-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* پنل — fade + translateY کوچک */}
      <div
        className={cn(
          'absolute top-full right-0 z-50 min-w-44 pt-2',
          'transition-[opacity,transform] duration-200 ease-out',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
        )}
      >
        <ul className="border-navy-100/80 rounded-xl border bg-white py-2 shadow-[0_12px_32px_-8px_rgb(16_29_56/0.14)]">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-navy-700 hover:bg-cream-100/70 hover:text-navy-950 block px-4 py-2.5 text-sm transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
