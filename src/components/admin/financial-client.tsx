// ============================================
// Zar30 - Admin Financial (Ledger) Client
// ============================================
// مانده حساب‌های دفتر کل + اسناد ژورنال — read-only
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { toPersianDigits, formatToman } from '@/lib/utils/format'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminFinanceList } from '@/components/admin/finance-list'

interface AccountRow {
  code: string
  name: string
  type: string
  debit: string
  credit: string
  balance: string
}

interface EntryRow {
  id: string
  referenceType: string | null
  referenceId: string | null
  description: string | null
  status: string
  reversalOf: string | null
  createdAt: string
  legs: {
    accountCode: string
    entryType: string
    amountToman: string | null
    amountGold: string | null
  }[]
}

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'دارایی',
  LIABILITY: 'بدهی',
  REVENUE: 'درآمد',
  EXPENSE: 'هزینه',
  EQUITY: 'حقوق صاحبان سهام',
}

export function AdminFinancialClient() {
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ accounts: AccountRow[] }>(
        '/api/v1/admin/ledger/accounts',
      )
      if (!cancelled && res.ok && res.data?.accounts) setAccounts(res.data.accounts)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="دفتر کل حسابداری"
        description="حساب‌های دفتر کل و اسناد ژورنال دوطرفه — منبع حقیقت مالی سیستم (read-only)"
      />

      {/* ===== مانده حساب‌ها ===== */}
      <section>
        <h2 className="mb-3 text-sm font-bold">مانده حساب‌ها</h2>
        {!accounts ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => {
              const isGold = a.code.includes('GOLD')
              return (
                <div
                  key={a.code}
                  id={`acct-${a.code}`}
                  className="bg-card border-border/60 scroll-mt-24 rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{a.name}</p>
                      <p className="text-muted-foreground text-[10px]" dir="ltr">
                        {a.code}
                      </p>
                    </div>
                    <span className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[10px]">
                      {TYPE_LABELS[a.type] ?? a.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold tabular-nums">
                    {isGold ? `${toPersianDigits(a.balance)} گرم` : formatToman(Number(a.balance))}
                  </p>
                  <p className="text-muted-foreground text-[10px] tabular-nums">
                    بدهکار {toPersianDigits(a.debit)} · بستانکار {toPersianDigits(a.credit)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ===== اسناد ژورنال ===== */}
      <section>
        <AdminFinanceList<EntryRow>
          title="اسناد ژورنال"
          endpoint="/api/v1/admin/ledger/journal"
          dataKey="entries"
          keyOf={(e) => e.id}
          searchPlaceholder="مرجع یا شرح سند…"
          filters={[
            {
              key: 'status',
              label: 'وضعیت سند',
              options: [
                { value: 'POSTED', label: 'ثبت‌شده' },
                { value: 'REVERSED', label: 'برگشت‌خورده' },
              ],
            },
          ]}
          readOnlyNotice
          columns={[
            {
              key: 'reference',
              header: 'مرجع',
              render: (e) => (
                <span className="text-xs" dir="ltr">
                  {[e.referenceType, e.referenceId].filter(Boolean).join(':') || '—'}
                </span>
              ),
            },
            {
              key: 'narration',
              header: 'شرح',
              render: (e) => (
                <div>
                  {e.description ?? '—'}
                  {e.status === 'REVERSED' && (
                    <span className="text-warning mr-1 text-[10px]">(برگشت‌خورده)</span>
                  )}
                </div>
              ),
            },
            {
              key: 'legs',
              header: 'پاها',
              render: (e) => (
                <div className="space-y-0.5">
                  {e.legs.map((l, i) => (
                    <p key={i} className="text-[10px] tabular-nums">
                      <span dir="ltr">{l.accountCode}</span>{' '}
                      {l.entryType === 'DEBIT' ? 'بدهکار' : 'بستانکار'}{' '}
                      {l.amountToman
                        ? `${toPersianDigits(l.amountToman)} تومان`
                        : `${toPersianDigits(l.amountGold ?? '0')} گرم`}
                    </p>
                  ))}
                </div>
              ),
            },
            {
              key: 'created',
              header: 'زمان',
              render: (e) => new Date(e.createdAt).toLocaleString('fa-IR'),
            },
          ]}
          emptyMessage="سندی ثبت نشده است"
        />
      </section>
    </div>
  )
}
