// ============================================
// Zar30 - Admin Status Badge (Centralized)
// ============================================
// نگاشت واحد status → label/tone برای وضعیت‌های User و KYC
// همیشه متن + رنگ؛ وضعیت ناشناخته neutral
// ============================================

import { cn } from 'cn'

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // User
  ACTIVE: { label: 'فعال', tone: 'success' },
  BLOCKED: { label: 'مسدود', tone: 'error' },
  DELETED: { label: 'حذف‌شده', tone: 'neutral' },
  // KYC
  NOT_STARTED: { label: 'شروع نشده', tone: 'neutral' },
  IN_PROGRESS: { label: 'در حال تکمیل', tone: 'info' },
  SUBMITTED: { label: 'در صف بررسی', tone: 'warning' },
  UNDER_REVIEW: { label: 'در حال بررسی', tone: 'info' },
  APPROVED: { label: 'تاییدشده', tone: 'success' },
  REJECTED: { label: 'ردشده', tone: 'error' },
  NEEDS_RESUBMISSION: { label: 'نیازمند اصلاح', tone: 'warning' },
}

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success/10 text-success border-success/25',
  warning: 'bg-warning/10 text-warning border-warning/25',
  error: 'bg-error/10 text-error border-error/25',
  info: 'bg-navy-500/10 text-navy-300 border-navy-500/25 dark:text-navy-200',
  neutral: 'bg-muted text-muted-foreground border-border/60',
}

export function AdminStatus({ status, className }: { status: string; className?: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: 'neutral' as const }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        TONE_CLASSES[entry.tone],
        className,
      )}
    >
      {entry.label}
    </span>
  )
}
