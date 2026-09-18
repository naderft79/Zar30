// ============================================
// Zarnama - Reset Password Page
// ============================================

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <CardTitle className="text-xl">تنظیم رمز جدید</CardTitle>
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
