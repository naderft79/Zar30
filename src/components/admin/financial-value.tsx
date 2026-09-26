// ============================================
// Zar30 - Admin Financial Value
// ============================================
// نمایش مقدار مالی دقیق — string ورودی، بدون هیچ تبدیل Number
// ============================================

import { formatExactAmount, formatGoldAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface FinancialValueProps {
  /** رشته دقیق Decimal/BigInt — هیچ Number */
  value: string | null | undefined
  unit?: string
  /** مقدار گرم طلا است — قانون نمایش ۵ رقم truncate اعمال می‌شود */
  gold?: boolean
  className?: string
}

export function FinancialValue({ value, unit, gold, className }: FinancialValueProps) {
  const isGold = gold || unit === 'گرم'
  return (
    <span className={cn('text-foreground tabular-nums', className)} dir="ltr">
      {isGold ? formatGoldAmount(value ?? '') : formatExactAmount(value ?? '')}
      {unit && <span className="text-muted-foreground mr-1 text-[10px]">{unit}</span>}
    </span>
  )
}
