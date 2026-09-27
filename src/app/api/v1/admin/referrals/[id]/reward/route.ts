// ============================================
// Zar30 - POST /api/v1/admin/referrals/[id]/reward
// ============================================
// پرداخت پاداش معرف — permission: referrals.manage — strict audit
// QUALIFIED → REWARDED با سند double-entry متوازن
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { getSessionMeta } from '@/lib/api/request'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { writeAuditStrict } from '@/lib/audit/audit'
import { payReferralReward } from '@/lib/services/referral.service'

export const POST = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdminPermission(req, PERMISSIONS.REFERRALS_MANAGE)
    const { id } = await ctx.params

    const result = await payReferralReward({ adminId: admin.adminId }, id)

    const meta = getSessionMeta(req)
    await writeAuditStrict({
      actorType: 'admin',
      actorId: admin.adminId,
      actorRole: admin.adminRole,
      action: 'referral.reward',
      entityType: 'referral',
      entityId: id,
      after: { rewardAmount: result.rewardAmount, referrerId: result.referrerId },
      ip: meta.ip,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
    })

    return ok(result)
  },
)
