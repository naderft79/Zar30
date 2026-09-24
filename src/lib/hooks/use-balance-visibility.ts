// ============================================
// Zar30 - Balance Visibility Hook (سراسری)
// ============================================
// چشم نمایش/مخفی‌سازی موجودی — یک state مشترک بین همه صفحات
// (WealthHero داشبورد، هیروی دارایی، کارت‌های کیف پول)
// ذخیره در localStorage + event برای sync بین کامپوننت‌ها و تب‌ها
// ============================================

'use client'

import { useSyncExternalStore } from 'react'

const KEY = 'zar30.balance.hidden'
const EVENT = 'zar30:balance-visibility'

let snapshot = false

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return false
}

// مقدار اولیه از localStorage خوانده می‌شود — یک‌بار در module scope نه
// (در SSR window وجود ندارد؛ در hydration sync می‌شود)
let initialized = false
function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  snapshot = window.localStorage.getItem(KEY) === '1'
}

export function useBalanceVisibility(): [boolean, () => void] {
  ensureInit()
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function toggle() {
    snapshot = !snapshot
    window.localStorage.setItem(KEY, snapshot ? '1' : '0')
    window.dispatchEvent(new Event(EVENT))
  }

  return [hidden, toggle]
}
