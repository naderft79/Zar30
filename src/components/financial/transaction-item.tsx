import {
  IconArrowDownLeft,
  IconArrowUpLeft,
  IconCalendarClock,
  IconRepeat,
  IconWallet,
  type TablerIcon,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { FinancialNumber } from './financial-number'
import { StatusBadge } from '@/components/ui/status-badge'

// ============================================
// Transaction Item — ردیف تراکنش مالی
// در لیست‌ها (دارایی، تاریخچه، داشبورد)
// ============================================

export type TransactionKind = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'installment' | 'transfer'
export type TransactionStatus = 'success' | 'pending' | 'failed'

const kindConfig: Record<TransactionKind, { icon: TablerIcon; label: string; iconClass: string }> =
  {
    deposit: { icon: IconArrowDownLeft, label: 'واریز', iconClass: 'text-success' },
    withdraw: { icon: IconArrowUpLeft, label: 'برداشت', iconClass: 'text-error' },
    buy: {
      icon: IconRepeat,
      label: 'خرید طلا',
      iconClass: 'text-gold-600 dark:text-gold-400',
    },
    sell: {
      icon: IconRepeat,
      label: 'فروش طلا',
      iconClass: 'text-muted-foreground',
    },
    installment: {
      icon: IconCalendarClock,
      label: 'پرداخت قسط',
      iconClass: 'text-info',
    },
    transfer: { icon: IconWallet, label: 'انتقال', iconClass: 'text-muted-foreground' },
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
      <Icon className={cn('size-6 shrink-0', config.iconClass)} strokeWidth={1.75} />
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
