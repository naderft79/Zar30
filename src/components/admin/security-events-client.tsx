// ============================================
// Zar30 - Admin Security Events Client
// ============================================
// رویدادهای امنیتی از audit_logs — ورود/خروج/نشست/رمز عبور
// ============================================

'use client'

import Link from 'next/link'
import { AdminFinanceList } from '@/components/admin/finance-list'

interface EventRow {
  id: string
  action: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string } | null
}

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'ورود',
  USER_LOGOUT: 'خروج',
  USER_REGISTERED: 'ثبت‌نام',
  MOBILE_VERIFIED: 'تایید موبایل',
  SESSION_REVOKE: 'لغو نشست',
  SESSION_REVOKE_ALL: 'لغو همه نشست‌ها',
  SESSION_REVOKE_OTHERS: 'لغو نشست‌های دیگر',
  SECURITY_PASSWORD_CHANGED: 'تغییر رمز عبور',
  SECURITY_PASSWORD_RESET: 'بازنشانی رمز عبور',
  SECURITY_SESSION_REUSE: 'استفاده مجدد نشست',
  SECURITY_SESSION_REVOKED: 'نشست لغوشده',
}

export function AdminSecurityEventsClient() {
  return (
    <AdminFinanceList<EventRow>
      title="رویدادهای امنیتی"
      description="ورودها، خروج‌ها، تغییرات رمز و رویدادهای نشست کاربران"
      endpoint="/api/v1/admin/security/events"
      dataKey="events"
      keyOf={(e) => e.id}
      searchPlaceholder="IP یا نوع رویداد…"
      filters={[
        {
          key: 'action',
          label: 'نوع رویداد',
          options: Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
        },
      ]}
      columns={[
        {
          key: 'action',
          header: 'رویداد',
          render: (e) => <span className="font-medium">{ACTION_LABELS[e.action] ?? e.action}</span>,
        },
        {
          key: 'user',
          header: 'کاربر',
          render: (e) =>
            e.user ? (
              <Link href={`/admin/users/${e.user.id}`} className="hover:underline">
                {e.user.name}
              </Link>
            ) : (
              '—'
            ),
        },
        {
          key: 'ip',
          header: 'IP',
          render: (e) => (
            <span dir="ltr" className="text-muted-foreground font-mono text-xs">
              {e.ip ?? '—'}
            </span>
          ),
          mobile: false,
        },
        {
          key: 'ua',
          header: 'دستگاه',
          render: (e) => (
            <span
              className="text-muted-foreground block max-w-40 truncate text-[10px]"
              title={e.userAgent ?? ''}
            >
              {e.userAgent ?? '—'}
            </span>
          ),
          mobile: false,
        },
        {
          key: 'time',
          header: 'زمان',
          render: (e) => new Date(e.createdAt).toLocaleString('fa-IR'),
        },
      ]}
      emptyMessage="رویدادی یافت نشد"
    />
  )
}
