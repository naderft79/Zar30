// ============================================
// Zar30 - Section Quick Nav (داشبورد)
// ============================================
// ردیف دکمه‌های بخش‌ها — پویا از ADMIN_NAV_SECTIONS:
// هر تغییر در nav (افزودن/حذف/جابه‌جایی) خودکار اینجا اعمال می‌شود
// کلیک روی عنوان → اولین صفحه بخش — کلیک روی chevron → لیست زیرمجموعه‌ها
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { IconChevronDown, IconChevronLeft } from '@tabler/icons-react'
import { ADMIN_NAV_SECTIONS, canSeeAdminItem } from '@/config/admin-navigation'
import type { Permission } from '@/lib/auth/rbac'
import { cn } from 'cn'

export function AdminSectionNav({ permissions }: { permissions: readonly Permission[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // بخش‌های قابل‌مشاهده — همان منبع سایدبار؛ بخش «نمای کلی» (خود داشبورد) حذف است
  const sections = ADMIN_NAV_SECTIONS.filter((s) => s.key !== 'overview')
    .map((s) => ({ ...s, items: s.items.filter((i) => canSeeAdminItem(i, permissions)) }))
    .filter((s) => s.items.length > 0)

  // بستن با کلیک خارج یا Escape
  useEffect(() => {
    if (!openKey) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenKey(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenKey(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openKey])

  return (
    <div
      ref={ref}
      role="navigation"
      aria-label="دسترسی سریع بخش‌ها"
      className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {sections.map((section) => {
        const open = openKey === section.key
        const SectionIcon = section.icon
        // بخش‌های بدون آیتم بالاتر فیلتر شدند — اولین آیتم حتماً هست
        const first = section.items[0]!
        return (
          <div key={section.key} className="relative shrink-0">
            {/* دکمه دو‌بخشی — عنوان بخش + chevron لیست */}
            <div
              className={cn(
                'border-border/60 bg-card flex items-stretch overflow-hidden rounded-xl border transition-all duration-(--duration-normal)',
                open
                  ? 'border-gold-500/50 shadow-gold-500/10 shadow-md'
                  : 'hover:border-border hover:shadow-sm',
              )}
            >
              <Link
                href={first.href}
                className={cn(
                  'text-foreground hover:bg-muted/60 focus-visible:ring-ring flex h-10 items-center gap-2 pr-3 pl-2.5 text-xs font-semibold transition-colors',
                  'focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-md transition-colors',
                    open
                      ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <SectionIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                {section.label}
              </Link>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : section.key)}
                aria-label={`زیرمجموعه‌های ${section.label}`}
                aria-expanded={open}
                aria-haspopup="menu"
                className={cn(
                  'border-border/60 text-muted-foreground flex w-8 items-center justify-center border-r transition-colors',
                  'hover:bg-muted/60 hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
                  open && 'bg-gold-500/10 text-gold-600 dark:text-gold-300',
                )}
              >
                <IconChevronDown
                  className={cn(
                    'size-3.5 transition-transform duration-(--duration-normal)',
                    open && 'rotate-180',
                  )}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* لیست بازشونده — زیرمجموعه‌های بخش */}
            {open && (
              <div
                role="menu"
                aria-label={section.label}
                className="border-border/60 bg-card animate-in fade-in-0 zoom-in-95 absolute top-full right-0 z-50 mt-1.5 w-60 origin-top rounded-xl border p-1.5 shadow-xl"
              >
                <ul className="max-h-72 space-y-0.5 overflow-y-auto">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <li key={item.key} role="none">
                        <Link
                          href={item.href}
                          role="menuitem"
                          onClick={() => setOpenKey(null)}
                          className="group hover:bg-muted focus-visible:bg-muted flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors focus-visible:outline-none"
                        >
                          <span className="bg-muted text-muted-foreground group-hover:bg-gold-500/15 group-hover:text-gold-700 dark:group-hover:text-gold-300 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors">
                            <ItemIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="text-foreground block truncate text-xs font-medium">
                              {item.label}
                            </span>
                            <span className="text-muted-foreground block truncate text-[10px]">
                              {item.description}
                            </span>
                          </span>
                          <IconChevronLeft
                            className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
