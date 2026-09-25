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
  IconPlus,
  IconStar,
  IconTrash,
} from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { apiPost, apiDelete } from '@/lib/api/client'
import { detectBank, maskIban, maskCardPan, type BankInfo } from '@/lib/banks'

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

function BankCardFace({
  bank,
  alias,
  cardPan,
  iban,
  isDefault,
}: {
  bank: BankInfo
  alias: string | null
  cardPan: string | null
  iban: string
  isDefault: boolean
}) {
  return (
    <div
      className="relative flex h-40 w-64 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-4 shadow-md"
      style={{ background: `linear-gradient(135deg, ${bank.from}, ${bank.to})`, color: bank.text }}
    >
      {/* الگوی تزئینی کارت */}
      <div
        aria-hidden="true"
        className="absolute -top-10 -left-10 size-40 rounded-full bg-white/10 blur-xl"
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium opacity-80">{bank.name}</p>
          {alias && <p className="mt-0.5 text-xs font-bold">{alias}</p>}
        </div>
        {isDefault && (
          <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            <IconStar className="size-3" aria-hidden="true" />
            پیش‌فرض
          </span>
        )}
      </div>
      <div className="relative space-y-1.5" dir="ltr">
        {cardPan ? (
          <p className="text-sm font-bold tracking-wider tabular-nums">{maskCardPan(cardPan)}</p>
        ) : (
          <p className="text-sm font-bold tracking-wider opacity-60">•••• •••• •••• ••••</p>
        )}
        <p className="text-[10px] tabular-nums opacity-75">{maskIban(iban)}</p>
      </div>
    </div>
  )
}

interface BankCardsProps {
  accounts: BankAccountRow[]
  online: boolean
  onChanged: () => void
}

export function BankCards({ accounts, online, onChanged }: BankCardsProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [iban, setIban] = useState('')
  const [cardPan, setCardPan] = useState('')
  const [alias, setAlias] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // پیش‌نمایش زنده کارت بر اساس شبای واردشده
  const normalizedIban = iban.replace(/\s/g, '').toUpperCase()
  const previewBank =
    normalizedIban.length >= 7 ? detectBank(normalizedIban) : detectBank('IR000000')
  const canAdd = accounts.length < MAX_CARDS

  async function submit() {
    setError(null)
    if (!/^IR\d{24}$/.test(normalizedIban)) {
      setError('شماره شبا باید با IR شروع و ۲۶ کاراکتر باشد')
      return
    }
    if (cardPan && !/^\d{16}$/.test(cardPan)) {
      setError('شماره کارت باید ۱۶ رقم باشد')
      return
    }
    setBusy(true)
    const res = await apiPost('/api/v1/bank-accounts', {
      iban: normalizedIban,
      cardPan: cardPan || undefined,
      alias: alias || undefined,
    })
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت کارت ناموفق بود')
      return
    }
    setSheetOpen(false)
    setIban('')
    setCardPan('')
    setAlias('')
    onChanged()
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
            onClick={() => setSheetOpen(true)}
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
              onClick={() => setSheetOpen(true)}
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
                  bank={detectBank(a.iban)}
                  alias={a.alias}
                  cardPan={a.cardPan}
                  iban={a.iban}
                  isDefault={a.isDefault}
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
                onClick={() => setSheetOpen(true)}
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

        {/* شیت افزودن کارت */}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="افزودن کارت بانکی">
          <div className="space-y-4">
            {/* پیش‌نمایش زنده */}
            <div className="flex justify-center">
              <BankCardFace
                bank={previewBank}
                alias={alias || null}
                cardPan={cardPan || null}
                iban={normalizedIban || 'IR0000000000000000000000'}
                isDefault={false}
              />
            </div>
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">شماره شبا</span>
              <input
                type="text"
                dir="ltr"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase().replace(/[^\dA-Z]/g, ''))}
                placeholder="IR062960000000100324200001"
                maxLength={26}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">شماره کارت (اختیاری)</span>
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={cardPan}
                onChange={(e) => setCardPan(e.target.value.replace(/[^\d]/g, '').slice(0, 16))}
                placeholder="6219861034529007"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-muted-foreground text-[11px]">نام مستعار (اختیاری)</span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value.slice(0, 50))}
                placeholder="مثلاً حساب اصلی"
                className={inputClass}
              />
            </label>
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
            <Button className="w-full" onClick={submit} disabled={busy || !online}>
              {busy ? 'در حال ثبت…' : 'ثبت کارت'}
            </Button>
          </div>
        </BottomSheet>
      </CardContent>
    </Card>
  )
}
