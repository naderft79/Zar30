// ============================================
// Zar30 - Admin Read-Only Notice
// ============================================
// بنر اطلاع‌رسانی semantic برای بخش‌های فقط‌خواندنی عملیات مالی
// ============================================

import { IconInfoCircle } from '@tabler/icons-react'
import { cn } from 'cn'

export function ReadOnlyNotice({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={cn(
        'border-border/60 bg-muted/40 text-muted-foreground flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-5',
        className,
      )}
    >
      <IconInfoCircle
        className="text-info mt-0.5 size-4 shrink-0"
        stroke={1.75}
        aria-hidden="true"
      />
      <p>
        این بخش فعلاً فقط خواندنی است. عملیات مالی تنها پس از اتصال سرویس authoritative، کنترل
        ledger، idempotency و audit فعال می‌شود.
      </p>
    </div>
  )
}
