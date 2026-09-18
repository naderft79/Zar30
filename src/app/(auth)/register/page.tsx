// ============================================
// Zarnama - Register Page (Placeholder)
// ============================================
// صفحه ثبت‌نام — منطق احراز هویت در Phase بعدی پیاده می شود
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = {
  title: 'ثبت‌نام',
  description: 'ایجاد حساب کاربری در زرنما — خرید و فروش طلای آب‌شده.',
  robots: { index: false },
}

export default function RegisterPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">ثبت‌نام در زرنما</CardTitle>
        <p className="text-muted-foreground text-sm">با شماره موبایل شروع کنید</p>
      </CardHeader>
      <CardContent>
        {/* فرم — backend ثبت‌نام در Phase بعدی متصل می شود */}
        <form className="space-y-4">
          <div>
            <label
              htmlFor="register-mobile"
              className="text-foreground mb-1.5 block text-sm font-medium"
            >
              شماره موبایل
            </label>
            <Input
              id="register-mobile"
              type="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              dir="ltr"
              className="text-left"
              autoComplete="tel"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled>
            ادامه
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-xs">
          سیستم ثبت‌نام در مرحله بعدی فعال می‌شود.
        </p>
        <p className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">حساب دارید؟ </span>
          <Link href="/login" className="text-gold font-medium hover:underline">
            وارد شوید
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
