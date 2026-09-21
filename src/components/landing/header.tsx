// ============================================
// Zar30 - Landing Header (Gerami-style)
// ============================================
// سفید/روشن + dropdownهای تمیز + رفتار اسکرول (۸۰px → ۶۸px)
// Compact premium CTA — نه navbar ساده SaaS
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/data/landing'
import { Logo } from '@/components/shared/logo'
import { NavDropdown } from './nav-dropdown'
import { MobileMenu } from './mobile-menu'
import { cn } from 'cn'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-sm',
        'transition-[height,box-shadow,border-color] duration-300 ease-out',
        scrolled
          ? 'border-navy-100/80 shadow-[0_1px_12px_rgb(16_29_56/0.05)] supports-[backdrop-filter]:bg-white/90'
          : 'border-transparent',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8',
          'transition-[height] duration-300 ease-out',
          scrolled ? 'h-[68px]' : 'h-20',
        )}
      >
        {/* لوگو */}
        <Link href="/" className="shrink-0" aria-label="زرسی — صفحه اصلی">
          <Logo size="md" textClassName="text-navy-950" />
        </Link>

        {/* ناوبری دسکتاپ */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <NavDropdown key={item.label} label={item.label} items={item.children} />
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className="text-navy-700 hover:text-navy-950 focus-visible:ring-gold-500/40 inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {/* CTA — compact و premium */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="text-navy-700 hover:text-navy-950 inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors"
          >
            <LogIn className="size-4" aria-hidden="true" />
            ورود
          </Link>
          <Link
            href="/register"
            className="bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
          >
            شروع خرید
          </Link>
        </div>

        {/* منوی موبایل */}
        <MobileMenu />
      </div>
    </header>
  )
}
