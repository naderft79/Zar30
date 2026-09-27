// ============================================
// Zar30 - Trade Terminal — خرید و فروش طلا
// ============================================
// چیدمان ۲ ستونه: نمودار + موقعیت | تیکت سفارش
// کاملاً هماهنگ با تم برنامه — توکن‌های semantic (لایت + دارک)
// ============================================

'use client'

import { useState } from 'react'
import { IconBell, IconPigMoney, IconExchange, IconChevronDown } from '@tabler/icons-react'
import { TradeTicket } from './trade/trade-ticket'
import { LivePriceHeader } from './trade/live-price-header'
import { OrdersHistory } from './trade/orders-history'
import { SipCard } from './sip-card'
import { PriceAlertsCard } from './price-alerts-card'
import { cn } from 'cn'

type Tab = 'spot' | 'sip' | 'alerts'

const TABS: { key: Tab; label: string; Icon: typeof IconExchange }[] = [
  { key: 'spot', label: 'معامله آنی', Icon: IconExchange },
  { key: 'sip', label: 'خرید دوره‌ای', Icon: IconPigMoney },
  { key: 'alerts', label: 'هشدار قیمت', Icon: IconBell },
]

export function TradeClient() {
  const [tab, setTab] = useState<Tab>('spot')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="animate-stagger space-y-4">
      {/* نوار بازار */}
      <LivePriceHeader />

      {/* تب‌های سرویس */}
      <div className="bg-muted/60 inline-flex rounded-lg p-0.5" role="tablist">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'focus-visible:ring-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none',
              tab === key
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" stroke={1.75} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'spot' && (
        <>
          {/* تیکت سفارش */}
          <div className="terminal-canvas border-border overflow-hidden rounded-2xl border p-4">
            <div className="mx-auto max-w-md">
              <TradeTicket onExecuted={() => setRefreshKey((k) => k + 1)} />
            </div>
          </div>

          {/* تاریخچه */}
          <OrdersHistory refreshKey={refreshKey} />
        </>
      )}

      {tab === 'sip' && <SipCard online />}

      {tab === 'alerts' && <PriceAlertsCard online currentPrice={null} />}

      {/* راهنمای کوچک پایین */}
      <p className="text-muted-foreground flex items-center gap-1 pb-2 text-[10px]">
        <IconChevronDown className="size-3" aria-hidden="true" />
        معامله با آخرین قیمت معتبر سرور انجام می‌شود — قیمت دقیق در سند سفارش ثبت می‌گردد
      </p>
    </div>
  )
}
