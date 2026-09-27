// ============================================
// Zar30 - Support Client — تیکت واقعی (Backend وصل)
// ============================================
// لیست/ساخت/پاسخ/بستن تیکت از API واقعی:
//   GET  /api/v1/tickets              → لیست تیکت‌ها
//   GET  /api/v1/tickets?id=          → جزئیات + پیام‌ها
//   POST /api/v1/tickets              → تیکت جدید
//   POST /api/v1/tickets/[id]/reply   → پاسخ کاربر
//   POST /api/v1/tickets/[id]/close   → بستن توسط کاربر
// Help Center دسته‌بندی‌محور حفظ شد — بخش تیکت preview حذف شد
// ============================================

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCoins,
  IconLifebuoy,
  IconMessage,
  IconPhone,
  IconPlus,
  IconShieldCheck,
  IconUser,
  IconWallet,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { PageHeader } from './page-header'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { useOnlineStatus } from './offline-indicator'
import { cn } from 'cn'

// دسته‌بندی‌های Help Center — به سوالات متداول لینک می‌شوند
const HELP_CATEGORIES = [
  {
    icon: IconUser,
    title: 'حساب و احراز هویت',
    description: 'ثبت‌نام، ورود و تایید هویت',
  },
  {
    icon: IconCoins,
    title: 'خرید و فروش طلا',
    description: 'معاملات، نرخ‌ها و تسویه',
  },
  {
    icon: IconWallet,
    title: 'کیف پول و تراکنش',
    description: 'واریز، برداشت و موجودی',
  },
  {
    icon: IconShieldCheck,
    title: 'امنیت حساب',
    description: 'رمز عبور، نشست‌ها و حریم خصوصی',
  },
] as const

const TICKET_CATEGORIES = [
  { value: 'ACCOUNT', label: 'حساب' },
  { value: 'KYC', label: 'احراز هویت' },
  { value: 'TRADE', label: 'معامله' },
  { value: 'INSTALLMENT', label: 'قسطی' },
  { value: 'INVESTMENT', label: 'سرمایه‌گذاری' },
  { value: 'PAYMENT', label: 'پرداخت' },
  { value: 'OTHER', label: 'سایر' },
] as const

const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'کم' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'HIGH', label: 'زیاد' },
  { value: 'URGENT', label: 'فوری' },
] as const

const STATUS_META: Record<
  string,
  { label: string; tone: 'success' | 'warning' | 'neutral' | 'error' }
> = {
  OPEN: { label: 'باز', tone: 'warning' },
  IN_PROGRESS: { label: 'در حال رسیدگی', tone: 'warning' },
  ANSWERED: { label: 'پاسخ داده شد', tone: 'success' },
  CLOSED: { label: 'بسته', tone: 'neutral' },
}

interface TicketListItem {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  slaDeadline: string | null
  createdAt: string
  updatedAt: string
  messagesCount: number
}

interface TicketDetail {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
  messages: {
    id: string
    senderType: string
    body: string
    createdAt: string
  }[]
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none'

export function SupportClient() {
  const online = useOnlineStatus()
  const [tickets, setTickets] = useState<TicketListItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // شیت تیکت جدید
  const [newOpen, setNewOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('ACCOUNT')
  const [priority, setPriority] = useState('MEDIUM')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // شیت گفتگو
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ tickets: TicketListItem[] }>('/api/v1/tickets')
    if (res.ok) setTickets(res.data?.tickets ?? [])
    setLoaded(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // fetch async — setState بعد از await انجام می‌شود (نه sync در بدنه effect)
      await load()
      void cancelled
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  function openNew() {
    setError(null)
    setSubject('')
    setBody('')
    setCategory('ACCOUNT')
    setPriority('MEDIUM')
    setNewOpen(true)
  }

  async function submitNew() {
    setError(null)
    if (subject.trim().length < 3) {
      setError('موضوع باید حداقل ۳ کاراکتر باشد')
      return
    }
    if (body.trim().length < 5) {
      setError('متن پیام باید حداقل ۵ کاراکتر باشد')
      return
    }
    setBusy(true)
    const res = await apiPost<{ id: string }>('/api/v1/tickets', {
      subject: subject.trim(),
      category,
      priority,
      body: body.trim(),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت تیکت ناموفق بود')
      return
    }
    setNewOpen(false)
    void load()
  }

  async function openChat(id: string) {
    setChatError(null)
    setReply('')
    const res = await apiGetWithRefresh<TicketDetail>(`/api/v1/tickets?id=${id}`)
    if (res.ok && res.data) {
      setDetail(res.data)
      setChatOpen(true)
    }
  }

  async function sendReply() {
    if (!detail || !reply.trim() || chatBusy) return
    setChatBusy(true)
    setChatError(null)
    const res = await apiPost(`/api/v1/tickets/${detail.id}/reply`, { body: reply.trim() })
    setChatBusy(false)
    if (!res.ok) {
      setChatError(res.error ?? 'ارسال پاسخ ناموفق بود')
      return
    }
    setReply('')
    // refresh گفتگو و لیست
    const fresh = await apiGetWithRefresh<TicketDetail>(`/api/v1/tickets?id=${detail.id}`)
    if (fresh.ok && fresh.data) setDetail(fresh.data)
    void load()
  }

  async function closeTicket() {
    if (!detail || chatBusy) return
    setChatBusy(true)
    setChatError(null)
    const res = await apiPost(`/api/v1/tickets/${detail.id}/close`)
    setChatBusy(false)
    if (!res.ok) {
      setChatError(res.error ?? 'بستن تیکت ناموفق بود')
      return
    }
    const fresh = await apiGetWithRefresh<TicketDetail>(`/api/v1/tickets?id=${detail.id}`)
    if (fresh.ok && fresh.data) setDetail(fresh.data)
    void load()
  }

  const closed = detail?.status === 'CLOSED'

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="پشتیبانی" description="مرکز راهنمایی و ارتباط با زرسی" />

      {/* دسته‌بندی‌های Help Center */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {HELP_CATEGORIES.map(({ icon: Icon, title, description }) => (
          <Link
            key={title}
            href="/faq"
            className="border-border/60 bg-card hover:border-gold-500/40 group flex flex-col gap-3 rounded-xl border p-4 transition-all duration-(--duration-normal) hover:-translate-y-0.5 hover:shadow-md"
          >
            <Icon
              className="text-gold-600 dark:text-gold-400 size-7 transition-transform duration-(--duration-normal) ease-(--ease-spring) group-hover:scale-110"
              strokeWidth={1.5}
            />
            <span>
              <span className="text-foreground block text-sm font-semibold">{title}</span>
              <span className="text-muted-foreground mt-1 block text-[11px] leading-4">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* تیکت‌های من — واقعی */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconMessage className="text-gold-600 size-5" stroke={1.75} />
            تیکت‌های من
          </CardTitle>
          <button
            type="button"
            onClick={openNew}
            disabled={!online}
            title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
            className="bg-navy-700 text-cream-50 hover:bg-navy-600 focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            <IconPlus className="size-3.5" aria-hidden="true" />
            تیکت جدید
          </button>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <div className="skeleton-shimmer h-16 rounded-lg" />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={IconMessage}
              title="تیکتی ندارید"
              description="برای سوالات و مشکلات خود تیکت ثبت کنید؛ کارشناسان زرسی در اولین فرصت پاسخ می‌دهند."
            />
          ) : (
            <ul className="divide-border/40 divide-y">
              {tickets.map((t) => {
                const meta = STATUS_META[t.status] ?? { label: t.status, tone: 'neutral' as const }
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => void openChat(t.id)}
                      className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-3 text-start transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-xs font-semibold">
                          {t.subject}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                          {new Date(t.updatedAt).toLocaleDateString('fa-IR', {
                            dateStyle: 'short',
                          })}
                          {' · '}
                          {toPersianDigitsSafe(t.messagesCount)} پیام
                        </p>
                      </div>
                      <StatusBadge tone={meta.tone} dot={false}>
                        {meta.label}
                      </StatusBadge>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* راه‌های ارتباطی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconPhone className="text-gold-600 size-5" stroke={1.75} />
            راه‌های ارتباطی
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-border/40 divide-y text-sm">
          <div className="text-muted-foreground flex items-center justify-between py-3">
            <span className="flex items-center gap-2">
              <IconLifebuoy className="size-4" />
              مرکز راهنمایی
            </span>
            <Link
              href="/faq"
              className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              سوالات متداول
              <IconArrowLeft className="size-3.5" />
            </Link>
          </div>
          <div className="text-muted-foreground flex items-center justify-between py-3">
            <span className="flex items-center gap-2">
              <IconMessage className="size-4" />
              تماس با ما
            </span>
            <Link
              href="/contact"
              className="text-gold-600 dark:text-gold-400 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              صفحه تماس
              <IconArrowLeft className="size-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* شیت تیکت جدید */}
      <BottomSheet open={newOpen} onClose={() => setNewOpen(false)} title="تیکت جدید">
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-[11px]">موضوع</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="خلاصه موضوع را بنویسید"
              maxLength={150}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">دسته‌بندی</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">اولویت</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={inputClass}
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-[11px]">توضیحات</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="مشکل یا سوال خود را کامل شرح دهید…"
              className="border-border/60 bg-background text-foreground focus-visible:ring-ring w-full rounded-lg border p-3 text-xs leading-6 focus-visible:ring-2 focus-visible:outline-none"
            />
          </label>

          {error && (
            <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
              <IconAlertTriangle className="size-3.5" aria-hidden="true" />
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submitNew}
            disabled={busy || !online}
            className="bg-navy-700 text-cream-50 hover:bg-navy-600 focus-visible:ring-ring inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
          >
            {busy ? 'در حال ثبت…' : 'ثبت تیکت'}
          </button>
        </div>
      </BottomSheet>

      {/* شیت گفتگو */}
      <BottomSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={detail?.subject ?? 'گفتگو'}
      >
        {detail && (
          <div className="space-y-3">
            <ul className="divide-border/40 divide-y">
              {detail.messages.map((m) => {
                const isAdmin = m.senderType === 'admin'
                return (
                  <li
                    key={m.id}
                    className={cn(
                      'rounded-xl border p-3',
                      isAdmin ? 'border-gold-500/30 bg-gold-500/5' : 'border-border/60 bg-card',
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-[10px] font-bold',
                          isAdmin ? 'text-gold-600 dark:text-gold-400' : 'text-foreground/70',
                        )}
                      >
                        {isAdmin ? 'پشتیبانی زرسی' : 'شما'}
                      </span>
                      <span className="text-muted-foreground text-[10px] tabular-nums">
                        {new Date(m.createdAt).toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <p className="text-foreground/90 text-xs leading-6 whitespace-pre-wrap">
                      {m.body}
                    </p>
                  </li>
                )
              })}
            </ul>

            {chatError && (
              <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                {chatError}
              </p>
            )}

            {!closed ? (
              <>
                <label className="block space-y-1.5">
                  <span className="text-muted-foreground text-[11px]">پاسخ شما</span>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    maxLength={5000}
                    placeholder="پیام خود را بنویسید…"
                    className="border-border/60 bg-background text-foreground focus-visible:ring-ring w-full rounded-lg border p-3 text-xs leading-6 focus-visible:ring-2 focus-visible:outline-none"
                  />
                </label>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={closeTicket}
                    disabled={chatBusy}
                    className="text-muted-foreground hover:text-error h-9 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    بستن تیکت
                  </button>
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={chatBusy || !reply.trim()}
                    className="bg-navy-700 text-cream-50 hover:bg-navy-600 focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    <IconMessage className="size-3.5" aria-hidden="true" />
                    {chatBusy ? 'در حال ارسال…' : 'ارسال'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-center text-xs">
                این تیکت بسته شده است.
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function toPersianDigitsSafe(n: number): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
}
