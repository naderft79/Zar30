// ============================================
// Zar30 - Admin Dashboard Service V2
// ============================================
// مرکز فرماندهی ادمین — فقط داده واقعی از PostgreSQL + Redis
// تمام مقادیر مالی string هستند (بدون حساب JS روی BigInt/Decimal)
// aggregateهای سنگین با Redis کش می‌شوند — کش هرگز منبع حقیقت نیست
// ============================================

import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { logger } from '@/lib/logger/logger'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import { withCache } from '@/lib/cache/dashboard-cache'
import { getOnlineAdmins } from '@/lib/cache/admin-presence'
import { getHaltFlags, type HaltFlags } from '@/lib/services/admin-system.service'
import { getSlaThresholds, slaState, type QueueKey, type SlaState } from '@/lib/config/admin-sla'
import { ApiError } from '@/lib/errors/api-error'
import { formatGoldAmount } from '@/lib/utils/format'

const DAY_MS = 24 * 60 * 60 * 1000

export type DashboardPeriod = '24h' | '7d' | '30d'
export type ChartRange = 7 | 30 | 90

function periodMs(period: DashboardPeriod): number {
  if (period === '24h') return DAY_MS
  if (period === '7d') return 7 * DAY_MS
  return 30 * DAY_MS
}

// ============================================
// Types — خروجی داشبورد V2
// ============================================

export interface KpiValue {
  /** مقدار خام به‌صورت string — نمایش با formatExactAmount در کلاینت */
  value: string
  /** درصد تغییر نسبت به دوره قبل — مثبت/منفی؛ null اگر دوره قبل صفر باشد */
  deltaPct: string | null
  /** جریان خالص دوره (برای KPIهای موجودی) — واحد همان KPI */
  netChange?: string
  /** اسپارک‌لاین ۷ روزه — مقادیر عددی ساده برای رندر mini chart */
  sparkline: number[]
}

export interface DashboardKpis {
  userTomanBalance: KpiValue
  userGoldBalance: KpiValue
  feeRevenue: KpiValue
  tradingVolume: KpiValue
  activeUsers: KpiValue
  newUsers: KpiValue
}

export interface QueueSummaryItem {
  key: QueueKey
  label: string
  permission: Permission
  count: number
  oldestAgeSec: number | null
  sla: SlaState
  href: string
}

export interface DashboardAlert {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  detail: string
  href: string
  at: string
}

export interface GoldPriceSnapshot {
  buyPrice: string
  sellPrice: string
  source: string
  spread: string
  recordedAt: string
}

export interface HealthProbe {
  name: string
  ok: boolean
  latencyMs?: number
}

export interface AdminDashboardV2 {
  generatedAt: string
  cachedAt: string | null
  period: DashboardPeriod
  halted: { trading: boolean; withdrawals: boolean }
  kpis: DashboardKpis
  goldPrice: GoldPriceSnapshot | null
  queues: QueueSummaryItem[]
  alerts: DashboardAlert[]
  /** روند ۳۰ روز — سری کامل برای sparkline و نمودار اصلی */
  trend: DashboardTrendPoint[]
  health: { db: HealthProbe; redis: HealthProbe; uptimeSeconds: number }
  onlineAdmins: { count: number; admins: OnlineAdminRow[] }
  meta: { visibleQueueKeys: QueueKey[] }
}

export interface OnlineAdminRow {
  adminId: string
  name: string | null
  mobile: string | null
  role: string
  roleLabel: string
  lastSeenSec: number
}

export interface DashboardTrendPoint {
  day: string
  txVolume: number
  feeRevenue: number
  orders: number
  newUsers: number
  deposits: number
  withdrawals: number
}

// ============================================
// Helperهای داخلی
// ============================================

function toNum(v: bigint | null | undefined): number {
  return v === null || v === undefined ? 0 : Number(v)
}

function pctDelta(current: number, previous: number): string | null {
  if (previous <= 0) return current > 0 ? '100' : null
  return (((current - previous) / previous) * 100).toFixed(1)
}

// ============================================
// صف‌های عملیاتی — count + قدیمی‌ترین رکورد + SLA
// ============================================

interface QueueDef {
  key: QueueKey
  label: string
  permission: Permission
  href: string
}

const QUEUE_DEFS: QueueDef[] = [
  {
    key: 'kyc',
    label: 'احراز هویت در انتظار',
    permission: PERMISSIONS.KYC_READ,
    href: '/admin/kyc?status=SUBMITTED',
  },
  {
    key: 'withdrawals',
    label: 'برداشت در انتظار',
    permission: PERMISSIONS.WITHDRAWALS_READ,
    href: '/admin/withdrawals?status=PENDING',
  },
  {
    key: 'orders',
    label: 'سفارش در انتظار',
    permission: PERMISSIONS.ORDERS_READ,
    href: '/admin/orders?status=PENDING',
  },
  {
    key: 'tickets',
    label: 'تیکت باز',
    permission: PERMISSIONS.TICKETS_READ,
    href: '/admin/support?status=OPEN',
  },
  {
    key: 'delivery',
    label: 'تحویل فیزیکی',
    permission: PERMISSIONS.DELIVERY_READ,
    href: '/admin/delivery?status=PENDING',
  },
  {
    key: 'risk',
    label: 'رویداد ریسک بررسی‌نشده',
    permission: PERMISSIONS.RISK_READ,
    href: '/admin/risk?status=open',
  },
]

async function queueStat(key: QueueKey): Promise<{ count: number; oldest: Date | null }> {
  switch (key) {
    case 'kyc': {
      const [count, agg] = await Promise.all([
        prisma.kycSubmission.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
        prisma.kycSubmission.aggregate({
          where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
          _min: { submittedAt: true },
        }),
      ])
      return { count, oldest: agg._min.submittedAt }
    }
    case 'withdrawals': {
      const [count, agg] = await Promise.all([
        prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
        prisma.withdrawalRequest.aggregate({
          where: { status: 'PENDING' },
          _min: { createdAt: true },
        }),
      ])
      return { count, oldest: agg._min.createdAt }
    }
    case 'orders': {
      const [count, agg] = await Promise.all([
        prisma.order.count({ where: { status: { in: ['PENDING', 'LOCKED'] } } }),
        prisma.order.aggregate({
          where: { status: { in: ['PENDING', 'LOCKED'] } },
          _min: { createdAt: true },
        }),
      ])
      return { count, oldest: agg._min.createdAt }
    }
    case 'tickets': {
      const [count, agg] = await Promise.all([
        prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.ticket.aggregate({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          _min: { createdAt: true },
        }),
      ])
      return { count, oldest: agg._min.createdAt }
    }
    case 'delivery': {
      const [count, agg] = await Promise.all([
        prisma.goldDeliveryRequest.count({ where: { status: { in: ['PENDING', 'PREPARING'] } } }),
        prisma.goldDeliveryRequest.aggregate({
          where: { status: { in: ['PENDING', 'PREPARING'] } },
          _min: { createdAt: true },
        }),
      ])
      return { count, oldest: agg._min.createdAt }
    }
    case 'risk': {
      const [count, agg] = await Promise.all([
        prisma.riskEvent.count({ where: { reviewedAt: null } }),
        prisma.riskEvent.aggregate({
          where: { reviewedAt: null },
          _min: { createdAt: true },
        }),
      ])
      return { count, oldest: agg._min.createdAt }
    }
  }
}

// ============================================
// سری روزانه — یک کوئری برای trend و sparkline
// ============================================

interface DailyRow {
  day: Date
  tx_volume: bigint
  fee_revenue: bigint
  orders: bigint
  new_users: bigint
  deposits: bigint
  withdrawals: bigint
}

async function dailySeries(from: Date, to: Date): Promise<DailyRow[]> {
  return prisma.$queryRaw<DailyRow[]>`
    SELECT d::date AS day,
      COALESCE(tx.volume, 0)::bigint AS tx_volume,
      COALESCE(fee.total, 0)::bigint AS fee_revenue,
      COALESCE(o.cnt, 0)::bigint AS orders,
      COALESCE(u.cnt, 0)::bigint AS new_users,
      COALESCE(dep.total, 0)::bigint AS deposits,
      COALESCE(wd.total, 0)::bigint AS withdrawals
    FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
    LEFT JOIN (
      SELECT created_at::date AS day, SUM(amount) AS volume
      FROM transactions
      WHERE status = 'COMPLETED' AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY 1
    ) tx ON tx.day = d::date
    LEFT JOIN (
      SELECT je.created_at::date AS day, SUM(le.amount_toman) AS total
      FROM ledger_entries le
      JOIN journal_entries je ON je.id = le.journal_entry_id AND je.status = 'POSTED'
      JOIN ledger_accounts la ON la.id = le.ledger_account_id AND la.type = 'REVENUE'
      WHERE le.entry_type = 'CREDIT' AND le.amount_toman IS NOT NULL
        AND le.created_at >= ${from} AND le.created_at <= ${to}
      GROUP BY 1
    ) fee ON fee.day = d::date
    LEFT JOIN (
      SELECT created_at::date AS day, COUNT(*) AS cnt
      FROM orders
      WHERE status = 'FILLED' AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY 1
    ) o ON o.day = d::date
    LEFT JOIN (
      SELECT created_at::date AS day, COUNT(*) AS cnt
      FROM users
      WHERE created_at >= ${from} AND created_at <= ${to}
      GROUP BY 1
    ) u ON u.day = d::date
    LEFT JOIN (
      SELECT created_at::date AS day, SUM(amount) AS total
      FROM transactions
      WHERE status = 'COMPLETED' AND type = 'DEPOSIT'
        AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY 1
    ) dep ON dep.day = d::date
    LEFT JOIN (
      SELECT created_at::date AS day, SUM(amount) AS total
      FROM transactions
      WHERE status = 'COMPLETED' AND type = 'WITHDRAW'
        AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY 1
    ) wd ON wd.day = d::date
    ORDER BY day
  `
}

// ============================================
// getAdminDashboardV2 — تجمیع اصلی (کش ۳۰s)
// ============================================

export async function getAdminDashboardV2(
  permissions: readonly Permission[],
  period: DashboardPeriod = '24h',
): Promise<AdminDashboardV2> {
  const cacheKey = `summary:${period}`
  const { data } = await withCache(cacheKey, 30, () => buildDashboard(period))

  // صف‌ها permission-aware — فیلتر بعد از کش (کش بدون permission است)
  const visibleQueues = data.queues.filter((q) => hasPermission(permissions, q.permission))
  return {
    ...data,
    queues: visibleQueues,
    meta: { visibleQueueKeys: visibleQueues.map((q) => q.key) },
  }
}

async function buildDashboard(period: DashboardPeriod): Promise<AdminDashboardV2> {
  const now = new Date()
  const pMs = periodMs(period)
  const periodFrom = new Date(now.getTime() - pMs)
  const prevFrom = new Date(now.getTime() - 2 * pMs)
  const trendFrom = new Date(now.getTime() - 29 * DAY_MS)
  trendFrom.setHours(0, 0, 0, 0)
  const sparkFrom = new Date(now.getTime() - 6 * DAY_MS)
  sparkFrom.setHours(0, 0, 0, 0)

  // سری روزانه برای trend (۳۰ روز) + sparklineها (۷ روز آخر)
  const daily = await dailySeries(trendFrom, now)
  const sparkDaily = daily.filter((d) => d.day >= sparkFrom)

  const sparkline = (pick: (d: DailyRow) => bigint): number[] =>
    sparkDaily.map((d) => toNum(pick(d)))

  const [
    tomanAggregate,
    goldAggregate,
    volumePeriod,
    volumePrev,
    feePeriod,
    feePrev,
    activeUsers,
    activePrev,
    newUsersPeriod,
    newUsersPrev,
    latestGoldPrice,
    failedTxCount,
    failedTxRecent,
    halted,
    thresholds,
  ] = await Promise.all([
    prisma.assetAccount.aggregate({ where: { assetType: 'TOMAN' }, _sum: { balance: true } }),
    prisma.assetAccount.aggregate({ where: { assetType: 'GOLD' }, _sum: { balance: true } }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: periodFrom } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: prevFrom, lt: periodFrom } },
      _sum: { amount: true },
    }),
    // درآمد کارمزد = جمع CREDIT روی حساب‌های REVENUE از ژورنال‌های POSTED
    prisma.ledgerEntry.aggregate({
      where: {
        entryType: 'CREDIT',
        amountToman: { not: null },
        createdAt: { gte: periodFrom },
        ledgerAccount: { type: 'REVENUE' },
        journalEntry: { status: 'POSTED' },
      },
      _sum: { amountToman: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        entryType: 'CREDIT',
        amountToman: { not: null },
        createdAt: { gte: prevFrom, lt: periodFrom },
        ledgerAccount: { type: 'REVENUE' },
        journalEntry: { status: 'POSTED' },
      },
      _sum: { amountToman: true },
    }),
    prisma.user.count({ where: { status: 'ACTIVE', lastLoginAt: { gte: periodFrom } } }),
    prisma.user.count({
      where: { status: 'ACTIVE', lastLoginAt: { gte: prevFrom, lt: periodFrom } },
    }),
    prisma.user.count({ where: { createdAt: { gte: periodFrom } } }),
    prisma.user.count({ where: { createdAt: { gte: prevFrom, lt: periodFrom } } }),
    prisma.goldPrice.findFirst({
      orderBy: { recordedAt: 'desc' },
      select: { buyPrice: true, sellPrice: true, source: true, spread: true, recordedAt: true },
    }),
    prisma.transaction.count({ where: { status: 'FAILED', createdAt: { gte: periodFrom } } }),
    prisma.transaction.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, type: true, amount: true, createdAt: true },
    }),
    getHaltFlags().catch((err) => {
      logger.error({ err }, 'Halt flags read failed')
      return {
        trading: { halted: false, at: null, by: null },
        withdrawals: { halted: false, at: null, by: null },
      } satisfies HaltFlags
    }),
    getSlaThresholds(),
  ])

  // موجودی‌ها — netChange = جریان خالص دوره (واریز − برداشت برای تومان)
  const depositsPeriod = daily
    .filter((d) => d.day >= new Date(periodFrom.toDateString()))
    .reduce((s, d) => s + toNum(d.deposits), 0)
  const withdrawalsPeriod = daily
    .filter((d) => d.day >= new Date(periodFrom.toDateString()))
    .reduce((s, d) => s + toNum(d.withdrawals), 0)

  const queueStats = await Promise.all(QUEUE_DEFS.map((q) => queueStat(q.key)))
  const queues: QueueSummaryItem[] = QUEUE_DEFS.map((def, i) => {
    const { count, oldest } = queueStats[i]!
    const oldestAgeSec = oldest ? Math.floor((now.getTime() - oldest.getTime()) / 1000) : null
    return {
      ...def,
      count,
      oldestAgeSec,
      sla: slaState(oldestAgeSec, thresholds[def.key]),
    }
  })

  // هشدارها: تراکنش ناموفق + رویداد ریسک بررسی‌نشده حد بالا
  const alerts: DashboardAlert[] = []
  if (failedTxCount > 0) {
    alerts.push({
      id: 'failed-tx',
      severity: 'error',
      title: `${failedTxCount} تراکنش ناموفق`,
      detail: failedTxRecent[0]
        ? `آخرین: ${failedTxRecent[0].type} — ${failedTxRecent[0].amount.toString()} تومان`
        : '',
      href: '/admin/transactions?status=FAILED',
      at: (failedTxRecent[0]?.createdAt ?? now).toISOString(),
    })
  }

  const [dbProbe, redisProbe] = await Promise.all([
    (async (): Promise<HealthProbe> => {
      const t = Date.now()
      try {
        await prisma.$queryRaw`SELECT 1`
        return { name: 'PostgreSQL', ok: true, latencyMs: Date.now() - t }
      } catch {
        return { name: 'PostgreSQL', ok: false }
      }
    })(),
    (async (): Promise<HealthProbe> => {
      const t = Date.now()
      try {
        const pong = await redis.ping()
        return { name: 'Redis', ok: pong === 'PONG', latencyMs: Date.now() - t }
      } catch {
        return { name: 'Redis', ok: false }
      }
    })(),
  ])

  const online = await getOnlineAdmins().catch(() => ({ count: 0, admins: [] }))

  const kpis: DashboardKpis = {
    userTomanBalance: {
      value: (tomanAggregate._sum.balance ?? 0).toString(),
      deltaPct: null,
      netChange: (depositsPeriod - withdrawalsPeriod).toString(),
      sparkline: sparkline((d) => d.deposits - d.withdrawals),
    },
    userGoldBalance: {
      value: (goldAggregate._sum.balance ?? 0).toString(),
      deltaPct: null,
      sparkline: sparkline((d) => d.tx_volume), // حجم معاملات طلا به‌عنوان پروکسی جریان
    },
    feeRevenue: {
      value: (feePeriod._sum.amountToman ?? 0n).toString(),
      deltaPct: pctDelta(toNum(feePeriod._sum.amountToman), toNum(feePrev._sum.amountToman)),
      sparkline: sparkline((d) => d.fee_revenue),
    },
    tradingVolume: {
      value: (volumePeriod._sum.amount ?? 0n).toString(),
      deltaPct: pctDelta(toNum(volumePeriod._sum.amount), toNum(volumePrev._sum.amount)),
      sparkline: sparkline((d) => d.tx_volume),
    },
    activeUsers: {
      value: String(activeUsers),
      deltaPct: pctDelta(activeUsers, activePrev),
      sparkline: sparkDaily.map((d) => toNum(d.orders)), // فعالیت روزانه ≈ سفارش‌ها
    },
    newUsers: {
      value: String(newUsersPeriod),
      deltaPct: pctDelta(newUsersPeriod, newUsersPrev),
      sparkline: sparkline((d) => d.new_users),
    },
  }

  return {
    generatedAt: now.toISOString(),
    cachedAt: null,
    period,
    halted: {
      trading: halted.trading.halted,
      withdrawals: halted.withdrawals.halted,
    },
    kpis,
    goldPrice: latestGoldPrice
      ? {
          buyPrice: latestGoldPrice.buyPrice.toString(),
          sellPrice: latestGoldPrice.sellPrice.toString(),
          source: latestGoldPrice.source,
          spread: latestGoldPrice.spread.toString(),
          recordedAt: latestGoldPrice.recordedAt.toISOString(),
        }
      : null,
    queues,
    alerts,
    trend: daily.map((d) => ({
      day: d.day.toISOString().slice(0, 10),
      txVolume: toNum(d.tx_volume),
      feeRevenue: toNum(d.fee_revenue),
      orders: toNum(d.orders),
      newUsers: toNum(d.new_users),
      deposits: toNum(d.deposits),
      withdrawals: toNum(d.withdrawals),
    })),
    health: { db: dbProbe, redis: redisProbe, uptimeSeconds: Math.floor(process.uptime()) },
    onlineAdmins: { count: online.count, admins: online.admins },
    meta: { visibleQueueKeys: [] },
  }
}

// ============================================
// نمودارها — GET /dashboard/charts?range=7|30|90
// ============================================

export interface DashboardCharts {
  range: ChartRange
  generatedAt: string
  /** سری روزانه دوره جاری + هم‌ترازشده با دوره قبلی */
  daily: {
    day: string
    txVolume: number
    feeRevenue: number
    orders: number
    newUsers: number
    prevTxVolume: number | null
    prevFeeRevenue: number | null
    prevOrders: number | null
    prevNewUsers: number | null
  }[]
  goldPriceSeries: { t: string; buy: number; sell: number }[]
  assetShare: { asset: string; balance: string }[]
  kycFunnel: { stage: string; count: number }[]
  peakHours: { weekday: number; hour: number; count: number }[]
  revenueByType: { code: string; label: string; amount: string }[]
}

const REVENUE_LABELS: Record<string, string> = {
  REVENUE_FEE: 'کارمزد معاملات',
  REVENUE_SPREAD: 'اسپرد',
  REVENUE_INSTALLMENT: 'کارمزد اقساط',
  REVENUE_WITHDRAWAL: 'کارمزد برداشت',
  REVENUE_DELIVERY: 'کارمزد تحویل',
}

export async function getDashboardCharts(range: ChartRange): Promise<DashboardCharts> {
  const { data } = await withCache(`charts:${range}`, 60, () => buildCharts(range))
  return data
}

async function buildCharts(range: ChartRange): Promise<DashboardCharts> {
  const now = new Date()
  const from = new Date(now.getTime() - (range - 1) * DAY_MS)
  from.setHours(0, 0, 0, 0)
  const prevFrom = new Date(from.getTime() - range * DAY_MS)

  const [current, prev] = await Promise.all([
    dailySeries(from, now),
    dailySeries(prevFrom, new Date(from.getTime() - 1)),
  ])

  const prevByIndex = new Map<number, DailyRow>()
  prev.forEach((d, i) => prevByIndex.set(i, d))

  const [goldRows, assetGroups, kycCounts, peakRows, revenueRows] = await Promise.all([
    prisma.goldPrice.findMany({
      where: { recordedAt: { gte: from } },
      orderBy: { recordedAt: 'asc' },
      take: 500,
      select: { buyPrice: true, sellPrice: true, recordedAt: true },
    }),
    prisma.assetAccount.groupBy({
      by: ['assetType'],
      _sum: { balance: true },
    }),
    prisma.kycSubmission.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ weekday: number; hour: number; cnt: bigint }[]>`
      SELECT EXTRACT(ISODOW FROM created_at)::int AS weekday,
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*)::bigint AS cnt
      FROM transactions
      WHERE status = 'COMPLETED' AND created_at >= ${from}
      GROUP BY 1, 2
    `,
    prisma.ledgerEntry.groupBy({
      by: ['ledgerAccountId'],
      where: {
        entryType: 'CREDIT',
        amountToman: { not: null },
        createdAt: { gte: from },
        ledgerAccount: { type: 'REVENUE' },
        journalEntry: { status: 'POSTED' },
      },
      _sum: { amountToman: true },
    }),
  ])

  const revAccounts = await prisma.ledgerAccount.findMany({
    where: { type: 'REVENUE' },
    select: { id: true, code: true },
  })
  const codeById = new Map(revAccounts.map((a) => [a.id, a.code]))

  const kycStage = (s: string) => kycCounts.find((k) => k.status === s)?._count._all ?? 0

  return {
    range,
    generatedAt: now.toISOString(),
    daily: current.map((d, i) => {
      const p = prevByIndex.get(i)
      return {
        day: d.day.toISOString().slice(0, 10),
        txVolume: toNum(d.tx_volume),
        feeRevenue: toNum(d.fee_revenue),
        orders: toNum(d.orders),
        newUsers: toNum(d.new_users),
        prevTxVolume: p ? toNum(p.tx_volume) : null,
        prevFeeRevenue: p ? toNum(p.fee_revenue) : null,
        prevOrders: p ? toNum(p.orders) : null,
        prevNewUsers: p ? toNum(p.new_users) : null,
      }
    }),
    goldPriceSeries: goldRows.map((g) => ({
      t: g.recordedAt.toISOString(),
      buy: toNum(g.buyPrice),
      sell: toNum(g.sellPrice),
    })),
    assetShare: assetGroups.map((a) => ({
      asset: a.assetType,
      balance: (a._sum.balance ?? 0).toString(),
    })),
    kycFunnel: [
      { stage: 'SUBMITTED', count: kycStage('SUBMITTED') },
      { stage: 'UNDER_REVIEW', count: kycStage('UNDER_REVIEW') },
      { stage: 'APPROVED', count: kycStage('APPROVED') },
      { stage: 'REJECTED', count: kycStage('REJECTED') + kycStage('NEEDS_RESUBMISSION') },
    ],
    peakHours: peakRows.map((r) => ({
      weekday: r.weekday,
      hour: r.hour,
      count: toNum(r.cnt),
    })),
    revenueByType: revenueRows
      .map((r) => {
        const code = codeById.get(r.ledgerAccountId) ?? 'UNKNOWN'
        return {
          code,
          label: REVENUE_LABELS[code] ?? code,
          amount: (r._sum.amountToman ?? 0n).toString(),
        }
      })
      .filter((r) => r.amount !== '0'),
  }
}

// ============================================
// مالی — GET /dashboard/finance
// ============================================

export interface DashboardFinance {
  generatedAt: string
  ledgerBalances: { code: string; name: string; nameFa: string; balance: string; type: string }[]
  pnl: { revenue: string; expense: string; net: string; periodDays: number }
  cashflow: { deposits: string; withdrawals: string; net: string }
  recon: { mismatches: number; checkedAccounts: number }
}

const KEY_ACCOUNTS_FA: Record<string, string> = {
  ASSET_TOMAN: 'موجودی تومان صندوق',
  ASSET_GOLD: 'موجودی طلای صندوق',
  ASSET_LOCKED_TOMAN: 'تومان قفل‌شده',
  ASSET_LOCKED_GOLD: 'طلای قفل‌شده',
  ASSET_PLATFORM_TOMAN: 'تومان پلتفرم',
  LIABILITY_USER_TOMAN: 'بدهی تومانی به کاربران',
  LIABILITY_GOLD_INVENTORY: 'بدهی طلایی (موجودی کاربران)',
  REVENUE_FEE: 'درآمد کارمزد',
  REVENUE_SPREAD: 'درآمد اسپرد',
  EXPENSE_OPERATIONAL: 'هزینه عملیاتی',
}

export async function getDashboardFinance(): Promise<DashboardFinance> {
  const { data } = await withCache('finance', 30, buildFinance)
  return data
}

async function buildFinance(): Promise<DashboardFinance> {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS)

  // مانده هر حساب = Σ(DEBIT − CREDIT) روی ledger entries — فقط ژورنال POSTED
  const balanceRows = await prisma.$queryRaw<
    { code: string; name: string; type: string; balance: bigint }[]
  >`
    SELECT la.code, la.name, la.type,
      COALESCE(SUM(CASE WHEN le.entry_type = 'DEBIT' THEN le.amount_toman ELSE -le.amount_toman END), 0)::bigint AS balance
    FROM ledger_accounts la
    LEFT JOIN ledger_entries le ON le.ledger_account_id = la.id AND le.amount_toman IS NOT NULL
    LEFT JOIN journal_entries je ON je.id = le.journal_entry_id AND je.status = 'POSTED'
    WHERE la.code IN (
      'ASSET_TOMAN','ASSET_GOLD','ASSET_LOCKED_TOMAN','ASSET_LOCKED_GOLD','ASSET_PLATFORM_TOMAN',
      'LIABILITY_USER_TOMAN','LIABILITY_GOLD_INVENTORY','REVENUE_FEE','REVENUE_SPREAD','EXPENSE_OPERATIONAL'
    )
    GROUP BY la.code, la.name, la.type
  `

  const [pnlRev, pnlExp, depAgg, wdAgg, reconRows] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: {
        entryType: 'CREDIT',
        amountToman: { not: null },
        createdAt: { gte: monthAgo },
        ledgerAccount: { type: 'REVENUE' },
        journalEntry: { status: 'POSTED' },
      },
      _sum: { amountToman: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        entryType: 'DEBIT',
        amountToman: { not: null },
        createdAt: { gte: monthAgo },
        ledgerAccount: { type: 'EXPENSE' },
        journalEntry: { status: 'POSTED' },
      },
      _sum: { amountToman: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: monthAgo } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'WITHDRAW', status: 'COMPLETED', createdAt: { gte: monthAgo } },
      _sum: { amount: true },
    }),
    // شمارش سریع مغایرت — نسخه SQL سبک همان منطق reconciliation
    prisma.$queryRaw<{ mismatches: bigint; total: bigint }[]>`
      WITH sums AS (
        SELECT le.asset_account_id, la.code,
          SUM(CASE WHEN le.entry_type = 'DEBIT' THEN COALESCE(le.amount_toman,0) ELSE -COALESCE(le.amount_toman,0) END) AS net_toman,
          SUM(CASE WHEN le.entry_type = 'DEBIT' THEN COALESCE(le.amount_gold,0) ELSE -COALESCE(le.amount_gold,0) END) AS net_gold
        FROM ledger_entries le
        JOIN journal_entries je ON je.id = le.journal_entry_id AND je.status = 'POSTED'
        JOIN ledger_accounts la ON la.id = le.ledger_account_id
        WHERE le.asset_account_id IS NOT NULL
        GROUP BY le.asset_account_id, la.code
      )
      SELECT COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM sums s
          WHERE s.asset_account_id = aa.id AND (
            (s.code IN ('ASSET_TOMAN','ASSET_GOLD')
              AND ((aa.asset_type = 'GOLD' AND s.net_gold <> aa.balance)
                OR (aa.asset_type <> 'GOLD' AND s.net_toman <> aa.balance)))
            OR (s.code IN ('ASSET_LOCKED_TOMAN','ASSET_LOCKED_GOLD')
              AND ((aa.asset_type = 'GOLD' AND s.net_gold <> aa.locked_balance)
                OR (aa.asset_type <> 'GOLD' AND s.net_toman <> aa.locked_balance)))
          )
        )
      )::bigint AS mismatches,
      COUNT(*)::bigint AS total
      FROM asset_accounts aa
    `,
  ])

  const revenue = pnlRev._sum.amountToman ?? 0n
  const expense = pnlExp._sum.amountToman ?? 0n
  const deposits = depAgg._sum.amount ?? 0n
  const withdrawals = wdAgg._sum.amount ?? 0n

  return {
    generatedAt: now.toISOString(),
    ledgerBalances: balanceRows.map((r) => ({
      code: r.code,
      name: r.name,
      nameFa: KEY_ACCOUNTS_FA[r.code] ?? r.name,
      balance: r.balance.toString(),
      type: r.type,
    })),
    pnl: {
      revenue: revenue.toString(),
      expense: expense.toString(),
      net: (revenue - expense).toString(),
      periodDays: 30,
    },
    cashflow: {
      deposits: deposits.toString(),
      withdrawals: withdrawals.toString(),
      net: (deposits - withdrawals).toString(),
    },
    recon: {
      mismatches: toNum(reconRows[0]?.mismatches),
      checkedAccounts: toNum(reconRows[0]?.total),
    },
  }
}

// ============================================
// فیدها — GET /dashboard/feeds (بدون کش)
// ============================================

export interface DashboardFeeds {
  generatedAt: string
  audit: {
    id: string
    actor: string
    action: string
    entityType: string
    entityId: string | null
    at: string
  }[]
  broadcasts: {
    id: string
    title: string
    channel: string
    status: string
    at: string
  }[]
  onlineAdmins: { count: number; admins: OnlineAdminRow[] }
  health: { db: HealthProbe; redis: HealthProbe }
}

export async function getDashboardFeeds(): Promise<DashboardFeeds> {
  const [auditRows, broadcastRows, online, dbProbe, redisProbe] = await Promise.all([
    prisma.auditLog.findMany({
      where: { actorType: 'admin' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        actorId: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    }),
    prisma.notification.findMany({
      where: { type: 'ADMIN_BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, channel: true, status: true, createdAt: true },
    }),
    getOnlineAdmins().catch(() => ({ count: 0, admins: [] })),
    (async (): Promise<HealthProbe> => {
      const t = Date.now()
      try {
        await prisma.$queryRaw`SELECT 1`
        return { name: 'PostgreSQL', ok: true, latencyMs: Date.now() - t }
      } catch {
        return { name: 'PostgreSQL', ok: false }
      }
    })(),
    (async (): Promise<HealthProbe> => {
      const t = Date.now()
      try {
        return { name: 'Redis', ok: (await redis.ping()) === 'PONG', latencyMs: Date.now() - t }
      } catch {
        return { name: 'Redis', ok: false }
      }
    })(),
  ])

  // نام actorها — یک کوئری برای همه
  const actorIds = [...new Set(auditRows.map((a) => a.actorId).filter(Boolean))] as string[]
  const actors = await prisma.adminUser.findMany({
    where: { id: { in: actorIds } },
    select: {
      id: true,
      user: { select: { mobile: true, firstName: true, lastName: true } },
    },
  })
  const actorName = new Map(
    actors.map((a) => [
      a.id,
      [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || a.user.mobile || '—',
    ]),
  )

  return {
    generatedAt: new Date().toISOString(),
    audit: auditRows.map((a) => ({
      id: a.id,
      actor: actorName.get(a.actorId ?? '') ?? a.actorRole ?? 'سیستم',
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      at: a.createdAt.toISOString(),
    })),
    broadcasts: broadcastRows.map((b) => ({
      id: b.id,
      title: b.title,
      channel: b.channel,
      status: b.status,
      at: b.createdAt.toISOString(),
    })),
    onlineAdmins: { count: online.count, admins: online.admins },
    health: { db: dbProbe, redis: redisProbe },
  }
}

// ============================================
// ردیف‌های صف — GET /dashboard/queues/:key
// ============================================

export interface QueueRow {
  id: string
  title: string
  subtitle: string
  amount?: string
  at: string
  href: string
}

export async function getQueueRows(key: QueueKey): Promise<QueueRow[]> {
  const take = 5
  switch (key) {
    case 'kyc': {
      const rows = await prisma.kycSubmission.findMany({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
        orderBy: { submittedAt: 'asc' },
        take,
        select: {
          id: true,
          level: true,
          status: true,
          submittedAt: true,
          user: { select: { mobile: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.user.mobile,
        subtitle: `سطح ${r.level} — ${r.status}`,
        at: (r.submittedAt ?? new Date()).toISOString(),
        href: `/admin/kyc/${r.id}`,
      }))
    }
    case 'withdrawals': {
      const rows = await prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take,
        select: {
          id: true,
          amount: true,
          iban: true,
          createdAt: true,
          user: { select: { mobile: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.user.mobile,
        subtitle: `IR${r.iban.slice(-6)}`,
        amount: r.amount.toString(),
        at: r.createdAt.toISOString(),
        href: `/admin/withdrawals/${r.id}`,
      }))
    }
    case 'orders': {
      const rows = await prisma.order.findMany({
        where: { status: { in: ['PENDING', 'LOCKED'] } },
        orderBy: { createdAt: 'asc' },
        take,
        select: {
          id: true,
          type: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { mobile: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.user.mobile,
        subtitle: `${r.type === 'BUY' ? 'خرید' : 'فروش'} — ${r.status}`,
        amount: r.total.toString(),
        at: r.createdAt.toISOString(),
        href: `/admin/orders/${r.id}`,
      }))
    }
    case 'tickets': {
      const rows = await prisma.ticket.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { createdAt: 'asc' },
        take,
        select: {
          id: true,
          subject: true,
          priority: true,
          createdAt: true,
          user: { select: { mobile: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.subject,
        subtitle: `${r.user.mobile} — ${r.priority}`,
        at: r.createdAt.toISOString(),
        href: `/admin/support?q=${r.id}`,
      }))
    }
    case 'delivery': {
      const rows = await prisma.goldDeliveryRequest.findMany({
        where: { status: { in: ['PENDING', 'PREPARING'] } },
        orderBy: { createdAt: 'asc' },
        take,
        select: {
          id: true,
          grams: true,
          status: true,
          createdAt: true,
          user: { select: { mobile: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.user.mobile,
        subtitle: `${formatGoldAmount(r.grams.toString())} گرم — ${r.status}`,
        at: r.createdAt.toISOString(),
        href: `/admin/delivery/${r.id}`,
      }))
    }
    case 'risk': {
      const rows = await prisma.riskEvent.findMany({
        where: { reviewedAt: null },
        orderBy: { createdAt: 'asc' },
        take,
        select: {
          id: true,
          metric: true,
          score: true,
          createdAt: true,
          user: { select: { mobile: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.user.mobile,
        subtitle: `${r.metric} — امتیاز ${r.score}`,
        at: r.createdAt.toISOString(),
        href: `/admin/risk?status=open`,
      }))
    }
  }
}

// ============================================
// Layout و Notes — ترجیحات + یادداشت تیمی
// ============================================

const NOTES_KEY = 'admin.notes'
const MAX_NOTES = 20

export interface DashboardNote {
  id: string
  text: string
  byAdminId: string
  byName: string
  pinned: boolean
  createdAt: string
}

export async function getDashboardLayout(adminId: string): Promise<{ hiddenWidgets: string[] }> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { preferences: true },
  })
  const prefs = (admin?.preferences ?? {}) as { hiddenWidgets?: unknown }
  return {
    hiddenWidgets: Array.isArray(prefs.hiddenWidgets)
      ? (prefs.hiddenWidgets as string[]).filter((w) => typeof w === 'string')
      : [],
  }
}

export async function saveDashboardLayout(adminId: string, hiddenWidgets: string[]): Promise<void> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { preferences: true },
  })
  const prefs = (admin?.preferences ?? {}) as Record<string, unknown>
  await prisma.adminUser.update({
    where: { id: adminId },
    data: { preferences: { ...prefs, hiddenWidgets } },
  })
}

export async function listDashboardNotes(): Promise<DashboardNote[]> {
  const row = await prisma.platformSetting.findUnique({ where: { key: NOTES_KEY } })
  const notes = Array.isArray(row?.value) ? (row.value as unknown[]) : []
  const adminIds = [
    ...new Set(
      notes
        .map((n) => (n as { byAdminId?: string }).byAdminId)
        .filter((v): v is string => typeof v === 'string'),
    ),
  ]
  const admins = await prisma.adminUser.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, user: { select: { mobile: true, firstName: true, lastName: true } } },
  })
  const nameOf = new Map(
    admins.map((a) => [
      a.id,
      [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || a.user.mobile || '—',
    ]),
  )
  return notes
    .map((n) => {
      const note = n as Partial<DashboardNote>
      return {
        id: note.id ?? '',
        text: note.text ?? '',
        byAdminId: note.byAdminId ?? '',
        byName: nameOf.get(note.byAdminId ?? '') ?? '—',
        pinned: note.pinned === true,
        createdAt: note.createdAt ?? '',
      }
    })
    .filter((n) => n.id)
    .slice(0, MAX_NOTES)
}

export async function addDashboardNote(
  adminId: string,
  text: string,
  pinned: boolean,
): Promise<DashboardNote> {
  const notes = await listDashboardNotes()
  const note: DashboardNote = {
    id: crypto.randomUUID(),
    text,
    byAdminId: adminId,
    byName: '',
    pinned,
    createdAt: new Date().toISOString(),
  }
  const next = [note, ...notes].slice(0, MAX_NOTES)
  await prisma.platformSetting.upsert({
    where: { key: NOTES_KEY },
    create: { key: NOTES_KEY, value: next as unknown as object[], updatedBy: adminId },
    update: { value: next as unknown as object[], updatedBy: adminId },
  })
  const admins = await prisma.adminUser.findMany({
    where: { id: adminId },
    select: { user: { select: { mobile: true, firstName: true, lastName: true } } },
  })
  const u = admins[0]?.user
  note.byName = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.mobile || '—'
  return note
}

export async function deleteDashboardNote(adminId: string, adminRole: string, noteId: string) {
  const notes = await listDashboardNotes()
  const target = notes.find((n) => n.id === noteId)
  if (!target) throw ApiError.notFound('یادداشت یافت نشد')
  // فقط نویسنده یا SUPER_ADMIN می‌تواند حذف کند
  if (target.byAdminId !== adminId && adminRole !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('فقط نویسنده یا مدیر ارشد می‌تواند این یادداشت را حذف کند')
  }
  const next = notes.filter((n) => n.id !== noteId)
  await prisma.platformSetting.upsert({
    where: { key: NOTES_KEY },
    create: { key: NOTES_KEY, value: next as unknown as object[], updatedBy: adminId },
    update: { value: next as unknown as object[], updatedBy: adminId },
  })
}

// ============================================
// Nav Badges — بدون تغییر (reuse از V1)
// ============================================

export interface AdminNavBadgeCounts {
  kyc?: number
  withdrawals?: number
  orders?: number
  tickets?: number
  risk?: number
  delivery?: number
  /** وضعیت توقف اضطراری — برای بنر سراسری در shell */
  halted?: { trading: boolean; withdrawals: boolean }
}

export async function getAdminNavBadges(
  permissions: readonly Permission[],
): Promise<AdminNavBadgeCounts> {
  const badges: AdminNavBadgeCounts = {}
  const tasks: Promise<void>[] = []

  if (hasPermission(permissions, PERMISSIONS.KYC_READ)) {
    tasks.push(
      prisma.kycSubmission
        .count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } })
        .then((n) => {
          if (n > 0) badges.kyc = n
        }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.WITHDRAWALS_READ)) {
    tasks.push(
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }).then((n) => {
        if (n > 0) badges.withdrawals = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.ORDERS_READ)) {
    tasks.push(
      prisma.order.count({ where: { status: { in: ['PENDING', 'LOCKED'] } } }).then((n) => {
        if (n > 0) badges.orders = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.TICKETS_READ)) {
    tasks.push(
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }).then((n) => {
        if (n > 0) badges.tickets = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.RISK_READ)) {
    tasks.push(
      prisma.riskEvent.count({ where: { reviewedAt: null } }).then((n) => {
        if (n > 0) badges.risk = n
      }),
    )
  }
  if (hasPermission(permissions, PERMISSIONS.DELIVERY_READ)) {
    tasks.push(
      prisma.goldDeliveryRequest
        .count({ where: { status: { in: ['PENDING', 'PREPARING'] } } })
        .then((n) => {
          if (n > 0) badges.delivery = n
        }),
    )
  }
  // پرچم‌های halt — همه ادمین‌ها باید وضعیت توقف را ببینند
  tasks.push(
    getHaltFlags()
      .then((f) => {
        badges.halted = {
          trading: f.trading.halted,
          withdrawals: f.withdrawals.halted,
        }
      })
      .catch(() => {}),
  )

  await Promise.all(tasks)
  return badges
}
