// ============================================
// Zar30 - PWA Install Prompt
// ============================================
// دعوت غیرمزاحم نصب اپ — فقط یک‌بار، قابل dismiss دائمی
// Android/Chrome: beforeinstallprompt → prompt() واقعی
// iOS Safari: راهنمای Add to Home Screen (بدون API برنامه‌ریزی‌پذیر)
// در standalone هرگز نمایش داده نمی‌شود
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { IconShare, IconX, IconDownload } from '@tabler/icons-react'

const DISMISS_KEY = 'zar30:pwa-install-dismissed'

// Event غیر استاندارد beforeinstallprompt در تایپ‌های DOM نیست
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as { standalone?: boolean }).standalone === true
  )
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && !/android/i.test(ua)
}

// تشخیص دیوایس موبایل (Android یا iOS) — بنر نصب فقط برای این‌ها می‌آید
function isMobileDevice(): boolean {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // روی Android/iOS بنر بلافاصله پیشنهاد می‌شود — نصب واقعی هر زمان
    // beforeinstallprompt برسد فعال است، قبل از آن راهنمای دستی نشان می‌دهیم
    let mobileTimer: ReturnType<typeof setTimeout> | undefined
    if (isMobileDevice()) {
      mobileTimer = setTimeout(() => {
        setShowIosHint(isIosSafari())
        setVisible(true)
      }, 2_000)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      if (mobileTimer) clearTimeout(mobileTimer)
    }
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setVisible(false)
      setDeferred(null)
    } else {
      // deferred هنوز نیامده — راهنمای دستی متناسب با پلتفرم
      setShowIosHint(true)
    }
  }

  return (
    <div
      role="dialog"
      aria-label="نصب اپلیکیشن زرسی"
      className="animate-fade-up fixed inset-x-4 bottom-24 z-(--z-sticky) md:hidden"
    >
      <div className="border-gold-500/25 bg-card/95 relative rounded-2xl border p-3.5 shadow-[0_16px_40px_-12px_rgb(16_29_56/0.35)] backdrop-blur-xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="بستن"
          className="text-muted-foreground hover:bg-muted absolute top-2 right-2 flex size-7 items-center justify-center rounded-lg"
        >
          <IconX className="size-4" stroke={1.75} />
        </button>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand-mark.png" alt="" className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-xs font-bold">زرسی را نصب کنید</p>
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-4">
              {showIosHint
                ? isIosSafari()
                  ? 'از منوی Share گزینه «Add to Home Screen» را بزنید'
                  : 'از منوی مرورگر گزینه «نصب برنامه» یا «Add to Home screen» را بزنید'
                : 'دسترسی سریع‌تر و تجربه اپلیکیشن واقعی روی صفحه اصلی'}
            </p>
          </div>
          {showIosHint ? (
            <IconShare className="text-gold-600 size-5 shrink-0" stroke={1.75} />
          ) : (
            <button
              type="button"
              onClick={install}
              className="bg-navy-700 text-cream-50 pressable flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold"
            >
              <IconDownload className="size-4" stroke={2} />
              نصب
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
