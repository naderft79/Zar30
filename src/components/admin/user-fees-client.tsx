// ============================================
// Zar30 - Admin User Fees Client
// ============================================
// Override فردی کارمزد کاربر — جستجو با موبایل، upsert و حذف
// ============================================

'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { apiDelete, apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'

interface OverrideRow {
  id: string
  userId: string
  buyFeeBps: number | null
  sellFeeBps: number | null
  note: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
}

const FIELDS: AdminFormField[] = [
  {
    key: 'mobile',
    label: 'شماره موبایل کاربر',
    required: true,
    ltr: true,
    placeholder: '0912…',
    hint: 'کاربر بر اساس موبایل پیدا می‌شود',
  },
  {
    key: 'buyFeeBps',
    label: 'کارمزد خرید (bps — خالی = بدون override)',
    ltr: true,
    placeholder: '50 = 0.5٪',
  },
  {
    key: 'sellFeeBps',
    label: 'کارمزد فروش (bps — خالی = بدون override)',
    ltr: true,
    placeholder: '50 = 0.5٪',
  },
  { key: 'note', label: 'یادداشت (اختیاری)', type: 'textarea' },
]

function bpsLabel(v: number | null): string {
  if (v == null) return '—'
  return `${v} bps (${(v / 100).toLocaleString('fa-IR')}٪)`
}

export function AdminUserFeesClient() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const submit = useCallback(async (values: AdminFormValues): Promise<string | null> => {
    const mobile = String(values.mobile ?? '').trim()
    if (!mobile) return 'موبایل الزامی است'

    // resolve کاربر با موبایل
    const lookup = await apiGetWithRefresh<{ users: { id: string }[] }>(
      `/api/v1/admin/users?limit=1&q=${encodeURIComponent(mobile)}`,
    )
    const userId = lookup.ok ? lookup.data?.users?.[0]?.id : undefined
    if (!userId) return 'کاربری با این موبایل یافت نشد'

    const res = await apiPost('/api/v1/admin/user-fees', {
      userId,
      buyFeeBps: String(values.buyFeeBps ?? '') === '' ? null : Number(values.buyFeeBps),
      sellFeeBps: String(values.sellFeeBps ?? '') === '' ? null : Number(values.sellFeeBps),
      note: String(values.note ?? '') || null,
    })
    if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
    setRefreshKey((k) => k + 1)
    return null
  }, [])

  const remove = useCallback(async (row: OverrideRow) => {
    if (!confirm(`override کارمزد «${row.user.name}» حذف شود؟`)) return
    const res = await apiDelete(`/api/v1/admin/user-fees/${row.id}`)
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      <AdminFinanceList<OverrideRow>
        title="کارمزدهای فردی کاربران"
        description="override کارمزد خرید/فروش برای کاربران خاص — بر قواعد گروهی اولویت دارد"
        endpoint="/api/v1/admin/user-fees"
        dataKey="overrides"
        keyOf={(o) => o.id}
        searchPlaceholder="موبایل یا نام کاربر…"
        readOnlyNotice={false}
        refreshKey={refreshKey}
        headerAction={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            override جدید
          </button>
        }
        columns={[
          {
            key: 'user',
            header: 'کاربر',
            render: (o) => (
              <Link href={`/admin/users/${o.user.id}`} className="font-medium hover:underline">
                {o.user.name}
              </Link>
            ),
          },
          {
            key: 'mobile',
            header: 'موبایل',
            render: (o) => <span dir="ltr">{o.user.mobile}</span>,
            mobile: false,
          },
          { key: 'buy', header: 'کارمزد خرید', render: (o) => bpsLabel(o.buyFeeBps) },
          { key: 'sell', header: 'کارمزد فروش', render: (o) => bpsLabel(o.sellFeeBps) },
          {
            key: 'note',
            header: 'یادداشت',
            render: (o) => <span className="text-muted-foreground">{o.note ?? '—'}</span>,
            mobile: false,
          },
          {
            key: 'created',
            header: 'ایجاد',
            render: (o) => new Date(o.createdAt).toLocaleDateString('fa-IR'),
            mobile: false,
          },
        ]}
        rowActions={(o) => (
          <button
            type="button"
            aria-label={`حذف override ${o.user.name}`}
            onClick={() => void remove(o)}
            className="border-error/30 text-error hover:bg-error/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
          >
            <IconTrash className="size-4" aria-hidden="true" />
          </button>
        )}
        emptyMessage="overrideای تعریف نشده است"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="override کارمزد کاربر"
        description="کارمزد اختصاصی برای یک کاربر — مقدار خالی یعنی آن سمت override نمی‌شود"
        fields={FIELDS}
        onSubmit={submit}
      />
    </>
  )
}
