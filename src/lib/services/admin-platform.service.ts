import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import type { z } from 'zod'
import type { adminPlatformQuerySchema } from '@/lib/validators/admin-operations'

export type AdminPlatformQuery = z.infer<typeof adminPlatformQuerySchema>

async function paged<T>(
  count: Promise<number>,
  rows: Promise<T[]>,
): Promise<{ rows: T[]; total: number }> {
  const [total, data] = await Promise.all([count, rows])
  return { total, rows: data }
}

export async function listAdminAuditLogs(input: AdminPlatformQuery) {
  const where: Prisma.AuditLogWhereInput = input.q
    ? {
        OR: [
          { action: { contains: input.q, mode: 'insensitive' } },
          { entityType: { contains: input.q, mode: 'insensitive' } },
          { entityId: { contains: input.q, mode: 'insensitive' } },
          { actorRole: { contains: input.q, mode: 'insensitive' } },
          { requestId: { contains: input.q, mode: 'insensitive' } },
        ],
      }
    : {}
  const result = await paged(
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        actorType: true,
        actorId: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityId: true,
        targetUserId: true,
        requestId: true,
        reason: true,
        ip: true,
        createdAt: true,
      },
    }),
  )
  return {
    total: result.total,
    rows: result.rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
  }
}

export async function listAdminSessions(input: AdminPlatformQuery) {
  const where: Prisma.SessionWhereInput = input.q
    ? {
        OR: [
          { id: { contains: input.q, mode: 'insensitive' } },
          { ip: { contains: input.q, mode: 'insensitive' } },
          { deviceInfo: { contains: input.q, mode: 'insensitive' } },
          { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
        ],
      }
    : {}
  const result = await paged(
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        deviceInfo: true,
        ip: true,
        userAgent: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
  )
  return {
    total: result.total,
    rows: result.rows.map((row) => ({
      ...row,
      expiresAt: row.expiresAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

export async function listAdminNotifications(input: AdminPlatformQuery) {
  const where: Prisma.NotificationWhereInput = input.q
    ? {
        OR: [
          { title: { contains: input.q, mode: 'insensitive' } },
          { type: { contains: input.q, mode: 'insensitive' } },
          { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
        ],
      }
    : {}
  const result = await paged(
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        type: true,
        title: true,
        channel: true,
        status: true,
        sentAt: true,
        readAt: true,
        createdAt: true,
        user: { select: { id: true, mobile: true } },
      },
    }),
  )
  return {
    total: result.total,
    rows: result.rows.map((row) => ({
      ...row,
      sentAt: row.sentAt?.toISOString() ?? null,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

export async function listAdminTeam(input: AdminPlatformQuery) {
  const where: Prisma.AdminUserWhereInput = input.q
    ? {
        OR: [
          { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
          { user: { firstName: { contains: input.q, mode: 'insensitive' } } },
          { user: { lastName: { contains: input.q, mode: 'insensitive' } } },
        ],
      }
    : {}
  const result = await paged(
    prisma.adminUser.count({ where }),
    prisma.adminUser.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, mobile: true, firstName: true, lastName: true, lastLoginAt: true },
        },
      },
    }),
  )
  return {
    total: result.total,
    rows: result.rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: { ...row.user, lastLoginAt: row.user.lastLoginAt?.toISOString() ?? null },
    })),
  }
}

export async function listAdminContent(input: AdminPlatformQuery) {
  const where: Prisma.CmsContentWhereInput = input.q
    ? {
        OR: [
          { key: { contains: input.q, mode: 'insensitive' } },
          { title: { contains: input.q, mode: 'insensitive' } },
          { slug: { contains: input.q, mode: 'insensitive' } },
        ],
      }
    : {}
  const result = await paged(
    prisma.cmsContent.count({ where }),
    prisma.cmsContent.findMany({
      where,
      orderBy: { updatedAt: input.direction },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: {
        id: true,
        key: true,
        type: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  )
  return {
    total: result.total,
    rows: result.rows.map((row) => ({
      ...row,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  }
}

export async function listAdminFlags(input: AdminPlatformQuery) {
  const where: Prisma.FeatureFlagWhereInput = input.q
    ? {
        OR: [
          { key: { contains: input.q, mode: 'insensitive' } },
          { description: { contains: input.q, mode: 'insensitive' } },
        ],
      }
    : {}
  const result = await paged(
    prisma.featureFlag.count({ where }),
    prisma.featureFlag.findMany({
      where,
      orderBy: { updatedAt: input.direction },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
  )
  return {
    total: result.total,
    rows: result.rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  }
}
