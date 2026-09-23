// ============================================
// Zar30 - Login Page
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'ورود',
  description: 'ورود به حساب کاربری زرسی.',
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* کارت شیشه‌ای */}
      <div className="border-border/50 bg-card/80 rounded-3xl border p-6 shadow-xl backdrop-blur-xl sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="text-foreground text-xl font-extrabold">ورود به زرسی</h1>
          <p className="text-muted-foreground mt-2 text-sm">با موبایل و رمز عبور وارد حساب شوید</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-7 text-center text-sm">
          <span className="text-muted-foreground">حساب ندارید؟ </span>
          <Link href="/register" className="text-gold-600 font-bold hover:underline">
            ثبت‌نام کنید
          </Link>
        </p>
      </div>

      {/* اعتماد — زیر کارت */}
      <p className="text-muted-foreground/60 mt-6 text-center text-[11px] leading-5">
        ورود شما با رمزنگاری و نشست امن انجام می‌شود
      </p>
    </div>
  )
}
