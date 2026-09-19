'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from 'cn'
import { Button } from './button'

// ============================================
// Error State — آرام، واضح، قابل اقدام
// ============================================
interface ErrorStateProps {
  title?: string
  description?: string
  /** تلاش مجدد */
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({
  title = 'مشکلی پیش آمد',
  description = 'در دریافت اطلاعات خطایی رخ داد. لطفاً دوباره تلاش کنید.',
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        'border-error/25 bg-error/5 animate-fade-in flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center',
        className,
      )}
    >
      <div className="bg-error/10 text-error flex size-14 items-center justify-center rounded-2xl">
        <AlertTriangle className="size-7" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mx-auto max-w-xs text-xs leading-5">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-1" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={cn('size-3.5', retrying && 'animate-spin')} />
          {retrying ? 'در حال تلاش…' : 'تلاش مجدد'}
        </Button>
      )}
    </div>
  )
}
