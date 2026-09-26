// ============================================
// Zar30 - Admin Reconciliation Client
// ============================================
// تطبیق موجودی AssetAccount با دفتر کل — mismatchها با خط هایلایت می‌شوند
// ============================================

'use client'

import Link from 'next/link'
import { IconCheck, IconX } from '@tabler/icons-react'
import { formatGoldGrams, formatToman } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'
import { cn } from 'cn'

interface ReconRow {
  assetAccountId: string
  walletId: string
  userId: string
  assetType: string
  balance: string
  expectedBalance: string
  lockedBalance: string
  expectedLocked: string
  ok: boolean
}

function fmt(asset: string, v: string): string {
  return asset === 'GOLD' ? formatGoldGrams(v) : `${formatToman(v)} تومان`
}

export function AdminReconciliationClient() {
  return (
    <AdminFinanceList<ReconRow>
      title="تطبیق دفتر کل"
      description="مقایسه موجودی ذخیره‌شده حساب‌های دارایی با مجموع اسناد دفتر کل — اصلاح خودکار هرگز انجام نمی‌شود؛ مغایرت‌ها باید دستی بررسی شوند"
      endpoint="/api/v1/admin/reconciliation"
      dataKey="rows"
      keyOf={(r) => r.assetAccountId}
      searchPlaceholder="جستجو…"
      columns={[
        {
          key: 'ok',
          header: 'وضعیت',
          render: (r) =>
            r.ok ? (
              <span className="text-success inline-flex items-center gap-1 text-xs font-bold">
                <IconCheck className="size-4" aria-hidden="true" /> تطبیق
              </span>
            ) : (
              <span className="text-error inline-flex items-center gap-1 text-xs font-bold">
                <IconX className="size-4" aria-hidden="true" /> مغایرت
              </span>
            ),
        },
        {
          key: 'user',
          header: 'کاربر',
          render: (r) => (
            <Link href={`/admin/users/${r.userId}`} className="font-mono text-xs hover:underline">
              {r.userId.slice(0, 8)}…
            </Link>
          ),
        },
        {
          key: 'asset',
          header: 'دارایی',
          render: (r) => (r.assetType === 'GOLD' ? 'طلا' : 'تومان'),
        },
        {
          key: 'balance',
          header: 'موجودی فعلی',
          render: (r) => (
            <span className={cn('tabular-nums', !r.ok && 'text-error font-bold')}>
              {fmt(r.assetType, r.balance)}
            </span>
          ),
        },
        {
          key: 'expected',
          header: 'موجودی دفتر کل',
          render: (r) => (
            <span className="tabular-nums">{fmt(r.assetType, r.expectedBalance)}</span>
          ),
          mobile: false,
        },
        {
          key: 'locked',
          header: 'قفل‌شده (ف/د)',
          render: (r) => (
            <span className="text-muted-foreground text-[11px] tabular-nums">
              {fmt(r.assetType, r.lockedBalance)} / {fmt(r.assetType, r.expectedLocked)}
            </span>
          ),
          mobile: false,
        },
      ]}
      emptyMessage="حسابی یافت نشد"
    />
  )
}
