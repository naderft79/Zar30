// ============================================
// Zar30 - Admin Dashboard V2 — مرکز فرماندهی
// ============================================
// گرید ۱۲ ستونی — KPI + صف‌ها + هشدارها + نمودارها + مالی + فیدها
// auto-refresh متفاوت per بخش — lazy sections — preferences per-admin
// ============================================

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  IconAlertTriangle,
  IconClipboardList,
  IconCoins,
  IconCoin,
  IconLifebuoy,
  IconPackage,
  IconRefresh,
  IconShieldExclamation,
  IconTrendingUp,
  IconUserCheck,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react'
import { apiGetWithRefresh } from '@/lib/api/client'
import type {
  AdminDashboardV2,
  DashboardCharts,
  DashboardFeeds,
  DashboardFinance,
} from '@/lib/services/admin-dashboard.service'
import { useAdmin } from '@/components/admin/admin-shell'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AlertFeed } from '@/components/admin/dashboard/alert-feed'
import { KpiCard, KpiCardSkeleton, type KpiPeriod } from '@/components/admin/dashboard/kpi-card'
import { QueueCard } from '@/components/admin/dashboard/queue-card'
import { QueueRowActions } from '@/components/admin/dashboard/queue-actions'
import { KillSwitch } from '@/components/admin/dashboard/kill-switch'
import { NotesWidget } from '@/components/admin/dashboard/notes-widget'
import {
  PreferencesPopover,
  type WidgetDef,
} from '@/components/admin/dashboard/preferences-popover'
import { QuickActions } from '@/components/admin/dashboard/quick-actions'
import { AdminSectionNav } from '@/components/admin/dashboard/section-nav'
import { Segmented } from '@/components/admin/dashboard/segmented'
import {
  AuditFeedWidget,
  BroadcastFeedWidget,
  HealthWidget,
  OnlineAdminsWidget,
} from '@/components/admin/dashboard/feeds'
import {
  CashflowWidget,
  LedgerBalancesWidget,
  PnlWidget,
  ReconWidget,
} from '@/components/admin/dashboard/finance-widgets'
import type { ChartRange } from '@/components/admin/dashboard/chart-widget'
import { PERMISSIONS, hasPermission } from '@/lib/auth/rbac'
import { formatExactAmount } from '@/lib/utils/format'

// ============================================
// Lazy chart bundle — خارج از باندل اولیه
// ============================================

const ChartsBundle = dynamic(
  () => import('@/components/admin/dashboard/charts').then((m) => m.ChartsSection),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-80 rounded-xl" />
        ))}
      </div>
    ),
  },
)

// ============================================
// Constants
// ============================================

const PERIODS: { value: KpiPeriod; label: string }[] = [
  { value: '24h', label: '۲۴h' },
  { value: '7d', label: '۷d' },
  { value: '30d', label: '۳۰d' },
]

const QUEUE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  kyc: IconUserCheck,
  withdrawals: IconWallet,
  orders: IconClipboardList,
  tickets: IconLifebuoy,
  delivery: IconPackage,
  risk: IconShieldExclamation,
}

const ALL_WIDGETS: WidgetDef[] = [
  { id: 'kpis', label: 'شاخص‌های کلیدی (KPI)' },
  { id: 'queues', label: 'صف‌های عملیاتی' },
  { id: 'alerts', label: 'هشدارها' },
  { id: 'charts', label: 'نمودارها' },
  { id: 'finance', label: 'ویجت‌های مالی' },
  { id: 'feeds', label: 'فیدهای فعالیت' },
  { id: 'notes', label: 'یادداشت تیمی' },
  { id: 'quick-actions', label: 'دسترسی سریع' },
  { id: 'kill-switch', label: 'کنترل اضطراری' },
]

const INTERVAL_QUEUES = 30_000
const INTERVAL_FEEDS = 60_000
const INTERVAL_CHARTS = 5 * 60_000

// ============================================
// Skeleton
// ============================================

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری مرکز فرماندهی">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-48 rounded-xl" />
        ))}
      </div>
      <div className="skeleton-shimmer h-64 rounded-xl" />
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function AdminDashboard() {
  const { admin } = useAdmin()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlRange = (searchParams.get('range') as ChartRange | null) ?? '30'
  const urlPeriod = (searchParams.get('period') as KpiPeriod | null) ?? '24h'

  const [dashboard, setDashboard] = useState<AdminDashboardV2 | null>(null)
  const [charts, setCharts] = useState<DashboardCharts | null>(null)
  const [finance, setFinance] = useState<DashboardFinance | null>(null)
  const [feeds, setFeeds] = useState<DashboardFeeds | null>(null)
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([])

  const [period, setPeriod] = useState<KpiPeriod>(urlPeriod)
  const [range, setRange] = useState<ChartRange>(urlRange)
  const [overlay, setOverlay] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const isVisible = (id: string) => !hiddenWidgets.includes(id)
  const mounted = useRef(true)

  // ---------- Fetch helpers ----------

  const loadDashboard = useCallback(async (p: KpiPeriod) => {
    const res = await apiGetWithRefresh<{ dashboard: AdminDashboardV2 }>(
      `/api/v1/admin/dashboard?period=${p}`,
    )
    if (!mounted.current) return
    if (!res.ok) {
      setError(res.error ?? 'بارگذاری داشبورد ناموفق بود')
      return
    }
    setError(null)
    setDashboard(res.data!.dashboard)
    setLastRefresh(new Date())
  }, [])

  const loadCharts = useCallback(async (r: ChartRange) => {
    const res = await apiGetWithRefresh<{ charts: DashboardCharts }>(
      `/api/v1/admin/dashboard/charts?range=${r}`,
    )
    if (!mounted.current) return
    if (res.ok) setCharts(res.data!.charts)
  }, [])

  const loadFinance = useCallback(async () => {
    if (!hasPermission(admin.permissions, PERMISSIONS.LEDGER_READ)) return
    const res = await apiGetWithRefresh<{ finance: DashboardFinance }>(
      '/api/v1/admin/dashboard/finance',
    )
    if (!mounted.current) return
    if (res.ok) setFinance(res.data!.finance)
  }, [admin.permissions])

  const loadFeeds = useCallback(async () => {
    const res = await apiGetWithRefresh<{ feeds: DashboardFeeds }>('/api/v1/admin/dashboard/feeds')
    if (!mounted.current) return
    if (res.ok) setFeeds(res.data!.feeds)
  }, [])

  const loadLayout = useCallback(async () => {
    const res = await apiGetWithRefresh<{ layout: { hiddenWidgets: string[] } }>(
      '/api/v1/admin/dashboard/layout',
    )
    if (!mounted.current) return
    if (res.ok) setHiddenWidgets(res.data!.layout.hiddenWidgets)
  }, [])

  // ---------- Effects ----------

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // initial load — IIFE جلو setState synchronous را می‌گیرد
  useEffect(() => {
    ;(async () => {
      await Promise.all([loadDashboard(period), loadLayout(), loadFeeds(), loadFinance()])
    })()
  }, [loadDashboard, loadLayout, loadFeeds, loadFinance, period])

  // charts — lazy بعد از mount
  useEffect(() => {
    ;(async () => {
      await loadCharts(range)
    })()
  }, [loadCharts, range])

  // auto-refresh intervals — فقط وقتی صفحه visible است
  useEffect(() => {
    if (document.hidden) return
    const iv = setInterval(() => void loadDashboard(period), INTERVAL_QUEUES)
    return () => clearInterval(iv)
  }, [loadDashboard, period])

  useEffect(() => {
    if (document.hidden) return
    const iv = setInterval(() => void loadFeeds(), INTERVAL_FEEDS)
    return () => clearInterval(iv)
  }, [loadFeeds])

  useEffect(() => {
    if (document.hidden) return
    const iv = setInterval(() => void loadCharts(range), INTERVAL_CHARTS)
    return () => clearInterval(iv)
  }, [loadCharts, range])

  // ---------- Handlers ----------

  const handlePeriodChange = (p: KpiPeriod) => {
    setPeriod(p)
    router.replace(`?period=${p}&range=${range}`, { scroll: false })
  }

  const handleRangeChange = (r: ChartRange) => {
    setRange(r)
    router.replace(`?period=${period}&range=${r}`, { scroll: false })
  }

  const refreshAll = () => {
    void loadDashboard(period)
    void loadCharts(range)
    void loadFinance()
    void loadFeeds()
  }

  // ---------- Render ----------

  if (error && !dashboard) {
    return (
      <div className="bg-card border-border/60 flex flex-col items-center rounded-2xl border p-10 text-center">
        <IconAlertTriangle
          className="text-error mb-3 size-8"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <p className="text-foreground text-sm font-semibold">خطا در بارگذاری مرکز فرماندهی</p>
        <p className="text-muted-foreground mt-1 text-xs">{error}</p>
        <button
          type="button"
          onClick={refreshAll}
          className="border-border/60 text-foreground hover:bg-muted focus-visible:ring-ring mt-4 inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconRefresh className="size-3.5" strokeWidth={1.75} />
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (!dashboard) return <DashboardSkeleton />

  const price = dashboard.goldPrice
  const haltActive = dashboard.halted.trading || dashboard.halted.withdrawals

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminPageHeader title="مرکز فرماندهی" />
        <div className="flex items-center gap-2">
          {/* Gold price chip */}
          {price && (
            <div className="border-border/60 bg-card flex items-center gap-1.5 rounded-xl border px-3 py-2">
              <IconCoin className="text-gold-500 size-4" strokeWidth={1.75} aria-hidden="true" />
              <div className="text-right">
                <p className="text-gold-700 dark:text-gold-300 text-xs font-bold tabular-nums">
                  {formatExactAmount(price.buyPrice)}
                </p>
                <p className="text-muted-foreground text-[9px]">تومان/گرم</p>
              </div>
            </div>
          )}
          {/* Range selector */}
          <Segmented
            options={[
              { value: '7', label: '۷ روز' },
              { value: '30', label: '۳۰ روز' },
              { value: '90', label: '۹۰ روز' },
            ]}
            value={range}
            onChange={handleRangeChange}
            ariaLabel="بازه نمودارها"
          />
          {/* Preferences */}
          <PreferencesPopover
            widgets={ALL_WIDGETS}
            hidden={hiddenWidgets}
            onChange={setHiddenWidgets}
          />
          <button
            type="button"
            onClick={refreshAll}
            aria-label="به‌روزرسانی همه"
            className="border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <IconRefresh className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ===== Section quick nav — پویا از nav اصلی ===== */}
      <AdminSectionNav permissions={admin.permissions} />

      {/* ===== Halt banner ===== */}
      {haltActive && (
        <div
          role="alert"
          className="border-error/40 bg-error/10 flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <IconAlertTriangle className="text-error size-5 shrink-0" strokeWidth={1.75} />
          <div className="flex-1">
            <p className="text-error text-sm font-bold">
              {dashboard.halted.trading && dashboard.halted.withdrawals
                ? 'معاملات و برداشت‌ها متوقف است'
                : dashboard.halted.trading
                  ? 'معاملات متوقف است'
                  : 'برداشت‌ها متوقف است'}
            </p>
            <p className="text-error/80 text-[11px]">
              از کنترل اضطراری در پایین صفحه ازسرگیری کنید
            </p>
          </div>
        </div>
      )}

      {/* ===== KPI Row ===== */}
      {isVisible('kpis') && (
        <div className="animate-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            id="kpi-toman"
            label="موجودی تومان کاربران"
            value={dashboard.kpis.userTomanBalance.value}
            unit="تومان"
            netChange={dashboard.kpis.userTomanBalance.netChange}
            netChangeLabel="جریان خالص"
            sparkline={dashboard.kpis.userTomanBalance.sparkline}
            icon={IconWallet}
            href="/admin/wallets"
            periods={PERIODS}
            activePeriod={period}
            onPeriodChange={handlePeriodChange}
          />
          <KpiCard
            id="kpi-gold"
            label="موجودی طلای کاربران"
            value={dashboard.kpis.userGoldBalance.value}
            unit="گرم"
            sparkline={dashboard.kpis.userGoldBalance.sparkline}
            icon={IconCoins}
            href="/admin/gold"
            gold
          />
          <KpiCard
            id="kpi-fee"
            label="درآمد کارمزد"
            value={dashboard.kpis.feeRevenue.value}
            unit="تومان"
            deltaPct={dashboard.kpis.feeRevenue.deltaPct}
            sparkline={dashboard.kpis.feeRevenue.sparkline}
            icon={IconTrendingUp}
            href="/admin/transactions?type=FEE"
            periods={PERIODS}
            activePeriod={period}
            onPeriodChange={handlePeriodChange}
          />
          <KpiCard
            id="kpi-users"
            label="کاربران فعال / جدید"
            value={dashboard.kpis.activeUsers.value}
            deltaPct={dashboard.kpis.newUsers.deltaPct}
            sparkline={dashboard.kpis.newUsers.sparkline}
            icon={IconUsers}
            href="/admin/users"
          />
        </div>
      )}

      {/* ===== Queues + Alerts ===== */}
      {isVisible('queues') && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.queues.map((q) => (
            <QueueCard
              key={q.key}
              queue={q}
              icon={QUEUE_ICONS[q.key] ?? IconClipboardList}
              onRefresh={() => void loadDashboard(period)}
              rowActions={(row) => (
                <QueueRowActions
                  queueKey={q.key}
                  rowId={row.id}
                  permissions={admin.permissions}
                  onDone={() => void loadDashboard(period)}
                />
              )}
            />
          ))}
        </div>
      )}

      {/* ===== Alerts + Online ===== */}
      {isVisible('alerts') && (
        <div className="grid gap-4 lg:grid-cols-2">
          <AlertFeed alerts={dashboard.alerts} />
          <OnlineAdminsWidget feeds={feeds} loading={feeds === null} />
        </div>
      )}

      {/* ===== Charts — lazy ===== */}
      {isVisible('charts') && (
        <ChartsBundle
          charts={charts}
          range={range}
          onRangeChange={handleRangeChange}
          overlay={overlay}
          onOverlayChange={setOverlay}
        />
      )}

      {/* ===== Finance ===== */}
      {isVisible('finance') && hasPermission(admin.permissions, PERMISSIONS.LEDGER_READ) && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LedgerBalancesWidget
            finance={finance}
            loading={finance === null}
            onRefresh={loadFinance}
          />
          <PnlWidget finance={finance} loading={finance === null} onRefresh={loadFinance} />
          <CashflowWidget finance={finance} loading={finance === null} onRefresh={loadFinance} />
          <ReconWidget finance={finance} loading={finance === null} onRefresh={loadFinance} />
        </div>
      )}

      {/* ===== Feeds ===== */}
      {isVisible('feeds') && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AuditFeedWidget feeds={feeds} loading={feeds === null} onRefresh={loadFeeds} />
          <BroadcastFeedWidget feeds={feeds} loading={feeds === null} onRefresh={loadFeeds} />
          <HealthWidget health={dashboard.health} loading={false} />
          {isVisible('kill-switch') && (
            <KillSwitch halted={dashboard.halted} onChange={() => void loadDashboard(period)} />
          )}
        </div>
      )}

      {/* ===== Notes + Quick Actions ===== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isVisible('notes') && <NotesWidget />}
        {isVisible('quick-actions') && <QuickActions />}
      </div>

      {/* ===== Last refresh timestamp ===== */}
      {lastRefresh && (
        <p className="text-muted-foreground text-center text-[10px] tabular-nums">
          آخرین به‌روزرسانی: {lastRefresh.toLocaleTimeString('fa-IR')} — داده کش‌شده تا ۳۰ ثانیه
        </p>
      )}
    </div>
  )
}
