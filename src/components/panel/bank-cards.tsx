// ============================================
// Zar30 - Bank Cards Section (Assets v2)
// ============================================
// کارت‌های بانکی کاربر — اسکرول افقی، گرادیانت واقعی بانک
// افزودن (پیش‌نمایش زنده)، حذف، پیش‌فرض — حداکثر ۵ کارت
// هشدار «شبا باید به نام خودتان باشد» — طبق قوانین پلتفرم‌های طلا
// ============================================

'use client'

import { useState } from 'react'
import {
  IconAlertTriangle,
  IconCreditCard,
  IconLoader2,
  IconPlus,
  IconStar,
  IconTrash,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { apiPost, apiGet, apiDelete } from '@/lib/api/client'
import { detectBank, detectBankByCard, type BankInfo } from '@/lib/banks'
import { usePanelUser } from './panel-shell'

export interface BankAccountRow {
  id: string
  bankCode: string
  bankName: string
  iban: string
  cardPan: string | null
  alias: string | null
  isDefault: boolean
}

const MAX_CARDS = 5

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm tabular-nums focus-visible:ring-2 focus-visible:outline-none'

// چیپ طلایی EMV — مشابه کارت‌های بانکی واقعی
function CardChip() {
  return (
    <div
      aria-hidden="true"
      className="relative h-6 w-8 shrink-0 overflow-hidden rounded-md"
      style={{
        background: 'linear-gradient(135deg, #f0d78a 0%, #d4af37 45%, #a07c1c 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
      }}
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/30" />
      <span className="absolute inset-y-0 left-1/3 w-px bg-black/25" />
      <span className="absolute inset-y-0 right-1/3 w-px bg-black/25" />
      <span className="absolute top-1/2 left-1/2 h-3 w-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-black/30" />
    </div>
  )
}

// قالب‌بندی کامل شماره کارت و شبا — بدون ستاره
function formatPan(pan: string) {
  return pan.replace(/(\d{4})(?=\d)/g, '$1 ')
}
function formatIban(iban: string) {
  // قالب شبا: IR + ۲ رقم کنترلی، سپس گروه‌های ۴ رقمی، و ۲ رقم پایانی
  const head = iban.slice(0, 4)
  const rest = iban.slice(4)
  const body = rest.slice(0, -2).replace(/(\d{4})(?=\d)/g, '$1 ')
  return `${head} ${body} ${rest.slice(-2)}`
}

function BankCardFace({
  bank,
  cardPan,
  iban,
  isDefault,
  holderName,
}: {
  bank: BankInfo
  cardPan: string | null
  iban: string
  isDefault: boolean
  holderName: string
}) {
  return (
    <div
      className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl p-4 shadow-md"
      dir="ltr"
      style={{ background: `linear-gradient(135deg, ${bank.from}, ${bank.to})`, color: bank.text }}
    >
      {/* الگوی تزئینی کارت */}
      <div
        aria-hidden="true"
        className="absolute -top-10 -left-10 size-40 rounded-full bg-white/10 blur-xl"
      />
      {/* بانک — گوشه بالا سمت راست: لوگو + نام */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <p className="text-[11px] font-semibold">{bank.name}</p>
        {bank.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bank.logo} alt="" className="size-6 object-contain" />
        )}
      </div>
      {/* بج پیش‌فرض — گوشه بالا سمت چپ */}
      {isDefault && (
        <span className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
          <IconStar className="size-3" aria-hidden="true" />
          پیش‌فرض
        </span>
      )}
      {/* چیپ طلایی — کمی بالای وسط، سمت چپ */}
      <div className="absolute top-[44%] left-3 -translate-y-1/2">
        <CardChip />
      </div>
      {/* شماره کارت و شبا — مرکز عمودی، کمی راست‌تر و دور از چیپ */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pl-12">
        <p className="text-sm font-bold tracking-wider tabular-nums">
          {cardPan ? formatPan(cardPan) : '•••• •••• •••• ••••'}
        </p>
        <p className="text-[10px] tracking-wider tabular-nums opacity-80">
          {formatIban(iban || 'IR000000000000000000000000')}
        </p>
      </div>
      {/* نام و نام خانوادگی دارنده — گوشه پایین سمت راست */}
      <p
        dir="rtl"
        className="absolute right-4 bottom-4 max-w-[70%] truncate text-[11px] font-semibold tracking-wide"
      >
        {holderName}
      </p>
    </div>
  )
}

interface BankCardsProps {
  accounts: BankAccountRow[]
  online: boolean
  onChanged: () => void
}

export function BankCards({ accounts, online, onChanged }: BankCardsProps) {
  const { user } = usePanelUser()
  const holderName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile
  const [sheetOpen, setSheetOpen] = useState(false)
  const [iban, setIban] = useState('')
  const [cardPan, setCardPan] = useState('')
  // وضعیت resolve خودکار شبا از شماره کارت — resolving | resolved | failed | null
  const [ibanState, setIbanState] = useState<'resolving' | 'resolved' | 'failed' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // پیش‌نمایش زنده کارت — با ۶ رقم شماره کارت از BIN، وگرنه از شبا
  const normalizedIban = iban.replace(/\s/g, '').toUpperCase()
  const cardBank = cardPan.length >= 6 ? detectBankByCard(cardPan) : null
  const previewBank =
    cardBank && cardBank.name !== 'بانک'
      ? cardBank
      : detectBank(normalizedIban.length >= 7 ? normalizedIban : 'IR000000')

  // کارت ذخیره‌شده — لوگو از BIN کارت، رنگ از شبا
  function bankFor(a: BankAccountRow): BankInfo {
    const base = detectBank(a.iban)
    const byCard = a.cardPan && a.cardPan.length >= 6 ? detectBankByCard(a.cardPan) : null
    return byCard && byCard.name !== 'بانک' ? { ...base, logo: byCard.logo } : base
  }
  const canAdd = accounts.length < MAX_CARDS

  // با کامل شدن ۱۶ رقم کارت، شبا خودکار از سرور resolve می‌شود
  async function resolveCard(pan: string) {
    if (pan.length !== 16) return
    setIbanState('resolving')
    const res = await apiGet<{ iban: string | null }>(
      `/api/v1/bank-accounts/resolve-card?pan=${pan}`,
    )
    if (!res.ok || !res.data?.iban) {
      setIbanState('failed')
      setIban('')
      return
    }
    setIban(res.data.iban)
    setIbanState('resolved')
  }

  function onCardPanChange(v: string) {
    setCardPan(v)
    setIbanState(null)
    setIban('')
    if (v.length === 16) void resolveCard(v)
  }

  async function submit() {
    setError(null)
    if (!/^\d{16}$/.test(cardPan)) {
      setError('شماره کارت باید ۱۶ رقم باشد')
      return
    }
    // شبا یا resolve شده یا باید دستی وارد شود
    if (ibanState !== 'resolved' && !/^IR\d{24}$/.test(normalizedIban)) {
      setError('شماره شبا باید ۲۴ رقم باشد')
      return
    }
    setBusy(true)
    const res = await apiPost('/api/v1/bank-accounts', {
      cardPan,
      ...(normalizedIban ? { iban: normalizedIban } : {}),
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت کارت ناموفق بود')
      return
    }
    setSheetOpen(false)
    setIban('')
    setCardPan('')
    setIbanState(null)
    onChanged()
  }

  // باز کردن مودال — فرم تمیز
  function openSheet() {
    setIban('')
    setCardPan('')
    setIbanState(null)
    setError(null)
    setSheetOpen(true)
  }

  async function remove(id: string) {
    const res = await apiDelete(`/api/v1/bank-accounts/${id}`)
    if (res.ok) onChanged()
  }

  async function makeDefault(id: string) {
    const res = await apiPost(`/api/v1/bank-accounts/${id}/default`, {})
    if (res.ok) onChanged()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconCreditCard className="text-gold-600 size-5" stroke={1.75} />
          کارت‌های بانکی
        </CardTitle>
        {canAdd ? (
          <button
            type="button"
            onClick={openSheet}
            disabled={!online}
            aria-label="افزودن کارت بانکی"
            className="text-gold-600 hover:text-gold-700 flex items-center gap-1 text-[11px] font-semibold transition-colors"
          >
            <IconPlus className="size-4" aria-hidden="true" />
            افزودن کارت
          </button>
        ) : (
          <span className="text-muted-foreground text-[10px] tabular-nums">
            {accounts.length}/{MAX_CARDS}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.length === 0 ? (
          <div className="space-y-3">
            <EmptyState
              icon={IconCreditCard}
              title="کارتی ثبت نشده است"
              description="برای برداشت سریع، شبای بانکی خود را ثبت کنید — باید به نام خودتان باشد."
            />
            <button
              type="button"
              onClick={openSheet}
              disabled={!online}
              className="border-border/70 hover:border-gold-500/50 hover:bg-gold-500/5 text-muted-foreground mx-auto flex h-24 w-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors"
            >
              <IconPlus className="text-gold-600 size-6" stroke={1.75} />
              <span className="text-[10px] font-semibold">ثبت کارت جدید</span>
            </button>
          </div>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {accounts.map((a) => (
              <div key={a.id} className="shrink-0">
                <BankCardFace
                  bank={bankFor(a)}
                  cardPan={a.cardPan}
                  iban={a.iban}
                  isDefault={a.isDefault}
                  holderName={holderName}
                />
                <div className="mt-2 flex items-center gap-1.5">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(a.id)}
                      disabled={!online}
                      className="text-muted-foreground hover:text-gold-600 text-[10px] font-semibold transition-colors"
                    >
                      پیش‌فرض کن
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={!online}
                    aria-label="حذف کارت"
                    className="text-muted-foreground hover:text-error ms-auto flex items-center gap-1 text-[10px] font-semibold transition-colors"
                  >
                    <IconTrash className="size-3" aria-hidden="true" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
            {canAdd && (
              <button
                type="button"
                onClick={openSheet}
                disabled={!online}
                className="border-border/70 hover:border-gold-500/50 hover:bg-gold-500/5 flex h-40 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors"
              >
                <IconPlus className="text-gold-600 size-6" stroke={1.75} />
                <span className="text-muted-foreground text-[10px] font-semibold">افزودن کارت</span>
              </button>
            )}
          </div>
        )}
        {accounts.length > 0 && !canAdd && (
          <p className="text-muted-foreground text-[10px]">حداکثر {MAX_CARDS} کارت قابل ثبت است</p>
        )}

        {/* مودال افزودن کارت — موبایل تقریباً تمام‌صفحه، دسکتاپ مرکزی */}
        <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
          <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 max-sm:h-[calc(100dvh-1.5rem)]">
            <DialogHeader className="border-border/50 border-b px-5 pt-5 pb-4">
              <DialogTitle>افزودن کارت بانکی</DialogTitle>
            </DialogHeader>
            <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
              {/* پیش‌نمایش زنده */}
              <div className="flex justify-center">
                <BankCardFace
                  bank={previewBank}
                  cardPan={cardPan || null}
                  iban={normalizedIban || 'IR000000000000000000000000'}
                  isDefault={false}
                  holderName={holderName}
                />
              </div>
              <label className="block space-y-1.5">
                <span className="text-muted-foreground text-[11px]">شماره کارت</span>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={cardPan}
                  onChange={(e) =>
                    onCardPanChange(e.target.value.replace(/[^\d]/g, '').slice(0, 16))
                  }
                  placeholder="6219861034529007"
                  maxLength={16}
                  className={inputClass}
                />
                {/* تشخیص بانک از ۶ رقم اول کارت */}
                {cardBank && cardBank.name !== 'بانک' && (
                  <span className="text-muted-foreground flex items-center gap-1.5 pt-0.5 text-[11px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cardBank.logo} alt="" className="size-4 object-contain" />
                    {cardBank.name}
                  </span>
                )}
              </label>
              {/* شبا — خودکار از شماره کارت؛ فقط در صورت شکست resolve قابل ویرایش */}
              {ibanState === 'resolving' && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <IconLoader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  در حال تشخیص شبا از شماره کارت…
                </p>
              )}
              {ibanState === 'resolved' && (
                <label className="block space-y-1.5">
                  <span className="text-muted-foreground text-[11px]">
                    شماره شبا — خودکار از کارت
                  </span>
                  <input
                    type="text"
                    dir="ltr"
                    value={iban}
                    readOnly
                    aria-readonly="true"
                    className={`${inputClass} bg-muted/50 cursor-default`}
                  />
                </label>
              )}
              {ibanState === 'failed' && (
                <label className="block space-y-1.5">
                  <span className="text-muted-foreground text-[11px]">شماره شبا (۲۴ رقم)</span>
                  <input
                    type="text"
                    dir="ltr"
                    value={iban}
                    onChange={(e) => {
                      // IR خودکار — با یا بدون تایپ IR، فقط ۲۴ رقم پذیرفته می‌شود
                      const raw = e.target.value.toUpperCase().replace(/[^\dA-Z]/g, '')
                      if (!raw) return setIban('')
                      const digits = raw.replace(/\D/g, '')
                      setIban(`IR${digits}`.slice(0, 26))
                    }}
                    placeholder="IR062960000000100324200001"
                    maxLength={26}
                    className={inputClass}
                  />
                  <span className="text-muted-foreground text-[10px]">
                    تشخیص خودکار ممکن نشد — شبا را دستی وارد کنید
                  </span>
                </label>
              )}
              {/* هشدار قانونی — الزامی در پلتفرم‌های طلای ایران */}
              <p className="text-warning bg-warning/10 flex items-start gap-2 rounded-xl p-3 text-[11px] leading-5">
                <IconAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                شماره شبا و کارت باید به نام خودتان باشد؛ تسویه فقط به حساب هم‌نام انجام می‌شود.
              </p>
              {error && (
                <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                  <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>
            {/* اکشن — چسبیده به پایین مودال */}
            <div className="border-border/50 border-t px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button className="w-full" onClick={submit} disabled={busy || !online}>
                {busy ? 'در حال ثبت…' : 'ثبت کارت'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
