'use client'

import Link from 'next/link'
import { AdminFinanceList, type FinanceListFilterDef } from './finance-list'
import type { AdminColumn } from './admin-data-table'
import { AdminStatus } from './admin-status'
import { FinancialValue } from './financial-value'
import type {
  AdminInstallmentRow,
  AdminInvestmentRow,
  AdminReferralRow,
  AdminTicketRow,
} from '@/lib/services/admin-operations.service'
import { toPersianDigits } from '@/lib/utils/format'

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString('fa-IR') : '—'
}

function UserLink({ id, name, mobile }: { id: string; name: string; mobile: string }) {
  return (
    <Link
      href={`/admin/users/${id}`}
      className="hover:text-gold-400 block min-w-0 transition-colors"
    >
      <span className="text-foreground block truncate text-xs font-medium">{name}</span>
      <span className="text-muted-foreground block text-[10px] tabular-nums" dir="ltr">
        {toPersianDigits(mobile)}
      </span>
    </Link>
  )
}

const installmentColumns: AdminColumn<AdminInstallmentRow>[] = [
  { key: 'user', header: 'متقاضی', render: (r) => <UserLink {...r.user} /> },
  {
    key: 'plan',
    header: 'طرح',
    render: (r) => `${r.plan.name} — ${toPersianDigits(r.plan.months)} ماه`,
  },
  { key: 'status', header: 'وضعیت', render: (r) => <AdminStatus status={r.status} /> },
  {
    key: 'principal',
    header: 'اصل مبلغ',
    render: (r) => <FinancialValue value={r.principal} unit="ریال" />,
  },
  {
    key: 'payable',
    header: 'کل پرداخت',
    render: (r) => <FinancialValue value={r.totalPayable} unit="ریال" />,
  },
  { key: 'payments', header: 'اقساط', render: (r) => toPersianDigits(r.paymentsCount) },
  { key: 'created', header: 'ایجاد', mobile: false, render: (r) => date(r.createdAt) },
]

const investmentColumns: AdminColumn<AdminInvestmentRow>[] = [
  { key: 'user', header: 'سرمایه‌گذار', render: (r) => <UserLink {...r.user} /> },
  { key: 'plan', header: 'طرح', render: (r) => r.plan.name },
  { key: 'status', header: 'وضعیت', render: (r) => <AdminStatus status={r.status} /> },
  { key: 'gold', header: 'طلا', render: (r) => <FinancialValue value={r.goldAmount} unit="گرم" /> },
  {
    key: 'rate',
    header: 'نرخ ثبت‌شده',
    render: (r) => <FinancialValue value={r.plan.rate} unit="٪" />,
  },
  { key: 'end', header: 'سررسید', render: (r) => date(r.endDate) },
  {
    key: 'payouts',
    header: 'پرداخت سود',
    mobile: false,
    render: (r) => toPersianDigits(r.payoutsCount),
  },
]

const referralColumns: AdminColumn<AdminReferralRow>[] = [
  {
    key: 'referrer',
    header: 'معرف',
    render: (r) => (
      <UserLink id={r.referrer.id} name={r.referrer.name} mobile={r.referrer.mobile} />
    ),
  },
  { key: 'referred', header: 'دعوت‌شده', render: (r) => <UserLink {...r.referred} /> },
  {
    key: 'code',
    header: 'کد معرفی',
    render: (r) => (
      <span className="tabular-nums" dir="ltr">
        {r.referrer.referralCode}
      </span>
    ),
  },
  { key: 'status', header: 'وضعیت', render: (r) => <AdminStatus status={r.status} /> },
  {
    key: 'reward',
    header: 'پاداش',
    render: (r) =>
      r.rewardAmount ? (
        <FinancialValue value={r.rewardAmount} unit={r.rewardType ?? ''} />
      ) : (
        'ثبت نشده'
      ),
  },
  { key: 'qualified', header: 'احراز شرط', mobile: false, render: (r) => date(r.qualifiedAt) },
]

const ticketColumns: AdminColumn<AdminTicketRow>[] = [
  {
    key: 'subject',
    header: 'موضوع',
    render: (r) => (
      <div className="min-w-0">
        <span className="text-foreground block truncate text-xs font-medium">{r.subject}</span>
        <span className="text-muted-foreground text-[10px]">{r.category}</span>
      </div>
    ),
  },
  { key: 'user', header: 'مشتری', render: (r) => <UserLink {...r.user} /> },
  { key: 'status', header: 'وضعیت', render: (r) => <AdminStatus status={r.status} /> },
  { key: 'priority', header: 'اولویت', render: (r) => <AdminStatus status={r.priority} /> },
  { key: 'messages', header: 'پیام‌ها', render: (r) => toPersianDigits(r.messagesCount) },
  { key: 'assignee', header: 'کارشناس', render: (r) => r.assignee?.name ?? 'تخصیص‌نیافته' },
  { key: 'updated', header: 'آخرین تغییر', mobile: false, render: (r) => date(r.updatedAt) },
]

const installmentFilters: FinanceListFilterDef[] = [
  {
    key: 'status',
    label: 'همه وضعیت‌ها',
    options: [
      { value: 'PENDING', label: 'در انتظار' },
      { value: 'ACTIVE', label: 'فعال' },
      { value: 'COMPLETED', label: 'تکمیل‌شده' },
      { value: 'DEFAULTED', label: 'نکول‌شده' },
    ],
  },
]
const investmentFilters: FinanceListFilterDef[] = [
  {
    key: 'status',
    label: 'همه وضعیت‌ها',
    options: [
      { value: 'ACTIVE', label: 'فعال' },
      { value: 'MATURED', label: 'سررسیدشده' },
      { value: 'EARLY_CLOSED', label: 'بسته‌شده زودهنگام' },
    ],
  },
]
const referralFilters: FinanceListFilterDef[] = [
  {
    key: 'status',
    label: 'همه وضعیت‌ها',
    options: [
      { value: 'PENDING', label: 'در انتظار' },
      { value: 'QUALIFIED', label: 'واجد شرایط' },
      { value: 'REWARDED', label: 'پاداش‌داده‌شده' },
    ],
  },
]
const ticketFilters: FinanceListFilterDef[] = [
  {
    key: 'status',
    label: 'همه وضعیت‌ها',
    options: [
      { value: 'OPEN', label: 'باز' },
      { value: 'IN_PROGRESS', label: 'در حال رسیدگی' },
      { value: 'ANSWERED', label: 'پاسخ‌داده‌شده' },
      { value: 'CLOSED', label: 'بسته' },
    ],
  },
  {
    key: 'priority',
    label: 'همه اولویت‌ها',
    options: [
      { value: 'LOW', label: 'کم' },
      { value: 'MEDIUM', label: 'متوسط' },
      { value: 'HIGH', label: 'زیاد' },
      { value: 'URGENT', label: 'فوری' },
    ],
  },
]

export function AdminInstallmentsClient() {
  return (
    <AdminFinanceList
      title="خرید قسطی"
      eyebrow="محصولات"
      description="قراردادها و چرخه پرداخت اقساط — داده واقعی و فقط خواندنی"
      endpoint="/api/v1/admin/installments"
      dataKey="contracts"
      columns={installmentColumns}
      keyOf={(r) => r.id}
      filters={installmentFilters}
      searchPlaceholder="شناسه، موبایل یا نام طرح…"
    />
  )
}
export function AdminInvestmentsClient() {
  return (
    <AdminFinanceList
      title="سرمایه‌گذاری"
      eyebrow="محصولات"
      description="موقعیت‌های سرمایه‌گذاری و سررسیدها — فقط خواندنی"
      endpoint="/api/v1/admin/investments"
      dataKey="positions"
      columns={investmentColumns}
      keyOf={(r) => r.id}
      filters={investmentFilters}
      searchPlaceholder="شناسه، موبایل یا نام طرح…"
    />
  )
}
export function AdminReferralsClient() {
  return (
    <AdminFinanceList
      title="برنامه معرفی"
      eyebrow="محصولات"
      description="زنجیره معرف، کاربر دعوت‌شده و وضعیت پاداش"
      endpoint="/api/v1/admin/referrals"
      dataKey="referrals"
      columns={referralColumns}
      keyOf={(r) => r.id}
      filters={referralFilters}
      searchPlaceholder="موبایل، شناسه یا کد معرفی…"
    />
  )
}
export function AdminSupportClient() {
  return (
    <AdminFinanceList
      title="مرکز پشتیبانی"
      eyebrow="خدمات مشتری"
      description="صندوق ورودی تیکت‌ها، اولویت و تخصیص کارشناس"
      endpoint="/api/v1/admin/support"
      dataKey="tickets"
      columns={ticketColumns}
      keyOf={(r) => r.id}
      filters={ticketFilters}
      searchPlaceholder="موضوع، شناسه یا موبایل…"
      readOnlyNotice={false}
    />
  )
}
