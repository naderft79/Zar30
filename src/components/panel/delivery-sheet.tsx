// ============================================
// Zar30 - Physical Delivery Sheet (Assets v2)
// ============================================
// شیت درخواست تحویل فیزیکی طلا — ≥۱ گرم، روش پستی یا تحویل حضوری
//   دفترچه آدرس (انتخاب/افزودن)، متن توضیح هزینه، OTP مالی
//   طلا قفل نمی‌شود — فقط موجودی آزاد در زمان ثبت چک می‌شود
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconAlertTriangle, IconMapPin, IconPackage, IconPlus } from '@tabler/icons-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { FinancialOtp } from './financial-otp'
import { CoinsSection } from './coins-section'
import { cn } from 'cn'

const inputClass =
  'border-border/60 bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none'

interface AddressRow {
  id: string
  title: string | null
  recipientName: string
  mobile: string
  province: string | null
  city: string | null
  address: string
  postalCode: string
  isDefault: boolean
}

interface DeliverySheetProps {
  open: boolean
  onClose: () => void
  online: boolean
  onCompleted: () => void
}

export function DeliverySheet({ open, onClose, online, onCompleted }: DeliverySheetProps) {
  // تب — طلای آب‌شده یا تبدیل به سکه/شمش
  const [tab, setTab] = useState<'GOLD' | 'COINS'>('GOLD')
  const [grams, setGrams] = useState('')
  const [method, setMethod] = useState<'POST' | 'PICKUP'>('POST')
  const [addresses, setAddresses] = useState<AddressRow[]>([])
  const [addressId, setAddressId] = useState<string | null>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // فیلدهای آدرس جدید
  const [recipientName, setRecipientName] = useState('')
  const [addrMobile, setAddrMobile] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [addrText, setAddrText] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const res = await apiGetWithRefresh<{ addresses: AddressRow[] }>('/api/v1/addresses')
      if (res.ok) {
        const list = res.data?.addresses ?? []
        setAddresses(list)
        const def = list.find((a) => a.isDefault) ?? list[0]
        setAddressId(def?.id ?? null)
      }
    })()
  }, [open])

  function reset() {
    setTab('GOLD')
    setGrams('')
    setMethod('POST')
    setShowNewAddress(false)
    setOtpCode('')
    setError(null)
    setDone(false)
    setBusy(false)
    setRecipientName('')
    setAddrMobile('')
    setProvince('')
    setCity('')
    setAddrText('')
    setPostalCode('')
  }

  async function submit() {
    setError(null)
    if (!/^\d+(\.\d{1,6})?$/.test(grams) || Number(grams) < 1) {
      setError('حداقل ۱ گرم طلا قابل تحویل است')
      return
    }
    if (method === 'POST' && !addressId && !showNewAddress) {
      setError('برای ارسال پستی، آدرس را انتخاب یا ثبت کنید')
      return
    }
    if (!/^\d{4,8}$/.test(otpCode)) {
      setError('کد تایید پیامکی را وارد کنید')
      return
    }

    setBusy(true)
    // اگر آدرس جدید است، اول ثبت می‌شود
    let finalAddressId = addressId
    if (method === 'POST' && showNewAddress) {
      const addrRes = await apiPost<{ address: { id: string } }>('/api/v1/addresses', {
        recipientName: recipientName.trim(),
        mobile: addrMobile,
        province: province || undefined,
        city: city || undefined,
        address: addrText.trim(),
        postalCode,
      })
      if (!addrRes.ok) {
        setBusy(false)
        setError(addrRes.error ?? 'ثبت آدرس ناموفق بود')
        return
      }
      finalAddressId = addrRes.data!.address.id
    }

    const res = await apiPost(
      '/api/v1/delivery',
      {
        grams,
        method,
        ...(method === 'POST' ? { addressId: finalAddressId } : {}),
        otpCode,
      },
      { 'Idempotency-Key': crypto.randomUUID() },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت درخواست ناموفق بود')
      return
    }
    setDone(true)
    onCompleted()
  }

  const newAddressValid =
    recipientName.trim().length >= 3 &&
    /^09\d{9}$/.test(addrMobile) &&
    addrText.trim().length >= 10 &&
    /^\d{10}$/.test(postalCode)

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="تحویل فیزیکی طلا"
    >
      {done ? (
        <div className="space-y-4 py-4 text-center">
          <p className="text-success text-sm font-bold">درخواست تحویل ثبت شد</p>
          <p className="text-muted-foreground text-xs leading-5">
            درخواست شما در صف بررسی قرار گرفت؛ وضعیت آن را در سوابق تحویل‌ها دنبال کنید.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            بستن
          </Button>
        </div>
      ) : (
        <>
          {/* تب — طلای آب‌شده یا سکه/شمش */}
          <div className="bg-muted/60 mb-4 grid grid-cols-2 gap-1 rounded-xl p-1">
            {(
              [
                { key: 'GOLD', label: 'طلای آب‌شده' },
                { key: 'COINS', label: 'سکه و شمش' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-lg py-2 text-xs font-semibold transition-colors',
                  tab === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'COINS' ? (
            <CoinsSection online={online} onChanged={onCompleted} />
          ) : (
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-muted-foreground text-[11px]">
                  مقدار طلا (گرم) — حداقل ۱ گرم
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="1"
                  className={cn(inputClass, 'tabular-nums')}
                />
              </label>

              {/* روش تحویل */}
              <div className="bg-muted/60 grid grid-cols-2 gap-1 rounded-xl p-1">
                {(
                  [
                    { key: 'POST', label: 'ارسال پستی' },
                    { key: 'PICKUP', label: 'تحویل حضوری' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={cn(
                      'rounded-lg py-2 text-xs font-semibold transition-colors',
                      method === key
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {method === 'PICKUP' && (
                <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
                  پس از تایید درخواست، محل و زمان تحویل حضوری از طریق پشتیبانی با شما هماهنگ می‌شود.
                </p>
              )}

              {/* دفترچه آدرس — فقط برای ارسال پستی */}
              {method === 'POST' && !showNewAddress && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-[11px]">آدرس تحویل</p>
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAddressId(a.id)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-xl border p-3 text-right transition-colors',
                        addressId === a.id
                          ? 'border-gold-500 bg-gold-500/8'
                          : 'border-border/60 hover:border-gold-500/40',
                      )}
                    >
                      <IconMapPin
                        className={cn(
                          'mt-0.5 size-4.5 shrink-0',
                          addressId === a.id ? 'text-gold-600' : 'text-muted-foreground',
                        )}
                        stroke={1.75}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="text-foreground block text-xs font-bold">
                          {a.title || a.recipientName}
                          {a.isDefault && (
                            <span className="text-gold-600 ms-1.5 text-[10px]">پیش‌فرض</span>
                          )}
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-[10px] leading-4">
                          {a.province}، {a.city} — {a.address}
                        </span>
                      </span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddress(true)
                      setAddressId(null)
                    }}
                    className="text-gold-600 hover:text-gold-700 flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                  >
                    <IconPlus className="size-4" aria-hidden="true" />
                    ثبت آدرس جدید
                  </button>
                </div>
              )}

              {/* فرم آدرس جدید */}
              {method === 'POST' && showNewAddress && (
                <div className="border-border/60 space-y-3 rounded-xl border p-3">
                  <p className="text-foreground text-xs font-bold">آدرس جدید</p>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="نام و نام خانوادگی گیرنده"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={addrMobile}
                    onChange={(e) =>
                      setAddrMobile(e.target.value.replace(/[^\d]/g, '').slice(0, 11))
                    }
                    placeholder="موبایل گیرنده (09…)"
                    className={cn(inputClass, 'tabular-nums')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="استان"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="شهر"
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    value={addrText}
                    onChange={(e) => setAddrText(e.target.value)}
                    placeholder="آدرس کامل پستی"
                    rows={2}
                    className={cn(inputClass, 'h-auto py-2 leading-6')}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={postalCode}
                    onChange={(e) =>
                      setPostalCode(e.target.value.replace(/[^\d]/g, '').slice(0, 10))
                    }
                    placeholder="کد پستی ۱۰ رقمی"
                    className={cn(inputClass, 'tabular-nums')}
                  />
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAddress(false)
                        setAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id)
                      }}
                      className="text-muted-foreground text-[11px] font-semibold"
                    >
                      ← انتخاب از آدرس‌های ثبت‌شده
                    </button>
                  )}
                </div>
              )}

              {/* توضیح هزینه — متن ساده به‌جای ماشین‌حساب */}
              <p className="text-muted-foreground bg-muted/50 rounded-xl p-3 text-[11px] leading-5">
                <IconPackage
                  className="text-gold-600 me-1 mb-0.5 inline size-4"
                  aria-hidden="true"
                />
                هزینه بسته‌بندی، بیمه و ارسال پس از بررسی درخواست محاسبه و قبل از ارسال نهایی به شما
                اعلام می‌شود. طلای شما تا زمان تایید نهایی در کیف پول باقی می‌ماند.
              </p>

              {/* OTP مالی */}
              <div className="border-border/50 space-y-2 border-t pt-3">
                <p className="text-muted-foreground text-[11px]">تایید امنیتی</p>
                <FinancialOtp value={otpCode} onChange={setOtpCode} disabled={!online} />
              </div>

              {error && (
                <p role="alert" className="text-error flex items-center gap-1.5 text-xs">
                  <IconAlertTriangle className="size-3.5" aria-hidden="true" />
                  {error}
                </p>
              )}

              <Button
                className="w-full"
                onClick={submit}
                disabled={
                  busy || !online || (method === 'POST' && showNewAddress && !newAddressValid)
                }
                title={!online ? 'اتصال اینترنت برقرار نیست' : undefined}
              >
                {!online ? 'آفلاین' : busy ? 'در حال ثبت…' : 'ثبت درخواست تحویل'}
              </Button>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  )
}
