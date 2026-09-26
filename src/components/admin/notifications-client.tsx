// ============================================
// Zar30 - Admin Notifications Client
// ============================================
// لیست اعلان‌ها + ارسال broadcast + مدیریت قالب‌ها
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconPencil, IconPlus, IconSend, IconTrash } from '@tabler/icons-react'
import { apiDelete, apiGetWithRefresh, apiPost, apiPut } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'

interface NotificationRow {
  id: string
  type: string
  title: string
  status: string
  channel: string
  createdAt: string
  sentAt: string | null
  readAt: string | null
  user: { mobile: string } | null
}

interface TemplateRow {
  id: string
  key: string
  channels: string[]
  titleTemplate: string
  bodyTemplate: string
  variables: string[]
  updatedAt: string
}

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'همه کاربران فعال' },
  { value: 'KYC_APPROVED', label: 'کاربران احرازشده (KYC)' },
  { value: 'ACTIVE_30D', label: 'کاربران فعال ۳۰ روز اخیر' },
]

const BROADCAST_FIELDS: AdminFormField[] = [
  { key: 'title', label: 'عنوان اعلان', required: true },
  { key: 'body', label: 'متن اعلان', type: 'textarea', required: true },
  { key: 'audience', label: 'مخاطبان', type: 'select', options: AUDIENCE_OPTIONS },
]

const TEMPLATE_FIELDS: AdminFormField[] = [
  { key: 'key', label: 'کلید قالب', required: true, ltr: true, placeholder: 'order_filled' },
  {
    key: 'channels',
    label: 'کانال‌ها',
    hint: 'با کاما جدا کنید — مثل IN_APP,PUSH',
    ltr: true,
    required: true,
  },
  { key: 'titleTemplate', label: 'قالب عنوان', required: true },
  {
    key: 'bodyTemplate',
    label: 'قالب متن',
    type: 'textarea',
    required: true,
    hint: 'متغیرها با {{name}} جایگذاری می‌شوند',
    ltr: true,
  },
  { key: 'variables', label: 'متغیرها', ltr: true, hint: 'با کاما جدا کنید — مثل amount,price' },
]

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: 'درون‌برنامه',
  PUSH: 'Push',
  SMS: 'پیامک',
  EMAIL: 'ایمیل',
}

export function AdminNotificationsClient() {
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null)
  const [templateDialog, setTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    const res = await apiGetWithRefresh<{ templates: TemplateRow[] }>(
      '/api/v1/admin/notification-templates',
    )
    if (res.ok && res.data?.templates) setTemplates(res.data.templates)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ templates: TemplateRow[] }>(
        '/api/v1/admin/notification-templates',
      )
      if (!cancelled && res.ok && res.data?.templates) setTemplates(res.data.templates)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submitBroadcast = useCallback(async (values: AdminFormValues): Promise<string | null> => {
    const res = await apiPost<{ sent: number }>('/api/v1/admin/notifications/broadcast', {
      title: String(values.title ?? ''),
      body: String(values.body ?? ''),
      audience: String(values.audience ?? 'ALL'),
    })
    if (!res.ok) return res.error ?? 'ارسال ناموفق بود'
    setNotice(`اعلان برای ${toPersianDigits(res.data?.sent ?? 0)} کاربر ارسال شد`)
    setRefreshKey((k) => k + 1)
    return null
  }, [])

  const submitTemplate = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const body = {
        key: String(values.key ?? ''),
        channels: String(values.channels ?? 'IN_APP')
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean),
        titleTemplate: String(values.titleTemplate ?? ''),
        bodyTemplate: String(values.bodyTemplate ?? ''),
        variables: String(values.variables ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      }
      const res = editingTemplate
        ? await apiPut(`/api/v1/admin/notification-templates/${editingTemplate.id}`, body)
        : await apiPost('/api/v1/admin/notification-templates', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      await loadTemplates()
      return null
    },
    [editingTemplate, loadTemplates],
  )

  const removeTemplate = useCallback(
    async (t: TemplateRow) => {
      if (!confirm(`قالب «${t.key}» حذف شود؟`)) return
      const res = await apiDelete(`/api/v1/admin/notification-templates/${t.id}`)
      if (res.ok) await loadTemplates()
    },
    [loadTemplates],
  )

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="اعلان‌ها"
        eyebrow="خدمات"
        description="اعلان‌های درون‌برنامه‌ای کاربران — ارسال گروهی و مدیریت قالب‌ها"
        actions={
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-colors"
          >
            <IconSend className="size-4" aria-hidden="true" />
            ارسال اعلان گروهی
          </button>
        }
      />

      {notice && (
        <p className="border-success/30 bg-success/5 text-success rounded-xl border p-3 text-xs">
          {notice}
        </p>
      )}

      <AdminFinanceList<NotificationRow>
        title="اعلان‌های اخیر"
        titleAs="h2"
        endpoint="/api/v1/admin/notifications"
        dataKey="notifications"
        keyOf={(n) => n.id}
        searchPlaceholder="عنوان، نوع یا موبایل…"
        refreshKey={refreshKey}
        filters={[
          {
            key: 'status',
            label: 'وضعیت',
            options: [
              { value: 'QUEUED', label: 'در صف' },
              { value: 'SENT', label: 'ارسال‌شده' },
              { value: 'DELIVERED', label: 'تحویل‌شده' },
              { value: 'READ', label: 'خوانده‌شده' },
              { value: 'FAILED', label: 'ناموفق' },
            ],
          },
        ]}
        columns={[
          { key: 'title', header: 'عنوان', render: (n) => n.title },
          { key: 'user', header: 'کاربر', render: (n) => n.user?.mobile ?? '—' },
          {
            key: 'channel',
            header: 'کانال',
            render: (n) => CHANNEL_LABELS[n.channel] ?? n.channel,
            mobile: false,
          },
          { key: 'status', header: 'وضعیت', render: (n) => <AdminStatus status={n.status} /> },
          {
            key: 'created',
            header: 'زمان',
            render: (n) => new Date(n.createdAt).toLocaleString('fa-IR'),
          },
        ]}
        emptyMessage="اعلانی ثبت نشده است"
      />

      {/* ===== قالب‌ها ===== */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">قالب‌های اعلان</h2>
          <button
            type="button"
            onClick={() => {
              setEditingTemplate(null)
              setTemplateDialog(true)
            }}
            className="border-border/60 text-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            قالب جدید
          </button>
        </div>

        {!templates ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <p className="border-border/60 text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
            قالبی تعریف نشده است
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-card border-border/60 rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold" dir="ltr">
                      {t.key}
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-[10px]">
                      {t.titleTemplate}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {t.channels.map((c) => CHANNEL_LABELS[c] ?? c).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`ویرایش ${t.key}`}
                      onClick={() => {
                        setEditingTemplate(t)
                        setTemplateDialog(true)
                      }}
                      className="border-border/60 text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md border transition-colors"
                    >
                      <IconPencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`حذف ${t.key}`}
                      onClick={() => void removeTemplate(t)}
                      className="border-error/30 text-error hover:bg-error/5 inline-flex size-7 items-center justify-center rounded-md border transition-colors"
                    >
                      <IconTrash className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AdminFormDialog
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        title="ارسال اعلان گروهی"
        description="اعلان درون‌برنامه‌ای برای همه کاربران منتخب ثبت می‌شود — بعد از ارسال قابل بازگشت نیست"
        fields={BROADCAST_FIELDS}
        initial={{ audience: 'ALL' }}
        submitLabel="ارسال"
        onSubmit={submitBroadcast}
      />

      <AdminFormDialog
        open={templateDialog}
        onOpenChange={setTemplateDialog}
        title={editingTemplate ? `ویرایش «${editingTemplate.key}»` : 'قالب جدید'}
        fields={TEMPLATE_FIELDS}
        initial={
          editingTemplate
            ? {
                key: editingTemplate.key,
                channels: editingTemplate.channels.join(','),
                titleTemplate: editingTemplate.titleTemplate,
                bodyTemplate: editingTemplate.bodyTemplate,
                variables: editingTemplate.variables.join(','),
              }
            : { channels: 'IN_APP' }
        }
        onSubmit={submitTemplate}
      />
    </div>
  )
}
