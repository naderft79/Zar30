// ============================================
// Zar30 - FAQ Section (Landing)
// ============================================
// Accordion تمیز — height + opacity، آیکون plus → minus
// با چرخش کوچک؛ keyboard accessible (Radix)
// ============================================

import { FAQS } from '@/lib/data/landing'
import { Container } from '@/components/shared/container'
import { Reveal } from './reveal'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

function PlusMinusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0" aria-hidden="true">
      {/* خط افقی — همیشه دیده می‌شود */}
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* خط عمودی — با باز شدن ۹۰ درجه می‌چرخد و روی خط افقی می‌افتد (minus) */}
      <path
        d="M12 5v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-transform duration-250 [[data-state=open]_&]:rotate-90"
      />
    </svg>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="bg-white py-16 sm:py-20" aria-labelledby="faq-title">
      <Container size="md">
        <div className="mb-10 text-center">
          <p className="text-gold-600 mb-2 text-sm font-semibold">پشتیبانی</p>
          <h2 id="faq-title" className="text-navy-950 text-2xl font-bold sm:text-3xl">
            سوالات متداول
          </h2>
          <p className="text-navy-500 mx-auto mt-3 max-w-lg text-sm leading-7 sm:text-[15px]">
            پاسخ پرتکرارترین سوال‌ها درباره خرید، فروش و نگهداری طلا در زرسی.
          </p>
        </div>

        <Reveal>
          <div className="border-navy-100/90 rounded-2xl border bg-white px-5 sm:px-7">
            <Accordion type="single" collapsible className="divide-navy-100/70 divide-y">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question} className="border-none">
                  <AccordionTrigger className="text-navy-900 hover:text-navy-950 py-5 text-start text-[15px] font-semibold hover:no-underline [&>svg]:hidden">
                    <span className="flex flex-1 items-center justify-between gap-4">
                      {faq.question}
                      <span className="text-navy-400">
                        <PlusMinusIcon />
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-navy-500 pb-5 text-sm leading-8 text-pretty">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
