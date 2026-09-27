// ============================================
// Zar30 - /api/v1/tickets
// ============================================
// GET  → لیست تیکت‌های کاربر (صفحه‌بندی) یا جزئیات با ?id=
// POST → ساخت تیکت جدید
// ============================================

import { created, ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { ApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'
import { z } from 'zod'
import { createTicket, listUserTickets, getTicketMessages } from '@/lib/services/ticket.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (id) {
    return ok(await getTicketMessages(id, auth.userId))
  }
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '20') || 20))
  const result = await listUserTickets(auth.userId, page, limit)
  return ok({ tickets: result.items }, { page, limit, total: result.total })
})

const createTicketSchema = z.object({
  subject: z.string().min(3, 'موضوع باید حداقل ۳ کاراکتر باشد').max(150),
  category: z.enum(['ACCOUNT', 'KYC', 'TRADE', 'INSTALLMENT', 'INVESTMENT', 'PAYMENT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  body: z.string().min(5, 'متن پیام باید حداقل ۵ کاراکتر باشد').max(5000),
})

export const POST = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)
  await checkRateLimit('api.general', auth.userId)

  const rawBody = await req.json().catch(() => null)
  const parsed = createTicketSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const ticket = await createTicket(auth, parsed.data)
  return created(ticket)
})
