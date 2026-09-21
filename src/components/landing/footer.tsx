// ============================================
// Zar30 - Landing Footer (Gerami-style)
// ============================================
// چهار ستون + برند | تماس | نشان‌های اعتماد | نوار پایانی
// سرمه‌ای تیره + متن روشن + accent طلایی کنترل‌شده
// ============================================

import Link from 'next/link'
import { Clock, Instagram, Linkedin, Mail, MapPin, Phone, Send } from 'lucide-react'
import { CONTACT_INFO, FOOTER_BADGES, FOOTER_LINKS } from '@/lib/data/landing'
import { Logo } from '@/components/shared/logo'

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/zar30', label: 'اینستاگرام', icon: Instagram },
  { href: 'https://t.me/zar30', label: 'تلگرام', icon: Send },
  { href: 'https://linkedin.com/company/zar30', label: 'لینکدین', icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="bg-navy-950 text-cream-100 border-navy-800/60 border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* ستون‌ها — برند + سه گروه لینک */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* برند */}
          <div className="lg:col-span-4">
            <Logo size="md" textClassName="text-cream-100" />
            <p className="text-navy-200/80 mt-4 max-w-xs text-sm leading-7">
              پلتفرم خرید، فروش و مدیریت طلای آب‌شده ۱۸ عیار — با پشتوانه طلای فیزیکی و دفتر کل قابل
              حسابرسی.
            </p>

            {/* تماس */}
            <address className="mt-6 space-y-2.5 text-sm not-italic">
              <a
                href={CONTACT_INFO.phoneHref}
                className="text-navy-200/80 hover:text-gold-300 inline-flex items-center gap-2.5 transition-colors"
              >
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <span className="tabular-nums">{CONTACT_INFO.phone}</span>
              </a>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="text-navy-200/80 hover:text-gold-300 inline-flex items-center gap-2.5 transition-colors"
                dir="ltr"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                {CONTACT_INFO.email}
              </a>
              <p className="text-navy-200/80 inline-flex w-full items-center gap-2.5">
                <Clock className="size-4 shrink-0" aria-hidden="true" />
                {CONTACT_INFO.hours}
              </p>
              <p className="text-navy-200/80 inline-flex w-full items-center gap-2.5">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                تهران، ایران
              </p>
            </address>
          </div>

          {/* گروه‌های لینک */}
          {FOOTER_LINKS.map((group) => (
            <nav key={group.title} className="lg:col-span-2" aria-label={group.title}>
              <h3 className="text-cream-50 mb-4 text-sm font-bold">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-navy-200/70 hover:text-gold-300 text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* نشان‌های اعتماد */}
          <div className="lg:col-span-2">
            <h3 className="text-cream-50 mb-4 text-sm font-bold">اعتماد</h3>
            <ul className="space-y-2.5">
              {FOOTER_BADGES.map((badge) => (
                <li
                  key={badge.label}
                  className="text-navy-200/70 inline-flex items-center gap-2 text-sm"
                >
                  <badge.icon className="text-gold-400 size-4 shrink-0" aria-hidden="true" />
                  {badge.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* نوار پایانی */}
        <div className="border-navy-800/60 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-navy-300/70 text-center text-xs leading-6 sm:text-right">
            © {new Date().getFullYear()} زرسی — تمامی حقوق مادی و معنوی برای وب‌سایت Zar30 محفوظ
            است.
            <span className="mx-2 hidden sm:inline">•</span>
            <span className="mt-1 block sm:mt-0 sm:inline">
              سرمایه‌گذاری در طلا همراه با ریسک است. عملکرد گذشته تضمینی برای آینده نیست.
            </span>
          </p>

          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="border-navy-800 text-navy-200/70 hover:border-gold-500/60 hover:text-gold-300 inline-flex size-9 items-center justify-center rounded-full border transition-colors duration-200"
              >
                <social.icon className="size-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
