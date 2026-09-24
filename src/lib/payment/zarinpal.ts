// ============================================
// Zar30 - ZarinPal Payment Gateway Adapter (v4)
// ============================================
// مرز واحد: API زرین‌پال مبلغ را به واحد پول خودش (IRT) می‌خواهد.
// تبدیل تومان→IRT فقط در همین adapter انجام می‌شود (×۱۰).
// Financial Core هرگز واحد خارجی نمی بیند.
// ============================================

import type { GatewayPaymentRequest, GatewayVerifyResult, PaymentGateway } from './gateway'

const API_BASE = 'https://payment.zarinpal.com/pg/v4/payment'
const GATEWAY_BASE = 'https://payment.zarinpal.com/pg/StartPay'
// محیط تست زرین‌پال — هیچ پول واقعی جابه‌جا نمی‌شود
const SANDBOX_API_BASE = 'https://sandbox.zarinpal.com/pg/v4/payment'
const SANDBOX_GATEWAY_BASE = 'https://sandbox.zarinpal.com/pg/StartPay'
// مرچنت پیش‌فرض sandbox زرین‌پال
const SANDBOX_DEFAULT_MERCHANT = '00000000-0000-0000-0000-000000000000'

export class ZarinpalGateway implements PaymentGateway {
  readonly name: string

  constructor(private readonly sandbox = false) {
    this.name = sandbox ? 'zarinpal-sandbox' : 'zarinpal'
  }

  private get merchantId(): string {
    const id = this.sandbox
      ? (process.env.ZARINPAL_SANDBOX_MERCHANT_ID ?? SANDBOX_DEFAULT_MERCHANT)
      : (process.env.PAYMENT_MERCHANT_ID ?? '')
    if (!id) throw new Error('PAYMENT_MERCHANT_ID is not configured')
    return id
  }

  private get apiBase(): string {
    return this.sandbox ? SANDBOX_API_BASE : API_BASE
  }

  private get gatewayBase(): string {
    return this.sandbox ? SANDBOX_GATEWAY_BASE : GATEWAY_BASE
  }

  // مرز واحد: مبلغ درگاه IRT است — تومان × ۱۰
  private toGatewayAmount(amountToman: bigint): number {
    return Number(amountToman * 10n)
  }

  async requestPayment(input: {
    amountToman: bigint
    description: string
    callbackUrl: string
  }): Promise<GatewayPaymentRequest> {
    const res = await fetch(`${this.apiBase}/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: this.toGatewayAmount(input.amountToman),
        callback_url: input.callbackUrl,
        description: input.description,
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => null)) as {
      data?: { code?: number; authority?: string }
      errors?: { code?: number; message?: string }
    } | null

    const code = json?.data?.code
    const authority = json?.data?.authority
    if (code !== 100 || !authority) {
      throw new Error(`ZarinPal request failed: ${json?.errors?.code ?? code ?? 'unknown'}`)
    }
    return { authority, redirectUrl: `${this.gatewayBase}/${authority}` }
  }

  async verifyPayment(input: {
    authority: string
    amountToman: bigint
  }): Promise<GatewayVerifyResult> {
    const res = await fetch(`${this.apiBase}/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        authority: input.authority,
        amount: this.toGatewayAmount(input.amountToman),
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    const json = (await res.json().catch(() => null)) as {
      data?: { code?: number; ref_id?: number; card_pan?: string }
      errors?: { code?: number }
    } | null

    const code = json?.data?.code
    // 100 = موفق | 101 = قبلاً verify شده (idempotent — موفق تلقی می‌شود)
    if (code === 100 || code === 101) {
      return {
        ok: true,
        amountToman: input.amountToman,
        refId: json?.data?.ref_id != null ? String(json.data.ref_id) : undefined,
        cardPan: json?.data?.card_pan,
      }
    }
    return { ok: false, error: `ZARINPAL_VERIFY_${code ?? 'UNKNOWN'}` }
  }
}
