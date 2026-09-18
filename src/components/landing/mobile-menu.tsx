// ============================================
// Zarnama - Mobile Menu (Client Component)
// ============================================
// منوی موبایل — Dialog تمام‌صفحه از سمت چپ (RTL)
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '@/lib/data/landing'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="باز کردن منو">
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="bg-background fixed top-0 left-0 h-full w-full max-w-sm translate-x-0 translate-y-0 rounded-none border-0 p-0"
        showCloseButton={false}
      >
        <div className="border-border flex h-16 items-center justify-between border-b px-4">
          <DialogTitle asChild>
            <span>
              <Logo size="md" />
            </span>
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="بستن منو">
            <X className="size-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="ناوبری موبایل">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-foreground hover:bg-muted rounded-lg px-4 py-3 text-base font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-border mt-6 flex flex-col gap-3 border-t pt-6">
            <Button variant="outline" size="lg" asChild className="w-full">
              <Link href="/login" onClick={() => setOpen(false)}>
                ورود به حساب
              </Link>
            </Button>
            <Button size="lg" asChild className="w-full">
              <Link href="/register" onClick={() => setOpen(false)}>
                شروع کنید — رایگان
              </Link>
            </Button>
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  )
}
