// ============================================
// Zarnama - Register Page
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'ثبت‌نام',
  description: 'ایجاد حساب کاربری در زرنما — خرید و فروش طلای آب‌شده.',
  robots: { index: false },
}

export default function RegisterPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="text-xl leading-none font-semibold">ثبت‌نام در زرنما</h1>
        <p className="text-muted-foreground text-sm">با شماره موبایل شروع کنید</p>
      </CardHeader>
      <CardContent>
        <RegisterForm />
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
