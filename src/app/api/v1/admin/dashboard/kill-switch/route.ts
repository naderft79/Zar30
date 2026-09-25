// ============================================
// Zar30 - GET|POST /api/v1/admin/dashboard/kill-switch
// ============================================
// توقف اضطراری معاملات/برداشت — تأیید دومرحله‌ای — permission: system.manage
// audit اجباری با before/after
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { getHaltFlags, setHaltFlag } from '@/lib/services/admin-system.service'
import { killSwitchSchema, KILL_SWITCH_CONFIRM } from '@/lib/validators/admin-dashboard'

function requestMeta(req: Request) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  }
}

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const flags = await getHaltFlags()
  return ok({ halted: flags })
})

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await requireAdminPermission(req, PERMISSIONS.SYSTEM_MANAGE)
  const parsed = killSwitchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }

  const { scope, action, confirm } = parsed.data
  const expected =
    action === 'HALT' ? KILL_SWITCH_CONFIRM[scope].halt : KILL_SWITCH_CONFIRM[scope].resume
  if (confirm.trim() !== expected) {
    throw ApiError.badRequest(`برای تأیید، عبارت «${expected}» را دقیقاً وارد کنید`)
  }

  const flags = await setHaltFlag(ctx, scope, action === 'HALT', requestMeta(req))
  return ok({ halted: flags })
})
