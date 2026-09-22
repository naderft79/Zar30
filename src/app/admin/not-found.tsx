// ============================================
// Zar30 - Admin Not Found (مقصد بدون پیاده‌سازی)
// ============================================
// routeهایی که در navigation به‌عنوان architecture target تعریف شده‌اند
// و هنوز page/API واقعی ندارند → این وضعیت صادقانه نمایش داده می‌شود
// ============================================

import Link from 'next/link'
import { ChevronLeft, Waypoints } from 'lucide-react'
import { ADMIN_HOME } from '@/config/admin-navigation'

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="bg-card border-border/60 w-full max-w-md rounded-2xl border p-8 text-center shadow-sm">
        <span className="bg-gold-500/10 text-gold-600 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <Waypoints className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="text-foreground text-lg font-bold">این بخش در نقشه راه است</h1>
        <p className="text-muted-foreground mt-2 text-xs leading-6">
          این مقصد در ناوبری مرکز عملیات تعریف شده، اما صفحه و سرویس آن هنوز پیاده‌سازی نشده است. پس
          از اتصال سرویس authoritative این بخش فعال می‌شود.
        </p>
        <Link
          href={ADMIN_HOME}
          className="bg-primary text-primary-foreground hover:bg-gold-400 focus-visible:ring-ring mt-6 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          بازگشت به داشبورد
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
