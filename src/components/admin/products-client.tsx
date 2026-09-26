// ============================================
// Zar30 - Admin Products Client
// ============================================
// لیست محصولات فروشگاه + ایجاد/ویرایش با Dialog
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost, apiPut } from '@/lib/api/client'
import { formatGoldGrams, formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'
import { AdminStatus } from '@/components/admin/admin-status'

interface ProductRow {
  id: string
  sku: string
  name: string
  kind: string
  weightGrams: string
  premiumToman: string
  stock: number
  active: boolean
  sortOrder: number
  imageUrl: string | null
  createdAt: string
  category: { id: string; name: string } | null
}

const KIND_LABELS: Record<string, string> = {
  COIN: 'سکه',
  BAR: 'شمش',
  JEWELRY: 'زیورآلات',
}

export function AdminProductsClient() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  // گزینه‌های دسته‌بندی برای فیلتر و فرم
  useEffect(() => {
    void (async () => {
      const res = await apiGetWithRefresh<{ categories: { id: string; name: string }[] }>(
        '/api/v1/admin/product-groups?limit=100',
      )
      if (res.ok && res.data?.categories) setCategories(res.data.categories)
    })()
  }, [])

  const fields: AdminFormField[] = [
    { key: 'name', label: 'نام محصول', required: true },
    { key: 'sku', label: 'کد SKU', required: true, ltr: true },
    {
      key: 'categoryId',
      label: 'دسته‌بندی',
      type: 'select',
      options: [
        { value: '', label: 'بدون دسته‌بندی' },
        ...categories.map((c) => ({ value: c.id, label: c.name })),
      ],
    },
    {
      key: 'kind',
      label: 'نوع',
      type: 'select',
      options: Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })),
    },
    { key: 'weightGrams', label: 'وزن (گرم)', required: true, ltr: true, placeholder: '2.426' },
    { key: 'premiumToman', label: 'اجرت/حق‌ضرب (تومان)', type: 'number', ltr: true },
    { key: 'stock', label: 'موجودی', type: 'number', ltr: true },
    { key: 'sortOrder', label: 'ترتیب نمایش', type: 'number', ltr: true },
    { key: 'imageUrl', label: 'لینک تصویر (اختیاری)', ltr: true },
    { key: 'active', label: 'فعال', type: 'checkbox' },
  ]

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const body = {
        name: String(values.name ?? ''),
        sku: String(values.sku ?? ''),
        categoryId: String(values.categoryId ?? '') || null,
        kind: String(values.kind ?? 'COIN'),
        weightGrams: String(values.weightGrams ?? ''),
        premiumToman: String(values.premiumToman ?? '0'),
        stock: Number(values.stock ?? 0),
        sortOrder: Number(values.sortOrder ?? 0),
        imageUrl: String(values.imageUrl ?? '') || null,
        active: values.active === true,
      }
      const res = editing
        ? await apiPut(`/api/v1/admin/products/${editing.id}`, body)
        : await apiPost('/api/v1/admin/products', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editing],
  )

  return (
    <>
      <AdminFinanceList<ProductRow>
        title="محصولات فروشگاه"
        description="کاتالوگ سکه، شمش و محصولات فروشگاه طلا"
        endpoint="/api/v1/admin/products"
        dataKey="products"
        keyOf={(p) => p.id}
        searchPlaceholder="نام یا SKU…"
        refreshKey={refreshKey}
        filters={[
          {
            key: 'kind',
            label: 'نوع محصول',
            options: Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })),
          },
          {
            key: 'categoryId',
            label: 'دسته‌بندی',
            options: categories.map((c) => ({ value: c.id, label: c.name })),
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
            محصول جدید
          </button>
        }
        columns={[
          {
            key: 'name',
            header: 'نام',
            render: (p) => <span className="font-medium">{p.name}</span>,
          },
          {
            key: 'sku',
            header: 'SKU',
            render: (p) => (
              <span dir="ltr" className="text-muted-foreground font-mono text-xs">
                {p.sku}
              </span>
            ),
          },
          {
            key: 'kind',
            header: 'نوع',
            render: (p) => KIND_LABELS[p.kind] ?? p.kind,
            mobile: false,
          },
          {
            key: 'category',
            header: 'دسته‌بندی',
            render: (p) => p.category?.name ?? '—',
            mobile: false,
          },
          {
            key: 'weight',
            header: 'وزن',
            render: (p) => formatGoldGrams(p.weightGrams),
            mobile: false,
          },
          {
            key: 'premium',
            header: 'اجرت',
            render: (p) => `${formatToman(p.premiumToman)} تومان`,
            mobile: false,
          },
          { key: 'stock', header: 'موجودی', render: (p) => p.stock },
          {
            key: 'active',
            header: 'وضعیت',
            render: (p) => <AdminStatus status={p.active ? 'ACTIVE' : 'SUSPENDED'} />,
          },
        ]}
        rowActions={(p) => (
          <button
            type="button"
            aria-label={`ویرایش ${p.name}`}
            onClick={() => {
              setEditing(p)
              setDialogOpen(true)
            }}
            className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
          >
            <IconPencil className="size-4" aria-hidden="true" />
          </button>
        )}
        emptyMessage="محصولی یافت نشد"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `ویرایش «${editing.name}»` : 'محصول جدید'}
        fields={fields}
        initial={
          editing
            ? {
                name: editing.name,
                sku: editing.sku,
                categoryId: editing.category?.id ?? '',
                kind: editing.kind,
                weightGrams: editing.weightGrams,
                premiumToman: editing.premiumToman,
                stock: String(editing.stock),
                sortOrder: String(editing.sortOrder),
                imageUrl: editing.imageUrl ?? '',
                active: editing.active,
              }
            : undefined
        }
        onSubmit={submit}
      />
    </>
  )
}
