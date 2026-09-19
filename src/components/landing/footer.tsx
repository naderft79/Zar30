// ============================================
// Zar30 - Landing Footer
// ============================================
// فوتر عمومی: ناوبری + تماس + حقوقی + شبکه‌های اجتماعی
// Server Component
// ============================================

import Link from 'next/link'
import { Instagram, Linkedin, Send, Mail, Phone, MapPin } from 'lucide-react'
import { FOOTER_LINKS, TRUST_BADGES } from '@/lib/data/landing'
import { Logo } from '@/components/shared/logo'

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/zar30', label: 'اینستاگرام', icon: Instagram },
  { href: 'https://t.me/zar30', label: 'تلگرام', icon: Send },
  { href: 'https://linkedin.com/company/zar30', label: 'لینکدین', icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="border-border bg-navy-dark text-cream border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* بخش بالایی */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* برند */}
          <div className="lg:col-span-4">
            <Logo size="lg" />
            <p className="text-cream/70 mt-4 max-w-xs text-sm leading-relaxed">
              زرسی، پلتفرم خرید، فروش و سرمایه‌گذاری طلای آب‌شده ۱۸ عیار — با شفافیت کامل و پشتوانه
              طلای فیزیکی.
            </p>
            {/* نشان‌های اعتماد */}
            <div className="mt-6 flex flex-wrap gap-3">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className="border-cream/15 text-cream/80 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                >
                  <badge.icon className="text-gold size-3.5" />
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          {/* لینک‌ها */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.title} className="lg:col-span-2">
              <h3 className="text-gold mb-4 text-sm font-semibold">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-cream/70 hover:text-gold text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* اطلاعات تماس */}
        <div className="border-cream/10 mt-12 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <a
              href="mailto:support@zar30.com"
              className="text-cream/70 hover:text-gold inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Mail className="size-4" />
              support@zar30.com
            </a>
            <a
              href="tel:+982100000000"
              className="text-cream/70 hover:text-gold inline-flex items-center gap-2 text-sm transition-colors"
            >
              <Phone className="size-4" />
              ۰۲۱-۰۰۰۰۰۰۰۰
            </a>
            <span className="text-cream/70 inline-flex items-center gap-2 text-sm">
              <MapPin className="size-4" />
              تهران، ایران
            </span>
          </div>

          {/* شبکه‌های اجتماعی */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="border-cream/15 text-cream/70 hover:border-gold hover:text-gold inline-flex size-9 items-center justify-center rounded-full border transition-colors"
              >
                <social.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* کپی‌رایت */}
        <div className="border-cream/10 mt-8 border-t pt-6">
          <p className="text-cream/50 text-center text-xs leading-relaxed">
            © {new Date().getFullYear()} زرسی — تمامی حقوق محفوظ است.
            <br className="sm:hidden" />
            <span className="mx-2 hidden sm:inline">•</span>
            سرمایه‌گذاری در طلا همراه با ریسک است. عملکرد گذشته تضمینی برای آینده نیست.
          </p>
        </div>
      </div>
    </footer>
  )
}
