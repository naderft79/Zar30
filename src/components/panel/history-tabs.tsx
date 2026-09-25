// ============================================
// Zar30 - History Tabs (سوابق تب‌دار)
// ============================================
// تب‌های سوابق مالی: تراکنش‌ها | برداشت‌ها | واریزها | انتقال‌ها | تحویل‌ها
// هر ردیف → رسید کپی‌پذیر در BottomSheet — «مشاهده همه» → /dashboard/transactions
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconHistory, IconChevronLeft } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { ReceiptSheet, type ReceiptField } from './receipt-sheet'
import { cn } from 'cn'

type TabKey = 'transactions' | 'withdrawals' | 'deposits' | 'transfers' | 'deliveries'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'transactions', label: 'تراکنش‌ها' },
  { key: 'withdrawals', label: 'برداشت‌ها' },
  { key: 'deposits', label: 'واریزها' },
  { key: 'transfers', label: 'انتقال‌ها' },
  { key: 'deliveries', label: 'تحویل‌ها' },
]

const ENDPOINTS: Record<TabKey, { url: string; field: string }> = {
  transactions: { url: '/api/v1/wallet/transactions?limit=10', field: 'transactions' },
  withdrawals: { url: '/api/v1/wallet/withdraw?limit=10', field: 'withdrawals' },
  deposits: { url: '/api/v1/wallet/deposit?limit=10', field: 'deposits' },
  transfers: { url: '/api/v1/transfers?limit=10', field: 'transfers' },
  deliveries: { url: '/api/v1/delivery?limit=10', field: 'deliveries' },
}

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'واریز',
  WITHDRAW: 'برداشت',
  FEE: 'کارمزد',
  TRANSFER: 'انتقال',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  COMPLETED: 'موفق',
  FAILED: 'ناموفق',
  REVERSED: 'برگشت‌خورده',
  APPROVED: 'تایید شده',
  REJECTED: 'رد شده',
  PAID: 'پرداخت شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
}

const METHOD_LABELS: Record<string, string> = { POST: 'ارسال پستی', PICKUP: 'تحویل حضوری' }

interface Row {
  id: string
  title: string
  subtitle: string
  amount: string
  status: string
  fields: ReceiptField[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}

export function HistoryTabs() {
  const [tab, setTab] = useState<TabKey>('transactions')
  const [rows, setRows] = useState<Row[]>([])
  // تب بارگذاری‌شده — تا وقتی با tab فعلی برابر نیست، اسکلت نمایش داده می‌شود
  const [loadedTab, setLoadedTab] = useState<TabKey | null>(null)
  const [receipt, setReceipt] = useState<Row | null>(null)
  const loading = loadedTab !== tab

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { url, field } = ENDPOINTS[tab]
      const res = await apiGetWithRefresh<Record<string, unknown[]>>(url)
      if (cancelled) return
      const items = (res.ok ? res.data?.[field] : []) ?? []
      setRows(items.map((item) => mapRow(tab, item as Record<string, unknown>)))
      setLoadedTab(tab)
    })()
    return () => {
      cancelled = true
    }
  }, [tab])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconHistory className="text-gold-600 size-5" stroke={1.75} />
          سوابق مالی
        </CardTitle>
        <Link
          href="/dashboard/transactions"
          className="text-gold-600 hover:text-gold-700 flex items-center gap-0.5 text-[11px] font-semibold transition-colors"
        >
          مشاهده همه
          <IconChevronLeft className="size-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>

      {/* تب‌ها — اسکرول افقی در موبایل */}
      <div className="border-border/50 flex gap-1 overflow-x-auto border-b px-4 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors',
              tab === t.key
                ? 'bg-gold-500/12 text-gold-700'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <CardContent>
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-shimmer h-10 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={IconHistory}
            title="سابقه‌ای ثبت نشده است"
            description="رویدادهای مالی شما اینجا با جزئیات کامل نمایش داده می‌شود."
          />
        ) : (
          <ul className="divide-border/40 divide-y">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setReceipt(r)}
                  className="hover:bg-muted/40 -mx-2 flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-right transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-xs font-semibold">{r.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                      {r.subtitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-foreground text-xs font-semibold tabular-nums" dir="ltr">
                      {r.amount}
                    </p>
                    <StatusBadge tone="gold" dot={false} className="mt-1">
                      {STATUS_LABELS[r.status] ?? r.status}
                    </StatusBadge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* رسید کپی‌پذیر */}
      <ReceiptSheet
        open={receipt != null}
        onClose={() => setReceipt(null)}
        title={receipt?.title ?? 'رسید'}
        statusLabel={receipt ? (STATUS_LABELS[receipt.status] ?? receipt.status) : undefined}
        fields={receipt?.fields ?? []}
      />
    </Card>
  )
}

// ---------- نگاشت ردیف‌های هر تب به مدل مشترک ----------
function mapRow(tab: TabKey, item: Record<string, unknown>): Row {
  const id = String(item.id)
  const status = String(item.status)
  const created = fmtDate(String(item.createdAt))

  if (tab === 'transactions') {
    const amount = String(item.amount)
    return {
      id,
      title: TX_LABELS[String(item.type)] ?? String(item.type),
      subtitle: created,
      amount: `${formatExactAmount(amount)} تومان`,
      status,
      fields: [
        { label: 'شناسه', value: id, mono: true },
        { label: 'نوع', value: TX_LABELS[String(item.type)] ?? String(item.type) },
        { label: 'مبلغ', value: `${formatExactAmount(amount)} تومان`, copyValue: amount },
        { label: 'تاریخ', value: created, copyValue: String(item.createdAt) },
        ...(item.bankRef ? [{ label: 'کد پیگیری', value: String(item.bankRef), mono: true }] : []),
      ],
    }
  }

  if (tab === 'withdrawals') {
    const amount = String(item.amount)
    return {
      id,
      title: 'برداشت تومانی',
      subtitle: created,
      amount: `${formatExactAmount(amount)} تومان`,
      status,
      fields: [
        { label: 'شناسه', value: id, mono: true },
        { label: 'مبلغ', value: `${formatExactAmount(amount)} تومان`, copyValue: amount },
        { label: 'شبا', value: String(item.iban ?? ''), mono: true },
        { label: 'تاریخ', value: created, copyValue: String(item.createdAt) },
        ...(item.reviewNote ? [{ label: 'یادداشت', value: String(item.reviewNote) }] : []),
      ],
    }
  }

  if (tab === 'deposits') {
    const amount = String(item.amount)
    return {
      id,
      title: 'واریز تومانی',
      subtitle: created,
      amount: `${formatExactAmount(amount)} تومان`,
      status,
      fields: [
        { label: 'شناسه', value: id, mono: true },
        { label: 'مبلغ', value: `${formatExactAmount(amount)} تومان`, copyValue: amount },
        { label: 'تاریخ', value: created, copyValue: String(item.createdAt) },
        ...(item.bankRef ? [{ label: 'کد پیگیری', value: String(item.bankRef), mono: true }] : []),
        ...(item.gatewayRef
          ? [{ label: 'مرجع درگاه', value: String(item.gatewayRef), mono: true }]
          : []),
      ],
    }
  }

  if (tab === 'transfers') {
    const isToman = item.assetType === 'TOMAN'
    const amount = isToman
      ? `${formatExactAmount(String(item.tomanAmount))} تومان`
      : `${formatExactAmount(String(item.goldAmount))} گرم`
    const isGift = item.kind === 'GIFT'
    const sender = item.sender as
      | { firstName?: string; lastName?: string; mobile?: string }
      | undefined
    const recipient = item.recipient as
      | { firstName?: string; lastName?: string; mobile?: string }
      | undefined
    return {
      id,
      title: isGift ? 'هدیه' : 'انتقال داخلی',
      subtitle: created,
      amount,
      status,
      fields: [
        { label: 'شناسه', value: id, mono: true },
        { label: 'نوع', value: isGift ? 'هدیه' : 'انتقال' },
        { label: 'مبلغ', value: amount },
        {
          label: 'فرستنده',
          value:
            `${sender?.firstName ?? ''} ${sender?.lastName ?? ''}`.trim() || sender?.mobile || '—',
        },
        {
          label: 'گیرنده',
          value:
            `${recipient?.firstName ?? ''} ${recipient?.lastName ?? ''}`.trim() ||
            recipient?.mobile ||
            '—',
        },
        { label: 'تاریخ', value: created, copyValue: String(item.createdAt) },
        ...(item.giftMessage ? [{ label: 'پیام هدیه', value: String(item.giftMessage) }] : []),
      ],
    }
  }

  // deliveries
  const grams = String(item.grams)
  const address = item.address as { city?: string; province?: string } | null | undefined
  return {
    id,
    title: `تحویل ${METHOD_LABELS[String(item.method)] ?? String(item.method)}`,
    subtitle: created,
    amount: `${formatExactAmount(grams)} گرم`,
    status,
    fields: [
      { label: 'شناسه', value: id, mono: true },
      { label: 'مقدار', value: `${formatExactAmount(grams)} گرم`, copyValue: grams },
      { label: 'روش', value: METHOD_LABELS[String(item.method)] ?? String(item.method) },
      ...(address?.city || address?.province
        ? [{ label: 'مقصد', value: `${address.province ?? ''} ${address.city ?? ''}`.trim() }]
        : []),
      ...(item.trackingCode
        ? [{ label: 'کد رهگیری', value: String(item.trackingCode), mono: true }]
        : []),
      ...(item.reviewNote ? [{ label: 'یادداشت', value: String(item.reviewNote) }] : []),
      { label: 'تاریخ', value: created, copyValue: String(item.createdAt) },
    ],
  }
}
