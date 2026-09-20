// ============================================
// Zar30 - Support (Full Panel Redesign)
// ============================================
// پایه Help Center — دسته‌بندی موضوعی + تیکت + راه‌های ارتباطی
// Ticket Engine در Phase بعدی
// ============================================

'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Coins,
  LifeBuoy,
  MessageSquare,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from './page-header'

// دسته‌بندی‌های Help Center — به سوالات متداول لینک می‌شوند
const HELP_CATEGORIES = [
  {
    icon: UserRound,
    title: 'حساب و احراز هویت',
    description: 'ثبت‌نام، ورود و تایید هویت',
  },
  {
    icon: Coins,
    title: 'خرید و فروش طلا',
    description: 'معاملات، نرخ‌ها و تسویه',
  },
  {
    icon: Wallet,
    title: 'کیف پول و تراکنش',
    description: 'واریز، برداشت و موجودی',
  },
  {
    icon: ShieldCheck,
    title: 'امنیت حساب',
    description: 'رمز عبور، نشست‌ها و حریم خصوصی',
  },
] as const

export function SupportClient() {
  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="پشتیبانی" description="مرکز راهنمایی و ارتباط با زرسی" />

      {/* دسته‌بندی‌های Help Center */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {HELP_CATEGORIES.map(({ icon: Icon, title, description }) => (
          <Link
            key={title}
            href="/faq"
            className="border-border/60 bg-card hover:border-gold-500/40 group flex flex-col gap-3 rounded-xl border p-4 transition-all duration-(--duration-normal) hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="bg-gold-500/12 text-gold-600 dark:text-gold-400 flex size-10 items-center justify-center rounded-xl transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-105">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="text-foreground block text-sm font-semibold">{title}</span>
              <span className="text-muted-foreground mt-1 block text-[11px] leading-4">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* تیکت پشتیبانی — preview */}
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

        {/* راه‌های ارتباطی */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="text-gold-500 size-5" strokeWidth={1.75} />
              راه‌های ارتباطی
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-border/40 divide-y text-sm">
            <div className="text-muted-foreground flex items-center justify-between py-3">
              <span className="flex items-center gap-2">
                <LifeBuoy className="size-4" />
                مرکز راهنمایی
              </span>
              <Link
                href="/faq"
                className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                سوالات متداول
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
            <div className="text-muted-foreground flex items-center justify-between py-3">
              <span className="flex items-center gap-2">
                <MessageSquare className="size-4" />
                تماس با ما
              </span>
              <Link
                href="/contact"
                className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                صفحه تماس
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
