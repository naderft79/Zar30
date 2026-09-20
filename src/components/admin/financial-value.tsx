// ============================================
// Zar30 - Admin Financial Value
// ============================================
// نمایش مقدار مالی دقیق — string ورودی، بدون هیچ تبدیل Number
// ============================================

import { formatExactAmount } from '@/lib/utils/format'
import { cn } from 'cn'

interface FinancialValueProps {
  /** رشته دقیق Decimal/BigInt — هیچ Number */
  value: string | null | undefined
  unit?: string
  className?: string
}

export function FinancialValue({ value, unit, className }: FinancialValueProps) {
  return (
    <span className={cn('text-foreground tabular-nums', className)} dir="ltr">
      {formatExactAmount(value ?? '')}
      {unit && <span className="text-muted-foreground mr-1 text-[10px]">{unit}</span>}
    </span>
  )
}
