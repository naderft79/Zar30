// ============================================
// Zar30 - GET|POST /api/v1/admin/dashboard/notes
// ============================================
// یادداشت تیمی داشبورد — حداکثر ۲۰ نوت — permission: dashboard.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { ApiError } from '@/lib/errors/api-error'
import { addDashboardNote, listDashboardNotes } from '@/lib/services/admin-dashboard.service'
import { dashboardNoteSchema } from '@/lib/validators/admin-dashboard'
import { writeAudit } from '@/lib/audit/audit'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const notes = await listDashboardNotes()
  return ok({ notes })
})

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await requireAdminPermission(req, PERMISSIONS.DASHBOARD_READ)
  const parsed = dashboardNoteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'ورودی نامعتبر است')
  }
  const note = await addDashboardNote(ctx.adminId, parsed.data.text, parsed.data.pinned)
  void writeAudit({
    actorType: 'admin',
    actorId: ctx.adminId,
    actorRole: ctx.adminRole,
    action: 'dashboard.note.add',
    entityType: 'platform_setting',
    entityId: 'admin.notes',
    after: { noteId: note.id, pinned: note.pinned },
  })
  return ok({ note })
})
