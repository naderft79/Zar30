import { ArrowDownLeft, ArrowUpLeft, CalendarClock, Repeat, Wallet } from 'lucide-react'
import { cn } from 'cn'
import { FinancialNumber } from './financial-number'
import { StatusBadge } from '@/components/ui/status-badge'
import type { LucideIcon } from 'lucide-react'

// ============================================
// Transaction Item — ردیف تراکنش مالی
// در لیست‌ها (دارایی، تاریخچه، داشبورد)
// ============================================

export type TransactionKind = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'installment' | 'transfer'
export type TransactionStatus = 'success' | 'pending' | 'failed'

const kindConfig: Record<TransactionKind, { icon: LucideIcon; label: string; iconClass: string }> =
  {
    deposit: { icon: ArrowDownLeft, label: 'واریز', iconClass: 'bg-success/10 text-success' },
    withdraw: { icon: ArrowUpLeft, label: 'برداشت', iconClass: 'bg-error/10 text-error' },
    buy: {
      icon: Repeat,
      label: 'خرید طلا',
      iconClass: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
    },
    sell: {
      icon: Repeat,
      label: 'فروش طلا',
      iconClass: 'bg-navy-500/10 text-navy-500 dark:text-navy-200',
    },
    installment: { icon: CalendarClock, label: 'پرداخت قسط', iconClass: 'bg-info/10 text-info' },
    transfer: { icon: Wallet, label: 'انتقال', iconClass: 'bg-muted text-muted-foreground' },
  }

const statusTone: Record<
  TransactionStatus,
  { tone: 'success' | 'warning' | 'error'; label: string }
> = {
  success: { tone: 'success', label: 'موفق' },
  pending: { tone: 'warning', label: 'در انتظار' },
  failed: { tone: 'error', label: 'ناموفق' },
}

interface TransactionItemProps {
  kind: TransactionKind
  title?: string
  amount: number | string
  unit?: string
  /** مثبت = واریز به حساب | منفی = برداشت */
  direction?: 'credit' | 'debit'
  status?: TransactionStatus
  date?: string
  className?: string
}

export function TransactionItem({
  kind,
  title,
  amount,
  unit = 'تومان',
  direction = kind === 'deposit' || kind === 'sell' ? 'credit' : 'debit',
  status = 'success',
  date,
  className,
}: TransactionItemProps) {
  const config = kindConfig[kind]
  const Icon = config.icon
  const st = statusTone[status]

  return (
    <div data-slot="transaction-item" className={cn('flex items-center gap-3 py-3', className)}>
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          config.iconClass,
        )}
      >
        <Icon className="size-4.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-medium">{title ?? config.label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <StatusBadge tone={st.tone} className="text-[10px]">
            {st.label}
          </StatusBadge>
          {date && <span className="text-muted-foreground text-[11px]">{date}</span>}
        </div>
      </div>
      <div
        className={cn(
          'shrink-0 text-left',
          direction === 'credit' ? 'text-success' : 'text-foreground',
        )}
      >
        <FinancialNumber value={amount} size="sm" className="text-sm font-bold" />
        <span className="text-muted-foreground mr-1 text-[10px] font-normal">{unit}</span>
        <span className="sr-only">{direction === 'credit' ? 'واریز' : 'برداشت'}</span>
      </div>
    </div>
  )
}
