// ============================================
// Zar30 - Mobile Menu (Landing)
// ============================================
// منوی موبایل Gerami-style — Dialog تمیز با accordion
// برای دسته‌ها + touch target حداقل ۴۴px + CTA اصلی
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogIn, Menu } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { NAV_ITEMS } from '@/lib/data/landing'
import { Logo } from '@/components/shared/logo'

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
        aria-expanded={open}
        className="text-navy-800 hover:bg-cream-100 focus-visible:ring-gold-500/40 inline-flex size-11 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="border-navy-100 top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-sm translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-l bg-white p-0"
        >
          <DialogTitle className="sr-only">منوی موبایل</DialogTitle>
          <DialogDescription className="sr-only">دسترسی به بخش‌های سایت زرسی</DialogDescription>

          {/* هدر منو */}
          <div className="border-navy-100 flex h-16 shrink-0 items-center justify-between border-b px-5">
            <Link href="/" onClick={() => setOpen(false)} aria-label="زرسی — صفحه اصلی">
              <Logo size="sm" textClassName="text-navy-950" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن منو"
              className="text-navy-600 hover:bg-cream-100 inline-flex size-11 items-center justify-center rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* آیتم‌ها */}
          <nav aria-label="ناوبری موبایل" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <li key={item.label}>
                    <Accordion type="single" collapsible>
                      <AccordionItem value={item.label} className="border-none">
                        <AccordionTrigger className="text-navy-900 px-3 py-3.5 text-[15px] font-medium hover:no-underline">
                          {item.label}
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <ul className="space-y-1 pr-2">
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  onClick={() => setOpen(false)}
                                  className="text-navy-600 hover:bg-cream-100 hover:text-navy-950 block min-h-11 rounded-lg px-3 py-2.5 text-sm transition-colors"
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href!}
                      onClick={() => setOpen(false)}
                      className="text-navy-900 hover:bg-cream-100 block min-h-11 rounded-lg px-3 py-3.5 text-[15px] font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          {/* CTA پایین منو */}
          <div className="border-navy-100 shrink-0 space-y-2 border-t p-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="border-navy-200 text-navy-800 hover:bg-cream-100 flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors"
            >
              <LogIn className="size-4" aria-hidden="true" />
              ورود
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-gold flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors"
            >
              شروع خرید
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
