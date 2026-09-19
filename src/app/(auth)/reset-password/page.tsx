// ============================================
// Zarnama - Reset Password Page
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'تنظیم رمز جدید',
  description: 'تنظیم رمز عبور جدید برای حساب زرنما.',
  robots: { index: false },
}

export default function ResetPasswordPage() {
  return (
    <Card className="border-border/60 w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="text-xl leading-none font-semibold">تنظیم رمز جدید</h1>
        <p className="text-muted-foreground text-sm">کد تایید و رمز عبور جدید را وارد کنید</p>
      </CardHeader>
      <CardContent>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
