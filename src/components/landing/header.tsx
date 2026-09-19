// ============================================
// Zar30 - Landing Header
// ============================================
// هدر عمومی: لوگو + ناوبری + ورود/ثبت‌نام + منوی موبایل
// Server Component — منوی موبایل به‌صورت Client جداست
// ============================================

import Link from 'next/link'
import { NAV_LINKS } from '@/lib/data/landing'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { MobileMenu } from './mobile-menu'

export function Header() {
  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* لوگو */}
        <Link href="/" className="flex items-center gap-2" aria-label="زرسی — صفحه اصلی">
          <Logo size="md" />
        </Link>

        {/* ناوبری دسکتاپ */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* دکمه‌های اقدام */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">ورود</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">شروع کنید</Link>
          </Button>
        </div>

        {/* منوی موبایل */}
        <MobileMenu />
      </div>
    </header>
  )
}
