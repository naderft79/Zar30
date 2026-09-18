// ============================================
// Zarnama - Contact Page
// ============================================

import type { Metadata } from 'next'
import { Mail, Phone, MapPin, MessageSquare, Clock } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = {
  title: 'تماس با ما',
  description: 'راه‌های ارتباط با پشتیبانی زرنما — تیکت، ایمیل و تماس تلفنی.',
  alternates: { canonical: '/contact' },
}

const CHANNELS = [
  {
    icon: MessageSquare,
    title: 'تیکت پشتیبانی',
    description: 'سریع‌ترین راه — از داخل پنل کاربری تیکت ثبت کنید.',
    value: 'پاسخ در کمتر از ۲۴ ساعت',
  },
  {
    icon: Mail,
    title: 'ایمیل',
    description: 'برای سوالات عمومی و همکاری',
    value: 'support@zarnama.ir',
    href: 'mailto:support@zarnama.ir',
  },
  {
    icon: Phone,
    title: 'تلفن',
    description: 'ساعات کاری: شنبه تا پنجشنبه، ۹ تا ۱۸',
    value: '۰۲۱-۰۰۰۰۰۰۰۰',
    href: 'tel:+982100000000',
  },
]

export default function ContactPage() {
  return (
    <>
      <Section
        containerSize="md"
        eyebrow="تماس با ما"
        titleAs="h1"
        title="در کنار شما هستیم"
        description="تیم پشتیبانی زرنما آماده پاسخگویی به سوالات شماست"
      >
        <div className="grid gap-5 sm:grid-cols-3">
          {CHANNELS.map((ch) => (
            <Card key={ch.title} className="border-border/60 text-center">
              <CardContent className="p-6">
                <div className="bg-gold/15 mx-auto mb-4 flex size-12 items-center justify-center rounded-xl">
                  <ch.icon className="text-gold size-6" />
                </div>
                <h3 className="text-foreground mb-1 font-semibold">{ch.title}</h3>
                <p className="text-muted-foreground mb-3 text-sm">{ch.description}</p>
                {ch.href ? (
                  <a
                    href={ch.href}
                    className="text-gold text-sm font-medium hover:underline"
                    dir="ltr"
                  >
                    {ch.value}
                  </a>
                ) : (
                  <p className="text-gold text-sm font-medium">{ch.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="bg-muted/30" containerSize="sm" title="ارسال پیام">
        <Card className="border-border/60">
          <CardContent className="p-6 sm:p-8">
            {/* فرم ساده — backend در Phase تیکتینگ متصل می شود */}
            <form className="space-y-5" action="mailto:support@zarnama.ir" method="get">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    نام و نام خانوادگی
                  </label>
                  <Input id="contact-name" name="name" required placeholder="نام شما" />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    ایمیل
                  </label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="contact-subject"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  موضوع
                </label>
                <Input id="contact-subject" name="subject" required placeholder="موضوع پیام" />
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  پیام
                </label>
                <textarea
                  id="contact-message"
                  name="body"
                  required
                  rows={5}
                  placeholder="پیام خود را بنویسید..."
                  className="border-input bg-input text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                ارسال پیام
              </Button>
            </form>
            <p className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
              <Clock className="size-3.5" />
              سیستم تیکتینگ داخل پنل در Phaseهای بعدی فعال می‌شود.
            </p>
          </CardContent>
        </Card>

        <div className="text-muted-foreground mt-8 flex items-center justify-center gap-2 text-sm">
          <MapPin className="size-4" />
          تهران، ایران
        </div>
      </Section>
    </>
  )
}
