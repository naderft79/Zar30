import Link from 'next/link'
import { IconArrowLeft, IconShieldCheck, type TablerIcon } from '@tabler/icons-react'
import { cn } from 'cn'
import { StatusBadge } from '@/components/ui/status-badge'

// ============================================
// Status Card — وضعیت KYC / امنیت حساب
// ============================================

type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral'

interface StatusCardProps {
  icon?: TablerIcon
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
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  gold: 'text-gold-600 dark:text-gold-400',
  neutral: 'text-muted-foreground',
}

export function StatusCard({
  icon: Icon = IconShieldCheck,
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
          <Icon className={cn('size-6 shrink-0', toneRing[statusTone])} strokeWidth={1.75} />
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
          <IconArrowLeft className="size-3.5" />
        </Link>
      )}
    </div>
  )
}
