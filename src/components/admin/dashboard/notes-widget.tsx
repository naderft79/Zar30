// ============================================
// Zar30 - Team Notes — یادداشت مشترک مدیران
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconNotes, IconPinFilled, IconSend, IconTrash } from '@tabler/icons-react'
import { AdminWidget } from './widget'
import { useAdmin } from '@/components/admin/admin-shell'
import { apiDelete, apiGetWithRefresh, apiPost } from '@/lib/api/client'
import type { DashboardNote } from '@/lib/services/admin-dashboard.service'
import { toPersianDigits } from '@/lib/utils/format'

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'همین حالا'
  if (min < 60) return `${toPersianDigits(min)}د پیش`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${toPersianDigits(hr)}س پیش`
  return new Date(iso).toLocaleDateString('fa-IR')
}

export function NotesWidget() {
  const { admin } = useAdmin()
  const [notes, setNotes] = useState<DashboardNote[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ notes: DashboardNote[] }>('/api/v1/admin/dashboard/notes')
    if (!res.ok) {
      setError(res.error ?? 'خطا در بارگذاری یادداشت‌ها')
      return
    }
    setError(null)
    setNotes(res.data!.notes)
  }, [])

  useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [load])

  const add = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    const res = await apiPost<{ note: DashboardNote }>('/api/v1/admin/dashboard/notes', {
      text: trimmed,
      pinned: false,
    })
    setSending(false)
    if (!res.ok) {
      setError(res.error ?? 'ثبت یادداشت ناموفق بود')
      return
    }
    setText('')
    setNotes((prev) => [res.data!.note, ...(prev ?? [])].slice(0, 20))
  }

  const remove = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    const res = await apiDelete(`/api/v1/admin/dashboard/notes/${id}`)
    setDeletingId(null)
    if (res.ok) setNotes((prev) => (prev ?? []).filter((n) => n.id !== id))
  }

  const sorted = (notes ?? []).slice().sort((a, b) => Number(b.pinned) - Number(a.pinned))

  return (
    <AdminWidget
      id="notes"
      title="یادداشت تیمی"
      subtitle="برای همه مدیران قابل مشاهده است"
      icon={IconNotes}
      loading={notes === null && !error}
      error={error}
      onRefresh={() => void load()}
      skeletonHeight="h-36"
    >
      {/* فرم افزودن */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
        className="mb-3 flex gap-1.5"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="یادداشت برای تیم…"
          maxLength={500}
          aria-label="متن یادداشت"
          className="border-border bg-field text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-8 min-w-0 flex-1 rounded-lg border px-3 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="افزودن یادداشت"
          className="bg-gold-500 text-navy-950 hover:bg-gold-400 focus-visible:ring-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          <IconSend className="size-3.5" strokeWidth={2} />
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[11px]">
          یادداشتی ثبت نشده — اولین را بنویس
        </p>
      ) : (
        <ul className="divide-border/40 max-h-48 divide-y overflow-y-auto">
          {sorted.map((n) => (
            <li key={n.id} className="group py-2 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-foreground flex items-center gap-1 text-xs leading-relaxed">
                    {n.pinned && (
                      <IconPinFilled
                        className="text-gold-500 size-3 shrink-0"
                        aria-label="سنجاق‌شده"
                      />
                    )}
                    <span className="break-words">{n.text}</span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-[9px]">
                    {n.byName} · {relTime(n.createdAt)}
                  </p>
                </div>
                {(n.byAdminId === admin.id || admin.role === 'SUPER_ADMIN') && (
                  <button
                    type="button"
                    onClick={() => void remove(n.id)}
                    disabled={deletingId === n.id}
                    aria-label="حذف یادداشت"
                    className="text-muted-foreground hover:text-error hover:bg-error/10 focus-visible:ring-ring inline-flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                  >
                    <IconTrash className="size-3" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminWidget>
  )
}
