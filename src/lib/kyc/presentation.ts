// ============================================
// Zar30 - KYC Presentation Helpers
// ============================================
// نمایش امن داده‌های بانکی KYC — decrypt فقط برای mask؛
// ciphertext (cardNumberEnc/ibanEnc) هرگز در خروجی presentation نیست
// ============================================

import { decryptString } from '@/lib/crypto/aes-gcm'

// مقادیر حساس بانکی هرگز plaintext برنمی‌گردند — فقط masked برای نمایش مرور
export function maskIban(ibanEnc: string | null): string | null {
  if (!ibanEnc) return null
  const iban = decryptString(ibanEnc)
  if (!iban) return null
  return `${iban.slice(0, 4)}••••••••••••••${iban.slice(-4)}`
}

export function maskCard(cardEnc: string | null): string | null {
  if (!cardEnc) return null
  const card = decryptString(cardEnc)
  if (!card) return null
  return `${card.slice(0, 4)}••••••••${card.slice(-4)}`
}

export interface KycBankPresentation {
  bankComplete: boolean
  cardMasked: string | null
  ibanMasked: string | null
}

// نمای بانکی امن — بدون ciphertext، بدون plaintext
export function kycBankPresentation(
  cardNumberEnc: string | null,
  ibanEnc: string | null,
): KycBankPresentation {
  return {
    bankComplete: !!(cardNumberEnc && ibanEnc),
    cardMasked: maskCard(cardNumberEnc),
    ibanMasked: maskIban(ibanEnc),
  }
}
