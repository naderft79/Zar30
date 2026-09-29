// ============================================
// Zar30 - Onboarding Page
// ============================================
// مسیر عمومی /onboarding — قبل از ورود یا ثبت‌نام
// نسخه موبایل تمام‌صفحه، نسخه دسکتاپ کارت مرکزی
// ============================================

import type { Metadata } from 'next'
import { OnboardingScreens } from '@/components/onboarding/onboarding-screens'

export const metadata: Metadata = {
  title: 'معرفی زرسی',
  description:
    'زرسی، پلتفرم خرید، فروش و سرمایه‌گذاری طلای آب‌شده ۱۸ عیار با شفافیت کامل و پشتوانه فیزیکی.',
  robots: { index: false, follow: false },
}

export default function OnboardingPage() {
  return <OnboardingScreens />
}
