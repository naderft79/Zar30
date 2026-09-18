// ============================================
// Zarnama - Blog Page
// ============================================
// معماری بلاگ — محتوا بعداً از CMS مدیریت می شود
// فعلاً placeholder ساختاریافته
// ============================================

import type { Metadata } from 'next'
import { Newspaper, ArrowLeft } from 'lucide-react'
import { Section } from '@/components/shared/section'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'بلاگ زرنما',
  description: 'مقالات آموزشی درباره طلا، سرمایه‌گذاری و بازار — به‌زودی در بلاگ زرنما.',
  alternates: { canonical: '/blog' },
}

// مقالات پیش‌نمایشی — بعداً از CMS/DB خوانده می شوند
const UPCOMING_TOPICS = [
  {
    tag: 'آموزش',
    title: 'طلای آب‌شده چیست و چه تفاوتی با طلای دست‌ساز دارد؟',
    excerpt: 'آشنایی با مفهوم طلای آب‌شده، عیار و مزایای آن نسبت به طلای ساخته‌شده.',
  },
  {
    tag: 'سرمایه‌گذاری',
    title: 'چرا طلا؟ نقش طلا در سبد سرمایه‌گذاری',
    excerpt: 'طلا به‌عنوان دارایی امن در برابر تورم — مزایا و ملاحظات.',
  },
  {
    tag: 'امنیت',
    title: 'چگونه از دارایی دیجیتال خود محافظت کنیم؟',
    excerpt: 'نکات امنیتی برای نگهداری طلای دیجیتال و مدیریت حساب.',
  },
]

export default function BlogPage() {
  return (
    <Section
      containerSize="lg"
      eyebrow="بلاگ"
      titleAs="h1"
      title="مجله زرنما"
      description="مقالات آموزشی درباره طلا، سرمایه‌گذاری و بازار — به‌زودی"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {UPCOMING_TOPICS.map((post) => (
          <Card key={post.title} className="border-border/60 flex flex-col">
            <CardContent className="flex flex-1 flex-col p-6">
              <div className="bg-gold/15 mb-4 flex h-40 items-center justify-center rounded-xl">
                <Newspaper className="text-gold/50 size-10" />
              </div>
              <Badge variant="secondary" className="mb-3 w-fit text-xs">
                {post.tag}
              </Badge>
              <h2 className="text-foreground mb-2 leading-snug font-semibold">{post.title}</h2>
              <p className="text-muted-foreground flex-1 text-sm leading-relaxed">{post.excerpt}</p>
              <span className="text-muted-foreground mt-4 inline-flex items-center gap-1 text-xs">
                به‌زودی
                <ArrowLeft className="size-3" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground mt-10 text-center text-sm">
        بلاگ زرنما به‌زودی با مقالات آموزشی راه‌اندازی می‌شود.
      </p>
    </Section>
  )
}
