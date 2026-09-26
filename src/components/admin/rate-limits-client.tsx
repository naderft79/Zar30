// ============================================
// Zar30 - Admin Rate Limits Client
// ============================================
// قوانین RateLimitConfig — override روی fallbackهای هاردکد rate-limit.ts
// حذف قانون = بازگشت به fallback؛ cache ۶۰ ثانیه‌ای سمت سرور دارد
// ============================================

'use client'

import { useCallback, useState } from 'react'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { apiDelete, apiPost, apiPut } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'
import { AdminStatus } from '@/components/admin/admin-status'

interface RateLimitRow {
  id: string
  key: string
  limit: number
  windowSeconds: number
  scope: string
  active: boolean
  updatedAt: string
}

const SCOPE_LABELS: Record<string, string> = { IP: 'IP', USER: 'کاربر', MOBILE: 'موبایل' }

const FIELDS: AdminFormField[] = [
  {
    key: 'key',
    label: 'کلید',
    required: true,
    ltr: true,
    placeholder: 'otp.send',
    hint: 'مثل api.general، otp.send، auth.login — حروف کوچک و نقطه',
  },
  { key: 'limit', label: 'حداکثر درخواست در پنجره', type: 'number', required: true, ltr: true },
  {
    key: 'windowSeconds',
    label: 'پنجره زمانی (ثانیه)',
    type: 'number',
    required: true,
    ltr: true,
    placeholder: '3600',
  },
  {
    key: 'scope',
    label: 'اسکوپ',
    type: 'select',
    options: [
      { value: 'IP', label: 'IP' },
      { value: 'USER', label: 'کاربر' },
      { value: 'MOBILE', label: 'موبایل' },
    ],
  },
  { key: 'active', label: 'فعال', type: 'checkbox' },
]

function windowLabel(s: number): string {
  if (s >= 3600 && s % 3600 === 0) return `${toPersianDigits(s / 3600)} ساعت`
  if (s >= 60 && s % 60 === 0) return `${toPersianDigits(s / 60)} دقیقه`
  return `${toPersianDigits(s)} ثانیه`
}

export function AdminRateLimitsClient() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RateLimitRow | null>(null)

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const body = {
        key: String(values.key ?? ''),
        limit: Number(values.limit ?? 0),
        windowSeconds: Number(values.windowSeconds ?? 0),
        scope: String(values.scope ?? 'IP'),
        active: values.active === true,
      }
      const res = editing
        ? await apiPut(`/api/v1/admin/rate-limits/${editing.id}`, body)
        : await apiPost('/api/v1/admin/rate-limits', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editing],
  )

  const remove = useCallback(async (row: RateLimitRow) => {
    if (!confirm(`قانون «${row.key}» حذف شود؟ (به مقدار fallback برمی‌گردد)`)) return
    const res = await apiDelete(`/api/v1/admin/rate-limits/${row.id}`)
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <>
      <AdminFinanceList<RateLimitRow>
        title="Rate Limiting"
        description="قوانین محدودیت نرخ درخواست — تغییرات حداکثر تا ۶۰ ثانیه بعد (کش) اعمال می‌شوند"
        endpoint="/api/v1/admin/rate-limits"
        dataKey="rules"
        keyOf={(r) => r.id}
        searchPlaceholder="جستجو…"
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
            key: 'key',
            header: 'کلید',
            render: (r) => (
              <span dir="ltr" className="font-mono text-xs font-bold">
                {r.key}
              </span>
            ),
          },
          { key: 'limit', header: 'حد', render: (r) => toPersianDigits(r.limit) },
          { key: 'window', header: 'پنجره', render: (r) => windowLabel(r.windowSeconds) },
          { key: 'scope', header: 'اسکوپ', render: (r) => SCOPE_LABELS[r.scope] ?? r.scope },
          {
            key: 'active',
            header: 'وضعیت',
            render: (r) => <AdminStatus status={r.active ? 'ACTIVE' : 'SUSPENDED'} />,
          },
          {
            key: 'updated',
            header: 'آخرین ویرایش',
            render: (r) => new Date(r.updatedAt).toLocaleDateString('fa-IR'),
            mobile: false,
          },
        ]}
        rowActions={(r) => (
          <>
            <button
              type="button"
              aria-label={`ویرایش ${r.key}`}
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
              aria-label={`حذف ${r.key}`}
              onClick={() => void remove(r)}
              className="border-error/30 text-error hover:bg-error/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
        emptyMessage="قانونی تعریف نشده — مقادیر پیش‌فرض داخلی اعمال می‌شوند"
      />

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `ویرایش «${editing.key}»` : 'قانون rate limit جدید'}
        fields={FIELDS}
        initial={
          editing
            ? {
                key: editing.key,
                limit: String(editing.limit),
                windowSeconds: String(editing.windowSeconds),
                scope: editing.scope,
                active: editing.active,
              }
            : { active: true, scope: 'IP' }
        }
        onSubmit={submit}
      />
    </>
  )
}
