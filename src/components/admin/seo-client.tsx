// ============================================
// Zar30 - Admin SEO Client
// ============================================
// متادیتای صفحات عمومی — upsert به platform_settings با پیشوند seo.
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'

interface SeoRow {
  page: string
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  updatedAt: string
}

const FIELDS: AdminFormField[] = [
  {
    key: 'page',
    label: 'مسیر صفحه',
    required: true,
    ltr: true,
    placeholder: '/',
    hint: 'مثل / یا /pricing',
  },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'keywords', label: 'کلمات کلیدی', ltr: true, hint: 'با کاما جدا کنید' },
  { key: 'ogImage', label: 'OG Image URL', ltr: true, placeholder: 'https://zar30.com/og.png' },
]

export function AdminSeoClient() {
  const [pages, setPages] = useState<SeoRow[] | null>(null)
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<SeoRow | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ pages: SeoRow[] }>('/api/v1/admin/seo')
    if (res.ok && res.data?.pages) setPages(res.data.pages)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ pages: SeoRow[] }>('/api/v1/admin/seo')
      if (!cancelled && res.ok && res.data?.pages) setPages(res.data.pages)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const res = await apiPost('/api/v1/admin/seo', {
        page: String(values.page ?? ''),
        title: String(values.title ?? ''),
        description: String(values.description ?? ''),
        keywords: String(values.keywords ?? '')
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        ogImage: String(values.ogImage ?? ''),
      })
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      await load()
      return null
    },
    [load],
  )

  return (
    <div>
      <AdminPageHeader
        title="سئو"
        eyebrow="محتوا و رشد"
        description="متادیتای صفحات عمومی — مقادیر در platform_settings با کلید seo.<path> ذخیره و audit می‌شوند"
        actions={
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setDialog(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            صفحه جدید
          </button>
        }
      />

      {!pages ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <p className="border-border/60 text-muted-foreground rounded-xl border border-dashed p-8 text-center text-xs">
          هنوز متادیتایی ثبت نشده است — با «صفحه جدید» شروع کنید
        </p>
      ) : (
        <div className="grid gap-3">
          {pages.map((p) => (
            <div
              key={p.page}
              className="bg-card border-border/60 flex items-start justify-between gap-3 rounded-xl border p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="bg-muted rounded px-1.5 py-0.5 text-[11px]" dir="ltr">
                    {p.page}
                  </code>
                  <p className="truncate text-xs font-bold">{p.title}</p>
                </div>
                {p.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">
                    {p.description}
                  </p>
                )}
                {p.keywords && p.keywords.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.keywords.map((k) => (
                      <span
                        key={k}
                        className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[9px]"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground mt-1.5 text-[9px]">
                  آخرین تغییر: {new Date(p.updatedAt).toLocaleString('fa-IR')}
                </p>
              </div>
              <button
                type="button"
                aria-label={`ویرایش ${p.page}`}
                onClick={() => {
                  setEditing(p)
                  setDialog(true)
                }}
                className="border-border/60 text-muted-foreground hover:text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
              >
                <IconPencil className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AdminFormDialog
        open={dialog}
        onOpenChange={setDialog}
        title={editing ? `ویرایش SEO «${editing.page}»` : 'متادیتای صفحه جدید'}
        fields={FIELDS}
        initial={
          editing
            ? {
                page: editing.page,
                title: editing.title ?? '',
                description: editing.description ?? '',
                keywords: (editing.keywords ?? []).join(','),
                ogImage: editing.ogImage ?? '',
              }
            : undefined
        }
        onSubmit={submit}
      />
    </div>
  )
}
