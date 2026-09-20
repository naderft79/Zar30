'use client'

import type { AdminColumn } from './admin-data-table'
import { AdminFinanceList } from './finance-list'
import { AdminStatus } from './admin-status'
import { toPersianDigits } from '@/lib/utils/format'

interface AuditRow {
  id: string
  actorType: string
  actorRole: string | null
  action: string
  entityType: string
  entityId: string | null
  requestId: string | null
  reason: string | null
  ip: string | null
  createdAt: string
}
interface SessionRow {
  id: string
  deviceInfo: string | null
  ip: string | null
  userAgent: string | null
  expiresAt: string
  revokedAt: string | null
  createdAt: string
  user: { id: string; mobile: string; firstName: string | null; lastName: string | null }
}
interface NotificationRow {
  id: string
  type: string
  title: string
  channel: string
  status: string
  sentAt: string | null
  readAt: string | null
  createdAt: string
  user: { id: string; mobile: string }
}
interface TeamRow {
  id: string
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    mobile: string
    firstName: string | null
    lastName: string | null
    lastLoginAt: string | null
  }
}
interface ContentRow {
  id: string
  key: string
  type: string
  title: string | null
  slug: string | null
  status: string
  publishedAt: string | null
  updatedAt: string
}
interface FlagRow {
  id: string
  key: string
  enabled: boolean
  rolloutPercent: number
  description: string | null
  updatedAt: string
}

const date = (v: string | null) =>
  v ? new Date(v).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const mobile = (v: string) => (
  <span dir="ltr" className="tabular-nums">
    {toPersianDigits(v)}
  </span>
)

const auditColumns: AdminColumn<AuditRow>[] = [
  {
    key: 'action',
    header: 'عملیات',
    render: (r) => (
      <span dir="ltr" className="font-medium">
        {r.action}
      </span>
    ),
  },
  {
    key: 'actor',
    header: 'عامل',
    render: (r) => `${r.actorType}${r.actorRole ? ` — ${r.actorRole}` : ''}`,
  },
  {
    key: 'entity',
    header: 'موجودیت',
    render: (r) => (
      <span dir="ltr">
        {r.entityType} / {r.entityId?.slice(0, 8) ?? '—'}
      </span>
    ),
  },
  {
    key: 'reason',
    header: 'دلیل',
    render: (r) => <span className="block max-w-52 truncate">{r.reason ?? '—'}</span>,
  },
  {
    key: 'request',
    header: 'Request ID',
    mobile: false,
    render: (r) => (
      <span dir="ltr" className="tabular-nums">
        {r.requestId?.slice(0, 12) ?? '—'}
      </span>
    ),
  },
  { key: 'created', header: 'زمان', render: (r) => date(r.createdAt) },
]
const sessionColumns: AdminColumn<SessionRow>[] = [
  { key: 'user', header: 'کاربر', render: (r) => mobile(r.user.mobile) },
  {
    key: 'device',
    header: 'دستگاه',
    render: (r) => (
      <span className="block max-w-48 truncate">{r.deviceInfo ?? r.userAgent ?? '—'}</span>
    ),
  },
  { key: 'ip', header: 'IP', render: (r) => <span dir="ltr">{r.ip ?? '—'}</span> },
  {
    key: 'state',
    header: 'وضعیت',
    render: (r) => <AdminStatus status={r.revokedAt ? 'REVOKED' : 'ACTIVE'} />,
  },
  { key: 'expires', header: 'انقضا', render: (r) => date(r.expiresAt) },
]
const notificationColumns: AdminColumn<NotificationRow>[] = [
  {
    key: 'title',
    header: 'اعلان',
    render: (r) => (
      <div>
        <span className="block font-medium">{r.title}</span>
        <span className="text-muted-foreground text-[10px]">{r.type}</span>
      </div>
    ),
  },
  { key: 'user', header: 'کاربر', render: (r) => mobile(r.user.mobile) },
  { key: 'channel', header: 'کانال', render: (r) => r.channel },
  { key: 'status', header: 'وضعیت', render: (r) => <AdminStatus status={r.status} /> },
  { key: 'created', header: 'ایجاد', render: (r) => date(r.createdAt) },
]
const teamColumns: AdminColumn<TeamRow>[] = [
  {
    key: 'user',
    header: 'عضو تیم',
    render: (r) => (
      <div>
        <span className="block font-medium">
          {[r.user.firstName, r.user.lastName].filter(Boolean).join(' ') || '—'}
        </span>
        {mobile(r.user.mobile)}
      </div>
    ),
  },
  { key: 'role', header: 'نقش', render: (r) => <span dir="ltr">{r.role}</span> },
  {
    key: 'state',
    header: 'وضعیت',
    render: (r) => <AdminStatus status={r.active ? 'ACTIVE' : 'DISABLED'} />,
  },
  { key: 'login', header: 'آخرین ورود', render: (r) => date(r.user.lastLoginAt) },
  { key: 'created', header: 'عضویت', render: (r) => date(r.createdAt) },
]
const contentColumns: AdminColumn<ContentRow>[] = [
  {
    key: 'title',
    header: 'محتوا',
    render: (r) => (
      <div>
        <span className="block font-medium">{r.title ?? r.key}</span>
        <span dir="ltr" className="text-muted-foreground text-[10px]">
          {r.slug ?? r.key}
        </span>
      </div>
    ),
  },
  { key: 'type', header: 'نوع', render: (r) => r.type },
  {
    key: 'status',
    header: 'وضعیت',
    render: (r) => <AdminStatus status={r.status.toUpperCase()} />,
  },
  { key: 'published', header: 'انتشار', render: (r) => date(r.publishedAt) },
  { key: 'updated', header: 'به‌روزرسانی', render: (r) => date(r.updatedAt) },
]
const flagColumns: AdminColumn<FlagRow>[] = [
  {
    key: 'key',
    header: 'Feature Flag',
    render: (r) => (
      <span dir="ltr" className="font-medium">
        {r.key}
      </span>
    ),
  },
  {
    key: 'state',
    header: 'وضعیت',
    render: (r) => <AdminStatus status={r.enabled ? 'ACTIVE' : 'DISABLED'} />,
  },
  {
    key: 'rollout',
    header: 'Rollout',
    render: (r) => <span className="tabular-nums">{toPersianDigits(r.rolloutPercent)}٪</span>,
  },
  {
    key: 'description',
    header: 'توضیح',
    render: (r) => <span className="block max-w-72 truncate">{r.description ?? '—'}</span>,
  },
  { key: 'updated', header: 'به‌روزرسانی', render: (r) => date(r.updatedAt) },
]

export const AdminAuditLogsClient = () => (
  <AdminFinanceList
    title="لاگ ممیزی"
    eyebrow="ریسک و امنیت"
    description="تاریخچه append-only عملیات حساس"
    endpoint="/api/v1/admin/audit-logs"
    dataKey="logs"
    columns={auditColumns}
    keyOf={(r) => r.id}
    readOnlyNotice={false}
    searchPlaceholder="عملیات، موجودیت یا Request ID…"
  />
)
export const AdminSecuritySessionsClient = () => (
  <AdminFinanceList
    title="نشست‌های سیستم"
    eyebrow="امنیت"
    description="نشست‌های کاربران بدون نمایش token یا hash"
    endpoint="/api/v1/admin/security/sessions"
    dataKey="sessions"
    columns={sessionColumns}
    keyOf={(r) => r.id}
    readOnlyNotice={false}
    searchPlaceholder="موبایل، IP یا دستگاه…"
  />
)
export const AdminNotificationsClient = () => (
  <AdminFinanceList
    title="اعلان‌ها"
    eyebrow="خدمات"
    description="وضعیت تحویل اعلان‌های ثبت‌شده؛ ارسال کمپین تا اتصال worker غیرفعال است"
    endpoint="/api/v1/admin/notifications"
    dataKey="notifications"
    columns={notificationColumns}
    keyOf={(r) => r.id}
    searchPlaceholder="عنوان، نوع یا موبایل…"
  />
)
export const AdminTeamClient = () => (
  <AdminFinanceList
    title="تیم ادمین"
    eyebrow="مدیریت سیستم"
    description="اعضای دارای دسترسی و نقش فعلی؛ مدیریت دعوت در این نسخه فعال نیست"
    endpoint="/api/v1/admin/team"
    dataKey="admins"
    columns={teamColumns}
    keyOf={(r) => r.id}
    searchPlaceholder="نام یا موبایل…"
  />
)
export const AdminContentClient = () => (
  <AdminFinanceList
    title="محتوا"
    eyebrow="محتوا و رشد"
    description="محتوای CMS و وضعیت انتشار؛ ویرایشگر نسخه‌بندی هنوز متصل نیست"
    endpoint="/api/v1/admin/content"
    dataKey="contents"
    columns={contentColumns}
    keyOf={(r) => r.id}
    searchPlaceholder="عنوان، کلید یا slug…"
  />
)
export const AdminFeatureFlagsClient = () => (
  <AdminFinanceList
    title="Feature Flags"
    eyebrow="مدیریت سیستم"
    description="پرچم‌های قابلیت از PostgreSQL؛ تغییر نیازمند workflow ممیزی‌شده است"
    endpoint="/api/v1/admin/feature-flags"
    dataKey="flags"
    columns={flagColumns}
    keyOf={(r) => r.id}
    searchPlaceholder="کلید یا توضیح…"
  />
)
