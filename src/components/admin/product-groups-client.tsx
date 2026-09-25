// ============================================
// Zar30 - Admin Product Groups (Categories) Client
// ============================================
// لیست دسته‌بندی‌های محصول + ایجاد/ویرایش
// ============================================

'use client'

import { useCallback, useState } from 'react'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { apiPost, apiPut } from '@/lib/api/client'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'
import { AdminStatus } from '@/components/admin/admin-status'

interface CategoryRow {
  id: string
  name: string
  slug: string
  sortOrder: number
  active: boolean
  productsCount: number
  createdAt: string
}

const FIELDS: AdminFormField[] = [
  { key: 'name', label: 'نام دسته‌بندی', required: true },
  {
    key: 'slug',
    label: 'Slug',
    required: true,
    ltr: true,
    placeholder: 'coins',
    hint: 'فقط حروف کوچک انگلیسی، عدد و خط تیره',
  },
  { key: 'sortOrder', label: 'ترتیب نمایش', type: 'number', ltr: true },
  { key: 'active', label: 'فعال', type: 'checkbox' },
]

export function AdminProductGroupsClient() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const body = {
        name: String(values.name ?? ''),
        slug: String(values.slug ?? ''),
        sortOrder: Number(values.sortOrder ?? 0),
        active: values.active === true,
      }
      const res = editing
        ? await apiPut(`/api/v1/admin/product-groups/${editing.id}`, body)
        : await apiPost('/api/v1/admin/product-groups', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editing],
  )

  return (
    <>
      <AdminFinanceList<CategoryRow>
        title="دسته‌بندی محصولات"
        description="گروه‌بندی محصولات فروشگاه طلا"
        endpoint="/api/v1/admin/product-groups"
        dataKey="categories"
        keyOf={(c) => c.id}
        searchPlaceholder="نام یا slug…"
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
            دسته‌بندی جدید
          </button>
        }
        columns={[
          {
            key: 'name',
            header: 'نام',
            render: (c) => <span className="font-medium">{c.name}</span>,
          },
          {
            key: 'slug',
            header: 'Slug',
            render: (c) => (
              <span dir="ltr" className="text-muted-foreground font-mono text-xs">
                {c.slug}
              </span>
            ),
          },
          { key: 'products', header: 'تعداد محصول', render: (c) => c.productsCount },
          { key: 'sort', header: 'ترتیب', render: (c) => c.sortOrder, mobile: false },
          {
            key: 'active',
            header: 'وضعیت',
            render: (c) => <AdminStatus status={c.active ? 'ACTIVE' : 'SUSPENDED'} />,
          },
          {
            key: 'created',
            header: 'ایجاد',
            render: (c) => new Date(c.createdAt).toLocaleDateString('fa-IR'),
            mobile: false,
          },
        ]}
        rowActions={(c) => (
          <button
            type="button"
            aria-label={`ویرایش ${c.name}`}
            onClick={() => {
              setEditing(c)
              setDialogOpen(true)
            }}
            className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
          >
            <IconPencil className="size-4" aria-hidden="true" />
          </button>
        )}
        emptyMessage="دسته‌بندی یافت نشد"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `ویرایش «${editing.name}»` : 'دسته‌بندی جدید'}
        fields={FIELDS}
        initial={
          editing
            ? {
                name: editing.name,
                slug: editing.slug,
                sortOrder: String(editing.sortOrder),
                active: editing.active,
              }
            : undefined
        }
        onSubmit={submit}
      />
    </>
  )
}
