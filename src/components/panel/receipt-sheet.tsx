// ============================================
// Zar30 - Receipt Sheet (رسید قابل کپی)
// ============================================
// جزئیات هر رویداد مالی — هر فیلد دکمه کپی دارد
// مشترک بین تب‌های سوابق صفحه دارایی و صفحه تراکنش‌ها
// ============================================

'use client'

import { useState } from 'react'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { StatusBadge } from '@/components/ui/status-badge'

export interface ReceiptField {
  label: string
  value: string
  /** متن خام برای کپی — پیش‌فرض همان value */
  copyValue?: string
  mono?: boolean
}

interface ReceiptSheetProps {
  open: boolean
  onClose: () => void
  title: string
  statusLabel?: string
  fields: ReceiptField[]
}

function CopyRow({ field }: { field: ReceiptField }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(field.copyValue ?? field.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API در برخی contextها در دسترس نیست — سکوت می‌کنیم
    }
  }

  return (
    <div className="border-border/40 flex items-center justify-between gap-3 border-b py-2.5 last:border-0">
      <span className="text-muted-foreground shrink-0 text-[11px]">{field.label}</span>
      <button
        type="button"
        onClick={copy}
        className="group flex min-w-0 items-center gap-1.5 text-left"
        aria-label={`کپی ${field.label}`}
      >
        <span
          className="text-foreground truncate text-xs font-semibold tabular-nums"
          dir={field.mono ? 'ltr' : undefined}
        >
          {field.value}
        </span>
        {copied ? (
          <IconCheck className="text-success size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <IconCopy
            className="text-muted-foreground/50 group-hover:text-gold-600 size-3.5 shrink-0 transition-colors"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  )
}

export function ReceiptSheet({ open, onClose, title, statusLabel, fields }: ReceiptSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {statusLabel && (
        <div className="mb-3">
          <StatusBadge tone="gold" dot={false}>
            {statusLabel}
          </StatusBadge>
        </div>
      )}
      <div>
        {fields.map((f) => (
          <CopyRow key={f.label} field={f} />
        ))}
      </div>
    </BottomSheet>
  )
}
