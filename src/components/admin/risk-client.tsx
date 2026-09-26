// ============================================
// Zar30 - Admin Risk Client
// ============================================
// قوانین ریسک (CRUD) + اسکن دستی + رویدادهای ریسک (بررسی)
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { IconCheck, IconPencil, IconPlus, IconRadar, IconTrash } from '@tabler/icons-react'
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

interface RiskRuleRow {
  id: string
  name: string
  metric: string
  threshold: string
  windowHours: number
  scoreWeight: number
  active: boolean
  eventsCount: number
  createdAt: string
}

interface RiskEventRow {
  id: string
  metric: string
  score: number
  detail: Record<string, string> | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  ruleName: string | null
  user: { id: string; mobile: string; name: string } | null
  userScore: number
}

const METRIC_LABELS: Record<string, string> = {
  WITHDRAW_SUM: 'مجموع برداشت',
  TRADE_SUM: 'مجموع معاملات',
  TRANSFER_COUNT: 'تعداد انتقال',
  TRANSFER_GOLD: 'گرم انتقال',
  FAILED_PAYMENTS: 'پرداخت ناموفق',
  FLAGGED_TRANSFERS: 'انتقال پرچم‌دار',
  BLOCKED_CARDS: 'کارت مسدود',
  LOGIN_IP_CHANGES: 'IPهای متمایز ورود',
}

const RULE_FIELDS: AdminFormField[] = [
  { key: 'name', label: 'نام قانون', required: true, placeholder: 'برداشت سنگین روزانه' },
  {
    key: 'metric',
    label: 'متریک',
    type: 'select',
    options: Object.entries(METRIC_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'threshold',
    label: 'آستانه',
    required: true,
    ltr: true,
    hint: 'بیشتر از این مقدار → رویداد ثبت می‌شود (واحد بر اساس متریک: تومان/گرم/تعداد)',
  },
  { key: 'windowHours', label: 'بازه (ساعت)', type: 'number', ltr: true, hint: 'پیش‌فرض ۲۴' },
  {
    key: 'scoreWeight',
    label: 'وزن امتیاز (۱ تا ۱۰۰)',
    type: 'number',
    ltr: true,
    hint: 'امتیازی که به ریسک کاربر اضافه می‌شود',
  },
  { key: 'active', label: 'فعال', type: 'checkbox' },
]

function scoreBadge(score: number) {
  const color = score >= 50 ? 'text-error' : score >= 20 ? 'text-warning' : 'text-muted-foreground'
  return <span className={`font-bold tabular-nums ${color}`}>{toPersianDigits(score)}</span>
}

export function AdminRiskClient() {
  const [rules, setRules] = useState<RiskRuleRow[] | null>(null)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [ruleDialog, setRuleDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RiskRuleRow | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadRules = useCallback(async () => {
    const res = await apiGetWithRefresh<{ rules: RiskRuleRow[] }>('/api/v1/admin/risk/rules')
    if (res.ok && res.data?.rules) setRules(res.data.rules)
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ rules: RiskRuleRow[] }>('/api/v1/admin/risk/rules')
      if (!cancelled && res.ok && res.data?.rules) setRules(res.data.rules)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const runScan = useCallback(async () => {
    if (scanning) return
    setScanning(true)
    setScanResult(null)
    const res = await apiPost<{ scanned: number; eventsCreated: number }>(
      '/api/v1/admin/risk/scan',
      {},
    )
    setScanning(false)
    if (res.ok && res.data) {
      setScanResult(
        `اسکن انجام شد — ${toPersianDigits(res.data.scanned)} کاربر، ${toPersianDigits(res.data.eventsCreated)} رویداد جدید`,
      )
      setRefreshKey((k) => k + 1)
    } else {
      setScanResult(res.error ?? 'اسکن ناموفق بود')
    }
  }, [scanning])

  const submitRule = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      const body = {
        name: String(values.name ?? ''),
        metric: String(values.metric ?? 'TRADE_SUM'),
        threshold: Number(values.threshold ?? 0),
        windowHours: Number(values.windowHours ?? 24),
        scoreWeight: Number(values.scoreWeight ?? 10),
        active: values.active === true,
      }
      const res = editingRule
        ? await apiPut(`/api/v1/admin/risk/rules/${editingRule.id}`, body)
        : await apiPost('/api/v1/admin/risk/rules', body)
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      await loadRules()
      return null
    },
    [editingRule, loadRules],
  )

  const removeRule = useCallback(
    async (r: RiskRuleRow) => {
      if (!confirm(`قانون «${r.name}» حذف شود؟`)) return
      const res = await apiDelete(`/api/v1/admin/risk/rules/${r.id}`)
      if (res.ok) await loadRules()
    },
    [loadRules],
  )

  const review = useCallback(async (e: RiskEventRow) => {
    const note = prompt('یادداشت بررسی (اختیاری):') ?? undefined
    const res = await apiPost(`/api/v1/admin/risk/events/${e.id}/review`, { note })
    if (res.ok) setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageHeader
          title="مدیریت ریسک"
          description="قوانین امتیازدهی پویا + رویدادهای ریسک کاربران — امتیاز کل هر کاربر از مجموع رویدادهای ۳۰ روز اخیر محاسبه می‌شود"
        />
        <button
          type="button"
          onClick={() => void runScan()}
          disabled={scanning}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors disabled:opacity-60"
        >
          <IconRadar className="size-4" aria-hidden="true" />
          {scanning ? 'در حال اسکن…' : 'اسکن کاربران فعال'}
        </button>
      </div>

      {scanResult && (
        <p className="border-primary/30 bg-primary/5 rounded-xl border p-3 text-xs">{scanResult}</p>
      )}

      {/* ===== قوانین ریسک ===== */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">قوانین ریسک</h2>
          <button
            type="button"
            onClick={() => {
              setEditingRule(null)
              setRuleDialog(true)
            }}
            className="border-border/60 text-foreground hover:bg-muted flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            قانون جدید
          </button>
        </div>

        {!rules ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-24 rounded-xl" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <p className="border-border/60 text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
            قانونی تعریف نشده است
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className={`bg-card border-border/60 rounded-xl border p-3 ${!r.active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{r.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {METRIC_LABELS[r.metric] ?? r.metric} &gt; {toPersianDigits(r.threshold)} ·{' '}
                      {toPersianDigits(r.windowHours)}h · وزن {toPersianDigits(r.scoreWeight)}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[10px]">
                      {toPersianDigits(r.eventsCount)} رویداد ثبت‌شده
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-label={`ویرایش ${r.name}`}
                      onClick={() => {
                        setEditingRule(r)
                        setRuleDialog(true)
                      }}
                      className="border-border/60 text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md border transition-colors"
                    >
                      <IconPencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`حذف ${r.name}`}
                      onClick={() => void removeRule(r)}
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

      {/* ===== رویدادهای ریسک ===== */}
      <section>
        <AdminFinanceList<RiskEventRow>
          title="رویدادهای ریسک"
          endpoint="/api/v1/admin/risk/events"
          dataKey="events"
          keyOf={(e) => e.id}
          searchPlaceholder="موبایل کاربر…"
          refreshKey={refreshKey}
          filters={[
            {
              key: 'status',
              label: 'وضعیت بررسی',
              options: [
                { value: 'open', label: 'بررسی‌نشده' },
                { value: 'reviewed', label: 'بررسی‌شده' },
              ],
            },
          ]}
          columns={[
            {
              key: 'user',
              header: 'کاربر',
              render: (e) =>
                e.user ? (
                  <Link href={`/admin/users/${e.user.id}`} className="font-medium hover:underline">
                    {e.user.name}
                  </Link>
                ) : (
                  '—'
                ),
            },
            {
              key: 'event',
              header: 'رویداد',
              render: (e) => (
                <div>
                  <p className="text-xs font-medium">
                    {e.ruleName ?? METRIC_LABELS[e.metric] ?? e.metric}
                  </p>
                  {e.detail && (
                    <p className="text-muted-foreground text-[10px]">
                      {e.detail.value} &gt; {e.detail.threshold}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: 'score',
              header: 'امتیاز رویداد',
              render: (e) => scoreBadge(e.score),
            },
            {
              key: 'userScore',
              header: 'امتیاز کاربر (۳۰d)',
              render: (e) => scoreBadge(e.userScore),
            },
            {
              key: 'reviewed',
              header: 'بررسی',
              render: (e) =>
                e.reviewedAt ? (
                  <span title={e.reviewNote ?? ''}>
                    <AdminStatus status="COMPLETED" />
                  </span>
                ) : (
                  <AdminStatus status="PENDING" />
                ),
            },
            {
              key: 'created',
              header: 'زمان',
              render: (e) => new Date(e.createdAt).toLocaleString('fa-IR'),
              mobile: false,
            },
          ]}
          rowActions={(e) =>
            !e.reviewedAt ? (
              <button
                type="button"
                aria-label="علامت‌گذاری به‌عنوان بررسی‌شده"
                title="بررسی شد"
                onClick={() => void review(e)}
                className="border-success/30 text-success hover:bg-success/5 inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
              >
                <IconCheck className="size-4" aria-hidden="true" />
              </button>
            ) : null
          }
          emptyMessage="رویداد ریسکی ثبت نشده است"
        />
      </section>

      <AdminFormDialog
        open={ruleDialog}
        onOpenChange={setRuleDialog}
        title={editingRule ? `ویرایش «${editingRule.name}»` : 'قانون ریسک جدید'}
        fields={RULE_FIELDS}
        initial={
          editingRule
            ? {
                name: editingRule.name,
                metric: editingRule.metric,
                threshold: editingRule.threshold,
                windowHours: String(editingRule.windowHours),
                scoreWeight: String(editingRule.scoreWeight),
                active: editingRule.active,
              }
            : { metric: 'TRADE_SUM', windowHours: '24', scoreWeight: '10', active: true }
        }
        onSubmit={submitRule}
      />
    </div>
  )
}
