// ============================================
// Zar30 - Admin Ticket Detail (Client)
// ============================================
// جزئیات تیکت + رشته پیام‌ها + اکشن پاسخ (reply) و بستن (close)
// reply: POST /api/v1/admin/support/[id]/reply — tickets.reply
// close: POST /api/v1/admin/support/[id]/close — tickets.reply
// پس از reply: تیکت → ANSWERED و کاربر اعلان می‌گیرد (سمت سرویس)
// ============================================

'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { IconAlertTriangle, IconArrowRight, IconSend } from '@tabler/icons-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { Field, useAdminDetail } from '@/components/admin/detail-ui'
import { apiPost } from '@/lib/api/client'
import { cn } from 'cn'

interface TicketMessageDto {
  id: string
  senderType: string
  body: string
  createdAt: string
}

interface TicketDetailDto {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
  messages: TicketMessageDto[]
}

const CATEGORY_LABEL: Record<string, string> = {
  ACCOUNT: 'حساب',
  KYC: 'احراز هویت',
  TRADE: 'معامله',
  INSTALLMENT: 'قسطی',
  INVESTMENT: 'سرمایه‌گذاری',
  PAYMENT: 'پرداخت',
  OTHER: 'سایر',
}

export function AdminTicketDetailClient() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ''
  const endpoint = `/api/v1/admin/support/${id}`

  const { data, error, loading, notFoundMessage, reload } = useAdminDetail<TicketDetailDto>(
    endpoint,
    'data',
    'تیکت یافت نشد',
  )

  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function sendReply() {
    if (!reply.trim() || busy) return
    setBusy(true)
    setActionError(null)
    const res = await apiPost(`/api/v1/admin/support/${id}/reply`, { body: reply.trim() })
    setBusy(false)
    if (!res.ok) {
      setActionError(res.error ?? 'ارسال پاسخ ناموفق بود')
      return
    }
    setReply('')
    reload()
  }

  async function closeTicket() {
    if (busy) return
    setBusy(true)
    setActionError(null)
    const res = await apiPost(`/api/v1/admin/support/${id}/close`)
    setBusy(false)
    if (!res.ok) {
      setActionError(res.error ?? 'بستن تیکت ناموفق بود')
      return
    }
    reload()
  }

  const closed = data?.status === 'CLOSED'

  return (
    <div className="animate-stagger space-y-5">
      <Link
        href="/admin/support"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      >
        <IconArrowRight className="size-4" stroke={1.75} />
        بازگشت به مرکز پشتیبانی
      </Link>

      <AdminPageHeader
        title={data?.subject ?? 'جزئیات تیکت'}
        eyebrow="خدمات مشتری"
        description={
          data
            ? `دسته ${CATEGORY_LABEL[data.category] ?? data.category} · ${
                data.messages.length
              } پیام`
            : undefined
        }
      />

      {loading ? (
        <div className="skeleton-shimmer h-40 rounded-xl" />
      ) : error ? (
        <p role="alert" className="text-error text-xs">
          {error}
        </p>
      ) : !data ? (
        <p className="text-muted-foreground text-xs">{notFoundMessage}</p>
      ) : (
        <>
          {/* خلاصه تیکت */}
          <div className="bg-card border-border/60 grid gap-x-6 gap-y-1 rounded-xl border p-4 sm:grid-cols-2">
            <Field label="وضعیت" value={<AdminStatus status={data.status} />} />
            <Field label="اولویت" value={<AdminStatus status={data.priority} />} />
            <Field label="ایجاد" value={new Date(data.createdAt).toLocaleString('fa-IR')} />
            <Field label="دسته‌بندی" value={CATEGORY_LABEL[data.category] ?? data.category} />
          </div>

          {/* رشته پیام‌ها */}
          <div className="space-y-3">
            {data.messages.map((m) => {
              const isAdmin = m.senderType === 'admin'
              return (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-xl border p-3.5',
                    isAdmin
                      ? 'border-gold-500/30 bg-gold-500/5 ms-8'
                      : 'border-border/60 bg-card me-8',
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        isAdmin ? 'text-gold-600 dark:text-gold-400' : 'text-foreground/70',
                      )}
                    >
                      {isAdmin ? 'پشتیبانی زرسی' : 'کاربر'}
                    </span>
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {new Date(m.createdAt).toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <p className="text-foreground/90 text-xs leading-6 whitespace-pre-wrap">
                    {m.body}
                  </p>
                </div>
              )
            })}
          </div>

          {/* پاسخ / بستن */}
          {!closed ? (
            <div className="bg-card border-border/60 space-y-3 rounded-xl border p-4">
              <label className="text-muted-foreground block text-[11px] font-medium">
                پاسخ پشتیبانی
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder="پاسخ خود به کاربر بنویسید…"
                  className="border-border/60 bg-background text-foreground focus-visible:ring-ring mt-1.5 w-full rounded-lg border p-3 text-xs leading-6 focus-visible:ring-2 focus-visible:outline-none"
                />
              </label>
              {actionError && (
                <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                  <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                  {actionError}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeTicket}
                  disabled={busy}
                  className="text-muted-foreground hover:text-error h-9 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  بستن تیکت
                </button>
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={busy || !reply.trim()}
                  className="bg-gold-500 hover:bg-gold-600 text-navy-950 focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-5 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                >
                  <IconSend className="size-3.5" aria-hidden="true" />
                  {busy ? 'در حال ارسال…' : 'ارسال پاسخ'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground bg-muted/50 rounded-xl p-3.5 text-center text-xs">
              این تیکت بسته شده است.
            </p>
          )}
        </>
      )}
    </div>
  )
}
