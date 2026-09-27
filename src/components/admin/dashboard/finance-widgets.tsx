// ============================================
// Zar30 - Finance Widgets — ledger/P&L/cashflow/recon/fee
// ============================================

'use client'

import Link from 'next/link'
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCoins,
  IconScale,
  IconWallet,
} from '@tabler/icons-react'
import { AdminWidget } from './widget'
import type { DashboardFinance } from '@/lib/services/admin-dashboard.service'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { formatExactAmount, toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

// CSV helper — BOM فارسی برای Excel
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================
// مانده حساب‌های کلیدی دفتر کل
// ============================================

export function LedgerBalancesWidget({
  finance,
  loading,
  error,
  onRefresh,
}: {
  finance: DashboardFinance | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  const rows = finance?.ledgerBalances ?? []

  return (
    <AdminWidget
      id="finance-ledger"
      title="مانده حساب‌های کلیدی"
      subtitle="از دفتر کل — Σ(DEBIT−CREDIT)"
      icon={IconScale}
      permission={PERMISSIONS.LEDGER_READ}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      skeletonHeight="h-40"
      viewAllHref="/admin/financial"
      onExportCsv={
        finance
          ? () =>
              downloadCsv(
                'ledger-balances.csv',
                ['کد', 'نام', 'نوع', 'مانده (تومان)'],
                rows.map((r) => [r.code, r.nameFa, r.type, r.balance]),
              )
          : undefined
      }
    >
      <ul className="divide-border/40 divide-y">
        {rows.slice(0, 6).map((r) => (
          <li
            key={r.code}
            className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-foreground text-xs font-semibold">{r.nameFa}</p>
              <p className="text-muted-foreground text-[9px] tabular-nums">{r.code}</p>
            </div>
            <Link
              href={`/admin/financial#acct-${r.code}`}
              className="text-foreground hover:text-gold-700 dark:hover:text-gold-300 focus-visible:ring-ring shrink-0 rounded-md text-xs font-bold tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {formatExactAmount(r.balance)}
            </Link>
          </li>
        ))}
      </ul>
    </AdminWidget>
  )
}

// ============================================
// P&L خلاصه — ۳۰ روز
// ============================================

export function PnlWidget({
  finance,
  loading,
  error,
  onRefresh,
}: {
  finance: DashboardFinance | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  const pnl = finance?.pnl
  const net = pnl ? BigInt(pnl.net) : 0n

  return (
    <AdminWidget
      id="finance-pnl"
      title="سود و زیان — ۳۰ روز"
      icon={IconCoins}
      permission={PERMISSIONS.LEDGER_READ}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      skeletonHeight="h-28"
      viewAllHref="/admin/financial"
    >
      {pnl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <IconArrowDownLeft className="text-success size-3.5" strokeWidth={2} />
              درآمد
            </span>
            <span className="text-success text-left text-sm font-bold break-all tabular-nums">
              {formatExactAmount(pnl.revenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <IconArrowUpRight className="text-error size-3.5" strokeWidth={2} />
              هزینه
            </span>
            <span className="text-error text-left text-sm font-bold break-all tabular-nums">
              {formatExactAmount(pnl.expense)}
            </span>
          </div>
          <div className="border-border/40 flex items-center justify-between border-t pt-3">
            <span className="text-foreground text-xs font-bold">خالص</span>
            <span
              className={cn(
                'text-left text-base font-bold break-all tabular-nums',
                net >= 0n ? 'text-gold-700 dark:text-gold-300' : 'text-error',
              )}
            >
              {formatExactAmount(pnl.net)} تومان
            </span>
          </div>
        </div>
      )}
    </AdminWidget>
  )
}

// ============================================
// گردش نقد — واریز/برداشت
// ============================================

export function CashflowWidget({
  finance,
  loading,
  error,
  onRefresh,
}: {
  finance: DashboardFinance | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  const cf = finance?.cashflow
  const dep = cf ? Number(cf.deposits) : 0
  const wd = cf ? Number(cf.withdrawals) : 0
  const total = dep + wd || 1

  return (
    <AdminWidget
      id="finance-cashflow"
      title="گردش نقد — ۳۰ روز"
      icon={IconWallet}
      permission={PERMISSIONS.LEDGER_READ}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      skeletonHeight="h-28"
      viewAllHref="/admin/transactions"
    >
      {cf && (
        <div className="space-y-3">
          <div className="bg-muted h-3 overflow-hidden rounded-full">
            <div
              className="bg-success h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(dep / total) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground text-[10px]">واریز</p>
              <p className="text-success text-sm font-bold break-all tabular-nums">
                {formatExactAmount(cf.deposits)}
              </p>
            </div>
            <div className="text-left">
              <p className="text-muted-foreground text-[10px]">برداشت</p>
              <p className="text-error text-sm font-bold break-all tabular-nums">
                {formatExactAmount(cf.withdrawals)}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-center text-[10px] tabular-nums">
            خالص: {formatExactAmount(cf.net)} تومان
          </p>
        </div>
      )}
    </AdminWidget>
  )
}

// ============================================
// وضعیت تطبیق دفتر
// ============================================

export function ReconWidget({
  finance,
  loading,
  error,
  onRefresh,
}: {
  finance: DashboardFinance | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
}) {
  const recon = finance?.recon
  const ok = recon ? recon.mismatches === 0 : null

  return (
    <AdminWidget
      id="finance-recon"
      title="تطبیق دفتر"
      icon={IconScale}
      permission={PERMISSIONS.LEDGER_READ}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      skeletonHeight="h-24"
      viewAllHref="/admin/reconciliation"
    >
      {recon && (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
              ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
            )}
          >
            {ok ? '✓ تطبیق کامل' : `⚠ ${toPersianDigits(recon.mismatches)} مغایرت`}
          </span>
          <p className="text-muted-foreground text-[10px] tabular-nums">
            {toPersianDigits(recon.checkedAccounts)} حساب بررسی شد
          </p>
          <Link
            href="/admin/reconciliation"
            className="text-gold-700 hover:text-gold-800 dark:text-gold-300 focus-visible:ring-ring rounded-md text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            جزئیات تطبیق ←
          </Link>
        </div>
      )}
    </AdminWidget>
  )
}
