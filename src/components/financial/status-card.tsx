import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { cn } from 'cn'
import { StatusBadge } from '@/components/ui/status-badge'
import type { LucideIcon } from 'lucide-react'

// ============================================
// Status Card — وضعیت KYC / امنیت حساب
// ============================================

type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral'

interface StatusCardProps {
  icon?: LucideIcon
  title: string
  statusLabel: string
  statusTone?: StatusTone
  description?: string
  action?: { label: string; href: string }
  /** درصد پیشرفت — مثلاً مراحل KYC */
  progress?: number
  className?: string
}

const toneRing: Record<StatusTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  gold: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
  neutral: 'bg-muted text-muted-foreground',
}

export function StatusCard({
  icon: Icon = ShieldCheck,
  title,
  statusLabel,
  statusTone = 'neutral',
  description,
  action,
  progress,
  className,
}: StatusCardProps) {
  return (
    <div
      data-slot="status-card"
      className={cn('bg-card border-border/60 rounded-xl border p-4 shadow-xs', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              toneRing[statusTone],
            )}
          >
            <Icon className="size-4.5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">{title}</p>
            <div className="mt-1">
              <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
            </div>
          </div>
        </div>
      </div>

      {description && <p className="text-muted-foreground mt-3 text-xs leading-5">{description}</p>}

      {progress !== undefined && (
        <div className="mt-3">
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-gold-500 h-full rounded-full transition-[width] duration-(--duration-slow) ease-(--ease-out)"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {action && (
        <Link
          href={action.href}
          className="text-gold-600 dark:text-gold-400 mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
        >
          {action.label}
          <ArrowLeft className="size-3.5" />
        </Link>
      )}
    </div>
  )
}
