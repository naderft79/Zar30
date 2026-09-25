// ============================================
// Zar30 - Admin Delivery Service (Phase 1)
// ============================================
// لیست و جزئیات درخواست‌های تحویل فیزیکی برای مرکز عملیات
// اکشن‌ها در finance/delivery.service.ts هستند (state machine مالی)
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import type { AdminDeliveryListQuery } from '@/lib/validators/admin-delivery'
import { parseAdminDateBoundary } from '@/lib/utils/admin-time'
import type { AdminAuditRow } from './admin-finance.service'

export interface AdminDeliveryRow {
  id: string
  grams: string
  method: string
  status: string
  trackingCode: string | null
  feeToman: string | null
  createdAt: string
  user: { id: string; mobile: string; name: string }
  address: { city: string | null; province: string | null } | null
}

export interface AdminDeliveryDetail extends Omit<AdminDeliveryRow, 'address'> {
  reviewNote: string | null
  pickupBranch: string | null
  pickupAt: string | null
  processedAt: string | null
  processedBy: { id: string; name: string } | null
  address: {
    id: string
    title: string | null
    recipientName: string
    mobile: string
    province: string | null
    city: string | null
    address: string
    postalCode: string
    latitude: string | null
    longitude: string | null
  } | null
  audit: AdminAuditRow[]
}

function serializeUser(u: {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
}) {
  return {
    id: u.id,
    mobile: u.mobile,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.mobile,
  }
}

export async function listAdminDeliveries(
  input: AdminDeliveryListQuery,
): Promise<{ rows: AdminDeliveryRow[]; total: number }> {
  const where: Prisma.GoldDeliveryRequestWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.method && { method: input.method }),
    ...(input.from && { createdAt: { gte: parseAdminDateBoundary(input.from, false) } }),
    ...(input.to && {
      createdAt: {
        ...(input.from ? { gte: parseAdminDateBoundary(input.from, false) } : {}),
        lte: parseAdminDateBoundary(input.to, true),
      },
    }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { trackingCode: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q } } },
        { user: { firstName: { contains: input.q, mode: 'insensitive' } } },
        { user: { lastName: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.goldDeliveryRequest.count({ where }),
    prisma.goldDeliveryRequest.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        grams: true,
        method: true,
        status: true,
        trackingCode: true,
        feeToman: true,
        createdAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
        address: { select: { city: true, province: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      grams: r.grams.toString(),
      method: r.method,
      status: r.status,
      trackingCode: r.trackingCode,
      feeToman: r.feeToman?.toString() ?? null,
      createdAt: r.createdAt.toISOString(),
      user: serializeUser(r.user),
      address: r.address,
    })),
  }
}

export async function getAdminDelivery(id: string): Promise<AdminDeliveryDetail | null> {
  const r = await prisma.goldDeliveryRequest.findUnique({
    where: { id },
    select: {
      id: true,
      grams: true,
      method: true,
      status: true,
      reviewNote: true,
      trackingCode: true,
      pickupBranch: true,
      pickupAt: true,
      feeToman: true,
      processedAt: true,
      createdAt: true,
      user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      address: {
        select: {
          id: true,
          title: true,
          recipientName: true,
          mobile: true,
          province: true,
          city: true,
          address: true,
          postalCode: true,
          latitude: true,
          longitude: true,
        },
      },
      processor: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
    },
  })
  if (!r) return null

  const auditRows = await prisma.auditLog.findMany({
    where: { entityType: 'delivery', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      action: true,
      actorType: true,
      actorRole: true,
      reason: true,
      createdAt: true,
    },
  })

  return {
    id: r.id,
    grams: r.grams.toString(),
    method: r.method,
    status: r.status,
    trackingCode: r.trackingCode,
    reviewNote: r.reviewNote,
    pickupBranch: r.pickupBranch,
    pickupAt: r.pickupAt?.toISOString() ?? null,
    feeToman: r.feeToman?.toString() ?? null,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    user: serializeUser(r.user),
    processedBy: r.processor
      ? {
          id: r.processor.id,
          name:
            [r.processor.user.firstName, r.processor.user.lastName].filter(Boolean).join(' ') ||
            r.processor.id,
        }
      : null,
    address: r.address
      ? {
          ...r.address,
          latitude: r.address.latitude?.toString() ?? null,
          longitude: r.address.longitude?.toString() ?? null,
        }
      : null,
    audit: auditRows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
  }
}
