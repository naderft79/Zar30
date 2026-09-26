// ============================================
// Zar30 - Installments Client — خرید قسطی طلا
// ============================================
// flow: محاسبه‌گر با اسلایدر مبلغ → صورتحساب (checkout) → درخواست قرارداد
// قراردادها از API واقعی: GET /api/v1/installments/contracts
// طرح‌ها از API: GET /api/v1/installments/plans
// پرداخت قسط: POST /api/v1/installments/pay (Idempotency-Key)
// ============================================

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconCalendarClock,
  IconChevronLeft,
  IconCircleCheck,
  IconCreditCard,
  IconFileText,
} from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { cn } from 'cn'

interface PlanDto {
  id: string
  name: string
  months: number
  downPaymentPercent: string
  interestRate: string
  fee: string
  minAmount: string
  maxAmount: string
}

interface ContractListItem {
  id: string
  status: string
  method: string
  principal: string
  downPayment: string
  totalPayable: string
  plan: { name: string; months: number }
  paidCount: number
  nextDueDate: string | null
  overdueCount: number
}

interface ContractDetail {
  id: string
  status: string
  method: string
  principal: string
  downPayment: string
  totalPayable: string
  plan: { name: string; months: number; interestRate: string }
  payments: {
    number: number
    dueDate: string
    amount: string
    lateFee: string
    status: string
    paidAt: string | null
  }[]
}

const STATUS_META: Record<
  string,
  { label: string; tone: 'success' | 'warning' | 'neutral' | 'error' }
> = {
  PENDING: { label: 'در انتظار تایید', tone: 'warning' },
  ACTIVE: { label: 'فعال', tone: 'success' },
  COMPLETED: { label: 'تسویه‌شده', tone: 'neutral' },
  DEFAULTED: { label: 'نکول', tone: 'error' },
}

const PAYMENT_STATUS_META: Record<
  string,
  { label: string; tone: 'success' | 'warning' | 'neutral' | 'error' }
> = {
  PENDING: { label: 'پرداخت‌نشده', tone: 'neutral' },
  OVERDUE: { label: 'معوق', tone: 'error' },
  PAID: { label: 'پرداخت‌شده', tone: 'success' },
  DEFAULTED: { label: 'نکول', tone: 'error' },
}

const faDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (v: string | number) => formatExactAmount(String(v))
const STEP = 5_000_000

export function InstallmentsClient() {
  // طرح‌ها + قراردادهای واقعی
  const [plans, setPlans] = useState<PlanDto[]>([])
  const [contracts, setContracts] = useState<ContractListItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // محاسبه‌گر
  const [months, setMonths] = useState<number | null>(null)
  const [amount, setAmount] = useState(100_000_000)
  const [price, setPrice] = useState<{ buyPrice: number } | null>(null)

  // شیت جزئیات قرارداد
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [payBusy, setPayBusy] = useState<number | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [payOk, setPayOk] = useState(false)
  const [submitted] = useState(
    () => typeof window !== 'undefined' && window.location.search.includes('submitted=1'),
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [contractsRes, plansRes, priceRes] = await Promise.all([
        apiGetWithRefresh<{ contracts: ContractListItem[] }>('/api/v1/installments/contracts'),
        apiGetWithRefresh<{ plans: PlanDto[] }>('/api/v1/installments/plans'),
        apiGetWithRefresh<{ buyPrice: number }>('/api/v1/price'),
      ])
      if (cancelled) return
      if (contractsRes.ok) setContracts(contractsRes.data?.contracts ?? [])
      if (plansRes.ok) {
        const p = plansRes.data?.plans ?? []
        setPlans(p)
        // طرح پیش‌فرض: ۶ ماهه در صورت وجود، وگرنه اولین طرح
        const def = p.find((x) => x.months === 6) ?? p[0]
        if (def) setMonths((m) => m ?? def.months)
      }
      if (priceRes.ok && priceRes.data) setPrice(priceRes.data)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const plan = useMemo(() => plans.find((p) => p.months === months) ?? null, [plans, months])
  const minAmount = plan ? Number(plan.minAmount) : 10_000_000
  const maxAmount = plan ? Number(plan.maxAmount) : 500_000_000

  // قسط ماهانه — همان فرمول annuity سرور (نمایشی)
  const quote = useMemo(() => {
    if (!plan || amount <= 0) return null
    const down = Math.round((amount * Number(plan.downPaymentPercent)) / 100)
    const financed = amount - down
    const r = Number(plan.interestRate) / 100 / 12
    const f = Math.pow(1 + r, plan.months)
    const installment = Math.round((financed * r * f) / (f - 1))
    return { down, installment, total: installment * plan.months }
  }, [plan, amount])

  const goldGrams = price && price.buyPrice > 0 ? amount / price.buyPrice : null
  const fillPct = Math.min(100, Math.max(0, ((amount - minAmount) / (maxAmount - minAmount)) * 100))

  function selectMonths(m: number) {
    setMonths(m)
    const p = plans.find((x) => x.months === m)
    if (p) setAmount((a) => Math.min(Math.max(a, Number(p.minAmount)), Number(p.maxAmount)))
  }

  async function openDetail(id: string) {
    setPayError(null)
    setPayOk(false)
    const res = await apiGetWithRefresh<ContractDetail>(`/api/v1/installments/contracts?id=${id}`)
    if (res.ok && res.data) {
      setDetail(res.data)
      setDetailOpen(true)
    }
  }

  async function payInstallment(number: number) {
    if (!detail || payBusy !== null) return
    setPayBusy(number)
    setPayError(null)
    setPayOk(false)
    const res = await apiPost<{ status: string; contractCompleted: boolean }>(
      '/api/v1/installments/pay',
      { contractId: detail.id, installmentNumber: number },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setPayBusy(null)
    if (!res.ok) {
      setPayError(res.error ?? 'پرداخت قسط ناموفق بود')
      return
    }
    setPayOk(true)
    const fresh = await apiGetWithRefresh<ContractDetail>(
      `/api/v1/installments/contracts?id=${detail.id}`,
    )
    if (fresh.ok && fresh.data) setDetail(fresh.data)
  }

  return (
    <div className="animate-stagger space-y-5">
      {/* پیام موفقیت ثبت درخواست */}
      {submitted && (
        <div
          role="status"
          className="text-success bg-success/10 flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium"
        >
          <IconCircleCheck className="size-5 shrink-0" aria-hidden="true" />
          درخواست خرید قسطی شما ثبت شد و پس از تایید کارشناسان فعال می‌شود.
        </div>
      )}

      {/* محاسبه‌گر خرید قسطی */}
      <Card className="border-gold-500/25 from-gold-500/10 via-card to-card bg-gradient-to-bl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconCreditCard className="text-gold-600 size-5" stroke={1.75} />
            طرح‌های اقساطی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* تب‌های مدت بازپرداخت */}
          <div
            role="tablist"
            aria-label="مدت بازپرداخت"
            className="bg-muted/70 grid grid-cols-4 gap-1 rounded-xl p-1"
          >
            {plans.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={months === t.months}
                onClick={() => selectMonths(t.months)}
                className={cn(
                  'focus-visible:ring-ring rounded-lg py-2 text-sm font-medium transition-all duration-(--duration-fast) focus-visible:ring-2 focus-visible:outline-none',
                  months === t.months
                    ? 'bg-navy-700 text-cream-50 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {faDigits(String(t.months))} ماهه
              </button>
            ))}
            {plans.length === 0 && <div className="skeleton-shimmer col-span-4 h-9 rounded-lg" />}
          </div>

          {/* مبلغ اعتبار */}
          <div className="text-center">
            <p className="text-muted-foreground text-xs">مبلغ اعتبار خرید</p>
            <p className="text-foreground mt-1 text-2xl font-bold tabular-nums">
              {fmt(amount)}
              <span className="text-gold-600 ms-1.5 text-sm font-bold">تومان</span>
            </p>
          </div>

          {/* اسلایدر مبلغ */}
          <div dir="ltr">
            <input
              type="range"
              min={minAmount}
              max={maxAmount}
              step={STEP}
              value={Math.min(Math.max(amount, minAmount), maxAmount)}
              onChange={(e) => setAmount(Number(e.target.value))}
              aria-label="مبلغ اعتبار خرید قسطی"
              aria-valuetext={`${fmt(amount)} تومان`}
              className="installment-slider w-full"
              style={{
                background: `linear-gradient(to right, var(--gold-500) 0%, var(--gold-500) ${fillPct}%, var(--muted) ${fillPct}%, var(--muted) 100%)`,
              }}
            />
            <div className="text-muted-foreground mt-2 flex items-center justify-between text-[10px] tabular-nums">
              <span dir="rtl">{faDigits(String(minAmount / 1_000_000))} میلیون</span>
              <span dir="rtl">{faDigits(String(maxAmount / 1_000_000))} میلیون</span>
            </div>
          </div>

          {/* طلای دریافتی */}
          <div className="border-gold-500/30 from-gold-500/15 via-gold-500/5 rounded-2xl border bg-gradient-to-bl to-transparent px-4 py-3.5 text-center">
            <p className="text-gold-700 text-[11px] font-medium">طلای دریافتی</p>
            {goldGrams === null ? (
              <p className="text-muted-foreground mt-1 text-lg font-bold">—</p>
            ) : (
              <p className="text-foreground mt-1 text-xl font-bold tabular-nums">
                {faDigits(goldGrams.toFixed(2))}
                <span className="text-gold-600 ms-1 text-xs font-medium">گرم</span>
              </p>
            )}
          </div>

          {/* جزئیات بازپرداخت */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border-border/60 bg-muted/40 rounded-xl border px-3.5 py-3 text-center">
              <p className="text-muted-foreground text-[11px]">مبلغ هر قسط</p>
              <p className="text-foreground mt-1 text-base font-bold tabular-nums">
                {fmt(quote?.installment ?? 0)}
              </p>
              <p className="text-muted-foreground/70 text-[10px]">
                تومان · {faDigits(String(months ?? 0))} قسط
              </p>
            </div>
            <div className="border-border/60 bg-muted/40 rounded-xl border px-3.5 py-3 text-center">
              <p className="text-muted-foreground text-[11px]">مجموع اقساط</p>
              <p className="text-foreground mt-1 text-base font-bold tabular-nums">
                {fmt(quote?.total ?? 0)}
              </p>
              <p className="text-muted-foreground/70 text-[10px]">
                تومان{plan && ` · سود ${faDigits(plan.interestRate)}٪ سالانه`}
              </p>
            </div>
          </div>

          {/* دکمه خرید قسطی → صورتحساب */}
          <Link
            href={`/dashboard/installments/checkout?amount=${amount}&months=${months ?? 6}`}
            aria-disabled={!plan}
            className={cn(
              'focus-visible:ring-ring flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
              plan
                ? 'bg-navy-700 text-cream-50 hover:bg-navy-600'
                : 'bg-muted text-muted-foreground pointer-events-none',
            )}
          >
            <IconCreditCard className="size-5" stroke={1.75} />
            خرید قسطی
          </Link>
        </CardContent>
      </Card>

      {/* قراردادهای من */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconFileText className="text-gold-600 size-5" stroke={1.75} />
            قراردادهای من
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <div className="skeleton-shimmer h-16 rounded-lg" />
          ) : contracts.length === 0 ? (
            <EmptyState
              icon={IconFileText}
              title="قراردادی ندارید"
              description="قراردادهای خرید اقساطی شما با وضعیت و جزئیات کامل اینجا نمایش داده می‌شوند."
            />
          ) : (
            <ul className="divide-border/40 divide-y">
              {contracts.map((c) => {
                const meta = STATUS_META[c.status] ?? { label: c.status, tone: 'neutral' as const }
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => void openDetail(c.id)}
                      className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-3 text-start transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-foreground text-xs font-semibold">
                          {c.plan.name} · {fmt(c.principal)} تومان
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                          {faDigits(String(c.paidCount))} از {faDigits(String(c.plan.months))} قسط
                          {c.overdueCount > 0 && (
                            <span className="text-error ms-1.5 font-medium">
                              · {faDigits(String(c.overdueCount))} قسط معوق
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge tone={meta.tone} dot={false}>
                          {meta.label}
                        </StatusBadge>
                        <IconChevronLeft className="text-muted-foreground size-4" stroke={1.75} />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* شیت جزئیات قرارداد — جدول اقساط + پرداخت */}
      <BottomSheet open={detailOpen} onClose={() => setDetailOpen(false)} title="جزئیات قرارداد">
        {detail && (
          <div className="space-y-4">
            <div className="bg-muted/40 rounded-xl p-3.5 text-center">
              <p className="text-muted-foreground text-[10px]">مبلغ خرید</p>
              <p className="text-foreground mt-0.5 text-lg font-bold tabular-nums">
                {fmt(detail.principal)}
                <span className="text-muted-foreground ms-1 text-[10px] font-normal">تومان</span>
              </p>
              <p className="text-muted-foreground mt-1 text-[10px]">
                {detail.plan.name} · پیش‌پرداخت {fmt(detail.downPayment)} تومان
              </p>
            </div>

            {payOk && (
              <p className="text-success bg-success/10 flex items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-medium">
                <IconCircleCheck className="size-4" aria-hidden="true" />
                پرداخت قسط با موفقیت انجام شد
              </p>
            )}

            <ul className="divide-border/60 divide-y">
              {detail.payments.map((p) => {
                const meta = PAYMENT_STATUS_META[p.status] ?? {
                  label: p.status,
                  tone: 'neutral' as const,
                }
                const payable = p.status !== 'PAID' && detail.status === 'ACTIVE'
                const overdue = p.status === 'OVERDUE'
                return (
                  <li key={p.number} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-foreground text-xs font-semibold tabular-nums">
                        قسط {faDigits(String(p.number))} · {fmt(p.amount)} تومان
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        سررسید:{' '}
                        {new Date(p.dueDate).toLocaleDateString('fa-IR', { dateStyle: 'short' })}
                        {Number(p.lateFee) > 0 && (
                          <span className="text-error ms-1">جریمه: {fmt(p.lateFee)} تومان</span>
                        )}
                      </p>
                    </div>
                    {p.status === 'PAID' ? (
                      <StatusBadge tone="success" dot={false}>
                        پرداخت‌شده
                      </StatusBadge>
                    ) : payable ? (
                      <button
                        type="button"
                        onClick={() => void payInstallment(p.number)}
                        disabled={payBusy !== null}
                        className={cn(
                          'focus-visible:ring-ring h-8 shrink-0 rounded-lg px-3 text-[11px] font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
                          overdue
                            ? 'bg-error hover:bg-error/90 text-white'
                            : 'bg-navy-700 text-cream-50 hover:bg-navy-600',
                        )}
                      >
                        {payBusy === p.number ? '…' : 'پرداخت'}
                      </button>
                    ) : (
                      <StatusBadge tone={meta.tone} dot={false}>
                        {meta.label}
                      </StatusBadge>
                    )}
                  </li>
                )
              })}
            </ul>

            {payError && (
              <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                {payError}
              </p>
            )}

            {detail.status === 'PENDING' && (
              <p className="text-muted-foreground bg-warning/10 rounded-xl p-3 text-[11px] leading-5">
                <IconCalendarClock
                  className="text-warning me-1 mb-0.5 inline size-4"
                  aria-hidden="true"
                />
                این قرارداد در انتظار تایید کارشناسان است. پس از تایید، اقساط فعال و جدول بالا
                به‌روزرسانی می‌شود.
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
