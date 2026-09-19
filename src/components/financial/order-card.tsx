import { ArrowDownLeft, ArrowUpLeft, Clock } from 'lucide-react'
import { cn } from 'cn'
import { FinancialNumber } from './financial-number'
import { StatusBadge } from '@/components/ui/status-badge'

// ============================================
// Order Card — کارت سفارش خرید/فروش طلا
// ============================================

export type OrderSide = 'buy' | 'sell'
export type OrderStatus = 'open' | 'filled' | 'cancelled' | 'pending'

const statusConfig: Record<
  OrderStatus,
  { tone: 'success' | 'warning' | 'neutral' | 'info'; label: string }
> = {
  open: { tone: 'info', label: 'باز' },
  filled: { tone: 'success', label: 'تکمیل‌شده' },
  cancelled: { tone: 'neutral', label: 'لغوشده' },
  pending: { tone: 'warning', label: 'در انتظار' },
}

interface OrderCardProps {
  side: OrderSide
  status?: OrderStatus
  /** مقدار طلا به گرم */
  goldAmount: number | string
  /** قیمت هر گرم به تومان */
  pricePerGram: number | string
  /** مبلغ کل به تومان */
  totalAmount: number | string
  createdAt?: string
  orderId?: string
  className?: string
}

export function OrderCard({
  side,
  status = 'open',
  goldAmount,
  pricePerGram,
  totalAmount,
  createdAt,
  orderId,
  className,
}: OrderCardProps) {
  const isBuy = side === 'buy'
  const st = statusConfig[status]
  const Icon = isBuy ? ArrowDownLeft : ArrowUpLeft

  return (
    <div
      data-slot="order-card"
      data-side={side}
      className={cn(
        'bg-card border-border/60 rounded-xl border p-4 shadow-xs transition-shadow hover:shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              isBuy ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
            )}
          >
            <Icon className="size-4.5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">
              {isBuy ? 'خرید طلا' : 'فروش طلا'}
            </p>
            {createdAt && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
                <Clock className="size-3" />
                {createdAt}
              </p>
            )}
          </div>
        </div>
        <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
      </div>

      <dl className="border-border/50 mt-4 grid grid-cols-3 gap-3 border-t pt-3.5">
        <div>
          <dt className="text-muted-foreground text-[11px]">مقدار</dt>
          <dd className="mt-1">
            <FinancialNumber value={goldAmount} size="sm" decimals={3} />
            <span className="text-muted-foreground mr-1 text-[10px]">گرم</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-[11px]">قیمت هر گرم</dt>
          <dd className="mt-1">
            <FinancialNumber value={pricePerGram} size="sm" />
            <span className="text-muted-foreground mr-1 text-[10px]">تومان</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-[11px]">مبلغ کل</dt>
          <dd className="mt-1">
            <FinancialNumber
              value={totalAmount}
              size="sm"
              className="text-gold-600 dark:text-gold-400"
            />
            <span className="text-muted-foreground mr-1 text-[10px]">تومان</span>
          </dd>
        </div>
      </dl>
      {orderId && (
        <p className="text-muted-foreground mt-3 text-[10px]" dir="ltr">
          #{orderId}
        </p>
      )}
    </div>
  )
}
