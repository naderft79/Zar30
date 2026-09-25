// ============================================
// Zar30 - Card → IBAN Resolution Service
// ============================================
// تبدیل شماره کارت به شبا — الگوریتم مستقیم ندارد و به سرویس بانکی نیاز دارد
//
// انتخاب provider با CARD_TO_IBAN_PROVIDER:
//   sandbox   → (پیش‌فرض dev) شبای قطعی با checksum مد-۹۷ معتبر از روی PAN
//               ساخته می‌شود — فقط برای توسعه؛ حساب واقعی نیست (MOCK)
//   external  → فراخوانی CARD_TO_IBAN_URL (POST {pan} → {iban})
//   off       → تبدیل غیرفعال — کاربر باید شبا را دستی وارد کند
// ============================================

import { detectBankByCard } from '@/lib/banks'

const TIMEOUT_MS = 5_000

// محاسبه ارقام کنترلی IBAN (ISO 13616): rearrange BBAN + 'IR00' → kk = 98 - mod97
function ibanCheckDigits(bban: string): string {
  const rearranged = `${bban}IR00`
  let rem = 0
  for (const ch of rearranged) {
    const code = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch
    for (const d of code) rem = (rem * 10 + Number(d)) % 97
  }
  return String(98 - rem).padStart(2, '0')
}

/**
 * MOCK — فقط برای dev: شبای قطعی و checksum-معتبر از روی شماره کارت
 * این شبا حساب واقعی نیست و در production نباید استفاده شود.
 */
function sandboxCardToIban(pan: string): string {
  const bank = detectBankByCard(pan)
  const bankCode = bank.code || '000'
  // شماره حساب ۱۹ رقمی قطعی از PAN
  const account = ((BigInt(pan) * 7919n) % 10_000_000_000_000_000_000n).toString().padStart(19, '0')
  const bban = bankCode + account
  return `IR${ibanCheckDigits(bban)}${bban}`
}

async function externalCardToIban(pan: string): Promise<string | null> {
  const url = process.env.CARD_TO_IBAN_URL
  if (!url) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pan }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { iban?: string }
    return typeof data.iban === 'string' && /^IR\d{24}$/.test(data.iban) ? data.iban : null
  } catch {
    return null
  }
}

/**
 * تبدیل شماره کارت به شبا — null یعنی provider در دسترس نیست و ورود دستی لازم است
 */
export async function resolveIbanFromCard(pan: string): Promise<string | null> {
  if (!/^\d{16}$/.test(pan)) return null
  const provider = process.env.CARD_TO_IBAN_PROVIDER ?? 'sandbox'
  switch (provider) {
    case 'external':
      return externalCardToIban(pan)
    case 'off':
      return null
    default:
      return sandboxCardToIban(pan)
  }
}
