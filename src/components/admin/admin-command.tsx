// ============================================
// Zar30 - Admin Command Palette
// ============================================
// Ctrl/Cmd + K — جستجوی سراسری موجودیت‌ها از /api/v1/admin/search
// ناوبری با ↑/↓ + Enter — تطبیق صفحات nav سمت کلاینت، permission-aware
// Radix Dialog: focus management و Escape توسط primitive
// ============================================

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  IconSearch,
  IconLoader2,
  IconUsers,
  IconUserCheck,
  IconShoppingBag,
  IconArrowsLeftRight,
  IconLifebuoy,
  IconClipboardList,
  IconPackage,
  IconCoins,
  IconDiscount,
  IconChevronLeft,
  IconArrowUp,
  IconArrowDown,
  IconCornerDownLeft,
  type Icon,
} from '@tabler/icons-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { apiGet } from '@/lib/api/client'
import { ADMIN_NAV_SECTIONS, canSeeAdminItem, type AdminNavItem } from '@/config/admin-navigation'
import type { Permission } from '@/lib/auth/rbac'
import type { AdminSearchResult } from '@/lib/services/admin-search.service'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

// آیکون و رنگ chip هر نوع نتیجه — هماهنگ با زبان بصری nav
const TYPE_META: Record<AdminSearchResult['type'], { label: string; icon: Icon; tone: string }> = {
  user: {
    label: 'کاربران',
    icon: IconUsers,
    tone: 'bg-info/10 text-info',
  },
  kyc: {
    label: 'احراز هویت',
    icon: IconUserCheck,
    tone: 'bg-warning/10 text-warning',
  },
  order: {
    label: 'سفارش‌ها',
    icon: IconShoppingBag,
    tone: 'bg-gold-500/15 text-gold-700 dark:text-gold-300',
  },
  transaction: {
    label: 'تراکنش‌ها',
    icon: IconArrowsLeftRight,
    tone: 'bg-success/10 text-success',
  },
  ticket: {
    label: 'پشتیبانی',
    icon: IconLifebuoy,
    tone: 'bg-info/10 text-info',
  },
  audit: {
    label: 'ممیزی',
    icon: IconClipboardList,
    tone: 'bg-muted text-muted-foreground',
  },
  delivery: {
    label: 'تحویل فیزیکی',
    icon: IconPackage,
    tone: 'bg-gold-500/10 text-gold-700 dark:text-gold-300',
  },
  product: {
    label: 'محصولات',
    icon: IconCoins,
    tone: 'bg-muted text-muted-foreground',
  },
  discount: {
    label: 'کدهای تخفیف',
    icon: IconDiscount,
    tone: 'bg-gold-500/10 text-gold-700 dark:text-gold-300',
  },
}

const DEBOUNCE_MS = 250
const QUICK_LIMIT = 6

// ردیف قابل‌انتخاب در لیست — برای ناوبری کیبورد flat نگه می‌داریم
interface Row {
  index: number
  key: string
  href: string
  icon: Icon
  label: string
  desc?: string
  status?: string
  tone?: string
}

interface Section {
  key: string
  label: string
  icon: Icon
  rows: Row[]
}

export function AdminCommand({ permissions }: { permissions: readonly Permission[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(0)
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
    setActive(0)
  }, [])

  function onQueryChange(value: string) {
    setQuery(value)
    setActive(0)
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
    setActive(0)
    if (!next) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      requestSeq.current += 1 // پاسخ در راه دیگر state را تغییر نمی‌دهد
      setQuery('')
      setResults([])
      setError(null)
      setLoading(false)
    }
  }

  const trimmed = query.trim()
  const trimmedLen = trimmed.length

  // تطبیق صفحات nav — سمت کلاینت روی برچسب فارسی؛ permission-aware
  const pageMatches: AdminNavItem[] =
    trimmedLen >= 2
      ? ADMIN_NAV_SECTIONS.flatMap((s) => s.items).filter(
          (item) =>
            canSeeAdminItem(item, permissions) &&
            (item.label.includes(trimmed) ||
              item.description.includes(trimmed) ||
              item.href.toLowerCase().includes(trimmed.toLowerCase())),
        )
      : []

  // دسترسی سریع — اولین آیتم قابل‌مشاهده هر بخش، وقتی هنوز جستجو نکرده
  const quickItems: AdminNavItem[] =
    trimmedLen < 2
      ? ADMIN_NAV_SECTIONS.map((s) => s.items.find((i) => canSeeAdminItem(i, permissions)))
          .filter((i): i is AdminNavItem => Boolean(i))
          .slice(0, QUICK_LIMIT)
      : []

  // گروه‌بندی نتایج + ساخت لیست flat برای ناوبری کیبورد
  let nextIndex = 0
  const sections: Section[] = []

  const navItems = trimmedLen < 2 ? quickItems : pageMatches
  if (navItems.length > 0) {
    sections.push({
      key: 'pages',
      label: trimmedLen < 2 ? 'دسترسی سریع' : 'صفحات',
      icon: IconSearch,
      rows: navItems.map((item) => ({
        index: nextIndex++,
        key: `page-${item.key}`,
        href: item.href,
        icon: item.icon,
        label: item.label,
        desc: item.description,
      })),
    })
  }

  for (const type of Object.keys(TYPE_META) as AdminSearchResult['type'][]) {
    const items = results.filter((r) => r.type === type)
    if (items.length === 0) continue
    const meta = TYPE_META[type]
    sections.push({
      key: type,
      label: meta.label,
      icon: meta.icon,
      rows: items.map((r) => ({
        index: nextIndex++,
        key: `${type}-${r.id}`,
        href: r.href,
        icon: meta.icon,
        label: r.label,
        desc: r.description,
        status: r.status,
        tone: meta.tone,
      })),
    })
  }

  const flat = sections.flatMap((s) => s.rows)
  const activeIndex = flat.length > 0 ? Math.min(active, flat.length - 1) : -1

  function openRow(row: Row) {
    router.push(row.href)
    onOpenChange(false)
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const row = flat[activeIndex]
      if (row) openRow(row)
    }
  }

  const hasContent = flat.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="جستجوی سراسری"
        className="border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex h-9 items-center gap-2 rounded-lg border px-3 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconSearch className="size-4" stroke={1.75} />
        <span className="hidden sm:inline">جستجو</span>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="border-border/60 top-[8%] w-[calc(100vw-1.5rem)] max-w-xl -translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:top-[15%]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">جستجوی سراسری</DialogTitle>
          <DialogDescription className="sr-only">
            جستجو در کاربران، احراز هویت، سفارش‌ها، تراکنش‌ها، تیکت‌ها و لاگ ممیزی
          </DialogDescription>

          {/* ردیف ورودی — آیکون طلایی + input بزرگ + Esc */}
          <div className="border-border/60 flex items-center gap-3 border-b px-4">
            <IconSearch
              className="text-gold-600 dark:text-gold-400 size-5 shrink-0"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="جستجو: موبایل، نام، شناسه، موضوع…"
              aria-label="عبارت جستجو"
              aria-activedescendant={activeIndex >= 0 ? `admin-cmd-item-${activeIndex}` : undefined}
              autoFocus
              className="text-foreground placeholder:text-muted-foreground/70 h-14 w-full bg-transparent text-sm outline-none"
            />
            {loading ? (
              <>
                <IconLoader2
                  className="text-muted-foreground size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
                <span role="status" className="sr-only">
                  در حال جستجو
                </span>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="بستن جستجو"
                className="border-border/60 bg-muted/60 text-muted-foreground hover:text-foreground shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors"
              >
                Esc
              </button>
            )}
          </div>

          {/* نتایج */}
          <div
            className="max-h-[58vh] overflow-y-auto overscroll-contain p-2"
            aria-label="نتایج جستجو"
            role="listbox"
          >
            {error && (
              <p role="alert" className="text-error px-3 py-8 text-center text-xs">
                {error}
              </p>
            )}

            {!error && !hasContent && trimmedLen >= 2 && !loading && (
              <div className="px-3 py-10 text-center">
                <IconSearch
                  className="text-muted-foreground/40 mx-auto mb-3 size-8"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <p className="text-muted-foreground text-xs">نتیجه‌ای یافت نشد</p>
              </div>
            )}

            {sections.map((section) => (
              <div key={section.key} className="mb-1 last:mb-0">
                <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                  <section.icon
                    className="text-muted-foreground size-3.5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <p className="text-muted-foreground text-[10px] font-semibold">{section.label}</p>
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[9px] font-medium tabular-nums">
                    {toPersianDigits(section.rows.length)}
                  </span>
                </div>
                <ul>
                  {section.rows.map((row) => {
                    const isActive = row.index === activeIndex
                    const RowIcon = row.icon
                    return (
                      <li key={row.key} role="option" aria-selected={isActive}>
                        <Link
                          id={`admin-cmd-item-${row.index}`}
                          href={row.href}
                          onClick={() => onOpenChange(false)}
                          onMouseEnter={() => setActive(row.index)}
                          ref={
                            isActive ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined
                          }
                          className={cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                            'focus-visible:outline-none',
                            isActive ? 'bg-muted' : 'hover:bg-muted/60',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                              row.tone ?? 'bg-muted text-muted-foreground',
                            )}
                          >
                            <RowIcon
                              className="size-[18px]"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="text-foreground block truncate text-[13px] font-medium">
                              {row.label}
                            </span>
                            {row.desc && (
                              <span className="text-muted-foreground block truncate text-[11px] tabular-nums">
                                {row.desc}
                              </span>
                            )}
                          </span>
                          {row.status && (
                            <span className="border-border/60 text-muted-foreground shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums">
                              {toPersianDigits(row.status)}
                            </span>
                          )}
                          <IconChevronLeft
                            className={cn(
                              'text-muted-foreground size-4 shrink-0 transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
                            )}
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* footer — راهنمای کلیدها */}
          <div className="border-border/60 bg-muted/40 text-muted-foreground flex items-center gap-4 border-t px-4 py-2.5 text-[10px]">
            <span className="flex items-center gap-1">
              <kbd className="border-border/60 bg-background inline-flex size-4 items-center justify-center rounded border">
                <IconArrowUp className="size-2.5" aria-hidden="true" />
              </kbd>
              <kbd className="border-border/60 bg-background inline-flex size-4 items-center justify-center rounded border">
                <IconArrowDown className="size-2.5" aria-hidden="true" />
              </kbd>
              <span className="mr-1">جابه‌جایی</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border-border/60 bg-background inline-flex h-4 items-center justify-center rounded border px-1">
                <IconCornerDownLeft className="size-2.5" aria-hidden="true" />
              </kbd>
              <span className="mr-1">باز کردن</span>
            </span>
            <span className="mr-auto hidden items-center gap-1 sm:flex">
              <kbd className="border-border/60 bg-background inline-flex h-4 items-center rounded border px-1.5 text-[9px]">
                Ctrl + K
              </kbd>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
