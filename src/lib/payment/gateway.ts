// ============================================
// Zar30 - Payment Gateway Abstraction
// ============================================
// Financial Core فقط «تومان» می شناسد.
// اگر درگاه خارجی واحد پول دیگری بخواهد، تبدیل فقط داخل adapter
// همان درگاه انجام می‌شود و هیچ واحد خارجی وارد Core نمی‌شود.
//
// انتخاب درگاه با PAYMENT_PROVIDER:
//   sandbox  → درگاه شبیه‌سازی برای توسعه/تست (بدون پول واقعی)
//   zarinpal → درگاه واقعی ZarinPal v4
// ============================================

export interface GatewayPaymentRequest {
  /** شناسه تراکنش درگاه — برای callback بعدی */
  authority: string
  /** URL هدایت کاربر به صفحه پرداخت */
  redirectUrl: string
}

export interface GatewayVerifyResult {
  ok: boolean
  /** مبلغ تاییدشده توسط درگاه — تومان (adapter normalize کرده) */
  amountToman?: bigint
  refId?: string
  cardPan?: string
  error?: string
}

export interface PaymentGateway {
  readonly name: string
  requestPayment(input: {
    amountToman: bigint
    description: string
    callbackUrl: string
  }): Promise<GatewayPaymentRequest>
  verifyPayment(input: { authority: string; amountToman: bigint }): Promise<GatewayVerifyResult>
}

import { SandboxGateway } from './sandbox'
import { ZarinpalGateway } from './zarinpal'

export function getPaymentGateway(name?: string): PaymentGateway {
  const provider = (name ?? process.env.PAYMENT_PROVIDER ?? 'sandbox').toLowerCase()
  if (provider === 'sandbox') return new SandboxGateway()
  if (provider === 'zarinpal') return new ZarinpalGateway()
  throw new Error(`Payment gateway '${provider}' is not supported`)
}
