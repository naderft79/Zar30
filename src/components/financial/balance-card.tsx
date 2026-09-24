import { IconCoins } from '@tabler/icons-react'
import { IconWallet3d } from '@/components/shared/icon-installment'
import { cn } from 'cn'
import { FinancialNumber } from './financial-number'
import { TrendBadge } from './trend-badge'

// ============================================
// Balance Card — کارت موجودی دارایی
// variant: gold (طلایی) | fiat (تومانی) | total
// ============================================

interface BalanceCardProps {
  variant?: 'gold' | 'fiat' | 'total'
  title?: string
  amount: number | string
  unit?: string
  /** درصد تغییر — مثبت/منفی */
  changePercent?: number
  /** زیرعنوان — مثلاً معادل تومانی طلا */
  subtitle?: string
  loading?: boolean
  className?: string
}

const variantConfig = {
  gold: {
    icon: IconCoins,
    title: 'موجودی طلا',
    unit: 'گرم',
    // گرادیان طلایی ظریف — نه پر زرق و برق
    cardClass:
      'border-gold-500/30 bg-gradient-to-bl from-gold-500/15 via-card to-card dark:from-gold-500/10',
    iconClass: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
  },
  fiat: {
    icon: IconWallet3d,
    title: 'موجودی تومانی',
    unit: 'تومان',
    cardClass: 'border-cream-400/15 bg-gradient-to-bl from-cream-50/6 via-card to-card',
    iconClass: 'bg-cream-50/10 text-cream-300',
  },
  total: {
    icon: IconWallet3d,
    title: 'ارزش کل دارایی',
    unit: 'تومان',
    cardClass: 'border-border/60 bg-gradient-to-bl from-elevated via-card to-card',
    iconClass: 'bg-muted text-muted-foreground',
  },
}

export function BalanceCard({
  variant = 'total',
  title,
  amount,
  unit,
  changePercent,
  subtitle,
  loading = false,
  className,
}: BalanceCardProps) {
  const config = variantConfig[variant]
  const Icon = config.icon
  const displayUnit = unit ?? config.unit

  return (
    <div
      data-slot="balance-card"
      data-variant={variant}
      className={cn(
        'group bg-card rounded-xl border p-5 shadow-sm transition-all duration-(--duration-normal) ease-(--ease-out)',
        'hover:-translate-y-0.5 hover:shadow-md',
        config.cardClass,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-label mb-1.5">{title ?? config.title}</p>
          {loading ? (
            <div className="skeleton-shimmer h-8 w-36 rounded-md" />
          ) : (
            <FinancialNumber
              value={amount}
              unit={displayUnit}
              size="lg"
              decimals={variant === 'gold' ? 3 : 0}
              animate
            />
          )}
          {subtitle && !loading && (
            <p className="text-muted-foreground mt-1.5 text-xs">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            config.iconClass,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
      </div>
      {changePercent !== undefined && !loading && (
        <div className="mt-3">
          <TrendBadge value={changePercent} />
        </div>
      )}
    </div>
  )
}
