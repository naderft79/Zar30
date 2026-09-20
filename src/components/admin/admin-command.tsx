// ============================================
// Zar30 - Admin Command Search
// ============================================
// Ctrl/Cmd + K — جستجوی سراسری موجودیت‌ها از /api/v1/admin/search
// Radix Dialog: focus management و Escape توسط primitive
// ============================================

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { apiGet } from '@/lib/api/client'
import type { AdminSearchResult } from '@/lib/services/admin-search.service'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

const TYPE_LABELS: Record<AdminSearchResult['type'], string> = {
  user: 'کاربران',
  kyc: 'احراز هویت',
  order: 'سفارش‌ها',
  transaction: 'تراکنش‌ها',
  ticket: 'پشتیبانی',
  audit: 'ممیزی',
}

const DEBOUNCE_MS = 250

export function AdminCommand() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestSeq = useRef(0)

  // Ctrl/Cmd + K — میانبر سراسری
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // unmount — timer و پاسخ pending پاک می‌شوند تا state بعد از بسته‌شدن تغییر نکند
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      requestSeq.current += 1
    }
  }, [])

  const runSearch = useCallback(async (q: string) => {
    const seq = ++requestSeq.current
    setLoading(true)
    setError(null)
    const res = await apiGet<{ results: AdminSearchResult[] }>(
      `/api/v1/admin/search?q=${encodeURIComponent(q)}`,
    )
    if (seq !== requestSeq.current) return // پاسخ قدیمی — نادیده
    setLoading(false)
    if (!res.ok) {
      setResults([])
      setError(res.error ?? 'جستجو ناموفق بود')
      return
    }
    setResults(res.data?.results ?? [])
  }, [])

  function onQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      requestSeq.current += 1 // پاسخ در راه دیگر state را تغییر نمی‌دهد
      setQuery('')
      setResults([])
      setError(null)
      setLoading(false)
    }
  }

  // گروه‌بندی نتایج بر اساس type — ترتیب ثابت
  const grouped = (Object.keys(TYPE_LABELS) as AdminSearchResult['type'][])
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0)

  const trimmedLen = query.trim().length

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="جستجوی سراسری — Ctrl+K"
        className="border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex h-9 items-center gap-2 rounded-lg border px-3 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Search className="size-4" strokeWidth={1.75} />
        <span className="hidden sm:inline">جستجو…</span>
        <kbd className="border-border/60 bg-background hidden rounded border px-1.5 py-0.5 text-[10px] sm:inline">
          Ctrl + K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="top-[15%] max-w-xl -translate-y-0 gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">جستجوی سراسری</DialogTitle>
          <DialogDescription className="sr-only">
            جستجو در کاربران، احراز هویت، سفارش‌ها، تراکنش‌ها، تیکت‌ها و لاگ ممیزی
          </DialogDescription>

          <div className="border-border/60 flex items-center gap-2 border-b px-4">
            <Search
              className="text-muted-foreground size-4 shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="جستجو: موبایل، نام، شناسه، موضوع…"
              aria-label="عبارت جستجو"
              autoFocus
              className="text-foreground placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-none"
            />
            {loading && (
              <>
                <Loader2
                  className="text-muted-foreground size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
                <span role="status" className="sr-only">
                  در حال جستجو
                </span>
              </>
            )}
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-2" aria-label="نتایج جستجو">
            {error && (
              <p role="alert" className="text-error px-3 py-6 text-center text-xs">
                {error}
              </p>
            )}

            {!error && trimmedLen < 2 && (
              <p className="text-muted-foreground px-3 py-6 text-center text-xs">
                حداقل ۲ نویسه برای جستجو وارد کنید
              </p>
            )}

            {!error && !loading && trimmedLen >= 2 && results.length === 0 && (
              <p className="text-muted-foreground px-3 py-6 text-center text-xs">
                نتیجه‌ای یافت نشد
              </p>
            )}

            {grouped.map((group) => (
              <div key={group.type} className="mb-1 last:mb-0">
                <p className="text-muted-foreground px-3 pt-2 pb-1 text-[10px] font-semibold">
                  {TYPE_LABELS[group.type]}
                </p>
                <ul>
                  {group.items.map((r) => (
                    <li key={`${r.type}-${r.id}`}>
                      <Link
                        href={r.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'hover:bg-muted focus-visible:bg-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2.5',
                          'focus-visible:outline-none',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="text-foreground block truncate text-sm">{r.label}</span>
                          <span className="text-muted-foreground block truncate text-[11px] tabular-nums">
                            {r.description}
                          </span>
                        </span>
                        {r.status && (
                          <span className="border-border/60 text-muted-foreground shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums">
                            {toPersianDigits(r.status)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
