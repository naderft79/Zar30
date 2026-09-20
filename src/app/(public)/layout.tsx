// ============================================
// Zar30 - Public Layout
// ============================================
// چیدمان صفحات عمومی: Header + Main + Footer
// ============================================

import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Skip link برای دسترس‌پذیری */}
      <a
        href="#main-content"
        className="bg-gold text-navy-dark sr-only z-50 px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:rounded-md"
      >
        رفتن به محتوای اصلی
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
