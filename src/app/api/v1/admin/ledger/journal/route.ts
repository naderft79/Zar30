// ============================================
// Zar30 - GET /api/v1/admin/ledger/journal
// ============================================
// اسناد دفتر کل — ledger.read
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { parseAdminQuery, paginationMeta } from '@/lib/api/admin-query'
import { requireAdminPermission } from '@/lib/auth/guard'
import { PERMISSIONS } from '@/lib/auth/rbac'
import { adminJournalQuerySchema } from '@/lib/validators/admin-risk'
import { listAdminJournalEntries } from '@/lib/services/admin-reports.service'

export const GET = withErrorHandler(async (req: Request) => {
  await requireAdminPermission(req, PERMISSIONS.LEDGER_READ)
  const input = parseAdminQuery(req, adminJournalQuerySchema)
  const { rows, total } = await listAdminJournalEntries(input)
  return ok({ entries: rows }, paginationMeta(input.page, input.limit, total))
})
