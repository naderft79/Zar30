// ============================================
// Zarnama - Login Page
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'ورود',
  description: 'ورود به حساب کاربری زرنما.',
  robots: { index: false },
}

export default function LoginPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="text-xl leading-none font-semibold">ورود به زرنما</h1>
        <p className="text-muted-foreground text-sm">با موبایل و رمز عبور وارد شوید</p>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
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
