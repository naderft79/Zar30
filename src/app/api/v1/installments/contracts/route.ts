// ============================================
// Zar30 - /api/v1/installments/contracts
// ============================================
// GET  → قراردادهای کاربر (یا جزئیات با ?id=)
// POST → درخواست قرارداد جدید — بدون Idempotency (رکورد PENDING است؛
//        عملیات مالی واقعی در approve/pay با محافظت قفل انجام می‌شود)
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { z } from 'zod'
import {
  listUserContracts,
  getUserContract,
  requestInstallmentContract,
} from '@/lib/services/installment.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const id = new URL(req.url).searchParams.get('id')
  if (id) {
    const contract = await getUserContract(auth.userId, id)
    return ok(contract)
  }
  return ok({ contracts: await listUserContracts(auth.userId) })
})

const requestContractSchema = z.object({
  planId: z.string().min(1),
  principal: z
    .string()
    .regex(/^\d+$/, 'مبلغ باید عدد صحیح مثبت باشد')
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, 'مبلغ باید مثبت باشد'),
  method: z.enum(['INTERNAL_CREDIT', 'CHEQUE']),
  chequeNumber: z.string().min(4).max(30).optional(),
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('wallet.write', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = requestContractSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const result = await requestInstallmentContract(auth, {
    planId: parsed.data.planId,
    principal: parsed.data.principal,
    method: parsed.data.method,
    chequeNumber: parsed.data.chequeNumber,
  })
  return created(result)
})
