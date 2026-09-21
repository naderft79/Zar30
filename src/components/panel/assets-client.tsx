// ============================================
// Zar30 - Assets Client (Real Wallet)
// ============================================
// موجودی واقعی از /api/v1/wallet — واریز/برداشت با Idempotency-Key
// ============================================

'use client'

import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpLeft,
  History,
  PieChart,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BalanceCard } from '@/components/financial/balance-card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'

interface WalletAccount {
  assetType: string
  balance: string
  lockedBalance: string
  available: string
}

interface TxRow {
  id: string
  type: string
  amount: string
  status: string
  createdAt: string
}

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'واریز',
  WITHDRAW: 'برداشت',
  FEE: 'کارمزد',
  TRANSFER: 'انتقال',
}

const TX_STATUS: Record<string, string> = {
  PENDING: 'در انتظار',
  COMPLETED: 'موفق',
  FAILED: 'ناموفق',
  REVERSED: 'برگشت‌خورده',
}

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

export function AssetsClient() {
  const [accounts, setAccounts] = useState<WalletAccount[]>([])
  const [txs, setTxs] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState<'deposit' | 'withdraw' | null>(null)
  const [amount, setAmount] = useState('')
  const [iban, setIban] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadAll() {
    const [walletRes, txRes] = await Promise.all([
      apiGetWithRefresh<{ accounts: WalletAccount[] }>('/api/v1/wallet'),
      apiGetWithRefresh<{ transactions: TxRow[] }>('/api/v1/wallet/transactions?limit=10'),
    ])
    if (walletRes.ok) setAccounts(walletRes.data?.accounts ?? [])
    if (txRes.ok) setTxs(txRes.data?.transactions ?? [])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [walletRes, txRes] = await Promise.all([
        apiGetWithRefresh<{ accounts: WalletAccount[] }>('/api/v1/wallet'),
        apiGetWithRefresh<{ transactions: TxRow[] }>('/api/v1/wallet/transactions?limit=10'),
      ])
      if (cancelled) return
      if (walletRes.ok) setAccounts(walletRes.data?.accounts ?? [])
      if (txRes.ok) setTxs(txRes.data?.transactions ?? [])
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rial = accounts.find((a) => a.assetType === 'RIAL')
  const gold = accounts.find((a) => a.assetType === 'GOLD')
  const total = Number(rial?.available ?? 0)

  async function submit() {
    setError(null)
    setSuccess(null)
    if (!/^\d+$/.test(amount) || Number(amount) <= 0) {
      setError('مبلغ معتبر وارد کنید')
      return
    }
    if (form === 'withdraw' && !/^IR\d{24}$/.test(iban)) {
      setError('شماره شبا باید با IR شروع و ۲۶ کاراکتر باشد (مثل IR062960000000100324200001)')
      return
    }
    setBusy(true)
    const endpoint = form === 'deposit' ? '/api/v1/wallet/deposit' : '/api/v1/wallet/withdraw'
    const body = form === 'deposit' ? { amount } : { amount, iban }
    const res = await apiPost(endpoint, body, { 'Idempotency-Key': crypto.randomUUID() })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'عملیات ناموفق بود')
      return
    }
    setSuccess(
      form === 'deposit'
        ? 'درخواست واریز ثبت شد — پس از تایید به موجودی شما اضافه می‌شود'
        : 'درخواست برداشت ثبت شد — مبلغ تا پرداخت مسدود می‌شود',
    )
    setForm(null)
    setAmount('')
    setIban('')
    void loadAll()
  }

  return (
    <div className="animate-stagger space-y-5">
      {/* کارت‌های موجودی — مقادیر واقعی */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard
          variant="gold"
          amount={gold?.available ?? '0'}
          subtitle="طلای آب‌شده ۱۸ عیار"
          loading={loading}
        />
        <BalanceCard
          variant="fiat"
          amount={rial?.available ?? '0'}
          unit="ریال"
          subtitle="کیف پول ریالی"
          loading={loading}
        />
        <BalanceCard
          variant="total"
          amount={String(Math.round(total))}
          unit="ریال"
          subtitle="مجموع دارایی ریالی شما"
          loading={loading}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      {/* اکشن‌های کیف پول */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="gold"
          onClick={() => {
            setForm('deposit')
            setError(null)
            setSuccess(null)
          }}
        >
          <ArrowDownLeft className="size-4" />
          واریز
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setForm('withdraw')
            setError(null)
            setSuccess(null)
          }}
        >
          <ArrowUpLeft className="size-4" />
          برداشت
        </Button>
      </div>

      {/* فرم واریز/برداشت */}
      {form && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {form === 'deposit' ? 'درخواست واریز' : 'درخواست برداشت'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">مبلغ (ریال)</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="1000000"
                className={inputClass}
              />
            </label>
            {form === 'withdraw' && (
              <label className="block space-y-1.5">
                <span className="text-muted-foreground text-[11px]">شماره شبا</span>
                <input
                  type="text"
                  dir="ltr"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="IR062960000000100324200001"
                  maxLength={26}
                  className={inputClass}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                {error}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button variant="gold" onClick={submit} disabled={busy}>
                {busy ? 'در حال ثبت…' : 'ثبت درخواست'}
              </Button>
              <Button variant="ghost" onClick={() => setForm(null)} disabled={busy}>
                انصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <p role="status" className="text-success flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          {success}
        </p>
      )}

      {/* تراکنش‌ها + ترکیب دارایی */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="text-gold-500 size-5" strokeWidth={1.75} />
              تراکنش‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <EmptyState
                icon={History}
                title="هنوز تراکنشی ثبت نشده است"
                description="واریز، برداشت، خرید و فروش شما با جزئیات کامل اینجا ثبت و نمایش داده می‌شود."
              />
            ) : (
              <ul className="divide-border/40 divide-y">
                {txs.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-foreground text-xs font-semibold">
                        {TX_LABELS[t.type] ?? t.type}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                        {new Date(t.createdAt).toLocaleString('fa-IR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-foreground text-xs font-semibold tabular-nums" dir="ltr">
                        {formatExactAmount(t.amount)}{' '}
                        <span className="text-muted-foreground">ریال</span>
                      </p>
                      <StatusBadge tone="gold" dot={false} className="mt-1">
                        {TX_STATUS[t.status] ?? t.status}
                      </StatusBadge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="text-gold-500 size-5" strokeWidth={1.75} />
              ترکیب دارایی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Number(gold?.balance ?? 0) === 0 && Number(rial?.balance ?? 0) === 0 ? (
              <EmptyState
                icon={PieChart}
                title="دارایی فعالی ندارید"
                description="نمودار ترکیب طلا و ریال پس از اولین تراکنش نمایش داده می‌شود."
              />
            ) : (
              <dl className="divide-border/40 divide-y text-xs">
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground">طلای آب‌شده</dt>
                  <dd className="text-foreground font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(gold?.balance ?? '0')} گرم
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <dt className="text-muted-foreground">ریال</dt>
                  <dd className="text-foreground font-semibold tabular-nums" dir="ltr">
                    {formatExactAmount(rial?.balance ?? '0')} ریال
                  </dd>
                </div>
                {Number(gold?.lockedBalance ?? 0) + Number(rial?.lockedBalance ?? 0) > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <dt className="text-muted-foreground">مسدود شده</dt>
                    <dd className="text-foreground font-semibold tabular-nums" dir="ltr">
                      {formatExactAmount(rial?.lockedBalance ?? '0')} ریال +{' '}
                      {formatExactAmount(gold?.lockedBalance ?? '0')} گرم
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
