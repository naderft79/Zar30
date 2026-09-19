// ============================================
// Zarnama - Installments Client — Preview (بدون Financial Logic)
// ============================================

'use client'

import { CalendarClock, FileText, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'

export function InstallmentsClient() {
  return (
    <div className="animate-stagger space-y-5">
      {/* طرح‌های اقساطی — preview */}
      <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="text-gold-500 size-5" strokeWidth={1.75} />
            طرح‌های اقساطی
            <StatusBadge tone="gold" dot={false}>
              به‌زودی
            </StatusBadge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Sparkles}
            title="طرح‌های اقساطی به‌زودی معرفی می‌شوند"
            description="به‌زودی می‌توانید طلای آب‌شده را با پرداخت اقساطی و قرارداد شفاف خریداری کنید."
            badge="به‌زودی — پیش‌نمایش"
          />
        </CardContent>
      </Card>

      {/* قراردادها + اقساط پیش رو */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="text-gold-500 size-5" strokeWidth={1.75} />
              قراردادهای من
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="قراردادی ندارید"
              description="قراردادهای خرید اقساطی شما با وضعیت و جزئیات کامل اینجا نمایش داده می‌شوند."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="text-gold-500 size-5" strokeWidth={1.75} />
              اقساط پیش رو
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarClock}
              title="قسطی ندارید"
              description="سررسید اقساط، یادآوری‌ها و تاریخچه پرداخت اینجا مدیریت می‌شود."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
