// ============================================
// Zar30 - Admin Detail UI Primitives (Shared)
// ============================================
// Section/Field/fmtDate مشترک برای صفحات detail ادمین
// useAdminDetail: fetch با stale pattern — setState فقط بعد از await
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { apiGetWithRefresh } from '@/lib/api/client'
import { AdminStatus } from '@/components/admin/admin-status'
import { FinancialValue } from '@/components/admin/financial-value'
import type {
  AdminAuditRow,
  AdminJournalBlock,
  AdminLedgerEntryRow,
} from '@/lib/services/admin-finance.service'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border-border/60 rounded-xl border p-5">
      <h2 className="text-foreground mb-3 text-sm font-bold">{title}</h2>
      {children}
    </section>
  )
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-muted-foreground shrink-0 text-[11px]">{label}</dt>
      <dd className="text-foreground min-w-0 text-left text-xs">{value}</dd>
    </div>
  )
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}

/** fetch detail — dataکلید آرایه/آبجکت در پاسخ `data` */
export function useAdminDetail<D>(endpoint: string, dataKey: string, fallback: string) {
  const [data, setData] = useState<D | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<Record<string, D>>(endpoint)
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.error ?? 'بارگذاری ناموفق بود')
        return
      }
      setError(null)
      setData(res.data?.[dataKey] ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [endpoint, dataKey])

  return { data, error, loading, notFoundMessage: fallback }
}

// ---------- Ledger / Journal / Audit blocks ----------

/** جدول ledger entries — DEBIT/CREDIT صریح؛ بدون محاسبه balance */
export function LedgerEntriesTable({ entries }: { entries: AdminLedgerEntryRow[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-xs">ورودی ledger ثبت نشده است</p>
  }
  return (
    <div className="border-border/60 overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-border/60 bg-muted/40 border-b">
            <th scope="col" className="text-muted-foreground px-3 py-2 text-right font-semibold">
              زمان
            </th>
            <th scope="col" className="text-muted-foreground px-3 py-2 text-right font-semibold">
              حساب
            </th>
            <th scope="col" className="text-muted-foreground px-3 py-2 text-right font-semibold">
              سند
            </th>
            <th scope="col" className="text-muted-foreground px-3 py-2 text-right font-semibold">
              نوع
            </th>
            <th scope="col" className="text-muted-foreground px-3 py-2 text-right font-semibold">
              مبلغ
            </th>
            <th scope="col" className="text-muted-foreground px-3 py-2 text-right font-semibold">
              مانده بعد
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-border/40 border-b last:border-b-0">
              <td className="text-muted-foreground px-3 py-2 whitespace-nowrap tabular-nums">
                {fmtDate(e.createdAt)}
              </td>
              <td className="px-3 py-2">
                <span className="text-foreground block font-medium">{e.ledgerAccount.name}</span>
                <span className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                  {e.ledgerAccount.code}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                  {e.journalEntry.id.slice(0, 8)}
                </span>
                <AdminStatus status={e.journalEntry.status} className="mr-1.5" />
                {e.journalEntry.referenceType && (
                  <span className="text-muted-foreground block text-[10px]">
                    {e.journalEntry.referenceType}
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <AdminStatus status={e.entryType} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {e.amountRial !== null && <FinancialValue value={e.amountRial} unit="ریال" />}
                {e.amountGold !== null && <FinancialValue value={e.amountGold} unit="گرم" />}
                {e.amountRial === null && e.amountGold === null && '—'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {e.balanceAfter !== null ? <FinancialValue value={e.balanceAfter} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** بلوک journal entry کامل + ledger entries آن */
export function JournalBlock({ journal }: { journal: AdminJournalBlock }) {
  return (
    <div className="space-y-3">
      <dl className="divide-border/40 divide-y">
        <Field
          label="شناسه سند"
          value={
            <span className="tabular-nums" dir="ltr">
              {journal.id}
            </span>
          }
        />
        <Field label="وضعیت" value={<AdminStatus status={journal.status} />} />
        <Field
          label="ارجاع"
          value={
            journal.referenceType ? `${journal.referenceType} — ${journal.referenceId ?? '—'}` : '—'
          }
        />
        {journal.description && <Field label="شرح" value={journal.description} />}
        {journal.reversalOf && (
          <Field
            label="برگشت از سند"
            value={
              <span className="tabular-nums" dir="ltr">
                {journal.reversalOf}
              </span>
            }
          />
        )}
        <Field label="زمان ثبت" value={fmtDate(journal.createdAt)} />
      </dl>
      <LedgerEntriesTable entries={journal.ledgerEntries} />
    </div>
  )
}

/** timeline audit — بدون before/after (ماژول audit بعدا) */
export function AuditTimeline({ rows }: { rows: AdminAuditRow[] }) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-xs">رویداد ممیزی ثبت نشده است</p>
  }
  return (
    <ul className="space-y-2">
      {rows.map((a) => (
        <li key={a.id} className="border-border/40 rounded-lg border p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground font-medium" dir="ltr">
              {a.action}
            </span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {fmtDate(a.createdAt)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-[10px]">
            {a.actorType}
            {a.actorRole ? ` — ${a.actorRole}` : ''}
            {a.reason ? ` — ${a.reason}` : ''}
          </p>
        </li>
      ))}
    </ul>
  )
}
