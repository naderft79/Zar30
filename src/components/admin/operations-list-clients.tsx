'use client'

import Link from 'next/link'
import { useState } from 'react'
import { IconCheck, IconCoin, IconX } from '@tabler/icons-react'
import { AdminFinanceList, type FinanceListFilterDef } from './finance-list'
import type { AdminColumn } from './admin-data-table'
import { AdminStatus } from './admin-status'
import { FinancialValue } from './financial-value'
import { useAdmin } from './admin-shell'
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac'
import { apiPost } from '@/lib/api/client'
import type {
  AdminInstallmentRow,
  AdminInvestmentRow,
  AdminReferralRow,
  AdminTicketRow,
} from '@/lib/services/admin-operations.service'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

// اکشن پرداخت پاداش معرف — فقط برای وضعیت QUALIFIED
// پاداش از PlatformSetting (referral.reward_toman) خوانده می‌شود؛ سند double-entry
// با ledger متوازن — payment سمت سرور idempotent (قفل ردیفی + REWARDED check)
function ReferralRowActions({
  row,
  onDone,
}: {
  row: AdminReferralRow
  onDone: (msg: string) => void
}) {
  const { admin } = useAdmin()
  const canManage = hasPermission(admin.permissions, PERMISSIONS.REFERRALS_MANAGE)
  const [busy, setBusy] = useState(false)

  if (!canManage || row.status !== 'QUALIFIED') return null

  async function pay() {
    if (busy) return
    if (
      !window.confirm(
        `پاداش معرفی برای ${row.referrer.name} پرداخت شود؟ مبلغ از تنظیمات سامانه خوانده و با سند حسابداری واریز می‌شود.`,
      )
    )
      return
    setBusy(true)
    const res = await apiPost(`/api/v1/admin/referrals/${row.id}/reward`)
    setBusy(false)
    if (!res.ok) {
      window.alert(res.error ?? 'پرداخت پاداش ناموفق بود')
      return
    }
    onDone('پاداش معرفی پرداخت شد.')
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={pay}
      title="پرداخت پاداش معرف"
      className="text-success hover:bg-success/10 focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      aria-label="پرداخت پاداش معرف"
    >
      <IconCoin className="size-4" strokeWidth={2} />
    </button>
  )
}

// اکشن‌های inline قرارداد قسطی — فقط برای وضعیت PENDING
// approve: صدور قرارداد (وصول پیش‌پرداخت + تحویل طلا + جدول اقساط)
// reject: رد با دلیل — هر دو سرور-side با permission enforce و strict audit
function InstallmentRowActions({ row, onDone }: { row: AdminInstallmentRow; onDone: () => void }) {
  const { admin } = useAdmin()
  const canReview = hasPermission(admin.permissions, PERMISSIONS.INSTALLMENTS_REVIEW)
  const [busy, setBusy] = useState(false)

  if (!canReview || row.status !== 'PENDING') return null

  async function run(url: string, body?: unknown) {
    if (busy) return
    setBusy(true)
    const res = await apiPost(url, body ?? {})
    setBusy(false)
    if (!res.ok) {
      window.alert(res.error ?? 'عملیات ناموفق بود')
      return
    }
    onDone()
  }

  function approve() {
    if (
      !window.confirm('صدور قرارداد تایید شود؟ پیش‌پرداخت از کیف پول کاربر کسر و طلا تحویل می‌شود.')
    )
      return
    void run(`/api/v1/admin/installments/${row.id}/approve`)
  }

  function reject() {
    const reason = window.prompt('دلیل رد را بنویسید (حداقل ۳ کاراکتر):')
    if (!reason || reason.trim().length < 3) return
    void run(`/api/v1/admin/installments/${row.id}/reject`, { reason: reason.trim() })
  }

  const btnBase =
    'flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40'

  return (
    <>
      <button
        type="button"
        disabled={busy}
        title="تایید و صدور قرارداد"
        aria-label="تایید و صدور قرارداد"
        onClick={approve}
        className={cn(btnBase, 'text-success hover:bg-success/10')}
      >
        <IconCheck className="size-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        disabled={busy}
        title="رد درخواست"
        aria-label="رد درخواست"
        onClick={reject}
        className={cn(btnBase, 'text-error hover:bg-error/10')}
      >
        <IconX className="size-4" strokeWidth={2} />
      </button>
    </>
  )
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString('fa-IR') : '—'
}

function UserLink({ id, name, mobile }: { id: string; name: string; mobile: string }) {
  return (
    <Link
      href={`/admin/users/${id}`}
      className="hover:text-gold-600 dark:hover:text-gold-400 block min-w-0 transition-colors"
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
    render: (r) => <FinancialValue value={r.principal} unit="تومان" />,
  },
  {
    key: 'payable',
    header: 'کل پرداخت',
    render: (r) => <FinancialValue value={r.totalPayable} unit="تومان" />,
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
  // refreshKey — پس از هر اکشن approve/reject لیست دوباره fetch می‌شود
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <AdminFinanceList
      title="خرید قسطی"
      eyebrow="محصولات"
      description="قراردادها و چرخه پرداخت اقساط — قراردادهای در انتظار با اکشن تایید/رد"
      endpoint="/api/v1/admin/installments"
      dataKey="contracts"
      columns={installmentColumns}
      keyOf={(r) => r.id}
      filters={installmentFilters}
      searchPlaceholder="شناسه، موبایل یا نام طرح…"
      refreshKey={refreshKey}
      rowActions={(r) => (
        <InstallmentRowActions row={r} onDone={() => setRefreshKey((k) => k + 1)} />
      )}
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
  // پس از پرداخت پاداش لیست refresh می‌شود
  const [refreshKey, setRefreshKey] = useState(0)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {doneMsg && (
        <div
          role="status"
          className="text-success bg-success/10 rounded-xl p-3.5 text-xs font-medium"
        >
          {doneMsg}
        </div>
      )}
      <AdminFinanceList
        title="برنامه معرفی"
        eyebrow="محصولات"
        description="زنجیره معرف، کاربر دعوت‌شده و وضعیت پاداش — دعوت‌های واجد شرایط دکمه پرداخت پاداش دارند"
        endpoint="/api/v1/admin/referrals"
        dataKey="referrals"
        columns={referralColumns}
        keyOf={(r) => r.id}
        filters={referralFilters}
        searchPlaceholder="موبایل، شناسه یا کد معرفی…"
        refreshKey={refreshKey}
        rowActions={(r) => (
          <ReferralRowActions
            row={r}
            onDone={(msg) => {
              setDoneMsg(msg)
              setRefreshKey((k) => k + 1)
            }}
          />
        )}
      />
    </div>
  )
}
export function AdminSupportClient() {
  return (
    <AdminFinanceList
      title="مرکز پشتیبانی"
      eyebrow="خدمات مشتری"
      description="صندوق ورودی تیکت‌ها، اولویت و تخصیص کارشناس — برای پاسخ روی ردیف کلیک کنید"
      endpoint="/api/v1/admin/support"
      dataKey="tickets"
      columns={ticketColumns}
      keyOf={(r) => r.id}
      filters={ticketFilters}
      searchPlaceholder="موضوع، شناسه یا موبایل…"
      detailHref={(r) => `/admin/support/${r.id}`}
    />
  )
}
