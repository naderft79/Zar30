// ============================================
// Zar30 - Admin Fraud Client
// ============================================
// فید سیگنال‌های تقلب — انتقال‌های پرچم‌دار + کارت‌های مسدود
// ============================================

'use client'

import Link from 'next/link'
import { IconFlag, IconCreditCardOff } from '@tabler/icons-react'
import { AdminFinanceList } from '@/components/admin/finance-list'

interface SignalRow {
  id: string
  kind: 'FLAGGED_TRANSFER' | 'BLOCKED_CARD'
  user: { id: string; mobile: string; name: string }
  label: string
  detail: string
  at: string
  href: string
}

const KIND_META = {
  FLAGGED_TRANSFER: { label: 'انتقال پرچم‌دار', icon: IconFlag },
  BLOCKED_CARD: { label: 'کارت مسدود', icon: IconCreditCardOff },
} as const

export function AdminFraudClient() {
  return (
    <AdminFinanceList<SignalRow>
      title="سیگنال‌های تقلب"
      description="انتقال‌های پرچم‌دار و کارت‌های مسدود — برای بررسی و اقدام"
      endpoint="/api/v1/admin/fraud"
      dataKey="signals"
      keyOf={(s) => s.id}
      searchPlaceholder="کاربر…"
      readOnlyNotice
      columns={[
        {
          key: 'kind',
          header: 'نوع',
          render: (s) => {
            const Meta = KIND_META[s.kind]
            return (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <Meta.icon className="text-warning size-4" aria-hidden="true" />
                {Meta.label}
              </span>
            )
          },
        },
        {
          key: 'user',
          header: 'کاربر',
          render: (s) => (
            <Link href={`/admin/users/${s.user.id}`} className="font-medium hover:underline">
              {s.user.name}
            </Link>
          ),
        },
        { key: 'label', header: 'سیگنال', render: (s) => s.label },
        {
          key: 'detail',
          header: 'جزئیات',
          render: (s) => <span className="text-muted-foreground">{s.detail}</span>,
          mobile: false,
        },
        {
          key: 'at',
          header: 'زمان',
          render: (s) => new Date(s.at).toLocaleString('fa-IR'),
        },
      ]}
      detailHref={(s) => s.href}
      emptyMessage="سیگنالی یافت نشد"
    />
  )
}
