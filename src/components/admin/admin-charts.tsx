// ============================================
// Zar30 - Admin Dashboard Charts (recharts)
// ============================================
// روند ۳۰ روزه — AreaChart حجم تراکنش + BarChart سفارش‌ها/کاربران جدید
// با next/dynamic لود می‌شود — خارج از باندل اولیه داشبورد
// ============================================

'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { IconChartLine, IconUsersGroup } from '@tabler/icons-react'
import type { AdminDashboardData } from '@/lib/services/admin-dashboard.service'
import { toPersianDigits } from '@/lib/utils/format'

type TrendPoint = AdminDashboardData['trend'][number]

const faDay = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' })

function dayLabel(iso: string): string {
  return faDay.format(new Date(`${iso}T00:00:00`))
}

/** تومان → میلیون تومان با ۱ رقم اعشار */
function toMillion(v: number): number {
  return Math.round(v / 100_000) / 10
}

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  fontSize: '11px',
  direction: 'rtl' as const,
}

export default function AdminCharts({ trend }: { trend: TrendPoint[] }) {
  const data = trend.map((t) => ({
    day: dayLabel(t.day),
    volume: toMillion(t.txVolume),
    orders: t.orders,
    users: t.newUsers,
  }))

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      {/* ===== حجم تراکنش ===== */}
      <section className="bg-card border-border/60 rounded-xl border p-5">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-sm font-bold">
          <IconChartLine className="text-gold-500 size-4" stroke={1.75} aria-hidden="true" />
          حجم تراکنش‌های موفق — ۳۰ روز اخیر
        </h2>
        <div dir="ltr" className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold-500)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--gold-500)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | string) => [
                  `${toPersianDigits(value)} میلیون تومان`,
                  'حجم',
                ]}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="var(--gold-500)"
                strokeWidth={2}
                fill="url(#volumeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-muted-foreground mt-2 text-[10px]">واحد: میلیون تومان</p>
      </section>

      {/* ===== فعالیت روزانه ===== */}
      <section className="bg-card border-border/60 rounded-xl border p-5">
        <h2 className="text-foreground mb-4 flex items-center gap-2 text-sm font-bold">
          <IconUsersGroup className="text-gold-500 size-4" stroke={1.75} aria-hidden="true" />
          فعالیت روزانه — سفارش‌های تکمیل‌شده و کاربران جدید
        </h2>
        <div dir="ltr" className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | string, name: string) => [
                  toPersianDigits(value),
                  name === 'orders' ? 'سفارش تکمیل‌شده' : 'کاربر جدید',
                ]}
              />
              <Bar dataKey="orders" fill="var(--gold-500)" radius={[4, 4, 0, 0]} maxBarSize={14} />
              <Bar dataKey="users" fill="var(--navy-400)" radius={[4, 4, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-muted-foreground mt-2 flex gap-4 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="bg-gold-500 inline-block size-2 rounded-sm" /> سفارش تکمیل‌شده
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-navy-400 inline-block size-2 rounded-sm" /> کاربر جدید
          </span>
        </div>
      </section>
    </div>
  )
}
