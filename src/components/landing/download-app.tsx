// ============================================
// Zar30 - Download App Section
// ============================================
// دانلود اپلیکیشن — PWA install + QR code
// Server Component
// ============================================

import { Smartphone, Globe, Download } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/shared/logo'

export function DownloadApp() {
  return (
    <Section
      id="download"
      eyebrow="اپلیکیشن زرسی"
      title="زرسی، همیشه همراه شما"
      description="اپلیکیشن وب پیشرو (PWA) زرسی را روی گوشی خود نصب کنید — بدون نیاز به فروشگاه."
    >
      <div className="mx-auto grid max-w-4xl items-center gap-8 lg:grid-cols-2">
        {/* کارت نصب PWA */}
        <Card className="border-gold/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-gold/15 flex size-12 shrink-0 items-center justify-center rounded-xl">
                <Globe className="text-gold size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground font-semibold">نسخه وب (PWA)</h3>
                  <Badge className="bg-success/15 text-success border-0 text-xs">موجود</Badge>
                </div>
                <ol className="text-muted-foreground mt-3 space-y-1.5 text-sm">
                  <li>۱. سایت را در مرورگر موبایل باز کنید</li>
                  <li>۲. روی «افزودن به صفحه اصلی» بزنید</li>
                  <li>۳. زرسی مثل یک اپلیکیشن اجرا می‌شود</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* کارت اپ native */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded-xl">
                <Smartphone className="text-muted-foreground size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground font-semibold">اپلیکیشن موبایل</h3>
                  <Badge variant="secondary" className="text-xs">
                    به‌زودی
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  اپلیکیشن اندروید و iOS زرسی به‌زودی عرضه می‌شود. با ثبت‌نام، از انتشار آن باخبر
                  شوید.
                </p>
                <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
                  <Download className="size-3.5" />
                  Android & iOS — در دست توسعه
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR برای دسترسی سریع */}
      <div className="mt-8 flex justify-center">
        <div className="border-border/60 bg-card inline-flex items-center gap-4 rounded-2xl border p-4">
          <div className="bg-gold/10 flex size-16 items-center justify-center rounded-xl">
            <Logo size="lg" showText={false} />
          </div>
          <div className="text-start">
            <p className="text-foreground text-sm font-semibold">zar30.com</p>
            <p className="text-muted-foreground text-xs">همین حالا در مرورگر باز کنید</p>
          </div>
        </div>
      </div>
    </Section>
  )
}
