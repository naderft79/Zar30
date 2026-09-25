// ============================================
// Zar30 - Admin System Service (Phase 5)
// ============================================
// اعلان broadcast + قالب‌ها، نقش‌ها/اعضا، تنظیمات سامانه، SEO، سلامت، پروفایل مدیر
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import { logger } from '@/lib/logger/logger'
import {
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  resolvePermissions,
  type Permission,
} from '@/lib/auth/rbac'
import type {
  AdminMemberUpdate,
  AdminSettingInput,
  AdminSeoInput,
} from '@/lib/validators/admin-system'
import type {
  adminBroadcastSchema,
  adminNotificationTemplateSchema,
} from '@/lib/validators/admin-system'
import type { z } from 'zod'

interface AdminActCtx {
  adminId: string
  adminRole: string
}

interface AuditMeta {
  ip?: string
  userAgent?: string
  requestId?: string
}

function audit(ctx: AdminActCtx, meta: AuditMeta, entry: Parameters<typeof toAuditData>[0]) {
  return toAuditData({
    ...entry,
    actorType: 'admin',
    actorId: ctx.adminId,
    actorRole: ctx.adminRole,
    ip: meta.ip,
    userAgent: meta.userAgent,
    requestId: meta.requestId,
  })
}

// ============================================
// Broadcast اعلان
// ============================================

async function audienceUserIds(audience: 'ALL' | 'KYC_APPROVED' | 'ACTIVE_30D'): Promise<string[]> {
  const where: Prisma.UserWhereInput = { status: 'ACTIVE' }
  if (audience === 'KYC_APPROVED') where.kycLevel = { not: 'LEVEL_0' }
  if (audience === 'ACTIVE_30D')
    where.lastLoginAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  const users = await prisma.user.findMany({ where, select: { id: true } })
  return users.map((u) => u.id)
}

// اعلان درون‌برنامه‌ای گروهی — createMany دسته‌ای؛ audit + نتیجه تعداد
export async function broadcastAdminNotification(
  ctx: AdminActCtx,
  input: z.infer<typeof adminBroadcastSchema>,
  meta: AuditMeta,
): Promise<{ sent: number }> {
  const userIds = await audienceUserIds(input.audience)
  if (userIds.length === 0) throw ApiError.badRequest('هیچ کاربر واجد شرایطی یافت نشد')

  // دسته‌های ۵۰۰تایی برای جلوگیری از کوئری بیش‌از‌حد بزرگ
  let sent = 0
  const now = new Date()
  for (let i = 0; i < userIds.length; i += 500) {
    const chunk = userIds.slice(i, i + 500)
    const res = await prisma.notification.createMany({
      data: chunk.map((userId) => ({
        userId,
        type: 'admin_broadcast',
        title: input.title,
        body: input.body,
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: now,
        data: { broadcast: true, audience: input.audience },
      })),
    })
    sent += res.count
  }

  await prisma.auditLog.create({
    data: audit(ctx, meta, {
      action: 'notification.broadcast',
      entityType: 'notification',
      after: { title: input.title, audience: input.audience, sent },
    }),
  })
  return { sent }
}

// ============================================
// قالب‌های اعلان
// ============================================

export async function listAdminNotificationTemplates() {
  const rows = await prisma.notificationTemplate.findMany({ orderBy: { key: 'asc' } })
  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    channels: r.channels,
    titleTemplate: r.titleTemplate,
    bodyTemplate: r.bodyTemplate,
    variables: Array.isArray(r.variables) ? (r.variables as string[]) : [],
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function upsertAdminNotificationTemplate(
  ctx: AdminActCtx,
  input: z.infer<typeof adminNotificationTemplateSchema>,
  meta: AuditMeta,
  id?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.notificationTemplate.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('قالب یافت نشد')
    const row = id
      ? await tx.notificationTemplate.update({ where: { id }, data: input })
      : await tx.notificationTemplate.create({ data: input })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: id ? 'notification_template.update' : 'notification_template.create',
        entityType: 'notification_template',
        entityId: row.id,
        before: before ? { key: before.key, channels: before.channels } : undefined,
        after: input,
      }),
    })
    return row
  })
  return { id: result.id }
}

export async function deleteAdminNotificationTemplate(
  ctx: AdminActCtx,
  id: string,
  meta: AuditMeta,
) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.notificationTemplate.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('قالب یافت نشد')
    await tx.notificationTemplate.delete({ where: { id } })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: 'notification_template.delete',
        entityType: 'notification_template',
        entityId: id,
        before: { key: before.key },
      }),
    })
  })
  return { id, deleted: true }
}

// ============================================
// نقش‌ها و اعضای تیم
// ============================================

export function listAdminRoleMatrix() {
  return (Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).map((role) => ({
    role,
    label: ROLE_LABELS[role],
    permissions: [...ROLE_PERMISSIONS[role]],
    count: ROLE_PERMISSIONS[role].length,
  }))
}

export const PERMISSION_CATALOG = Object.values(PERMISSIONS)

export async function getAdminMember(id: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    include: { user: { select: { id: true, mobile: true, firstName: true, lastName: true } } },
  })
  if (!admin) throw ApiError.notFound('عضو تیم یافت نشد')
  const custom = (admin.permissions ?? {}) as { grant?: string[]; revoke?: string[] }
  return {
    id: admin.id,
    role: admin.role,
    active: admin.active,
    grant: Array.isArray(custom.grant) ? custom.grant : [],
    revoke: Array.isArray(custom.revoke) ? custom.revoke : [],
    resolved: resolvePermissions(admin.role, admin.permissions),
    user: admin.user,
    createdAt: admin.createdAt.toISOString(),
  }
}

// به‌روزرسانی نقش/فعلیت/override — audit با before/after کامل
export async function updateAdminMember(
  ctx: AdminActCtx,
  id: string,
  input: AdminMemberUpdate,
  meta: AuditMeta,
) {
  if (id === ctx.adminId && (input.active === false || input.role))
    throw ApiError.badRequest('نمی‌توان نقش یا وضعیت حساب خود را تغییر داد')

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.adminUser.findUnique({ where: { id } })
    if (!before) throw ApiError.notFound('عضو تیم یافت نشد')

    // محافظت از آخرین SUPER_ADMIN فعال — غیرفعال‌سازی یا تغییر نقشش سیستم را قفل می‌کند
    const touchingSuperAdmin =
      before.role === 'SUPER_ADMIN' &&
      before.active &&
      ((input.role !== undefined && input.role !== 'SUPER_ADMIN') || input.active === false)
    if (touchingSuperAdmin) {
      const otherSupers = await tx.adminUser.count({
        where: { role: 'SUPER_ADMIN', active: true, id: { not: id } },
      })
      if (otherSupers === 0)
        throw ApiError.badRequest('نقش یا وضعیت آخرین مدیر ارشد فعال قابل تغییر نیست')
    }

    const permissions = {
      grant: input.grant ?? [],
      revoke: input.revoke ?? [],
    }
    const saved = await tx.adminUser.update({
      where: { id },
      data: {
        ...(input.role !== undefined && { role: input.role }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.grant !== undefined || input.revoke !== undefined ? { permissions } : {}),
      },
    })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: 'team.member.update',
        entityType: 'admin_user',
        entityId: id,
        targetUserId: before.userId,
        before: { role: before.role, active: before.active, permissions: before.permissions },
        after: {
          role: saved.role,
          active: saved.active,
          grant: permissions.grant,
          revoke: permissions.revoke,
          reason: input.reason,
        },
      }),
    })
    return saved
  })
  return { id: result.id, role: result.role, active: result.active }
}

// ============================================
// تنظیمات سامانه (PlatformSetting)
// ============================================

export async function listAdminSettings(q?: string, prefix?: string) {
  const where: Prisma.PlatformSettingWhereInput = {
    ...(q && { key: { contains: q, mode: 'insensitive' } }),
    ...(prefix && { key: { startsWith: prefix } }),
  }
  const rows = await prisma.platformSetting.findMany({ where, orderBy: { key: 'asc' } })
  return rows.map((r) => ({
    key: r.key,
    value: r.value,
    updatedAt: r.updatedAt.toISOString(),
    updatedBy: r.updatedBy,
  }))
}

export async function upsertAdminSetting(
  ctx: AdminActCtx,
  input: AdminSettingInput,
  meta: AuditMeta,
) {
  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.platformSetting.findUnique({ where: { key: input.key } })
    const row = await tx.platformSetting.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        value: input.value as Prisma.InputJsonValue,
        updatedBy: ctx.adminId,
      },
      update: { value: input.value as Prisma.InputJsonValue, updatedBy: ctx.adminId },
    })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: before ? 'setting.update' : 'setting.create',
        entityType: 'platform_setting',
        entityId: input.key,
        before: before ? { value: before.value } : undefined,
        after: { value: input.value },
      }),
    })
    return row
  })
  return { key: result.key }
}

export async function deleteAdminSetting(ctx: AdminActCtx, key: string, meta: AuditMeta) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.platformSetting.findUnique({ where: { key } })
    if (!before) throw ApiError.notFound('تنظیم یافت نشد')
    await tx.platformSetting.delete({ where: { key } })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: 'setting.delete',
        entityType: 'platform_setting',
        entityId: key,
        before: { value: before.value },
      }),
    })
  })
  return { key, deleted: true }
}

// ---------- SEO — settings با پیشوند seo. ----------

const SEO_PREFIX = 'seo.'

export async function getAdminSeo(page: string) {
  const row = await prisma.platformSetting.findUnique({ where: { key: `${SEO_PREFIX}${page}` } })
  return row ? (row.value as Record<string, unknown>) : null
}

export async function listAdminSeo() {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { startsWith: SEO_PREFIX } },
    orderBy: { key: 'asc' },
  })
  return rows.map((r) => ({
    page: r.key.slice(SEO_PREFIX.length),
    ...(r.value as Record<string, unknown>),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

export async function upsertAdminSeo(ctx: AdminActCtx, input: AdminSeoInput, meta: AuditMeta) {
  const key = `${SEO_PREFIX}${input.page}`
  const value = {
    title: input.title,
    description: input.description ?? '',
    keywords: input.keywords,
    ogImage: input.ogImage ?? '',
  }
  await prisma.$transaction(async (tx) => {
    const before = await tx.platformSetting.findUnique({ where: { key } })
    await tx.platformSetting.upsert({
      where: { key },
      create: { key, value, updatedBy: ctx.adminId },
      update: { value, updatedBy: ctx.adminId },
    })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: 'seo.update',
        entityType: 'platform_setting',
        entityId: key,
        before: before ? { value: before.value } : undefined,
        after: { value },
      }),
    })
  })
  return { page: input.page }
}

// ============================================
// سلامت سیستم
// ============================================

export async function getAdminSystemHealth() {
  const started = process.uptime()
  const checks: { name: string; ok: boolean; latencyMs?: number; detail?: string }[] = []

  // DB
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.push({ name: 'PostgreSQL', ok: true, latencyMs: Date.now() - dbStart })
  } catch (err) {
    checks.push({ name: 'PostgreSQL', ok: false, detail: String(err) })
    logger.error({ err }, 'Health check: Postgres failed')
  }

  // Redis
  const rStart = Date.now()
  try {
    const pong = await redis.ping()
    checks.push({ name: 'Redis', ok: pong === 'PONG', latencyMs: Date.now() - rStart })
  } catch (err) {
    checks.push({ name: 'Redis', ok: false, detail: String(err) })
    logger.error({ err }, 'Health check: Redis failed')
  }

  // صف‌های عملیاتی — شمارنده‌های pending برای context
  const [pendingKyc, pendingWithdrawals, pendingOrders, openTickets, unreviewedRisk] =
    await Promise.all([
      prisma.kycSubmission.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
      prisma.riskEvent.count({ where: { reviewedAt: null } }),
    ])

  return {
    status: checks.every((c) => c.ok) ? 'healthy' : 'degraded',
    checks,
    uptimeSeconds: Math.floor(started),
    runtime: { node: process.version, env: process.env.NODE_ENV },
    queues: { pendingKyc, pendingWithdrawals, pendingOrders, openTickets, unreviewedRisk },
    checkedAt: new Date().toISOString(),
  }
}

// ============================================
// پروفایل مدیر
// ============================================

export async function getAdminProfile(adminId: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    include: {
      user: {
        select: {
          id: true,
          mobile: true,
          firstName: true,
          lastName: true,
          email: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
  })
  if (!admin) throw ApiError.notFound('مدیر یافت نشد')

  const [sessions, recentActions] = await Promise.all([
    prisma.session.findMany({
      where: { userId: admin.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, deviceInfo: true, ip: true, userAgent: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { actorType: 'admin', actorId: adminId },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { action: true, entityType: true, entityId: true, createdAt: true },
    }),
  ])

  const custom = (admin.permissions ?? {}) as { grant?: string[]; revoke?: string[] }
  return {
    id: admin.id,
    role: admin.role,
    roleLabel: ROLE_LABELS[admin.role],
    active: admin.active,
    permissions: resolvePermissions(admin.role, admin.permissions),
    overrides: {
      grant: Array.isArray(custom.grant) ? custom.grant : [],
      revoke: Array.isArray(custom.revoke) ? custom.revoke : [],
    },
    user: {
      ...admin.user,
      lastLoginAt: admin.user.lastLoginAt?.toISOString() ?? null,
      createdAt: admin.user.createdAt.toISOString(),
    },
    sessions: sessions.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
    recentActions: recentActions.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    permissionCatalog: PERMISSION_CATALOG as Permission[],
  }
}

// ============================================
// Kill Switch — توقف اضطراری معاملات/برداشت (Dashboard V2)
// ============================================
// پرچم‌ها در PlatformSetting — کش Redis ۵ ثانیه برای hot path
// معاملات: fail-open (پیوستگی کسب‌وکار) | برداشت: fail-closed (امنیت)
// ============================================

export type HaltScope = 'TRADING' | 'WITHDRAWALS'
export interface HaltFlags {
  trading: { halted: boolean; at: string | null; by: string | null }
  withdrawals: { halted: boolean; at: string | null; by: string | null }
}

const HALT_CACHE_KEY = 'admin:halt:flags'
const HALT_CACHE_TTL = 5
const HALT_KEYS = { TRADING: 'trading.halted', WITHDRAWALS: 'withdrawals.halted' } as const

interface HaltSettingValue {
  halted?: boolean
  at?: string
  by?: string
}

async function readHaltFlags(): Promise<HaltFlags> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [HALT_KEYS.TRADING, HALT_KEYS.WITHDRAWALS] } },
    select: { key: true, value: true, updatedBy: true, updatedAt: true },
  })
  const parse = (key: string): HaltFlags['trading'] => {
    const row = rows.find((r) => r.key === key)
    const v = (row?.value ?? {}) as HaltSettingValue
    return {
      halted: v.halted === true,
      at: v.at ?? row?.updatedAt?.toISOString() ?? null,
      by: v.by ?? row?.updatedBy ?? null,
    }
  }
  return { trading: parse(HALT_KEYS.TRADING), withdrawals: parse(HALT_KEYS.WITHDRAWALS) }
}

// خواندن پرچم‌ها با کش ۵ ثانیه — hot path سفارش/برداشت
export async function getHaltFlags(): Promise<HaltFlags> {
  try {
    const cached = await redis.get(HALT_CACHE_KEY)
    if (cached) return JSON.parse(cached) as HaltFlags
  } catch {
    // کش خراب — ادامه به DB
  }
  const flags = await readHaltFlags()
  try {
    await redis.set(HALT_CACHE_KEY, JSON.stringify(flags), 'EX', HALT_CACHE_TTL)
  } catch {
    // کش اختیاری است
  }
  return flags
}

// fail-open: خطای بررسی → معامله ادامه می‌یابد (پیوستگی کسب‌وکار)
export async function isTradingHalted(): Promise<boolean> {
  try {
    return (await getHaltFlags()).trading.halted
  } catch (err) {
    logger.error({ err }, 'Halt flag check failed (trading) — fail-open')
    return false
  }
}

// fail-closed: خطای بررسی → برداشت متوقف می‌شود (امنیت)
export async function isWithdrawalsHalted(): Promise<boolean> {
  try {
    return (await getHaltFlags()).withdrawals.halted
  } catch (err) {
    logger.error({ err }, 'Halt flag check failed (withdrawals) — fail-closed')
    return true
  }
}

// تغییر وضعیت halt — audit اجباری با before/after + ابطال کش
export async function setHaltFlag(
  ctx: AdminActCtx,
  scope: HaltScope,
  halted: boolean,
  meta: AuditMeta,
): Promise<HaltFlags> {
  const key = HALT_KEYS[scope]
  const value: HaltSettingValue = {
    halted,
    at: new Date().toISOString(),
    by: ctx.adminId,
  }
  const json = value as unknown as Prisma.InputJsonValue

  await prisma.$transaction(async (tx) => {
    const before = await tx.platformSetting.findUnique({ where: { key } })
    await tx.platformSetting.upsert({
      where: { key },
      create: { key, value: json, updatedBy: ctx.adminId },
      update: { value: json, updatedBy: ctx.adminId },
    })
    await tx.auditLog.create({
      data: audit(ctx, meta, {
        action: halted ? 'system.kill_switch.halt' : 'system.kill_switch.resume',
        entityType: 'platform_setting',
        entityId: key,
        reason: `${scope} ${halted ? 'HALTED' : 'RESUMED'}`,
        before: before?.value,
        after: value,
      }),
    })
  })

  try {
    await redis.del(HALT_CACHE_KEY)
  } catch {
    // ابطال کش اختیاری — TTL ۵ ثانیه است
  }
  return readHaltFlags()
}
