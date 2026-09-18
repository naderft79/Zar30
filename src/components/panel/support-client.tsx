// ============================================
// Zarnama - Support Preview (Phase 3)
// ============================================
// محل تیکت و تماس — Ticket Engine در Phase بعدی
// ============================================

'use client'

import Link from 'next/link'
import { LifeBuoy, MessageSquare, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SupportClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-bold">پشتیبانی</h1>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="text-gold size-5" />
            تیکت پشتیبانی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-border/60 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <p className="text-muted-foreground text-sm">
              سیستم تیکتینگ به‌زودی فعال می‌شود — بلیط جدید، پیگیری و پاسخ
            </p>
            <Badge variant="outline" className="text-xs">
              به‌زودی — پیش‌نمایش
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="text-gold size-5" />
            راه‌های ارتباطی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <LifeBuoy className="size-4" />
              مرکز راهنمایی
            </span>
            <Link href="/faq" className="text-gold hover:underline">
              سوالات متداول
            </Link>
          </div>
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              تماس با ما
            </span>
            <Link href="/contact" className="text-gold hover:underline">
              صفحه تماس
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
