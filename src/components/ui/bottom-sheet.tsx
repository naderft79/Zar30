// ============================================
// Zar30 - Bottom Sheet (Mobile-first Dialog)
// ============================================
// شیت پایین‌چسب موبایل — جایگزین modal سنتی در صفحه‌های لمسی
// - drag handle + گوشه‌های گرد بالا + backdrop
// - safe-area-inset-bottom رعایت می‌شود
// - دکمه Back اندروید/iOS شیت را می‌بندد (history state)
// - روی دسکتاپ هم همان شیت پایینی رندر می‌شود (یکدست)
// ============================================

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { cn } from 'cn'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

// آستانه کشیدن به پایین برای بستن (px)
const DRAG_CLOSE_PX = 80

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStart = useRef<number | null>(null)
  const pushed = useRef(false)

  // باز شدن: mount + یک state در history تا دکمه Back شیت را ببندد
  useEffect(() => {
    if (!open) return
    const t = requestAnimationFrame(() => setMounted(true))
    if (!pushed.current) {
      window.history.pushState({ zar30Sheet: true }, '')
      pushed.current = true
    }
    const onPop = () => {
      pushed.current = false
      onClose()
    }
    window.addEventListener('popstate', onPop)
    // قفل اسکرول پس‌زمینه
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(t)
      window.removeEventListener('popstate', onPop)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // بستن برنامه‌ای: اگر state هنوز در history است، برگرد تا popstate ببندد
  const close = useCallback(() => {
    if (pushed.current) {
      window.history.back()
      return
    }
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) pushed.current = false
  }, [open])

  if (!open) return null

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0]!.clientY
  }
  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return
    const dy = e.touches[0]!.clientY - dragStart.current
    setDragY(Math.max(0, dy))
  }
  const onHandleTouchEnd = () => {
    if (dragY > DRAG_CLOSE_PX) close()
    setDragY(0)
    dragStart.current = null
  }

  return (
    <div className="fixed inset-0 z-(--z-modal)" role="dialog" aria-modal="true">
      {/* backdrop */}
      <div
        className={cn(
          'bg-navy-950/50 absolute inset-0 backdrop-blur-[2px] transition-opacity duration-(--duration-normal)',
          mounted ? 'opacity-100' : 'opacity-0',
        )}
        onClick={close}
        aria-hidden="true"
      />
      {/* شیت */}
      <div
        className={cn(
          'bg-card absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-3xl shadow-2xl transition-transform duration-(--duration-normal) ease-(--ease-out)',
          !mounted && 'translate-y-full',
        )}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        {/* دستگیره کشیدن */}
        <div
          className="flex touch-none flex-col items-center pt-2.5 pb-1"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <span className="bg-muted-foreground/30 h-1 w-10 rounded-full" aria-hidden="true" />
        </div>
        {title && (
          <div className="border-border/50 flex items-center justify-between border-b px-4 pb-3">
            <p className="text-foreground text-sm font-bold">{title}</p>
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="text-muted-foreground hover:bg-muted flex size-8 items-center justify-center rounded-lg"
            >
              <IconX className="size-4.5" stroke={1.75} />
            </button>
          </div>
        )}
        {/* محتوا — اسکرول داخلی + safe-area پایین */}
        <div className="max-h-[calc(88dvh-3.5rem)] overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
