// ============================================
// Zar30 - Kill Switch — توقف اضطراری معاملات/برداشت
// ============================================
// تأیید دومرحله‌ای با تایپ عبارت — permission: system.manage
// ============================================

'use client'

import { useState } from 'react'
import { IconAlertOctagon, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react'
import { AdminWidget } from './widget'
import { useAdmin } from '@/components/admin/admin-shell'
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac'
import { apiPost } from '@/lib/api/client'
import { KILL_SWITCH_CONFIRM } from '@/lib/validators/admin-dashboard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from 'cn'

type Scope = 'TRADING' | 'WITHDRAWALS'

const SCOPE_LABEL: Record<Scope, string> = {
  TRADING: 'معاملات',
  WITHDRAWALS: 'برداشت‌ها',
}

interface Halted {
  trading: boolean
  withdrawals: boolean
}

export function KillSwitch({ halted, onChange }: { halted: Halted | null; onChange: () => void }) {
  const { admin } = useAdmin()
  const canManage = hasPermission(admin.permissions, PERMISSIONS.SYSTEM_MANAGE)

  const [open, setOpen] = useState<Scope | null>(null)
  const [action, setAction] = useState<'HALT' | 'RESUME'>('HALT')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canManage && !(halted?.trading || halted?.withdrawals)) return null

  const expected = open
    ? action === 'HALT'
      ? KILL_SWITCH_CONFIRM[open].halt
      : KILL_SWITCH_CONFIRM[open].resume
    : ''

  const openDialog = (scope: Scope, act: 'HALT' | 'RESUME') => {
    setOpen(scope)
    setAction(act)
    setConfirmText('')
    setError(null)
  }

  const submit = async () => {
    if (!open || submitting) return
    if (confirmText.trim() !== expected) {
      setError(`عبارت «${expected}» را دقیقاً وارد کنید`)
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await apiPost<{ halted: unknown }>('/api/v1/admin/dashboard/kill-switch', {
      scope: open,
      action,
      confirm: confirmText.trim(),
    })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error ?? 'عملیات ناموفق بود')
      return
    }
    setOpen(null)
    onChange()
  }

  const scopeHalted = (s: Scope) => (s === 'TRADING' ? halted?.trading : halted?.withdrawals)

  return (
    <>
      <AdminWidget
        id="kill-switch"
        title="کنترل اضطراری"
        subtitle="توقف فوری معاملات یا برداشت در بحران"
        icon={IconAlertOctagon}
        className={cn((halted?.trading || halted?.withdrawals) && 'border-error/50 bg-error/5')}
      >
        <div className="space-y-3">
          {(['TRADING', 'WITHDRAWALS'] as Scope[]).map((scope) => {
            const isHalted = scopeHalted(scope)
            return (
              <div
                key={scope}
                className="border-border/40 flex items-center justify-between rounded-lg border px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-block size-2 rounded-full',
                      isHalted ? 'bg-error animate-pulse-soft' : 'bg-success',
                    )}
                    aria-label={isHalted ? 'متوقف' : 'فعال'}
                  />
                  <span className="text-foreground text-xs font-semibold">
                    {SCOPE_LABEL[scope]}
                  </span>
                  <span
                    className={cn('text-[9px] font-bold', isHalted ? 'text-error' : 'text-success')}
                  >
                    {isHalted ? 'متوقف' : 'فعال'}
                  </span>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openDialog(scope, isHalted ? 'RESUME' : 'HALT')}
                    className={cn(
                      'focus-visible:ring-ring inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none',
                      isHalted
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : 'bg-error/10 text-error hover:bg-error/20',
                    )}
                  >
                    {isHalted ? (
                      <>
                        <IconPlayerPlay className="size-3" strokeWidth={2} />
                        از سرگیری
                      </>
                    ) : (
                      <>
                        <IconPlayerStop className="size-3" strokeWidth={2} />
                        توقف
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </AdminWidget>

      {/* Dialog تأیید دومرحله‌ای */}
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent
          role="alertdialog"
          aria-describedby="kill-switch-warning"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconAlertOctagon
                className={cn('size-5', action === 'HALT' ? 'text-error' : 'text-success')}
                strokeWidth={1.75}
              />
              {action === 'HALT' ? 'توقف' : 'از سرگیری'} {open ? SCOPE_LABEL[open] : ''}
            </DialogTitle>
            <DialogDescription id="kill-switch-warning">
              {action === 'HALT'
                ? `با این کار ${open ? SCOPE_LABEL[open] : ''} کاربران بلافاصله متوقف می‌شود. این اقدام در audit ثبت می‌شود.`
                : `${open ? SCOPE_LABEL[open] : ''} به حالت عادی برمی‌گردد.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-foreground text-xs">برای تأیید، عبارت زیر را دقیقاً وارد کنید:</p>
            <p className="bg-muted text-foreground rounded-lg px-3 py-2 text-center text-sm font-bold select-all">
              {expected}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expected}
              autoFocus
              aria-label="متن تأیید"
              aria-invalid={error !== null}
              className="border-border bg-field text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-center text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            />
            {error && (
              <p className="text-error text-[11px]" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="border-border text-foreground hover:bg-muted focus-visible:ring-ring h-9 rounded-lg border px-4 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting || confirmText.trim() !== expected}
              className={cn(
                'focus-visible:ring-ring h-9 rounded-lg px-4 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50',
                action === 'HALT'
                  ? 'bg-error hover:bg-error/90 text-white'
                  : 'bg-success hover:bg-success/90 text-white',
              )}
            >
              {submitting
                ? 'در حال انجام…'
                : `${action === 'HALT' ? 'توقف' : 'از سرگیری'} ${open ? SCOPE_LABEL[open] : ''}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
