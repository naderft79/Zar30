// ============================================
// Zarnama - FAQ Section
// ============================================
// سوالات متداول — Accordion با Radix
// داده از src/lib/data — بعداً از CMS مدیریت می شود
// ============================================

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FAQS } from '@/lib/data/landing'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function FaqSection() {
  return (
    <Section
      id="faq"
      className="bg-muted/30"
      containerSize="md"
      eyebrow="سوالات متداول"
      title="پاسخ سوال‌های شما"
      description="هر آنچه درباره زرنما باید بدانید"
    >
      <Accordion
        type="single"
        collapsible
        className="bg-card border-border/60 rounded-2xl border px-6"
      >
        {FAQS.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
            <AccordionContent className="text-base">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/faq">
            مشاهده همه سوالات
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </div>
    </Section>
  )
}
