// ============================================
// Zar30 - POST /api/v1/auth/register
// ============================================

import { created, withErrorHandler } from '@/lib/api/response'
import { parseBody, getSessionMeta, getClientIp } from '@/lib/api/request'
import { registerSchema } from '@/lib/validators/auth'
import { authService } from '@/lib/services/auth.service'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit'

export const POST = withErrorHandler(async (req: Request) => {
  const input = await parseBody(req, registerSchema)
  await checkRateLimit('auth.register', getClientIp(req) ?? 'unknown')

  const meta = getSessionMeta(req)
  const result = await authService.register(input, meta)
  return created(result)
})
