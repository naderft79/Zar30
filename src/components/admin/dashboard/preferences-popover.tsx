// ============================================
// Zar30 - Widget Preferences — شخصی‌سازی داشبورد per-admin
// ============================================
// show/hide ویجت‌ها — ذخیره در AdminUser.preferences
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { IconSettings, IconX } from '@tabler/icons-react'
import { apiPut } from '@/lib/api/client'
import { cn } from 'cn'

export interface WidgetDef {
  id: string
  label: string
}

export function PreferencesPopover({
  widgets,
  hidden,
  onChange,
}: {
  widgets: WidgetDef[]
  hidden: string[]
  onChange: (hidden: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // بستن با کلیک خارج
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = async (id: string) => {
    const next = hidden.includes(id) ? hidden.filter((w) => w !== id) : [...hidden, id]
    // optimistic — خطا برمی‌گردد
    onChange(next)
    setSaving(true)
    const res = await apiPut('/api/v1/admin/dashboard/layout', { hiddenWidgets: next })
    setSaving(false)
    if (!res.ok) onChange(hidden)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="شخصی‌سازی داشبورد"
        aria-expanded={open}
        className="border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconSettings className="size-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="شخصی‌سازی ویجت‌ها"
          className="border-border/60 bg-card absolute top-10 left-0 z-50 w-56 rounded-xl border p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-foreground text-xs font-bold">نمایش ویجت‌ها</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md p-0.5 focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconX className="size-3.5" strokeWidth={2} />
            </button>
          </div>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {widgets.map((w) => {
              const visible = !hidden.includes(w.id)
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={visible}
                    onClick={() => void toggle(w.id)}
                    className="hover:bg-muted/50 focus-visible:ring-ring flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-right transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="text-foreground text-xs">{w.label}</span>
                    <span
                      className={cn(
                        'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
                        visible ? 'bg-gold-500' : 'bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute size-3 rounded-full bg-white shadow transition-all',
                          visible ? 'right-0.5' : 'right-3.5',
                        )}
                      />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {saving && (
            <p className="text-muted-foreground mt-2 text-center text-[9px]">در حال ذخیره…</p>
          )}
        </div>
      )}
    </div>
  )
}
