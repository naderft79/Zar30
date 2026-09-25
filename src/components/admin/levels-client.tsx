// ============================================
// Zar30 - Admin KYC Levels Client
// ============================================
// سطوح احراز هویت — نام/رتبه/توضیح + توزیع کاربران در هر سطح
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconLoader2, IconPencil, IconShieldCheck } from '@tabler/icons-react'
import { apiGetWithRefresh, apiPost } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'

interface LevelRow {
  id: string
  level: string
  name: string
  rank: number
  description: string | null
  usersCount: number
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_0: 'سطح ۰',
  LEVEL_1: 'سطح ۱',
  LEVEL_2: 'سطح ۲',
  LEVEL_3: 'سطح ۳',
}

export function AdminLevelsClient() {
  const [levels, setLevels] = useState<LevelRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LevelRow | null>(null)

  const load = useCallback(async () => {
    const res = await apiGetWithRefresh<{ levels: LevelRow[] }>('/api/v1/admin/levels')
    if (res.ok && res.data?.levels) {
      setLevels(res.data.levels)
      setError(null)
    } else {
      setError(res.error ?? 'بارگذاری سطوح ناموفق بود')
      setLevels([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ levels: LevelRow[] }>('/api/v1/admin/levels')
      if (cancelled) return
      if (res.ok && res.data?.levels) {
        setLevels(res.data.levels)
        setError(null)
      } else {
        setError(res.error ?? 'بارگذاری سطوح ناموفق بود')
        setLevels([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const fields: AdminFormField[] = [
    { key: 'name', label: 'نام سطح', required: true, placeholder: 'سطح ۲ — احراز هویت کامل' },
    { key: 'rank', label: 'رتبه (ترتیب نمایش)', type: 'number', ltr: true },
    { key: 'description', label: 'توضیحات (اختیاری)', type: 'textarea' },
  ]

  const submit = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      if (!editing) return 'سطح نامشخص است'
      const res = await apiPost('/api/v1/admin/levels', {
        level: editing.level,
        name: String(values.name ?? ''),
        rank: Number(values.rank ?? editing.rank),
        description: String(values.description ?? '') || null,
      })
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      await load()
      return null
    },
    [editing, load],
  )

  const totalUsers = levels?.reduce((s, l) => s + l.usersCount, 0) ?? 0

  return (
    <div>
      <AdminPageHeader
        title="سطوح احراز هویت"
        description="پیکربندی نام و توضیح هر سطح + توزیع کاربران — سقف‌های مالی هر سطح در صفحات «محدودیت‌ها» تعریف می‌شوند"
      />

      {error && (
        <p
          role="alert"
          className="border-error/30 bg-error/5 text-error mb-4 rounded-xl border p-4 text-xs"
        >
          {error}
        </p>
      )}

      {!levels ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {levels.map((l) => {
            const pct = totalUsers > 0 ? Math.round((l.usersCount / totalUsers) * 100) : 0
            return (
              <div key={l.id} className="bg-card border-border/60 rounded-xl border p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                    <IconShieldCheck className="size-5" aria-hidden="true" />
                  </div>
                  <button
                    type="button"
                    aria-label={`ویرایش ${l.name}`}
                    onClick={() => {
                      setEditing(l)
                      setDialogOpen(true)
                    }}
                    className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
                  >
                    <IconPencil className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-muted-foreground mt-3 text-[10px] font-semibold">
                  {LEVEL_LABELS[l.level] ?? l.level}
                </p>
                <p className="mt-1 text-sm font-bold">{l.name}</p>
                {l.description && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">
                    {l.description}
                  </p>
                )}
                <div className="border-border/40 mt-3 border-t pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">کاربران</span>
                    <span className="font-bold tabular-nums">
                      {toPersianDigits(l.usersCount)}
                      <span className="text-muted-foreground mr-1 text-[10px] font-normal">
                        ({toPersianDigits(pct)}٪)
                      </span>
                    </span>
                  </div>
                  <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {levels === null && !error && (
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
          <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />
          در حال بارگذاری…
        </div>
      )}

      <AdminFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `ویرایش ${LEVEL_LABELS[editing.level] ?? editing.level}` : 'ویرایش سطح'}
        fields={fields}
        initial={
          editing
            ? {
                name: editing.name,
                rank: String(editing.rank),
                description: editing.description ?? '',
              }
            : undefined
        }
        onSubmit={submit}
      />
    </div>
  )
}
