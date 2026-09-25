// ============================================
// Zar30 - Segmented Control — انتخاب بازه زمانی (KPI و نمودار)
// ============================================

'use client'

import { cn } from 'cn'

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  ariaLabel?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="bg-muted inline-flex rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'focus-visible:ring-ring rounded-md font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none',
            size === 'sm' ? 'h-6 px-2 text-[10px]' : 'h-8 px-3 text-xs',
            value === opt.value
              ? 'bg-card text-gold-700 dark:text-gold-300 shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
