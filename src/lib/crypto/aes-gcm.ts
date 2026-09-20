// ============================================
// Zar30 - AES-256-GCM Encryption (Phase 4)
// ============================================
// رمزنگاری داده‌های حساس KYC (کارت بانکی، شبا، فایل‌های مدارک)
// فرمت ذخیره: base64(iv) : base64(tag) : base64(ciphertext)
// ============================================

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'
import { env } from '@/lib/config/env'

const PREFIX = 'v1'

function key(): Buffer {
  return Buffer.from(env.KYC_ENCRYPTION_KEY, 'hex')
}

export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  // قالب باینری: iv(12) | tag(16) | ciphertext — برای ذخیره در Object Storage
  return Buffer.concat([iv, tag, enc])
}

export function decryptBuffer(payload: Buffer): Buffer {
  if (payload.length < 29) throw new Error('Invalid encrypted payload')
  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const data = payload.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()])
}

export function encryptString(plain: string): string {
  const enc = encryptBuffer(Buffer.from(plain, 'utf8'))
  const iv = enc.subarray(0, 12)
  const tag = enc.subarray(12, 28)
  const data = enc.subarray(28)
  return `${PREFIX}:${iv.toString('base64')}:${tag.toString('base64')}:${data.toString('base64')}`
}

export function decryptString(payload: string): string {
  const [v, ivB64, tagB64, dataB64] = payload.split(':')
  if (v !== PREFIX || !ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted format')
  const packed = Buffer.concat([
    Buffer.from(ivB64, 'base64'),
    Buffer.from(tagB64, 'base64'),
    Buffer.from(dataB64, 'base64'),
  ])
  return decryptBuffer(packed).toString('utf8')
}

// checksum فایل — integrity برای مدارک
export function sha256Hex(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}
