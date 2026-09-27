// ============================================
// Zar30 - Referral Client — Backend واقعی وصل
// ============================================
// GET /api/v1/referrals → کد دعوت، آمار (کل/qualified/rewarded)،
// مجموع پاداش و لیست دعوت‌شدگان با وضعیت
// کیفیت‌سنجی خودکار بعد از حداقل حجم خرید (سمت سرور) انجام می‌شود؛
// پاداش تومانی توسط ادمین از صف referrals پرداخت می‌شود.
// ============================================

'use client'

import { useEffect, useState } from 'react'
import {
  IconCheck,
  IconCopy,
  IconGift,
  IconLink,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react'
import { usePanelUser } from './panel-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from './page-header'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatExactAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface ReferralItem {
  id: string
  status: 'PENDING' | 'QUALIFIED' | 'REWARDED'
  createdAt: string
  qualifiedAt: string | null
  rewardAmount: string | null
  referred: {
    name: string
    joinedAt: string
  }
}

interface ReferralStats {
  referralCode: string
  total: number
  qualified: number
  rewarded: number
  totalReward: string
  items: ReferralItem[]
}

const STATUS_META: Record<string, { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  PENDING: { label: 'در انتظار خرید', tone: 'warning' },
  QUALIFIED: { label: 'واجد پاداش', tone: 'success' },
  REWARDED: { label: 'پاداش داده شد', tone: 'neutral' },
}

const faNum = (v: string | number) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.charAt(+d))
const fmt = (v: string) => formatExactAmount(v)

export function ReferralClient() {
  const { user } = usePanelUser()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<ReferralStats>('/api/v1/referrals')
      if (cancelled) return
      if (res.ok && res.data) setStats(res.data)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // کد از API — در نبودش از context کاربر
  const code = stats?.referralCode || user.referralCode
  const referralLink = `https://zar30.com/register?ref=${code}`

  async function copy(text: string, which: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard ممکن است در بعضی contextها در دسترس نباشد
    }
  }

  return (
    <div className="animate-stagger space-y-5">
      <PageHeader title="معرفی دوستان" description="کد دعوت و پاداش معرفی" />

      {/* کد دعوت — کارت طلایی برجسته */}
      <Card className="surface-wealth relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconGift className="text-gold-600 size-5" stroke={1.75} />
            کد دعوت شما
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="border-gold-500/30 bg-elevated/80 flex items-center justify-between gap-3 rounded-xl border p-4 shadow-xs">
            <span className="text-foreground font-mono text-xl font-bold tabular-nums" dir="ltr">
              {code}
            </span>
            <button
              onClick={() => copy(code, 'code')}
              className="text-muted-foreground hover:text-gold-600 dark:hover:text-gold-400 focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {copied === 'code' ? (
                <IconCheck className="text-success size-4" />
              ) : (
                <IconCopy className="size-4" />
              )}
              {copied === 'code' ? 'کپی شد' : 'کپی'}
            </button>
          </div>
          {/* لینک دعوت */}
          <div className="border-border/60 bg-muted/30 flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
              <IconLink className="size-4 shrink-0" />
              <span className="truncate font-mono tabular-nums" dir="ltr">
                {referralLink}
              </span>
            </span>
            <button
              onClick={() => copy(referralLink, 'link')}
              aria-label="کپی لینک دعوت"
              className="text-muted-foreground hover:text-gold-600 dark:hover:text-gold-400 focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {copied === 'link' ? (
                <IconCheck className="text-success size-4" />
              ) : (
                <IconCopy className="size-4" />
              )}
              {copied === 'link' ? 'کپی شد' : 'کپی لینک'}
            </button>
          </div>
          <p className="text-muted-foreground text-xs leading-5">
            این کد یا لینک را با دوستان خود به اشتراک بگذارید. پس از ثبت‌نام و اولین خرید آن‌ها،
            پاداش معرفی به کیف پول تومانی شما واریز می‌شود.
          </p>
        </CardContent>
      </Card>

      {/* آمار — واقعی */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <IconUsers className="text-gold-600 dark:text-gold-400 size-7 shrink-0" stroke={1.5} />
            <div className="min-w-0">
              <p className="text-muted-foreground text-label">کل دعوت‌ها</p>
              <p className="text-financial-lg text-foreground mt-1 tabular-nums">
                {loaded ? faNum(stats?.total ?? 0) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <IconUsers className="text-gold-600 dark:text-gold-400 size-7 shrink-0" stroke={1.5} />
            <div className="min-w-0">
              <p className="text-muted-foreground text-label">واجد پاداش</p>
              <p className="text-financial-lg text-foreground mt-1 tabular-nums">
                {loaded ? faNum(stats?.qualified ?? 0) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <IconTrendingUp
              className="text-gold-600 dark:text-gold-400 size-7 shrink-0"
              stroke={1.5}
            />
            <div className="min-w-0">
              <p className="text-muted-foreground text-label">پاداش دریافتی</p>
              <p className="text-financial-lg text-foreground mt-1 tabular-nums">
                {loaded && stats ? (
                  <>
                    {fmt(stats.totalReward)}
                    <span className="text-muted-foreground ms-1 text-[10px] font-normal">
                      تومان
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* لیست دعوت‌شدگان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconUsers className="text-gold-600 size-5" stroke={1.75} />
            دعوت‌شدگان من
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loaded ? (
            <div className="skeleton-shimmer h-16 rounded-lg" />
          ) : !stats || stats.items.length === 0 ? (
            <EmptyState
              icon={IconUsers}
              title="هنوز کسی را دعوت نکرده‌اید"
              description="کد یا لینک دعوت خود را با دوستان به اشتراک بگذارید؛ با اولین خرید آن‌ها پاداش معرفی دریافت می‌کنید."
            />
          ) : (
            <ul className="divide-border/40 divide-y">
              {stats.items.map((it) => {
                const meta = STATUS_META[it.status] ?? {
                  label: it.status,
                  tone: 'neutral' as const,
                }
                return (
                  <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-xs font-semibold">
                        {it.referred.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        عضویت:{' '}
                        {new Date(it.referred.joinedAt).toLocaleDateString('fa-IR', {
                          dateStyle: 'short',
                        })}
                        {it.status === 'REWARDED' && it.rewardAmount && (
                          <span className="text-success ms-1.5 font-medium">
                            · پاداش {fmt(it.rewardAmount)} تومان
                          </span>
                        )}
                      </p>
                    </div>
                    <StatusBadge tone={meta.tone} dot={false} className={cn('shrink-0')}>
                      {meta.label}
                    </StatusBadge>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
