// ============================================
// Zar30 - FAQ Page
// ============================================
// سوالات متداول — داده از لایه داده (قابل اتصال به CMS)
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { FAQS } from '@/lib/data/landing'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const metadata: Metadata = {
  title: 'سوالات متداول',
  description:
    'پاسخ سوال‌های متداول درباره زرسی: خرید و فروش طلا، تحویل فیزیکی، اقساط، امنیت حساب و کارمزدها.',
  alternates: { canonical: '/faq' },
}

export default function FaqPage() {
  return (
    <Section
      containerSize="md"
      eyebrow="سوالات متداول"
      titleAs="h1"
      title="سوال شما چیست؟"
      description="پاسخ رایج‌ترین سوال‌ها درباره زرسی"
    >
      <Accordion
        type="single"
        collapsible
        className="bg-card border-border/60 rounded-2xl border px-6"
      >
        {FAQS.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-base leading-relaxed">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">پاسخ سوال خود را پیدا نکردید؟</p>
        <Button size="lg" variant="outline" asChild>
          <Link href="/contact">تماس با پشتیبانی</Link>
        </Button>
      </div>
    </Section>
  )
}
