// ============================================
// Zarnama - Support (Phase 3.1 — Premium Redesign)
// ============================================
// محل تیکت و تماس — Ticket Engine در Phase بعدی
// ============================================

'use client'

import Link from 'next/link'
import { LifeBuoy, MessageSquare, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from './page-header'

export function SupportClient() {
  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="پشتیبانی" description="تیکت پشتیبانی و راه‌های ارتباطی" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="text-gold-500 size-5" strokeWidth={1.75} />
            تیکت پشتیبانی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={MessageSquare}
            title="سیستم تیکتینگ به‌زودی فعال می‌شود"
            description="بلیط جدید، پیگیری وضعیت و پاسخ پشتیبانی پس از راه‌اندازی موتور تیکت اینجا مدیریت می‌شود."
            badge="به‌زودی — پیش‌نمایش"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="text-gold-500 size-5" strokeWidth={1.75} />
            راه‌های ارتباطی
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-border/40 divide-y text-sm">
          <div className="text-muted-foreground flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2">
              <LifeBuoy className="size-4" />
              مرکز راهنمایی
            </span>
            <Link href="/faq" className="text-gold-600 dark:text-gold-400 hover:underline">
              سوالات متداول
            </Link>
          </div>
          <div className="text-muted-foreground flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              تماس با ما
            </span>
            <Link href="/contact" className="text-gold-600 dark:text-gold-400 hover:underline">
              صفحه تماس
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
