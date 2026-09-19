// ============================================
// Zarnama - OTP Verification Page
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { OtpForm } from '@/components/auth/otp-form'

export const metadata: Metadata = {
  title: 'تایید شماره موبایل',
  description: 'کد تایید ارسال‌شده به موبایل خود را وارد کنید.',
  robots: { index: false },
}

export default function VerifyOtpPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="text-xl leading-none font-semibold">تایید شماره موبایل</h1>
        <p className="text-muted-foreground text-sm">
          کد ۶ رقمی ارسال‌شده به موبایل شما را وارد کنید
        </p>
      </CardHeader>
      <CardContent>
        <Suspense>
          <OtpForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
