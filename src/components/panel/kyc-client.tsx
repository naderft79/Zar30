// ============================================
// Zar30 - KYC Client (Phase 4)
// ============================================
// احراز هویت چندمرحله‌ای — داخل پروفایل
// State machine سرور: NOT_STARTED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED
// این کامپوننت فقط رندر و draft-save است — تصمیم نهایی همیشه سرور است
// ============================================

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Camera,
  Check,
  CreditCard,
  FileImage,
  Fingerprint,
  Landmark,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from './page-header'
import { jalaliToGregorian, gregorianToJalali, jalaliMonthLength } from '@/lib/utils/jalali'

// ---------- Types (قرارداد GET /api/v1/kyc) ----------
interface KycDoc {
  id: string
  kind: 'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'SELFIE'
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

interface KycSubmission {
  id: string
  level: string
  status:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'NEEDS_RESUBMISSION'
  firstName: string | null
  lastName: string | null
  nationalCode: string | null
  shenasnamehNo: string | null
  birthDate: string | null
  currentStep: number
  submittedAt: string | null
  rejectionReason: string | null
  createdAt: string
  bankComplete: boolean
  cardMasked: string | null
  ibanMasked: string | null
  documents: KycDoc[]
}

interface KycStatusResponse {
  kycLevel: string
  active: KycSubmission | null
  history: KycSubmission[]
}

const KYC_LEVEL_LABELS: Record<string, string> = {
  LEVEL_0: 'احراز نشده',
  LEVEL_1: 'سطح ۱ — موبایل تایید شده',
  LEVEL_2: 'سطح ۲ — هویتی',
  LEVEL_3: 'سطح ۳ — کامل',
}

const STATUS_META: Record<
  KycSubmission['status'],
  { label: string; tone: 'success' | 'warning' | 'error' | 'info' | 'neutral'; desc: string }
> = {
  NOT_STARTED: { label: 'شروع نشده', tone: 'neutral', desc: 'احراز هویت هنوز آغاز نشده است.' },
  IN_PROGRESS: {
    label: 'در حال تکمیل',
    tone: 'info',
    desc: 'اطلاعات شما ذخیره می‌شود — هر وقت برگردید ادامه می‌دهید.',
  },
  SUBMITTED: {
    label: 'ارسال شده',
    tone: 'info',
    desc: 'مدارک شما در صف بررسی کارشناسان زرسی قرار گرفت.',
  },
  UNDER_REVIEW: {
    label: 'در حال بررسی',
    tone: 'warning',
    desc: 'کارشناسان در حال بررسی مدارک شما هستند. معمولاً کمتر از ۲۴ ساعت.',
  },
  APPROVED: {
    label: 'تایید شده',
    tone: 'success',
    desc: 'هویت شما تایید شد و سقف خدمات حساب شما ارتقا یافت.',
  },
  REJECTED: {
    label: 'رد شده',
    tone: 'error',
    desc: 'درخواست شما رد شد. می‌توانید با اصلاح اطلاعات دوباره اقدام کنید.',
  },
  NEEDS_RESUBMISSION: {
    label: 'نیاز به اصلاح',
    tone: 'warning',
    desc: 'بخشی از اطلاعات نیاز به اصلاح دارد. لطفاً دوباره ارسال کنید.',
  },
}

const WIZARD_STEPS = [
  { key: 'personal', title: 'اطلاعات شخصی', icon: UserRound },
  { key: 'identity', title: 'اطلاعات هویتی', icon: Fingerprint },
  { key: 'bank', title: 'اطلاعات بانکی', icon: Landmark },
  { key: 'docs', title: 'بارگذاری مدارک', icon: FileImage },
  { key: 'review', title: 'بازبینی و ارسال', icon: BadgeCheck },
] as const

const DOC_SLOTS: {
  kind: KycDoc['kind']
  title: string
  hint: string
  required: boolean
  icon: typeof FileImage
}[] = [
  {
    kind: 'ID_CARD_FRONT',
    title: 'تصویر کارت ملی',
    hint: 'تصویر واضح روی کارت ملی — JPEG، PNG یا WebP تا ۵MB',
    required: true,
    icon: CreditCard,
  },
  {
    kind: 'ID_CARD_BACK',
    title: 'پشت کارت ملی (اختیاری)',
    hint: 'در صورت وجود کارت ملی جدید',
    required: false,
    icon: CreditCard,
  },
  {
    kind: 'SELFIE',
    title: 'سلفی با کارت ملی',
    hint: 'چهره شما در کنار کارت ملی واضح باشد',
    required: false,
    icon: Camera,
  },
]

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const faDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)

export function KycClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<KycStatusResponse | null>(null)

  const load = useCallback(() => {
    return apiGet<KycStatusResponse>('/api/v1/kyc')
      .then((res) => {
        if (res.ok && res.data) setData(res.data)
        else setError(res.error ?? 'خطا در دریافت وضعیت')
        setLoading(false)
      })
      .catch(() => {
        setError('خطای اتصال')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    apiGet<KycStatusResponse>('/api/v1/kyc')
      .then((res) => {
        if (cancelled) return
        if (res.ok && res.data) setData(res.data)
        else setError(res.error ?? 'خطا در دریافت وضعیت')
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('خطای اتصال')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <KycSkeleton />
  if (error || !data) {
    return (
      <div className="animate-stagger space-y-5">
        <PageHeader title="احراز هویت" description="تایید هویت برای فعال‌سازی کامل خدمات" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p role="alert" className="text-error text-sm">
              {error ?? 'خطای ناشناخته'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true)
                setError(null)
                void load()
              }}
            >
              <RefreshCcw className="size-4" />
              تلاش مجدد
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const active = data.active

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="احراز هویت" description="تایید هویت برای فعال‌سازی کامل خدمات زرسی" />

      {!active && (
        <KycIntro kycLevel={data.kycLevel} onStarted={(s) => setData({ ...data, active: s })} />
      )}

      {active?.status === 'IN_PROGRESS' && (
        <Wizard
          submission={active}
          onUpdate={(s) => setData({ ...data, active: s })}
          onDone={load}
        />
      )}

      {active && (active.status === 'SUBMITTED' || active.status === 'UNDER_REVIEW') && (
        <StatusView submission={active} />
      )}

      {active && active.status === 'NEEDS_RESUBMISSION' && (
        <ResubmitView submission={active} onStarted={(s) => setData({ ...data, active: s })} />
      )}

      {/* تاریخچه */}
      {data.history.length > 1 && <HistoryList history={data.history} />}

      {/* سطح فعلی */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-muted-foreground text-sm">سطح احراز هویت فعلی</span>
          <StatusBadge tone={data.kycLevel === 'LEVEL_0' ? 'warning' : 'success'}>
            {KYC_LEVEL_LABELS[data.kycLevel] ?? data.kycLevel}
          </StatusBadge>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Skeleton ----------
function KycSkeleton() {
  return (
    <div
      className="animate-stagger space-y-5"
      aria-busy="true"
      aria-label="در حال بارگذاری احراز هویت"
    >
      <PageHeader title="احراز هویت" description="تایید هویت برای فعال‌سازی کامل خدمات" />
      <Skeleton className="h-44 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

// ---------- Intro (NOT_STARTED / APPROVED) ----------
function KycIntro({
  kycLevel,
  onStarted,
}: {
  kycLevel: string
  onStarted: (s: KycSubmission) => void
}) {
  const [starting, setStarting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const approved = kycLevel !== 'LEVEL_0' && kycLevel !== 'LEVEL_1'

  async function start() {
    setErr(null)
    setStarting(true)
    const res = await apiPost<{ submission: KycSubmission }>('/api/v1/kyc/start')
    setStarting(false)
    if (res.ok && res.data) onStarted(res.data.submission)
    else setErr(res.error ?? 'خطا در شروع')
  }

  return (
    <section
      aria-label="شروع احراز هویت"
      className="surface-wealth gold-rings relative overflow-hidden rounded-2xl border p-6 sm:p-8"
    >
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span className="from-gold-500/30 to-gold-600/15 text-gold-300 ring-gold-500/40 shadow-gold flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-bl ring-1">
          <ShieldCheck className="size-8" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-cream-50 text-lg font-bold text-balance sm:text-xl">
            {approved ? 'هویت شما تایید شده است' : 'احراز هویت سطح ۲'}
          </h2>
          <p className="text-navy-200/80 mt-2 max-w-prose text-sm leading-6 text-pretty">
            {approved
              ? 'احراز هویت شما کامل شده و از تمام خدمات زرسی می‌توانید استفاده کنید.'
              : 'با تکمیل احراز هویت، خرید و فروش طلا، برداشت و خدمات مالی کامل برای شما فعال می‌شود. فرایند کمتر از چند دقیقه طول می‌کشد و اطلاعات شما رمزنگاری‌شده نگه‌داری می‌شود.'}
          </p>
          <ul className="text-navy-200/70 mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
            {['اطلاعات شخصی', 'کد ملی و شناسنامه', 'شبا و کارت بانکی', 'تصویر کارت ملی'].map(
              (s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <Check className="text-gold-500 size-3.5" aria-hidden="true" />
                  {s}
                </li>
              ),
            )}
          </ul>
        </div>
        {!approved && (
          <Button
            variant="gold"
            size="lg"
            onClick={() => void start()}
            disabled={starting}
            className="shrink-0"
          >
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Fingerprint className="size-4" />
            )}
            {starting ? 'در حال شروع…' : 'شروع احراز هویت'}
          </Button>
        )}
      </div>
      {err && (
        <p
          role="alert"
          className="bg-error/10 text-error relative mt-4 rounded-lg px-3 py-2 text-sm"
        >
          {err}
        </p>
      )}
    </section>
  )
}

// ---------- Status View (SUBMITTED / UNDER_REVIEW) ----------
function StatusView({ submission }: { submission: KycSubmission }) {
  const meta = STATUS_META[submission.status]
  return (
    <Card className="overflow-hidden">
      <div className="surface-wealth relative px-6 py-8 text-center">
        <span className="bg-gold-500/15 text-gold-400 ring-gold-500/30 mx-auto flex size-16 items-center justify-center rounded-full ring-1">
          <Loader2 className="size-7 animate-spin" style={{ animationDuration: '3s' }} />
        </span>
        <h2 className="text-cream-50 mt-4 text-lg font-bold">{meta.label}</h2>
        <p className="text-navy-200/80 mx-auto mt-2 max-w-md text-sm leading-6">{meta.desc}</p>
        {submission.submittedAt && (
          <p className="text-navy-300/60 mt-3 text-xs tabular-nums">
            ارسال‌شده در{' '}
            {new Date(submission.submittedAt).toLocaleDateString('fa-IR', { dateStyle: 'long' })}
          </p>
        )}
      </div>
      <CardContent className="py-4">
        <p className="text-muted-foreground text-center text-xs leading-5">
          نتیجه بررسی از طریق اعلان به شما اطلاع‌رسانی می‌شود. در این مدت امکان ویرایش اطلاعات وجود
          ندارد.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------- Resubmission (NEEDS_RESUBMISSION / REJECTED) ----------
function ResubmitView({
  submission,
  onStarted,
}: {
  submission: KycSubmission
  onStarted: (s: KycSubmission) => void
}) {
  const [starting, setStarting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function restart() {
    setErr(null)
    setStarting(true)
    const res = await apiPost<{ submission: KycSubmission }>('/api/v1/kyc/start')
    setStarting(false)
    if (res.ok && res.data) onStarted(res.data.submission)
    else setErr(res.error ?? 'خطا در شروع مجدد')
  }

  return (
    <Card className="border-warning/30">
      <CardHeader>
        <CardTitle className="text-warning flex items-center gap-2 text-base">
          <RefreshCcw className="size-5" />
          {STATUS_META[submission.status].label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission.rejectionReason && (
          <div className="bg-error/10 border-error/20 rounded-lg border px-4 py-3">
            <p className="text-muted-foreground text-xs">دلیل:</p>
            <p className="text-foreground mt-1 text-sm leading-6">{submission.rejectionReason}</p>
          </div>
        )}
        <p className="text-muted-foreground text-sm leading-6">
          اطلاعات قبلی شما برای ویرایش بارگذاری می‌شود — مدارک را مجدد بارگذاری کنید.
        </p>
        {err && (
          <p role="alert" className="text-error text-sm">
            {err}
          </p>
        )}
        <Button variant="gold" onClick={() => void restart()} disabled={starting}>
          {starting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
          اصلاح و ارسال مجدد
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------- History ----------
function HistoryList({ history }: { history: KycSubmission[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">تاریخچه درخواست‌ها</CardTitle>
      </CardHeader>
      <CardContent className="divide-border/40 divide-y p-0">
        {history.map((s) => {
          const meta = STATUS_META[s.status]
          return (
            <div key={s.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-foreground text-sm font-medium">{KYC_LEVEL_LABELS[s.level]}</p>
                <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                  {new Date(s.createdAt).toLocaleDateString('fa-IR')}
                </p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ============================================
// Wizard
// ============================================
function Wizard({
  submission,
  onUpdate,
  onDone,
}: {
  submission: KycSubmission
  onUpdate: (s: KycSubmission) => void
  onDone: () => void
}) {
  const [step, setStep] = useState(Math.min(Math.max(submission.currentStep, 0), 4))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // فرم state — با داده‌های draft پر می‌شود
  const [firstName, setFirstName] = useState(submission.firstName ?? '')
  const [lastName, setLastName] = useState(submission.lastName ?? '')
  const initBirth = useMemo(() => {
    if (!submission.birthDate) return null
    return gregorianToJalali(new Date(submission.birthDate))
  }, [submission.birthDate])
  const [jy, setJy] = useState(initBirth?.jy?.toString() ?? '')
  const [jm, setJm] = useState(initBirth?.jm?.toString() ?? '')
  const [jd, setJd] = useState(initBirth?.jd?.toString() ?? '')
  const [nationalCode, setNationalCode] = useState(submission.nationalCode ?? '')
  const [shenasnameh, setShenasnameh] = useState(submission.shenasnamehNo ?? '')
  const [cardNumber, setCardNumber] = useState('')
  const [iban, setIban] = useState('')

  const docs = submission.documents
  const hasDoc = (kind: KycDoc['kind']) => docs.some((d) => d.kind === kind)

  // ذخیره draft برای هر مرحله — server validation همزمان
  async function saveDraft(payload: Record<string, unknown>, nextStep?: number): Promise<boolean> {
    setError(null)
    setBusy(true)
    const res = await apiPut<{ submission: KycSubmission }>('/api/v1/kyc/draft', {
      ...payload,
      ...(nextStep !== undefined && { currentStep: nextStep }),
    })
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'ذخیره ناموفق بود')
      return false
    }
    onUpdate(res.data.submission)
    return true
  }

  async function next() {
    if (step === 0) {
      const d = jalaliToGregorian(Number(jy), Number(jm), Number(jd))
      if (!firstName.trim() || !lastName.trim() || !d) {
        setError('نام، نام خانوادگی و تاریخ تولد معتبر الزامی است')
        return
      }
      if (await saveDraft({ firstName, lastName, birthDate: d.toISOString() }, 1)) setStep(1)
    } else if (step === 1) {
      if (await saveDraft({ nationalCode, shenasnamehNo: shenasnameh }, 2)) setStep(2)
    } else if (step === 2) {
      if (
        await saveDraft(
          {
            cardNumber: cardNumber.replace(/\s/g, ''),
            iban: iban.replace(/\s/g, '').toUpperCase(),
          },
          3,
        )
      )
        setStep(3)
    } else if (step === 3) {
      if (!hasDoc('ID_CARD_FRONT')) {
        setError('تصویر کارت ملی الزامی است')
        return
      }
      if (await saveDraft({}, 4)) setStep(4)
    }
  }

  async function back() {
    setError(null)
    if (step > 0) setStep(step - 1)
  }

  async function submit() {
    setError(null)
    setBusy(true)
    const res = await apiPost<{ submission: KycSubmission }>('/api/v1/kyc/submit')
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'ارسال ناموفق بود')
      return
    }
    onDone()
  }

  const birthYearOptions = useMemo(() => {
    const { jy: cur } = gregorianToJalali(new Date())
    return Array.from({ length: 100 }, (_, i) => cur - 18 - i)
  }, [])

  const dayCount = jy && jm ? jalaliMonthLength(Number(jy), Number(jm)) : 31

  return (
    <div className="space-y-5">
      {/* Step rail — دسکتاپ افقی، موبایل فشرده */}
      <nav aria-label="مراحل احراز هویت" className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-center gap-1 sm:gap-2">
          {WIZARD_STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const current = i === step
            return (
              <li key={s.key} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={`h-px w-6 sm:w-10 ${i <= step ? 'bg-gold-500/60' : 'bg-border/60'}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  aria-current={current ? 'step' : undefined}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all duration-(--duration-normal) ${
                    current
                      ? 'bg-gold-500/15 text-gold-400 ring-gold-500/40 ring-1'
                      : done
                        ? 'text-foreground hover:bg-muted/60 cursor-pointer'
                        : 'text-muted-foreground/60'
                  }`}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                      done
                        ? 'bg-gold-500 text-navy-950'
                        : current
                          ? 'bg-gold-500/20 text-gold-400'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="size-3" /> : faDigits(i + 1)}
                  </span>
                  <span className="hidden sm:inline">{s.title}</span>
                  <Icon className="size-4 sm:hidden" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <Card className="animate-page-in" key={step}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {(() => {
              const Icon = WIZARD_STEPS[step]!.icon
              return <Icon className="text-gold-500 size-5" strokeWidth={1.75} />
            })()}
            {WIZARD_STEPS[step]!.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ---- Step 0: شخصی ---- */}
          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="نام" htmlFor="kyc-first">
                  <Input
                    id="kyc-first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={64}
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="نام خانوادگی" htmlFor="kyc-last">
                  <Input
                    id="kyc-last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={64}
                    autoComplete="family-name"
                  />
                </Field>
              </div>
              <Field label="تاریخ تولد (جلالی)" htmlFor="kyc-bd-d">
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="تاریخ تولد">
                  <select
                    id="kyc-bd-d"
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="border-border/60 bg-input text-foreground h-10 rounded-lg border px-3 text-sm tabular-nums"
                    aria-label="روز"
                  >
                    <option value="">روز</option>
                    {Array.from({ length: dayCount }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {faDigits(i + 1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={jm}
                    onChange={(e) => setJm(e.target.value)}
                    className="border-border/60 bg-input text-foreground h-10 rounded-lg border px-3 text-sm"
                    aria-label="ماه"
                  >
                    <option value="">ماه</option>
                    {JALALI_MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={jy}
                    onChange={(e) => setJy(e.target.value)}
                    className="border-border/60 bg-input text-foreground h-10 rounded-lg border px-3 text-sm tabular-nums"
                    aria-label="سال"
                  >
                    <option value="">سال</option>
                    {birthYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {faDigits(y)}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </>
          )}

          {/* ---- Step 1: هویتی ---- */}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="کد ملی" htmlFor="kyc-nc" hint="۱۰ رقم بدون خط تیره">
                <Input
                  id="kyc-nc"
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-left tabular-nums"
                  placeholder="0012345678"
                  maxLength={10}
                />
              </Field>
              <Field label="شماره شناسنامه" htmlFor="kyc-sn">
                <Input
                  id="kyc-sn"
                  value={shenasnameh}
                  onChange={(e) => setShenasnameh(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-left tabular-nums"
                  maxLength={10}
                />
              </Field>
            </div>
          )}

          {/* ---- Step 2: بانکی ---- */}
          {step === 2 && (
            <>
              <p className="text-muted-foreground bg-muted/40 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-5">
                <Banknote className="text-gold-500 mt-0.5 size-4 shrink-0" />
                حساب باید به نام خودتان و منطبق بر کد ملی باشد. اطلاعات بانکی رمزنگاری‌شده ذخیره
                می‌شود.
              </p>
              <Field label="شماره کارت بانکی" htmlFor="kyc-card" hint="۱۶ رقم">
                <Input
                  id="kyc-card"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  inputMode="numeric"
                  dir="ltr"
                  className="text-left tracking-widest tabular-nums"
                  placeholder="6037 9911 2233 4455"
                  maxLength={16}
                />
              </Field>
              <Field label="شماره شبا" htmlFor="kyc-iban" hint="با IR شروع می‌شود">
                <div className="relative">
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold tabular-nums">
                    IR
                  </span>
                  <Input
                    id="kyc-iban"
                    value={iban.replace(/^IR/i, '')}
                    onChange={(e) => setIban('IR' + e.target.value.replace(/\D/g, '').slice(0, 24))}
                    inputMode="numeric"
                    dir="ltr"
                    className="pl-10 text-left tabular-nums"
                    placeholder="060120000000001234567890"
                    maxLength={24}
                  />
                </div>
              </Field>
              {submission.bankComplete && !cardNumber && !iban.replace(/^IR/i, '') && (
                <p className="text-success text-xs">
                  اطلاعات بانکی قبلاً ثبت شده — برای تغییر، مقادیر جدید وارد کنید.
                </p>
              )}
            </>
          )}

          {/* ---- Step 3: مدارک ---- */}
          {step === 3 && (
            <div className="space-y-4">
              {DOC_SLOTS.map((slot) => (
                <DocUpload
                  key={slot.kind}
                  slot={slot}
                  doc={docs.find((d) => d.kind === slot.kind)}
                  onChange={onDone}
                />
              ))}
              <p className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
                <ShieldCheck className="text-gold-500 mt-0.5 size-4 shrink-0" />
                مدارک رمزنگاری‌شده و فقط برای کارشناسان احراز هویت قابل مشاهده است.
              </p>
            </div>
          )}

          {/* ---- Step 4: بازبینی ---- */}
          {step === 4 && (
            <div className="space-y-4">
              <dl className="divide-border/40 divide-y text-sm">
                {[
                  [
                    'نام',
                    `${submission.firstName ?? firstName} ${submission.lastName ?? lastName}`.trim() ||
                      '—',
                  ],
                  [
                    'تاریخ تولد',
                    submission.birthDate
                      ? new Date(submission.birthDate).toLocaleDateString('fa-IR')
                      : '—',
                  ],
                  ['کد ملی', submission.nationalCode ?? nationalCode ?? '—'],
                  ['شماره شناسنامه', submission.shenasnamehNo ?? shenasnameh ?? '—'],
                  ['کارت بانکی', submission.cardMasked ?? 'ثبت می‌شود'],
                  ['شبا', submission.ibanMasked ?? 'ثبت می‌شود'],
                  ['مدارک', `${faDigits(docs.length)} مدرک بارگذاری شده`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd
                      className="text-foreground font-medium tabular-nums"
                      dir={k === 'شبا' || k === 'کارت بانکی' ? 'ltr' : undefined}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5 text-xs leading-5">
                با ارسال، اطلاعات شما برای بررسی کارشناسان ثبت می‌شود و تا پایان بررسی قابل ویرایش
                نیست.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="bg-error/10 text-error rounded-lg px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {/* اکشن‌ها */}
          <div className="flex items-center gap-2 pt-2">
            {step < 4 ? (
              <Button variant="gold" onClick={() => void next()} disabled={busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowLeft className="size-4" />
                )}
                {busy ? 'در حال ذخیره…' : 'مرحله بعد'}
              </Button>
            ) : (
              <Button variant="gold" onClick={() => void submit()} disabled={busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BadgeCheck className="size-4" />
                )}
                {busy ? 'در حال ارسال…' : 'ارسال برای بررسی'}
              </Button>
            )}
            {step > 0 && (
              <Button variant="outline" onClick={() => void back()} disabled={busy}>
                <ArrowRight className="size-4" />
                مرحله قبل
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Field wrapper ----------
function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-foreground mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  )
}

// ---------- Document upload ----------
function DocUpload({
  slot,
  doc,
  onChange,
}: {
  slot: (typeof DOC_SLOTS)[number]
  doc?: KycDoc
  onChange: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const Icon = slot.icon

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr(null)
    if (file.size > 5 * 1024 * 1024) {
      setErr('حجم فایل بیش از ۵ مگابایت است')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErr('فقط JPEG، PNG یا WebP مجاز است')
      return
    }
    const form = new FormData()
    form.set('kind', slot.kind)
    form.set('file', file)
    setUploading(true)
    setProgress(15)
    const timer = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 200)
    const res = await apiUpload<{ document: KycDoc }>('/api/v1/kyc/documents', form)
    clearInterval(timer)
    setProgress(100)
    setTimeout(() => {
      setUploading(false)
      setProgress(0)
    }, 350)
    if (!res.ok) {
      setErr(res.error ?? 'آپلود ناموفق بود')
      return
    }
    onChange()
  }

  async function remove() {
    if (!doc) return
    setErr(null)
    const res = await apiDelete(`/api/v1/kyc/documents/${doc.id}`)
    if (!res.ok) {
      setErr(res.error ?? 'حذف ناموفق بود')
      return
    }
    onChange()
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors duration-(--duration-normal) ${
        doc ? 'border-success/30 bg-success/5' : 'border-border/60 bg-card'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            doc ? 'bg-success/15 text-success' : 'bg-gold-500/12 text-gold-500'
          }`}
        >
          {doc ? <Check className="size-5" /> : <Icon className="size-5" strokeWidth={1.75} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold">
            {slot.title}
            {slot.required && (
              <span className="text-error mr-1" aria-hidden="true">
                *
              </span>
            )}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-5">
            {doc ? `${doc.fileName} — ${faDigits((doc.sizeBytes / 1024).toFixed(0))}KB` : slot.hint}
          </p>
          {uploading && (
            <div
              className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-gold-500 h-full rounded-full transition-all duration-(--duration-fast)"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {err && (
            <p role="alert" className="text-error mt-1.5 text-xs">
              {err}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {doc ? (
            <>
              <a
                href={`/api/v1/kyc/documents/${doc.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-500 hover:text-gold-400 text-xs underline-offset-4 hover:underline"
              >
                مشاهده
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void remove()}
                aria-label={`حذف ${slot.title}`}
                className="text-error hover:text-error size-8"
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              بارگذاری
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => void pick(e)}
        aria-label={slot.title}
      />
    </div>
  )
}
