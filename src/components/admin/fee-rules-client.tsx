// ============================================
// Zar30 - Admin Fee Rules Client
// ============================================
// قواعد کارمزد گروهی — بر اساس سطح KYC یا حجم معامله
// ============================================

'use client'

import { useCallback, useState } from 'react'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { apiDelete, apiPost, apiPut } from '@/lib/api/client'
import { formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'
import { AdminStatus } from '@/components/admin/admin-status'

interface FeeRuleRow {
  id: string
  name: string
  kind: string
  kycLevel: string | null
  minVolumeToman: string | null
  buyFeeBps: number
  sellFeeBps: number
  priority: number
  active: boolean
  createdAt: string
}

const KYC_OPTIONS = [
  { value: 'LEVEL_0', label: 'سطح ۰' },
  { value: 'LEVEL_1', label: 'سطح ۱' },
  { value: 'LEVEL_2', label: 'سطح ۲' },
  { value: 'LEVEL_3', label: 'سطح ۳' },
]

const FIELDS: AdminFormField[] = [
  { key: 'name', label: 'نام قانون', required: true, placeholder: 'کارمزد VIP' },
  {
    key: 'kind',
    label: 'نوع قانون',
    type: 'select',
    options: [
      { value: 'KYC_LEVEL', label: 'بر اساس سطح KYC' },
      { value: 'VOLUME', label: 'بر اساس حجم معامله' },
    ],
  },
  {
    key: 'kycLevel',
    label: 'سطح KYC (برای نوع سطح)',
    type: 'select',
    options: [{ value: '', label: '—' }, ...KYC_OPTIONS],
  },
  {
    key: 'minVolumeToman',
    label: 'حداقل حجم معامله — تومان (برای نوع حجمی)',
    ltr: true,
    placeholder: '10000000',
  },
  {
    key: 'buyFeeBps',
    label: 'کارمزد خرید (bps)',
    required: true,
    ltr: true,
    placeholder: '50 = 0.5٪',
  },
  {
    key: 'sellFeeBps',
    label: 'کارمزد فروش (bps)',
    required: true,
    ltr: true,
    placeholder: '50 = 0.5٪',
  },
  {
    key: 'priority',
    label: 'اولویت (بالاتر = اعمال زودتر)',
    type: 'number',
    ltr: true,
    hint: 'قانون با priority بالاتر و شرط منطبق، انتخاب می‌شود',
  },
  { key: 'active', label: 'فعال', type: 'checkbox' },
]

export function AdminFeeRulesClient() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FeeRuleRow | null>(null)

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const kind = String(values.kind ?? 'KYC_LEVEL')
      const body = {
        name: String(values.name ?? ''),
        kind,
        kycLevel: kind === 'KYC_LEVEL' ? String(values.kycLevel ?? '') || null : null,
        minVolumeToman: kind === 'VOLUME' ? String(values.minVolumeToman ?? '') || null : null,
        buyFeeBps: Number(values.buyFeeBps ?? 0),
        sellFeeBps: Number(values.sellFeeBps ?? 0),
        priority: Number(values.priority ?? 0),
        active: values.active === true,
      }
      const res = editing
        ? await apiPut(`/api/v1/admin/fee-rules/${editing.id}`, body)
        : await apiPost('/api/v1/admin/fee-rules', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editing],
  )

  const remove = useCallback(async (row: FeeRuleRow) => {
    if (!confirm(`قانون «${row.name}» حذف شود؟`)) return
    const res = await apiDelete(`/api/v1/admin/fee-rules/${row.id}`)
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      <AdminFinanceList<FeeRuleRow>
        title="قواعد کارمزد"
        description="کارمزد گروهی معاملات بر اساس سطح KYC یا حجم — override فردی بر این قواعد مقدم است"
        endpoint="/api/v1/admin/fee-rules"
        dataKey="rules"
        keyOf={(r) => r.id}
        searchPlaceholder="جستجو…"
        readOnlyNotice={false}
        refreshKey={refreshKey}
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
            key: 'name',
            header: 'نام',
            render: (r) => <span className="font-medium">{r.name}</span>,
          },
          {
            key: 'kind',
            header: 'نوع',
            render: (r) => (r.kind === 'KYC_LEVEL' ? 'سطح KYC' : 'حجم معامله'),
          },
          {
            key: 'cond',
            header: 'شرط',
            render: (r) =>
              r.kind === 'KYC_LEVEL'
                ? (KYC_OPTIONS.find((k) => k.value === r.kycLevel)?.label ?? '—')
                : `حداقل ${formatToman(r.minVolumeToman ?? '0')} ت`,
            mobile: false,
          },
          { key: 'buy', header: 'خرید', render: (r) => `${r.buyFeeBps} bps`, mobile: false },
          { key: 'sell', header: 'فروش', render: (r) => `${r.sellFeeBps} bps`, mobile: false },
          { key: 'priority', header: 'اولویت', render: (r) => r.priority, mobile: false },
          {
            key: 'active',
            header: 'وضعیت',
            render: (r) => <AdminStatus status={r.active ? 'ACTIVE' : 'SUSPENDED'} />,
          },
        ]}
        rowActions={(r) => (
          <>
            <button
              type="button"
              aria-label={`ویرایش ${r.name}`}
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
              aria-label={`حذف ${r.name}`}
              onClick={() => void remove(r)}
              className="border-error/30 text-error hover:bg-error/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
        emptyMessage="قانونی تعریف نشده — کارمزد پیش‌فرض ۵۰ bps اعمال می‌شود"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `ویرایش «${editing.name}»` : 'قانون کارمزد جدید'}
        fields={FIELDS}
        initial={
          editing
            ? {
                name: editing.name,
                kind: editing.kind,
                kycLevel: editing.kycLevel ?? '',
                minVolumeToman: editing.minVolumeToman ?? '',
                buyFeeBps: String(editing.buyFeeBps),
                sellFeeBps: String(editing.sellFeeBps),
                priority: String(editing.priority),
                active: editing.active,
              }
            : { active: true, kind: 'KYC_LEVEL', priority: '0' }
        }
        onSubmit={submit}
      />
    </>
  )
}
