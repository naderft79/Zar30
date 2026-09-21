// ============================================
// Zar30 - Landing Page (Gerami-style Redesign)
// ============================================
// صفحه اصلی عمومی — ترتیب بخش‌ها:
// Hero → Trust → Market → Features → Steps → Delivery
// → FAQ → Support → License → Final CTA
// تا حد امکان Server-rendered (فقط تعاملی‌ها Client)
// ============================================

import type { Metadata } from 'next'
import { priceService } from '@/lib/price/price-service'
import { Hero } from '@/components/landing/hero'
import { TrustCards } from '@/components/landing/trust-cards'
import { TrustStrip } from '@/components/landing/trust-strip'
import { GoldMarketSection } from '@/components/landing/market-price'
import { FeatureSection } from '@/components/landing/feature-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { PhysicalDelivery } from '@/components/landing/physical-delivery'
import { FaqSection } from '@/components/landing/faq-section'
import { SupportSection } from '@/components/landing/support-section'
import { LicenseSection } from '@/components/landing/license-section'
import { FinalCta } from '@/components/landing/final-cta'
import { FEATURE_SECTIONS, FAQS } from '@/lib/data/landing'

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

export default async function LandingPage() {
  // قیمت اولیه مشترک بین Hero و بخش بازار — یک fetch سروری
  const price = await priceService.getCurrentPrice()

  return (
    <>
      <JsonLd />
      <Hero price={price} />
      <TrustCards />
      <TrustStrip />
      <GoldMarketSection initialPrice={price} />
      {FEATURE_SECTIONS.map((section) => (
        <FeatureSection key={section.id} data={section} />
      ))}
      <HowItWorks />
      <PhysicalDelivery />
      <FaqSection />
      <SupportSection />
      <LicenseSection />
      <FinalCta />
    </>
  )
}
