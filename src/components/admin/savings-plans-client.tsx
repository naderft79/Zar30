// ============================================
// Zar30 - Admin Savings Plans (SIP) Client
// ============================================
// طرح‌های خرید خودکار کاربران — مشاهده + توقف/فعال‌سازی
// ============================================

'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react'
import { apiPost } from '@/lib/api/client'
import { formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import { AdminStatus } from '@/components/admin/admin-status'

interface SipRow {
  id: string
  tomanAmount: string
  frequency: string
  nextRunAt: string
  lastRunAt: string | null
  lastError: string | null
  consecutiveFailures: number
  active: boolean
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'روزانه',
  WEEKLY: 'هفتگی',
  MONTHLY: 'ماهانه',
}

export function AdminSavingsPlansClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  const toggle = useCallback(async (p: SipRow) => {
    const next = !p.active
    if (
      !confirm(
        `طرح ${formatToman(p.tomanAmount)} تومانی ${p.user.name} ${next ? 'فعال' : 'متوقف'} شود؟`,
      )
    ) {
      return
    }
    const res = await apiPost(`/api/v1/admin/savings-plans/${p.id}/toggle`, { active: next })
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <AdminFinanceList<SipRow>
      title="خرید خودکار (SIP)"
      description="طرح‌های خرید خودکار طلای کاربران — توقف/فعال‌سازی با audit و اعلان به کاربر"
      endpoint="/api/v1/admin/savings-plans"
      dataKey="plans"
      keyOf={(p) => p.id}
      searchPlaceholder="کاربر (موبایل/نام)…"
      refreshKey={refreshKey}
      filters={[
        {
          key: 'status',
          label: 'وضعیت',
          options: [
            { value: 'active', label: 'فعال' },
            { value: 'paused', label: 'متوقف' },
            { value: 'failing', label: 'با خطا' },
          ],
        },
        {
          key: 'frequency',
          label: 'دوره',
          options: [
            { value: 'DAILY', label: 'روزانه' },
            { value: 'WEEKLY', label: 'هفتگی' },
            { value: 'MONTHLY', label: 'ماهانه' },
          ],
        },
      ]}
      columns={[
        {
          key: 'user',
          header: 'کاربر',
          render: (p) => (
            <Link href={`/admin/users/${p.user.id}`} className="font-medium hover:underline">
              {p.user.name}
            </Link>
          ),
        },
        {
          key: 'amount',
          header: 'مبلغ هر اجرا',
          render: (p) => `${formatToman(p.tomanAmount)} تومان`,
        },
        {
          key: 'freq',
          header: 'دوره',
          render: (p) => FREQUENCY_LABELS[p.frequency] ?? p.frequency,
        },
        {
          key: 'next',
          header: 'اجرای بعدی',
          render: (p) => new Date(p.nextRunAt).toLocaleDateString('fa-IR'),
          mobile: false,
        },
        {
          key: 'last',
          header: 'آخرین اجرا',
          render: (p) => (p.lastRunAt ? new Date(p.lastRunAt).toLocaleDateString('fa-IR') : '—'),
          mobile: false,
        },
        {
          key: 'failures',
          header: 'شکست‌ها',
          render: (p) =>
            p.consecutiveFailures > 0 ? (
              <span className="text-error font-bold tabular-nums" title={p.lastError ?? ''}>
                {p.consecutiveFailures}
              </span>
            ) : (
              '۰'
            ),
        },
        {
          key: 'status',
          header: 'وضعیت',
          render: (p) => <AdminStatus status={p.active ? 'ACTIVE' : 'SUSPENDED'} />,
        },
      ]}
      rowActions={(p) => (
        <button
          type="button"
          aria-label={p.active ? 'توقف طرح' : 'فعال‌سازی طرح'}
          title={p.active ? 'توقف طرح' : 'فعال‌سازی'}
          onClick={() => void toggle(p)}
          className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
        >
          {p.active ? (
            <IconPlayerPause className="size-4" aria-hidden="true" />
          ) : (
            <IconPlayerPlay className="size-4" aria-hidden="true" />
          )}
        </button>
      )}
      emptyMessage="طرح خرید خودکاری یافت نشد"
    />
  )
}
