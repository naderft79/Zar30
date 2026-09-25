// ============================================
// Zar30 - Admin Form Dialog (Generic CRUD Form)
// ============================================
// فرم field-محور داخل Dialog برای صفحات مدیریتی CRUD
// values خام string هستند؛ تبدیل نوع (bigint/boolean/date) در onSubmit انجام می‌شود
// ============================================

'use client'

import { useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { cn } from 'cn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type AdminFormField = {
  key: string
  label: string
  /** پیش‌فرض text */
  type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'datetime'
  options?: readonly { value: string; label: string }[]
  placeholder?: string
  hint?: string
  /** dir="ltr" برای کدها/اعداد */
  ltr?: boolean
  required?: boolean
}

export type AdminFormValues = Record<string, string | boolean>

interface AdminFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: readonly AdminFormField[]
  /** مقادیر اولیه — برای حالت ویرایش */
  initial?: AdminFormValues
  submitLabel?: string
  onSubmit: (values: AdminFormValues) => Promise<string | null>
}

const fieldClass =
  'border-border/60 bg-card text-foreground focus-visible:ring-ring h-10 w-full rounded-lg border px-3 text-xs focus-visible:ring-2 focus-visible:outline-none'

export function AdminFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel = 'ذخیره',
  onSubmit,
}: AdminFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* FormBody با mount شدن DialogContent ریست می‌شود — نیازی به effect نیست */}
        {open && (
          <FormBody
            fields={fields}
            initial={initial}
            submitLabel={submitLabel}
            onSubmit={onSubmit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface FormBodyProps {
  fields: readonly AdminFormField[]
  initial?: AdminFormValues
  submitLabel: string
  onSubmit: (values: AdminFormValues) => Promise<string | null>
  onClose: () => void
}

function FormBody({ fields, initial, submitLabel, onSubmit, onClose }: FormBodyProps) {
  const [values, setValues] = useState<AdminFormValues>(() => {
    const defaults: AdminFormValues = {}
    for (const f of fields) {
      const t = f.type ?? 'text'
      defaults[f.key] =
        initial?.[f.key] ??
        (t === 'checkbox' ? false : t === 'select' ? (f.options?.[0]?.value ?? '') : '')
    }
    return defaults
  })
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    const err = await onSubmit(values)
    setPending(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        {fields.map((f) => {
          const t = f.type ?? 'text'
          return (
            <div key={f.key} className="space-y-1.5">
              {t === 'checkbox' ? (
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={values[f.key] === true}
                    onChange={(e) => set(f.key, e.target.checked)}
                    className="accent-primary size-4"
                  />
                  {f.label}
                </label>
              ) : (
                <>
                  <label
                    htmlFor={`af-${f.key}`}
                    className="text-foreground block text-xs font-medium"
                  >
                    {f.label}
                    {f.required && <span className="text-error mr-1">*</span>}
                  </label>
                  {t === 'select' ? (
                    <select
                      id={`af-${f.key}`}
                      value={String(values[f.key] ?? '')}
                      onChange={(e) => set(f.key, e.target.value)}
                      className={fieldClass}
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : t === 'textarea' ? (
                    <textarea
                      id={`af-${f.key}`}
                      value={String(values[f.key] ?? '')}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className={cn(fieldClass, 'h-auto py-2')}
                    />
                  ) : (
                    <Input
                      id={`af-${f.key}`}
                      type={
                        t === 'datetime' ? 'datetime-local' : t === 'number' ? 'number' : 'text'
                      }
                      dir={f.ltr ? 'ltr' : undefined}
                      value={String(values[f.key] ?? '')}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      inputMode={t === 'number' ? 'numeric' : undefined}
                      className={fieldClass}
                    />
                  )}
                </>
              )}
              {f.hint && <p className="text-muted-foreground text-[10px]">{f.hint}</p>}
            </div>
          )
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="border-error/30 bg-error/5 text-error rounded-lg border px-3 py-2 text-xs"
        >
          {error}
        </p>
      )}

      <DialogFooter>
        <button
          type="button"
          onClick={onClose}
          className="border-border/60 text-muted-foreground hover:bg-muted h-10 rounded-lg border px-4 text-xs font-medium transition-colors"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-colors disabled:opacity-60"
        >
          {pending && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </button>
      </DialogFooter>
    </form>
  )
}
