// ============================================
// Zar30 - Admin Pagination (URL-driven)
// ============================================
// صفحه فعلی از URL — تغییر صفحه بقیه query را حفظ می‌کند
// ============================================

'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toPersianDigits } from '@/lib/utils/format'
import { cn } from 'cn'

interface AdminPaginationProps {
  page: number
  totalPages: number
  total: number
}

export function AdminPagination({ page, totalPages, total }: AdminPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function goTo(next: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(next))
    router.push(`${pathname}?${params.toString()}`)
  }

  const canPrev = page > 1
  const canNext = page < totalPages

  const btnClass = cn(
    'border-border/60 text-foreground inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition-colors',
    'hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-40',
  )

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-[11px] tabular-nums">
        {toPersianDigits(total)} رکورد — صفحه {toPersianDigits(page)} از{' '}
        {toPersianDigits(totalPages)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btnClass}
          disabled={!canPrev}
          onClick={() => goTo(page - 1)}
          aria-label="صفحه قبلی"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
          قبلی
        </button>
        <button
          type="button"
          className={btnClass}
          disabled={!canNext}
          onClick={() => goTo(page + 1)}
          aria-label="صفحه بعدی"
        >
          بعدی
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
