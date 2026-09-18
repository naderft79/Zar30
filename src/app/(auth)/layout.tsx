// ============================================
// Zarnama - Auth Layout
// ============================================
// چیدمان صفحات احراز هویت — بدون هدر/فوتر عمومی
// ============================================

import Link from 'next/link'
import { Logo } from '@/components/shared/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border/50 flex h-16 items-center justify-center border-b">
        <Link href="/" aria-label="زرنما — صفحه اصلی">
          <Logo size="md" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>
    </div>
  )
}
