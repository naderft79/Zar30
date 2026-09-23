// ============================================
// Zar30 - Auth Layout
// ============================================
// چیدمان صفحات احراز هویت — بدون هدر/فوتر عمومی
// کادر شیشه‌ای روی canvas سفید با halo طلایی/سورمه‌ای
// ============================================

import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      {/* haloهای تزئینی — طلایی و سورمه‌ای، صرفاً بصری */}
      <div
        aria-hidden="true"
        className="from-gold-400/20 pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-gradient-to-br to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="from-navy-500/10 pointer-events-none absolute -right-40 -bottom-40 size-96 rounded-full bg-gradient-to-tl to-transparent blur-3xl"
      />

      <header className="relative flex h-16 items-center justify-center">
        <Link href="/" aria-label="زرسی — صفحه اصلی">
          <Logo size="md" />
        </Link>
      </header>
      <main className="relative flex flex-1 items-center justify-center p-4 pb-10">{children}</main>
    </div>
  )
}
