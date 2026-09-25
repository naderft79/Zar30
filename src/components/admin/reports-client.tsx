// ============================================
// Zar30 - Admin Reports Client
// ============================================
// کارت‌های خروجی CSV با بازه زمانی — دانلود مستقیم از API
// ============================================

'use client'

import { useState } from 'react'
import {
  IconDownload,
  IconLoader2,
  IconClipboardList,
  IconArrowsLeftRight,
  IconUpload,
  IconUsers,
  IconCashBanknote,
  IconShare2,
} from '@tabler/icons-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

const REPORTS = [
  { kind: 'orders', label: 'سفارش‌ها', icon: IconClipboardList, desc: 'سفارش‌های خرید و فروش طلا' },
  {
    kind: 'transactions',
    label: 'تراکنش‌ها',
    icon: IconArrowsLeftRight,
    desc: 'همه تراکنش‌های مالی',
  },
  { kind: 'withdrawals', label: 'برداشت‌ها', icon: IconUpload, desc: 'درخواست‌های برداشت تومانی' },
  { kind: 'users', label: 'کاربران', icon: IconUsers, desc: 'فهرست کاربران و سطح KYC' },
  { kind: 'transfers', label: 'انتقال‌ها', icon: IconShare2, desc: 'انتقال‌های داخلی بین کاربران' },
  { kind: 'payments', label: 'پرداخت‌ها', icon: IconCashBanknote, desc: 'تراکنش‌های درگاه پرداخت' },
] as const

const inputClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none tabular-nums'

export function AdminReportsClient() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pendingKind, setPendingKind] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function download(kind: string) {
    if (pendingKind) return
    setPendingKind(kind)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ kind, from: from || undefined, to: to || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'تولید خروجی ناموفق بود')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zar30-${kind}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setPendingKind(null)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="گزارش‌ها"
        description="خروجی CSV از داده‌های عملیاتی — حداکثر ۵٬۰۰۰ رکورد در هر خروجی؛ همه خروجی‌ها در تاریخچه و audit ثبت می‌شوند"
      />

      <div className="bg-card border-border/60 mb-5 flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <div>
          <label htmlFor="rep-from" className="text-muted-foreground mb-1 block text-[11px]">
            از تاریخ
          </label>
          <input
            id="rep-from"
            type="date"
            dir="ltr"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="rep-to" className="text-muted-foreground mb-1 block text-[11px]">
            تا تاریخ
          </label>
          <input
            id="rep-to"
            type="date"
            dir="ltr"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </div>
        <p className="text-muted-foreground text-[10px]">خالی = همه دوره‌ها</p>
      </div>

      {error && (
        <p
          role="alert"
          className="border-error/30 bg-error/5 text-error mb-4 rounded-xl border p-3 text-xs"
        >
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <button
            key={r.kind}
            type="button"
            onClick={() => void download(r.kind)}
            disabled={pendingKind !== null}
            className="bg-card border-border/60 hover:border-primary/40 hover:bg-primary/5 group flex items-start gap-3 rounded-xl border p-4 text-right transition-colors disabled:opacity-60"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <r.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{r.label}</span>
              <span className="text-muted-foreground mt-0.5 block text-[11px]">{r.desc}</span>
            </span>
            {pendingKind === r.kind ? (
              <IconLoader2
                className="text-primary size-4 shrink-0 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <IconDownload
                className="text-muted-foreground group-hover:text-primary size-4 shrink-0"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
