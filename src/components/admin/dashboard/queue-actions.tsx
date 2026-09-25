// ============================================
// Zar30 - Queue Row Actions — اکشن‌های inline روی ردیف‌های صف داشبورد
// ============================================
// فقط روی صف‌هایی که endpoint واقعی دارند:
//   withdrawals → approve/reject · kyc → claim · delivery → approve · risk → review
// سرور permission را دوباره enforce می‌کند — اینجا فقط نمایش شرطی است
// ============================================

'use client'

import { useState } from 'react'
import { IconCheck, IconEyeCheck, IconUserCheck, IconX } from '@tabler/icons-react'
import { apiPost } from '@/lib/api/client'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import { cn } from 'cn'

interface QueueRowActionsProps {
  queueKey: string
  rowId: string
  permissions: readonly Permission[]
  onDone: () => void
}

const btnBase =
  'flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40'

export function QueueRowActions({ queueKey, rowId, permissions, onDone }: QueueRowActionsProps) {
  const [busy, setBusy] = useState(false)

  async function run(url: string, body?: unknown, confirmMsg?: string) {
    if (busy) return
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setBusy(true)
    const res = await apiPost(url, body ?? {})
    setBusy(false)
    if (!res.ok) {
      window.alert(res.error ?? 'عملیات ناموفق بود')
      return
    }
    onDone()
  }

  const reject = (url: string) => {
    const reason = window.prompt('دلیل رد را بنویسید (حداقل ۳ کاراکتر):')
    if (!reason || reason.trim().length < 3) return
    void run(url, { reason: reason.trim() })
  }

  return (
    <>
      {queueKey === 'withdrawals' && (
        <>
          {hasPermission(permissions, PERMISSIONS.WITHDRAWALS_APPROVE) && (
            <button
              type="button"
              disabled={busy}
              title="تایید برداشت"
              aria-label="تایید برداشت"
              onClick={() =>
                void run(`/api/v1/admin/withdrawals/${rowId}/approve`, {}, 'برداشت تایید شود؟')
              }
              className={cn(btnBase, 'text-success hover:bg-success/10')}
            >
              <IconCheck className="size-4" strokeWidth={2} />
            </button>
          )}
          {hasPermission(permissions, PERMISSIONS.WITHDRAWALS_REJECT) && (
            <button
              type="button"
              disabled={busy}
              title="رد برداشت"
              aria-label="رد برداشت"
              onClick={() => reject(`/api/v1/admin/withdrawals/${rowId}/reject`)}
              className={cn(btnBase, 'text-error hover:bg-error/10')}
            >
              <IconX className="size-4" strokeWidth={2} />
            </button>
          )}
        </>
      )}
      {queueKey === 'kyc' && hasPermission(permissions, PERMISSIONS.KYC_REVIEW) && (
        <button
          type="button"
          disabled={busy}
          title="گرفتن پرونده برای بررسی"
          aria-label="گرفتن پرونده برای بررسی"
          onClick={() => void run(`/api/v1/admin/kyc/${rowId}/claim`)}
          className={cn(btnBase, 'text-navy-600 hover:bg-navy-500/10 dark:text-navy-300')}
        >
          <IconUserCheck className="size-4" strokeWidth={2} />
        </button>
      )}
      {queueKey === 'delivery' && hasPermission(permissions, PERMISSIONS.DELIVERY_REVIEW) && (
        <button
          type="button"
          disabled={busy}
          title="تایید درخواست تحویل"
          aria-label="تایید درخواست تحویل"
          onClick={() =>
            void run(`/api/v1/admin/delivery/${rowId}/approve`, {}, 'درخواست تحویل تایید شود؟')
          }
          className={cn(btnBase, 'text-success hover:bg-success/10')}
        >
          <IconCheck className="size-4" strokeWidth={2} />
        </button>
      )}
      {queueKey === 'risk' && hasPermission(permissions, PERMISSIONS.RISK_REVIEW) && (
        <button
          type="button"
          disabled={busy}
          title="علامت به‌عنوان بررسی‌شده"
          aria-label="علامت به‌عنوان بررسی‌شده"
          onClick={() => void run(`/api/v1/admin/risk/events/${rowId}/review`)}
          className={cn(btnBase, 'text-navy-600 hover:bg-navy-500/10 dark:text-navy-300')}
        >
          <IconEyeCheck className="size-4" strokeWidth={2} />
        </button>
      )}
    </>
  )
}
