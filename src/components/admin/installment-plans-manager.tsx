// ============================================
// Zar30 - Installment Plans Manager Page (Admin)
// ============================================
// صفحه مستقل مدیریت طرح‌های اقساطی + تنظیمات کارمزد سراسری:
//   - لیست/ایجاد/ویرایش/فعال‌سازی طرح‌ها (months, پیش‌پرداخت, نرخ سود,
//     هزینه خدمات هر ۱۰ میلیون, سقف/کف مبلغ)
//   - کارمزد خرید / کارمزد درگاه / جریمه دیرکرد (سراسری)
// API: /api/v1/admin/installments/plans + /settings
// permissions: نمایش دکمه‌ها با INSTALLMENTS_MANAGE (enforce سمت سرور)
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCoin,
  IconPencil,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import { useAdmin } from '@/components/admin/admin-shell'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac'
import { apiGet, apiPost, apiPut } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
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
  serviceFeePer10M: string
  active: boolean
}

interface SettingsDto {
  buyFeePercent: number
  gatewayFeePercent: number
  lateFeeDailyPercent: number
}

const faNum = (v: string | number) => toPersianDigits(String(v))
const fmtM = (v: string | number) =>
  faNum((Number(v) / 1_000_000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }))

interface FormState {
  name: string
  months: string
  downPaymentPercent: string
  interestRate: string
  fee: string
  minAmountMillion: string
  maxAmountMillion: string
  serviceFeePer10MMillion: string
}

const EMPTY_FORM: FormState = {
  name: '',
  months: '6',
  downPaymentPercent: '20',
  interestRate: '10',
  fee: '2',
  minAmountMillion: '10',
  maxAmountMillion: '100',
  serviceFeePer10MMillion: '0.5',
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-muted-foreground text-[11px] font-medium">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        dir="ltr"
        {...props}
        className="border-border/60 bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-xs tabular-nums focus-visible:ring-2 focus-visible:outline-none"
      />
      {hint && <span className="text-muted-foreground/70 block text-[10px]">{hint}</span>}
    </label>
  )
}

function num(v: string) {
  const n = Number(v.replace(/,/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function toToman(million: string) {
  return String(Math.round(num(million) * 1_000_000))
}

export function PlansManager() {
  const { admin } = useAdmin()
  const canManage = hasPermission(admin.permissions, PERMISSIONS.INSTALLMENTS_MANAGE)

  const [plans, setPlans] = useState<PlanDto[] | null>(null)
  const [, setSettings] = useState<SettingsDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // فرم طرح — null = فرم بسته است
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)

  // فرم تنظیمات سراسری
  const [buyFee, setBuyFee] = useState('')
  const [gatewayFee, setGatewayFee] = useState('')
  const [lateFee, setLateFee] = useState('')

  const load = useCallback(async () => {
    const [plansRes, settingsRes] = await Promise.all([
      apiGet<{ plans: PlanDto[] }>('/api/v1/admin/installments/plans'),
      apiGet<{ settings: SettingsDto }>('/api/v1/admin/installments/settings'),
    ])
    setError(null)
    if (!plansRes.ok) {
      setError(plansRes.error ?? 'بارگذاری طرح‌ها ناموفق بود')
      return
    }
    setPlans(plansRes.data?.plans ?? [])
    if (settingsRes.ok && settingsRes.data) {
      const s = settingsRes.data.settings
      setSettings(s)
      setBuyFee(String(s.buyFeePercent))
      setGatewayFee(String(s.gatewayFeePercent))
      setLateFee(String(s.lateFeeDailyPercent))
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void load(), 0)
    return () => clearTimeout(t)
  }, [load])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function openEdit(p: PlanDto) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      months: String(p.months),
      downPaymentPercent: p.downPaymentPercent,
      interestRate: p.interestRate,
      fee: p.fee,
      minAmountMillion: String(Number(p.minAmount) / 1_000_000),
      maxAmountMillion: String(Number(p.maxAmount) / 1_000_000),
      serviceFeePer10MMillion: String(Number(p.serviceFeePer10M) / 1_000_000),
    })
  }

  function closeForm() {
    setForm(null)
    setEditingId(null)
  }

  async function savePlan() {
    if (!form || busy) return
    setBusy(true)
    setError(null)
    setDone(null)

    const payload = {
      name: form.name.trim(),
      months: Math.round(num(form.months)),
      downPaymentPercent: num(form.downPaymentPercent),
      interestRate: num(form.interestRate),
      fee: num(form.fee),
      minAmount: toToman(form.minAmountMillion),
      maxAmount: toToman(form.maxAmountMillion),
      serviceFeePer10M: toToman(form.serviceFeePer10MMillion),
    }
    if (!payload.name || !Number.isFinite(payload.months) || payload.months < 1) {
      setError('نام و تعداد ماه معتبر الزامی است')
      setBusy(false)
      return
    }

    const res = editingId
      ? await apiPut('/api/v1/admin/installments/plans', { id: editingId, ...payload })
      : await apiPost('/api/v1/admin/installments/plans', payload)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ذخیره ناموفق بود')
      return
    }
    setDone(
      editingId ? 'طرح به‌روزرسانی شد.' : 'طرح جدید ایجاد شد و بلافاصله در سایت نمایش داده می‌شود.',
    )
    closeForm()
    await load()
  }

  async function toggleActive(p: PlanDto) {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPut('/api/v1/admin/installments/plans', { id: p.id, active: !p.active })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'تغییر وضعیت ناموفق بود')
      return
    }
    setDone(p.active ? 'طرح غیرفعال شد و از سایت حذف شد.' : 'طرح فعال شد.')
    await load()
  }

  async function saveSettings() {
    if (busy) return
    setBusy(true)
    setError(null)
    setDone(null)
    const res = await apiPut('/api/v1/admin/installments/settings', {
      buyFeePercent: num(buyFee),
      gatewayFeePercent: num(gatewayFee),
      lateFeeDailyPercent: num(lateFee),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ذخیره تنظیمات ناموفق بود')
      return
    }
    setDone('تنظیمات کارمزد ذخیره شد — حداکثر ۳۰ ثانیه بعد در کل سایت اعمال می‌شود.')
    await load()
  }

  const input = (v: string, set: (s: string) => void) => ({
    value: v,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value),
  })

  return (
    <div>
      <AdminPageHeader
        title="مدیریت طرح‌های اقساطی"
        eyebrow="محصولات — خرید قسطی"
        description="طرح‌ها و کارمزدها بلافاصله و به‌صورت پویا در سایت اعمال می‌شوند"
      />

      <div className="mt-4 max-w-3xl space-y-5">
        {error && (
          <p
            role="alert"
            className="text-error bg-error/10 flex items-center gap-2 rounded-xl p-3 text-xs"
          >
            <IconAlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {done && (
          <p
            role="status"
            className="text-success bg-success/10 flex items-center gap-2 rounded-xl p-3 text-xs"
          >
            <IconCircleCheck className="size-4 shrink-0" aria-hidden="true" />
            {done}
          </p>
        )}

        {/* ---------- فرم ایجاد/ویرایش طرح ---------- */}
        {form && canManage && (
          <div className="border-gold-500/40 bg-gold-500/5 space-y-3 rounded-xl border p-4">
            <p className="text-foreground text-xs font-bold">
              {editingId ? 'ویرایش طرح' : 'طرح جدید'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 block space-y-1">
                <span className="text-muted-foreground text-[11px] font-medium">نام طرح</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثلاً: طرح ویژه ۱۲ ماهه"
                  className="border-border/60 bg-background text-foreground focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none"
                />
              </label>
              <Field
                label="تعداد ماه"
                hint="۱ تا ۶۰ ماه"
                {...input(form.months, (v) => setForm({ ...form, months: v }))}
              />
              <Field
                label="پیش‌پرداخت (٪)"
                hint="۰ تا ۹۰ درصد"
                {...input(form.downPaymentPercent, (v) =>
                  setForm({ ...form, downPaymentPercent: v }),
                )}
              />
              <Field
                label="نرخ سود سالانه (٪)"
                {...input(form.interestRate, (v) => setForm({ ...form, interestRate: v }))}
              />
              <Field
                label="کارمزد طرح (٪)"
                {...input(form.fee, (v) => setForm({ ...form, fee: v }))}
              />
              <Field
                label="حداقل مبلغ (میلیون تومان)"
                {...input(form.minAmountMillion, (v) => setForm({ ...form, minAmountMillion: v }))}
              />
              <Field
                label="حداکثر مبلغ (میلیون تومان)"
                {...input(form.maxAmountMillion, (v) => setForm({ ...form, maxAmountMillion: v }))}
              />
              <Field
                label="هزینه خدمات هر ۱۰ میلیون (میلیون تومان)"
                hint="به ازای هر ۱۰ میلیون اعتبار؛ مقیاس‌پذیر است"
                {...input(form.serviceFeePer10MMillion, (v) =>
                  setForm({ ...form, serviceFeePer10MMillion: v }),
                )}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeForm}
                className="text-muted-foreground hover:text-foreground h-8 rounded-lg px-3 text-xs font-medium"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => void savePlan()}
                disabled={busy}
                className="bg-gold-500 text-navy-950 hover:bg-gold-600 h-8 rounded-lg px-4 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {busy ? 'در حال ذخیره…' : editingId ? 'ذخیره تغییرات' : 'ایجاد طرح'}
              </button>
            </div>
          </div>
        )}

        {/* ---------- لیست طرح‌ها ---------- */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground text-xs font-bold">طرح‌ها</p>
            {canManage && !form && (
              <button
                type="button"
                onClick={openCreate}
                className="border-gold-500/50 text-gold-700 dark:text-gold-400 hover:bg-gold-500/10 inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-bold"
              >
                <IconPlus className="size-3.5" aria-hidden="true" />
                طرح جدید
              </button>
            )}
          </div>

          {!plans ? (
            <div className="skeleton-shimmer h-32 rounded-xl" />
          ) : plans.length === 0 ? (
            <p className="text-muted-foreground bg-muted/40 rounded-xl p-6 text-center text-xs">
              هنوز طرحی تعریف نشده است — با دکمه «طرح جدید» اولین طرح را بسازید.
            </p>
          ) : (
            <ul className="border-border/60 divide-border/40 divide-y overflow-hidden rounded-xl border">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="bg-card flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground text-xs font-bold">{p.name}</p>
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                          p.active
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {p.active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-[10px] tabular-nums">
                      {faNum(p.months)} ماه · پیش‌پرداخت {faNum(p.downPaymentPercent)}٪ · سود{' '}
                      {faNum(p.interestRate)}٪ · {fmtM(p.minAmount)} تا {fmtM(p.maxAmount)} میلیون ·
                      هزینه خدمات {fmtM(p.serviceFeePer10M)} میلیون/۱۰م
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-medium"
                      >
                        <IconPencil className="size-3" aria-hidden="true" />
                        ویرایش
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleActive(p)}
                        disabled={busy}
                        className={cn(
                          'inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold disabled:opacity-50',
                          p.active
                            ? 'bg-error/10 text-error hover:bg-error/20'
                            : 'bg-success/10 text-success hover:bg-success/20',
                        )}
                      >
                        {p.active ? (
                          <>
                            <IconX className="size-3" strokeWidth={2.25} />
                            غیرفعال
                          </>
                        ) : (
                          <>
                            <IconCoin className="size-3" strokeWidth={2.25} />
                            فعال
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ---------- تنظیمات کارمزد سراسری ---------- */}
        <div>
          <p className="text-foreground mb-2 text-xs font-bold">کارمزدهای سراسری</p>
          <div className="border-border/60 bg-card space-y-3 rounded-xl border p-4">
            <p className="text-muted-foreground text-[10px] leading-5">
              این درصدها برای همه طرح‌ها اعمال می‌شوند. تغییرات حداکثر ۳۰ ثانیه بعد در محاسبه‌گر و
              صورتحساب کاربران اعمال می‌شود.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="کارمزد خرید (٪)"
                hint="درصد از اعتبار"
                disabled={!canManage}
                {...input(buyFee, setBuyFee)}
              />
              <Field
                label="کارمزد درگاه (٪)"
                hint="درصد از اعتبار"
                disabled={!canManage}
                {...input(gatewayFee, setGatewayFee)}
              />
              <Field
                label="جریمه دیرکرد (٪ روزانه)"
                disabled={!canManage}
                {...input(lateFee, setLateFee)}
              />
            </div>
            {canManage && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={busy}
                  className="bg-navy-700 text-cream-50 hover:bg-navy-600 h-8 rounded-lg px-4 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {busy ? 'در حال ذخیره…' : 'ذخیره کارمزدها'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
