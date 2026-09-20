// ============================================
// Zar30 - Admin Filter Bar (Reusable)
// ============================================
// جستجوی labeled + slot برای selectهای فیلتر + دکمه پاک‌سازی
// الگوی client-controlled تمیز — والدین URL را source of truth نگه می‌دارند
// ============================================

'use client'

import { Search, X } from 'lucide-react'
import { useId } from 'react'

interface AdminFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** selectهای فیلتر و کنترل‌های اضافی */
  children?: React.ReactNode
  /** آیا فیلتر فعالی وجود دارد — برای نمایش دکمه پاک‌سازی */
  hasActiveFilters: boolean
  onClear: () => void
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'جستجو…',
  children,
  hasActiveFilters,
  onClear,
}: AdminFilterBarProps) {
  const searchId = useId()
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <label htmlFor={searchId} className="sr-only">
          جستجو
        </label>
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id={searchId}
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="border-border/60 bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-lg border pr-9 pl-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>
      {children}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-3.5" aria-hidden="true" />
          پاک‌سازی فیلترها
        </button>
      )}
    </div>
  )
}
