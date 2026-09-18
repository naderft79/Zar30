// ============================================
// Zarnama - Login Page (Placeholder)
// ============================================
// صفحه ورود — منطق احراز هویت در Phase بعدی پیاده می شود
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = {
  title: 'ورود',
  description: 'ورود به حساب کاربری زرنما.',
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">ورود به زرنما</CardTitle>
        <p className="text-muted-foreground text-sm">شماره موبایل خود را وارد کنید</p>
      </CardHeader>
      <CardContent>
        {/* فرم — backend احراز هویت در Phase بعدی متصل می شود */}
        <form className="space-y-4">
          <div>
            <label
              htmlFor="login-mobile"
              className="text-foreground mb-1.5 block text-sm font-medium"
            >
              شماره موبایل
            </label>
            <Input
              id="login-mobile"
              type="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              dir="ltr"
              className="text-left"
              autoComplete="tel"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled>
            دریافت کد تأیید
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-xs">
          سیستم ورود در مرحله بعدی فعال می‌شود.
        </p>
        <p className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">حساب ندارید؟ </span>
          <Link href="/register" className="text-gold font-medium hover:underline">
            ثبت‌نام کنید
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
