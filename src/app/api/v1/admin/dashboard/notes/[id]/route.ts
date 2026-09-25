// ============================================
// Zar30 - DELETE /api/v1/admin/dashboard/notes/:id
// ============================================
// حذف یادداشت — فقط نویسنده یا SUPER_ADMIN
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { deleteDashboardNote } from '@/lib/services/admin-dashboard.service'
import { writeAudit } from '@/lib/audit/audit'

export const DELETE = withErrorHandler(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
    const { id } = await ctx.params
    await deleteDashboardNote(admin.adminId, admin.adminRole, id)
    void writeAudit({
      actorType: 'admin',
      actorId: admin.adminId,
      actorRole: admin.adminRole,
      action: 'dashboard.note.delete',
      entityType: 'platform_setting',
      entityId: 'admin.notes',
      after: { noteId: id },
    })
    return ok({ deleted: true })
  },
)
