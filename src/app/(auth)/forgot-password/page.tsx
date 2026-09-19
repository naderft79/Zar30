// ============================================
// Zarnama - Forgot Password Page
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'بازیابی رمز عبور',
  description: 'بازیابی رمز عبور حساب زرنما با کد تایید پیامکی.',
  robots: { index: false },
}

export default function ForgotPasswordPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="text-xl leading-none font-semibold">بازیابی رمز عبور</h1>
        <p className="text-muted-foreground text-sm">کد بازیابی به موبایل شما ارسال می‌شود</p>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-gold font-medium hover:underline">
            بازگشت به ورود
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
