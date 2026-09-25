// ============================================
// Zar30 - Admin Presence (Admin Dashboard V2)
// ============================================
// ردیابی مدیران آنلاین با Redis ZSET — score = timestamp آخرین فعالیت
// fire-and-forget از requireAdmin — خطای Redis هرگز auth را fail نمی‌کند
// ============================================

import { redis } from '@/lib/redis/client'
import prisma from '@/lib/db/prisma'
import { ROLE_LABELS } from '@/lib/auth/rbac'

const ONLINE_KEY = 'admin:online'
const ONLINE_WINDOW_MS = 5 * 60 * 1000 // ۵ دقیقه

/**
 * ثبت فعالیت مدیر — fire-and-forget؛ خطا فقط نادیده گرفته می‌شود.
 * در requireAdmin صدا زده می‌شود تا هر درخواست API ادمین حضور را تازه کند.
 */
export function trackAdminOnline(adminId: string): void {
  const now = Date.now()
  void Promise.all([
    redis.zadd(ONLINE_KEY, now, adminId),
    // حذف اعضای قدیمی — هزینه کم، هر از گاهی انجام می‌شود
    redis.zremrangebyscore(ONLINE_KEY, 0, now - ONLINE_WINDOW_MS),
  ]).catch(() => {
    // حضور آنلاین best-effort است — خاموش
  })
}

export interface OnlineAdmin {
  adminId: string
  name: string | null
  mobile: string | null
  role: string
  roleLabel: string
  lastSeenSec: number
}

/** مدیران فعال در ۵ دقیقه اخیر — با اطلاعات نمایشی */
export async function getOnlineAdmins(): Promise<{ count: number; admins: OnlineAdmin[] }> {
  const now = Date.now()
  const since = now - ONLINE_WINDOW_MS
  await redis.zremrangebyscore(ONLINE_KEY, 0, since)
  const rows = await redis.zrevrangebyscore(ONLINE_KEY, now, since, 'WITHSCORES')

  const ids: string[] = []
  const lastSeen = new Map<string, number>()
  for (let i = 0; i + 1 < rows.length; i += 2) {
    const id = rows[i]!
    const ts = Number(rows[i + 1]!)
    ids.push(id)
    lastSeen.set(id, Math.floor((now - ts) / 1000))
  }
  if (ids.length === 0) return { count: 0, admins: [] }

  const admins = await prisma.adminUser.findMany({
    where: { id: { in: ids }, active: true },
    select: {
      id: true,
      role: true,
      user: { select: { mobile: true, firstName: true, lastName: true } },
    },
  })

  return {
    count: admins.length,
    admins: admins.map((a) => ({
      adminId: a.id,
      name: [a.user.firstName, a.user.lastName].filter(Boolean).join(' ') || null,
      mobile: a.user.mobile,
      role: a.role,
      roleLabel: ROLE_LABELS[a.role] ?? a.role,
      lastSeenSec: lastSeen.get(a.id) ?? 0,
    })),
  }
}
