// ============================================
// Zar30 - Design System Preview (client)
// ============================================
// نمایش tokenها، primitiveها و کامپوننت‌های مالی در stateهای مختلف
// ============================================

'use client'

import { useState } from 'react'
import { Coins, History, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Skeleton, SkeletonCard, SkeletonListItem, SkeletonText } from '@/components/ui/skeleton'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { FinancialNumber } from '@/components/financial/financial-number'
import { BalanceCard } from '@/components/financial/balance-card'
import { TrendBadge } from '@/components/financial/trend-badge'
import { PriceTicker } from '@/components/financial/price-ticker'
import { TransactionItem } from '@/components/financial/transaction-item'
import { OrderCard } from '@/components/financial/order-card'
import { QuoteCard } from '@/components/financial/quote-card'
import { PortfolioChart } from '@/components/financial/portfolio-chart'
import { StatusCard } from '@/components/financial/status-card'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-h2 text-foreground border-border/60 border-b pb-2">{title}</h2>
      {children}
    </section>
  )
}

interface Row {
  id: string
  kind: string
  amount: number
  status: string
}

const TABLE_COLUMNS: DataTableColumn<Row>[] = [
  {
    key: 'id',
    header: 'شناسه',
    primary: true,
    render: (r) => (
      <span className="font-mono text-xs" dir="ltr">
        {r.id}
      </span>
    ),
  },
  { key: 'kind', header: 'نوع', render: (r) => r.kind },
  {
    key: 'amount',
    header: 'مبلغ',
    render: (r) => <FinancialNumber value={r.amount} size="sm" unit="تومان" />,
  },
  {
    key: 'status',
    header: 'وضعیت',
    render: (r) => (
      <StatusBadge tone={r.status === 'موفق' ? 'success' : 'warning'}>{r.status}</StatusBadge>
    ),
  },
]

const TABLE_ROWS: Row[] = [
  { id: 'tx-1001', kind: 'خرید طلا', amount: 1250000, status: 'موفق' },
  { id: 'tx-1002', kind: 'واریز', amount: 500000, status: 'موفق' },
  { id: 'tx-1003', kind: 'پرداخت قسط', amount: 75000, status: 'در انتظار' },
]

export function DesignSystemPreview() {
  const [retrying, setRetrying] = useState(false)

  return (
    <main className="bg-background mx-auto max-w-6xl space-y-10 p-6 pb-24" dir="rtl">
      <header>
        <h1 className="text-display text-foreground">Design System — زرسی</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          پیش‌نمایش توکن‌ها و کامپوننت‌های Phase 3.1 — فقط برای توسعه
        </p>
      </header>

      <Section title="Buttons — واریانت‌ها">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="gold">Gold CTA</Button>
          <Button variant="success">Success</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Danger</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">XS</Button>
          <Button size="sm">SM</Button>
          <Button size="lg">LG</Button>
          <Button disabled>Disabled</Button>
          <Button variant="gold" disabled>
            Gold Disabled
          </Button>
        </div>
      </Section>

      <Section title="Badges — وضعیت">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">خنثی</StatusBadge>
          <StatusBadge tone="gold">در انتظار</StatusBadge>
          <StatusBadge tone="success">فعال</StatusBadge>
          <StatusBadge tone="warning">نیاز به اقدام</StatusBadge>
          <StatusBadge tone="error">ناموفق</StatusBadge>
          <StatusBadge tone="info">در حال پردازش</StatusBadge>
        </div>
      </Section>

      <Section title="Financial Numbers — اعداد مالی">
        <Card>
          <CardContent className="flex flex-wrap items-baseline gap-8 pt-6">
            <FinancialNumber value={1234567} unit="تومان" size="xl" />
            <FinancialNumber value={12.345} unit="گرم" size="lg" decimals={3} />
            <FinancialNumber value={9876543} unit="تومان" size="md" />
            <FinancialNumber value={42000} size="sm" unit="تومان" />
            <div className="flex items-center gap-2">
              <TrendBadge value={2.35} caption="۲۴ ساعت" />
              <TrendBadge value={-1.2} caption="۲۴ ساعت" />
              <TrendBadge value={0} />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Balance Cards — کارت‌های موجودی">
        <div className="grid gap-4 sm:grid-cols-3">
          <BalanceCard variant="total" amount={15234500} changePercent={2.35} />
          <BalanceCard variant="gold" amount={4.325} subtitle="≈ ۱۵٬۲۳۴٬۵۰۰ تومان" />
          <BalanceCard variant="fiat" amount={1250000} changePercent={-0.8} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <BalanceCard variant="gold" amount={0} loading />
          <BalanceCard variant="fiat" amount={0} loading />
          <BalanceCard variant="total" amount={0} loading />
        </div>
      </Section>

      <Section title="Price Ticker — نوار قیمت">
        <PriceTicker
          items={[
            { key: 'gold18', label: 'طلای ۱۸ عیار (گرم)', price: 3512000, changePercent: 0.42 },
            { key: 'buy', label: 'نرخ خرید', price: 3537000, changePercent: 0.41 },
            { key: 'sell', label: 'نرخ فروش', price: 3487000, changePercent: -0.18 },
          ]}
        />
      </Section>

      <Section title="Transaction / Order / Quote">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">تراکنش‌ها</CardTitle>
            </CardHeader>
            <CardContent className="divide-border/40 divide-y">
              <TransactionItem kind="deposit" amount={5000000} date="۱۴۰۳/۰۹/۱۲" />
              <TransactionItem kind="buy" amount={3512000} date="۱۴۰۳/۰۹/۱۱" />
              <TransactionItem kind="sell" amount={1756000} status="pending" date="۱۴۰۳/۰۹/۱۰" />
              <TransactionItem kind="withdraw" amount={200000} status="failed" date="۱۴۰۳/۰۹/۰۹" />
              <TransactionItem kind="installment" amount={75000} date="۱۴۰۳/۰۹/۰۸" />
            </CardContent>
          </Card>
          <div className="space-y-4">
            <OrderCard
              side="buy"
              status="open"
              goldAmount={1.5}
              pricePerGram={3512000}
              totalAmount={5268000}
              createdAt="۱۴۰۳/۰۹/۱۲ — ۱۴:۳۲"
              orderId="ord-9f2e1"
            />
            <QuoteCard
              title="پیش‌فاکتور خرید"
              expiresIn="۳۰ ثانیه"
              rows={[
                { label: 'مقدار', value: 1.5, unit: 'گرم' },
                { label: 'نرخ هر گرم', value: 3512000, unit: 'تومان' },
                { label: 'کارمزد', value: 52680, unit: 'تومان' },
                { label: 'مبلغ قابل پرداخت', value: 5320680, unit: 'تومان', total: true },
              ]}
              actionLabel="تایید و خرید"
            />
          </div>
        </div>
      </Section>

      <Section title="Portfolio Chart + Status Cards">
        <div className="grid gap-5 lg:grid-cols-2">
          <PortfolioChart
            data={[100, 102, 98, 105, 108, 103, 110, 115, 112, 118, 122, 120]}
            changePercent={20.0}
          />
          <div className="space-y-4">
            <StatusCard
              icon={ShieldCheck}
              title="احراز هویت"
              statusLabel="سطح ۱ — موبایل تایید شده"
              statusTone="warning"
              description="برای فعال شدن معاملات، احراز هویت را تکمیل کنید."
              progress={33}
              action={{ label: 'ادامه احراز هویت', href: '/design-system' }}
            />
            <StatusCard
              icon={ShieldCheck}
              title="امنیت حساب"
              statusLabel="موبایل تایید شده"
              statusTone="success"
              description="حساب در وضعیت امن قرار دارد."
            />
          </div>
        </div>
      </Section>

      <Section title="Data Table — جدول responsive">
        <Card>
          <CardContent className="pt-6">
            <DataTable columns={TABLE_COLUMNS} rows={TABLE_ROWS} rowKey={(r) => r.id} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={TABLE_COLUMNS}
              rows={[]}
              rowKey={(r) => r.id}
              emptyIcon={History}
              emptyTitle="هنوز تراکنشی ثبت نشده است"
            />
          </CardContent>
        </Card>
      </Section>

      <Section title="States — خالی / خطا / بارگذاری">
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            icon={Coins}
            title="هنوز دارایی ندارید"
            description="با اولین واریز، کیف پول طلا و ریالی شما ساخته می‌شود."
            badge="پیش‌نمایش"
          />
          <ErrorState
            onRetry={() => {
              setRetrying(true)
              setTimeout(() => setRetrying(false), 1200)
            }}
            retrying={retrying}
          />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonText lines={3} className="mt-4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Form Controls">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">ورودی متن</label>
              <Input placeholder="مقدار را وارد کنید" />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">
                ورودی نامعتبر
              </label>
              <Input aria-invalid="true" defaultValue="مقدار نامعتبر" />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">غیرفعال</label>
              <Input disabled placeholder="غیرفعال" />
            </div>
            <div>
              <label className="text-foreground mb-1.5 block text-sm font-medium">عددی</label>
              <Input dir="ltr" className="tnum text-left" defaultValue="1,234,567" />
            </div>
          </CardContent>
        </Card>
      </Section>
    </main>
  )
}
