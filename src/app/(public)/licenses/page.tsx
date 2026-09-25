// ============================================
// Zar30 - Licenses & Legal Documents Page
// ============================================
// مجوزها و مدارک قانونی زرسی — لیست مستندات حقوقی پلتفرم
// ============================================

import type { Metadata } from 'next'
import Link from 'next/link'
import { IconCertificate, IconArrowLeft, IconFileText } from '@tabler/icons-react'
import { Section } from '@/components/shared/section'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'مجوزها و مدارک قانونی',
  description: 'مجوزها، مدارک قانونی و اسناد رسمی پلتفرم زرسی.',
  alternates: { canonical: '/licenses' },
}

const DOCUMENTS = [
  {
    title: 'شرایط استفاده از خدمات',
    description: 'قواعد و شروط استفاده از پلتفرم زرسی',
    href: '/terms',
  },
  {
    title: 'حریم خصوصی',
    description: 'سیاست‌های حفاظت از داده‌های کاربران',
    href: '/privacy',
  },
  {
    title: 'امنیت پلتفرم',
    description: 'لایه‌های امنیتی و معماری حفاظتی زرسی',
    href: '/security',
  },
] as const

export default function LicensesPage() {
  return (
    <Section
      containerSize="md"
      title="مجوزها و مدارک قانونی"
      description="مستندات حقوقی و مجوزهای رسمی پلتفرم زرسی"
    >
      <div className="border-border/60 bg-card divide-border/50 mx-auto max-w-2xl divide-y overflow-hidden rounded-2xl border">
        {DOCUMENTS.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="hover:bg-muted/40 group flex items-center gap-3.5 p-4 transition-colors"
          >
            <IconFileText className="text-gold-600 size-6 shrink-0" stroke={1.75} />
            <span className="min-w-0 flex-1">
              <span className="text-foreground block text-sm font-semibold">{doc.title}</span>
              <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                {doc.description}
              </span>
            </span>
            <IconArrowLeft className="text-muted-foreground group-hover:text-gold-600 size-4 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
      <p className="text-muted-foreground mx-auto mt-6 flex max-w-2xl items-start gap-2 text-xs leading-5">
        <IconCertificate className="text-gold-600 mt-0.5 size-4 shrink-0" aria-hidden="true" />
        مجوزهای رسمی پلتفرم پس از صدور در همین صفحه منتشر می‌شوند.
      </p>
      <div className="mt-10 text-center">
        <Button variant="outline" asChild>
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </Button>
      </div>
    </Section>
  )
}
