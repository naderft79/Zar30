// ============================================
// Zar30 - Admin Discounts Client
// ============================================
// کدهای تخفیف — درصدی/مبلغ ثابت، سقف استفاده، انقضا، حوزه اعمال
// ============================================

'use client'

import { useCallback, useState } from 'react'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { apiPost, apiPut } from '@/lib/api/client'
import { formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'
import { AdminStatus } from '@/components/admin/admin-status'

interface DiscountRow {
  id: string
  code: string
  type: string
  value: string
  maxUses: number | null
  usedCount: number
  minPurchase: string | null
  expiresAt: string | null
  appliesTo: string
  active: boolean
  createdAt: string
}

const APPLIES_LABELS: Record<string, string> = {
  TRADE_FEE: 'کارمزد معامله',
  COIN_PREMIUM: 'اجرت سکه',
  SHOP: 'فروشگاه',
}

const FIELDS: AdminFormField[] = [
  { key: 'code', label: 'کد تخفیف', required: true, ltr: true, placeholder: 'NOWRUZ10' },
  {
    key: 'type',
    label: 'نوع',
    type: 'select',
    options: [
      { value: 'PERCENT', label: 'درصدی (۱ تا ۱۰۰)' },
      { value: 'FIXED', label: 'مبلغ ثابت (تومان)' },
    ],
  },
  {
    key: 'value',
    label: 'مقدار',
    required: true,
    ltr: true,
    hint: 'برای درصدی عدد ۱ تا ۱۰۰؛ برای ثابت مبلغ به تومان',
  },
  {
    key: 'appliesTo',
    label: 'حوزه اعمال',
    type: 'select',
    options: Object.entries(APPLIES_LABELS).map(([value, label]) => ({ value, label })),
  },
  { key: 'maxUses', label: 'سقف تعداد استفاده (خالی = نامحدود)', type: 'number', ltr: true },
  { key: 'minPurchase', label: 'حداقل خرید (تومان — اختیاری)', ltr: true },
  { key: 'expiresAt', label: 'انقضا (اختیاری)', type: 'datetime', ltr: true },
  { key: 'active', label: 'فعال', type: 'checkbox' },
]

export function AdminDiscountsClient() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountRow | null>(null)

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const expiresRaw = String(values.expiresAt ?? '')
      const body = {
        code: String(values.code ?? ''),
        type: String(values.type ?? 'PERCENT'),
        value: String(values.value ?? ''),
        appliesTo: String(values.appliesTo ?? 'SHOP'),
        maxUses: String(values.maxUses ?? '') === '' ? null : Number(values.maxUses),
        minPurchase: String(values.minPurchase ?? '') || null,
        expiresAt: expiresRaw ? new Date(expiresRaw).toISOString() : null,
        active: values.active === true,
      }
      const res = editing
        ? await apiPut(`/api/v1/admin/discounts/${editing.id}`, body)
        : await apiPost('/api/v1/admin/discounts', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editing],
  )

  return (
    <>
      <AdminFinanceList<DiscountRow>
        title="کدهای تخفیف"
        description="مدیریت کدهای تخفیف کارمزد معامله، اجرت سکه و فروشگاه"
        endpoint="/api/v1/admin/discounts"
        dataKey="discounts"
        keyOf={(d) => d.id}
        searchPlaceholder="کد تخفیف…"
        refreshKey={refreshKey}
        filters={[
          {
            key: 'appliesTo',
            label: 'حوزه اعمال',
            options: Object.entries(APPLIES_LABELS).map(([value, label]) => ({ value, label })),
          },
          {
            key: 'active',
            label: 'وضعیت',
            options: [
              { value: 'true', label: 'فعال' },
              { value: 'false', label: 'غیرفعال' },
            ],
          },
        ]}
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
            کد تخفیف جدید
          </button>
        }
        columns={[
          {
            key: 'code',
            header: 'کد',
            render: (d) => (
              <span dir="ltr" className="font-mono text-xs font-bold">
                {d.code}
              </span>
            ),
          },
          {
            key: 'value',
            header: 'مقدار',
            render: (d) => (d.type === 'PERCENT' ? `${d.value}٪` : `${formatToman(d.value)} تومان`),
          },
          {
            key: 'applies',
            header: 'حوزه',
            render: (d) => APPLIES_LABELS[d.appliesTo] ?? d.appliesTo,
            mobile: false,
          },
          {
            key: 'uses',
            header: 'استفاده',
            render: (d) => `${d.usedCount}${d.maxUses ? ` / ${d.maxUses}` : ''}`,
            mobile: false,
          },
          {
            key: 'minPurchase',
            header: 'حداقل خرید',
            render: (d) => (d.minPurchase ? `${formatToman(d.minPurchase)} ت` : '—'),
            mobile: false,
          },
          {
            key: 'expires',
            header: 'انقضا',
            render: (d) => (d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('fa-IR') : '—'),
            mobile: false,
          },
          {
            key: 'active',
            header: 'وضعیت',
            render: (d) => <AdminStatus status={d.active ? 'ACTIVE' : 'SUSPENDED'} />,
          },
        ]}
        rowActions={(d) => (
          <button
            type="button"
            aria-label={`ویرایش ${d.code}`}
            onClick={() => {
              setEditing(d)
              setDialogOpen(true)
            }}
            className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
          >
            <IconPencil className="size-4" aria-hidden="true" />
          </button>
        )}
        emptyMessage="کد تخفیفی یافت نشد"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `ویرایش کد «${editing.code}»` : 'کد تخفیف جدید'}
        fields={FIELDS}
        initial={
          editing
            ? {
                code: editing.code,
                type: editing.type,
                value: editing.value,
                appliesTo: editing.appliesTo,
                maxUses: editing.maxUses ? String(editing.maxUses) : '',
                minPurchase: editing.minPurchase ?? '',
                expiresAt: editing.expiresAt ? editing.expiresAt.slice(0, 16) : '',
                active: editing.active,
              }
            : undefined
        }
        onSubmit={submit}
      />
    </>
  )
}
