// ============================================
// Zar30 - Admin Financial Action Button
// ============================================
// دکمه عملیات مالی ادمین — تاییدیه + دلیل اختیاری + state مدیریت‌شده
// ============================================

'use client'

import { useState } from 'react'
import { apiPost } from '@/lib/api/client'

interface FinanceActionProps {
  label: string
  endpoint: string
  tone?: 'gold' | 'danger' | 'neutral'
  needsReason?: boolean
  confirmText?: string
  onDone: () => void
}

const toneClass = {
  gold: 'bg-gold-500 hover:bg-gold-600 text-navy-950',
  danger: 'bg-error/90 hover:bg-error text-white',
  neutral: 'border-border/60 bg-card text-foreground hover:border-navy-400/40 border',
} as const

export function FinanceAction({
  label,
  endpoint,
  tone = 'neutral',
  needsReason = false,
  confirmText,
  onDone,
}: FinanceActionProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (needsReason && reason.trim().length < 3) {
      setError('دلیل الزامی است (حداقل ۳ کاراکتر)')
      return
    }
    setBusy(true)
    setError(null)
    const res = await apiPost(endpoint, needsReason ? { reason: reason.trim() } : {})
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'عملیات ناموفق بود')
      return
    }
    setOpen(false)
    onDone()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`h-9 rounded-lg px-4 text-xs font-semibold transition-colors ${toneClass[tone]}`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="border-border/60 bg-card space-y-3 rounded-xl border p-4">
      <p className="text-foreground text-xs font-medium">
        {confirmText ?? `آیا از «${label}» مطمئن هستید؟ این عملیات در دفتر کل ثبت می‌شود.`}
      </p>
      {needsReason && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="دلیل (برای ممیزی الزامی)"
          rows={2}
          className="border-border/60 bg-background text-foreground w-full rounded-lg border p-2 text-xs"
        />
      )}
      {error && (
        <p role="alert" className="text-error text-[11px]">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className={`h-8 rounded-lg px-4 text-xs font-semibold disabled:opacity-50 ${toneClass[tone]}`}
        >
          {busy ? 'در حال انجام…' : 'تایید نهایی'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={busy}
          className="text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
        >
          انصراف
        </button>
      </div>
    </div>
  )
}
