// ============================================
// Zar30 - Landing Page
// ============================================
// صفحه اصلی عمومی — تمام بخش‌های Landing
// تا حد امکان Server-rendered
// ============================================

import type { Metadata } from 'next'
import { Hero } from '@/components/landing/hero'
import { PriceSection } from '@/components/landing/price-section'
import { Features } from '@/components/landing/features'
import { WhyZar30 } from '@/components/landing/why-zar30'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Stats } from '@/components/landing/stats'
import { InvestmentPreview } from '@/components/landing/investment-preview'
import { InstallmentPreview } from '@/components/landing/installment-preview'
import { SecuritySection } from '@/components/landing/security-section'
import { PhysicalGold } from '@/components/landing/physical-gold'
import { ReferralSection } from '@/components/landing/referral-section'
import { FaqSection } from '@/components/landing/faq-section'
import { CtaSection } from '@/components/landing/cta-section'
import { DownloadApp } from '@/components/landing/download-app'
import { FAQS } from '@/lib/data/landing'

export const metadata: Metadata = {
  title: 'زرسی | خرید، فروش و سرمایه‌گذاری طلای آب‌شده ۱۸ عیار',
  description:
    'با زرسی از هر مبلغی طلای آب‌شده ۱۸ عیار بخرید، بفروشید، اقساطی تهیه کنید یا فیزیکی تحویل بگیرید — با پشتوانه طلای فیزیکی و دفتر کل قابل حسابرسی.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'زرسی | خرید و سرمایه‌گذاری طلای آب‌شده',
    description: 'طلا بخرید، بفروشید و مدیریت کنید — با هر مبلغی، با شفافیت کامل.',
    type: 'website',
    locale: 'fa_IR',
    url: '/',
  },
}

// JSON-LD ساختاریافته — Organization + WebSite + FAQ
function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'زرسی',
        alternateName: 'Zar30',
        url: 'https://zar30.com',
        logo: 'https://zar30.com/icon.svg',
        description: 'پلتفرم خرید، فروش و سرمایه‌گذاری طلای آب‌شده ۱۸ عیار',
      },
      {
        '@type': 'WebSite',
        name: 'زرسی',
        url: 'https://zar30.com',
        inLanguage: 'fa-IR',
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default function LandingPage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <PriceSection />
      <Features />
      <WhyZar30 />
      <Stats />
      <HowItWorks />
      <InvestmentPreview />
      <InstallmentPreview />
      <SecuritySection />
      <PhysicalGold />
      <ReferralSection />
      <FaqSection />
      <DownloadApp />
      <CtaSection />
    </>
  )
}
