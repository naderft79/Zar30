// ============================================
// Zar30 - Admin Limit Rules Client
// ============================================
// قوانین محدودیت با scope ثابت (WITHDRAW/TRADE/TRANSFER)
// نمایش مصرف دوره‌ای کاربران در detailهای مجزا انجام می‌شود
// ============================================

'use client'

import { useCallback, useState } from 'react'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { apiDelete, apiPost, apiPut } from '@/lib/api/client'
import { formatGoldGrams, formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'
import { AdminStatus } from '@/components/admin/admin-status'

interface LimitRuleRow {
  id: string
  scope: string
  kycLevel: string | null
  period: string
  amountToman: string | null
  amountGold: string | null
  active: boolean
  createdAt: string
}

const KYC_OPTIONS = [
  { value: 'LEVEL_0', label: 'سطح ۰' },
  { value: 'LEVEL_1', label: 'سطح ۱' },
  { value: 'LEVEL_2', label: 'سطح ۲' },
  { value: 'LEVEL_3', label: 'سطح ۳' },
]

interface AdminLimitsClientProps {
  scope: 'WITHDRAW' | 'TRADE' | 'TRANSFER'
  title: string
  description: string
}

export function AdminLimitsClient({ scope, title, description }: AdminLimitsClientProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LimitRuleRow | null>(null)

  const isGoldOnly = scope === 'TRANSFER'

  const fields: AdminFormField[] = [
    {
      key: 'kycLevel',
      label: 'سطح KYC (خالی = همه سطوح)',
      type: 'select',
      options: [{ value: '', label: 'همه سطوح' }, ...KYC_OPTIONS],
    },
    {
      key: 'period',
      label: 'دوره',
      type: 'select',
      options: [
        { value: 'DAILY', label: 'روزانه' },
        { value: 'MONTHLY', label: 'ماهانه' },
      ],
    },
    ...(isGoldOnly
      ? []
      : ([
          {
            key: 'amountToman',
            label: 'سقف تومان (خالی = بدون سقف تومانی)',
            ltr: true,
            placeholder: '50000000',
          },
        ] as AdminFormField[])),
    {
      key: 'amountGold',
      label: `سقف گرم${isGoldOnly ? ' — الزامی' : ' (اختیاری)'}`,
      ltr: true,
      placeholder: '10.5',
      hint: isGoldOnly ? undefined : 'برای محدودیت بر اساس وزن طلا',
    },
    { key: 'active', label: 'فعال', type: 'checkbox' },
  ]

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const body = {
        scope,
        kycLevel: String(values.kycLevel ?? '') || null,
        period: String(values.period ?? 'DAILY'),
        amountToman: isGoldOnly ? null : String(values.amountToman ?? '') || null,
        amountGold: String(values.amountGold ?? '') || null,
        active: values.active === true,
      }
      const res = editing
        ? await apiPut(`/api/v1/admin/limits/${editing.id}`, body)
        : await apiPost('/api/v1/admin/limits', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editing, scope, isGoldOnly],
  )

  const remove = useCallback(async (row: LimitRuleRow) => {
    if (!confirm('این قانون محدودیت حذف شود؟')) return
    const res = await apiDelete(`/api/v1/admin/limits/${row.id}`)
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      <AdminFinanceList<LimitRuleRow>
        title={title}
        description={description}
        endpoint={`/api/v1/admin/limits?scope=${scope}`}
        dataKey="rules"
        keyOf={(r) => r.id}
        searchPlaceholder="جستجو…"
        refreshKey={refreshKey}
        filters={[{ key: 'kycLevel', label: 'سطح KYC', options: KYC_OPTIONS }]}
        headerAction={
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            قانون جدید
          </button>
        }
        columns={[
          {
            key: 'kyc',
            header: 'سطح KYC',
            render: (r) => KYC_OPTIONS.find((k) => k.value === r.kycLevel)?.label ?? 'همه سطوح',
          },
          {
            key: 'period',
            header: 'دوره',
            render: (r) => (r.period === 'DAILY' ? 'روزانه' : 'ماهانه'),
          },
          {
            key: 'toman',
            header: 'سقف تومان',
            render: (r) => (r.amountToman ? `${formatToman(r.amountToman)} ت` : '—'),
          },
          {
            key: 'gold',
            header: 'سقف گرم',
            render: (r) => (r.amountGold ? formatGoldGrams(r.amountGold) : '—'),
          },
          {
            key: 'active',
            header: 'وضعیت',
            render: (r) => <AdminStatus status={r.active ? 'ACTIVE' : 'SUSPENDED'} />,
          },
          {
            key: 'created',
            header: 'ایجاد',
            render: (r) => new Date(r.createdAt).toLocaleDateString('fa-IR'),
            mobile: false,
          },
        ]}
        rowActions={(r) => (
          <>
            <button
              type="button"
              aria-label="ویرایش قانون"
              onClick={() => {
                setEditing(r)
                setDialogOpen(true)
              }}
              className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
            >
              <IconPencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="حذف قانون"
              onClick={() => void remove(r)}
              className="border-error/30 text-error hover:bg-error/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
        emptyMessage="قانون محدودیتی تعریف نشده — محدودیت‌های پیش‌فرض KYC اعمال می‌شوند"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'ویرایش قانون محدودیت' : 'قانون محدودیت جدید'}
        description="قانون با سطح KYC مشخص بر قانون «همه سطوح» مقدم است"
        fields={fields}
        initial={
          editing
            ? {
                kycLevel: editing.kycLevel ?? '',
                period: editing.period,
                amountToman: editing.amountToman ?? '',
                amountGold: editing.amountGold ?? '',
                active: editing.active,
              }
            : { period: 'DAILY', active: true }
        }
        onSubmit={submit}
      />
    </>
  )
}
