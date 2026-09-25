// ============================================
// Zar30 - Admin Settings Client
// ============================================
// PlatformSetting CRUD — key/value JSON + جستجو
// ============================================

'use client'

import { useCallback, useState } from 'react'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { apiDelete, apiPost } from '@/lib/api/client'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'

interface SettingRow {
  key: string
  value: unknown
  updatedAt: string
  updatedBy: string | null
}

const FIELDS: AdminFormField[] = [
  { key: 'key', label: 'کلید', required: true, ltr: true, placeholder: 'delivery.fee_toman' },
  {
    key: 'value',
    label: 'مقدار (JSON)',
    type: 'textarea',
    required: true,
    ltr: true,
    placeholder: '12345 یا {"min":100} یا "متن"',
    hint: 'عدد، رشته، بولین یا آبجکت JSON معتبر',
  },
]

export function AdminSettingsClient() {
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<SettingRow | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const submit = useCallback(async (values: AdminFormValues): Promise<string | null> => {
    let parsed: unknown
    try {
      parsed = JSON.parse(String(values.value ?? ''))
    } catch {
      return 'مقدار باید JSON معتبر باشد — رشته را داخل "..." بنویسید'
    }
    const res = await apiPost('/api/v1/admin/settings', {
      key: String(values.key ?? ''),
      value: parsed,
    })
    if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
    setRefreshKey((k) => k + 1)
    return null
  }, [])

  const remove = useCallback(async (s: SettingRow) => {
    if (!confirm(`تنظیم «${s.key}» حذف شود؟`)) return
    const res = await apiDelete(`/api/v1/admin/settings/${encodeURIComponent(s.key)}`)
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div>
      <AdminFinanceList<SettingRow>
        title="تنظیمات سامانه"
        eyebrow="مدیریت سیستم"
        description="کلید/مقدارهای پلتفرم — مثل هزینه تحویل، آستانه‌ها و سوئیچ‌ها؛ هر تغییر audit می‌شود"
        endpoint="/api/v1/admin/settings"
        dataKey="settings"
        keyOf={(s) => s.key}
        searchPlaceholder="کلید…"
        refreshKey={refreshKey}
        readOnlyNotice={false}
        headerAction={
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setDialog(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            تنظیم جدید
          </button>
        }
        columns={[
          {
            key: 'key',
            header: 'کلید',
            render: (s) => (
              <span className="font-mono text-xs" dir="ltr">
                {s.key}
              </span>
            ),
          },
          {
            key: 'value',
            header: 'مقدار',
            render: (s) => (
              <code
                className="bg-muted block max-w-64 truncate rounded px-1.5 py-0.5 text-[11px]"
                dir="ltr"
              >
                {JSON.stringify(s.value)}
              </code>
            ),
          },
          {
            key: 'updated',
            header: 'آخرین تغییر',
            render: (s) => new Date(s.updatedAt).toLocaleString('fa-IR'),
            mobile: false,
          },
        ]}
        rowActions={(s) => (
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={`ویرایش ${s.key}`}
              onClick={() => {
                setEditing(s)
                setDialog(true)
              }}
              className="border-border/60 text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
            >
              <IconPencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`حذف ${s.key}`}
              onClick={() => void remove(s)}
              className="border-error/30 text-error hover:bg-error/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
            >
              <IconTrash className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
        emptyMessage="تنظیمی ثبت نشده است"
      />

      <AdminFormDialog
        open={dialog}
        onOpenChange={setDialog}
        title={editing ? `ویرایش «${editing.key}»` : 'تنظیم جدید'}
        fields={FIELDS}
        initial={editing ? { key: editing.key, value: JSON.stringify(editing.value) } : undefined}
        onSubmit={submit}
      />
    </div>
  )
}
