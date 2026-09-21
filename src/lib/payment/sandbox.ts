// ============================================
// Zar30 - Sandbox Payment Gateway (Dev/Test)
// ============================================
// درگاه شبیه‌سازی — هیچ پول واقعی جابه‌جا نمی‌شود.
// redirectUrl مستقیم به callback می‌رود تا flow کامل dev تست شود.
// برای سناریوهای تست: authorityهای پایانی '-FAIL' و '-MISMATCH'
// به ترتیب verify ناموفق و مبلغ متفاوت برمی‌گردانند.
// ============================================

import { randomUUID } from 'crypto'
import type { GatewayPaymentRequest, GatewayVerifyResult, PaymentGateway } from './gateway'

export class SandboxGateway implements PaymentGateway {
  readonly name = 'sandbox'

  async requestPayment(input: {
    amountToman: bigint
    description: string
    callbackUrl: string
  }): Promise<GatewayPaymentRequest> {
    const authority = `SBX-${randomUUID()}`
    return {
      authority,
      // درگاه واقعی کاربر را به صفحه خودش می‌برد؛ sandbox مستقیم callback می‌دهد
      redirectUrl: `${input.callbackUrl}?Authority=${authority}&Status=OK`,
    }
  }

  async verifyPayment(input: {
    authority: string
    amountToman: bigint
  }): Promise<GatewayVerifyResult> {
    if (input.authority.endsWith('-FAIL')) {
      return { ok: false, error: 'SANDBOX_VERIFY_FAILED' }
    }
    const amount = input.authority.endsWith('-MISMATCH')
      ? input.amountToman + 1n
      : input.amountToman
    return {
      ok: true,
      amountToman: amount,
      refId: `SBX-REF-${Date.now()}`,
      cardPan: '****5022',
    }
  }
}
