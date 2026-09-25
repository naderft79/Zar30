// ============================================
// Zar30 - Admin Commerce Service (Phase 2)
// ============================================
// CRUD محصول/دسته‌بندی/کد تخفیف + لیست موجودی سکه کاربران
// همه mutationها audit log با actor + before/after دارند
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import { parseAdminDateBoundary } from '@/lib/utils/admin-time'
import type {
  AdminCategoryListQuery,
  AdminCoinHoldingListQuery,
  AdminDiscountListQuery,
  AdminProductListQuery,
} from '@/lib/validators/admin-commerce'
import type {
  adminCategorySchema,
  adminDiscountSchema,
  adminProductSchema,
} from '@/lib/validators/admin-commerce'
import type { z } from 'zod'

// ---------- Types ----------

interface AdminActCtx {
  adminId: string
  adminRole: string
}

interface AuditMeta {
  ip?: string
  userAgent?: string
  requestId?: string
}

export interface AdminProductRow {
  id: string
  sku: string
  name: string
  kind: string
  weightGrams: string
  premiumToman: string
  stock: number
  active: boolean
  sortOrder: number
  imageUrl: string | null
  createdAt: string
  category: { id: string; name: string } | null
}

export interface AdminCategoryRow {
  id: string
  name: string
  slug: string
  sortOrder: number
  active: boolean
  productsCount: number
  createdAt: string
}

export interface AdminDiscountRow {
  id: string
  code: string
  type: string
  value: string
  maxUses: number | null
  usedCount: number
  minPurchase: string | null
  expiresAt: string | null
  appliesTo: string
  active: boolean
  createdAt: string
}

export interface AdminCoinHoldingRow {
  id: string
  quantity: number
  journalEntryId: string | null
  createdAt: string
  updatedAt: string
  product: { id: string; code: string; name: string; kind: string; weightGrams: string }
  user: { id: string; mobile: string; name: string }
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

// ---------- Products ----------

const productSelect = {
  id: true,
  sku: true,
  name: true,
  kind: true,
  weightGrams: true,
  premiumToman: true,
  stock: true,
  active: true,
  sortOrder: true,
  imageUrl: true,
  createdAt: true,
  category: { select: { id: true, name: true } },
} as const

function serializeProduct(p: {
  id: string
  sku: string
  name: string
  kind: string
  weightGrams: { toString(): string }
  premiumToman: bigint
  stock: number
  active: boolean
  sortOrder: number
  imageUrl: string | null
  createdAt: Date
  category: { id: string; name: string } | null
}): AdminProductRow {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    kind: p.kind,
    weightGrams: p.weightGrams.toString(),
    premiumToman: p.premiumToman.toString(),
    stock: p.stock,
    active: p.active,
    sortOrder: p.sortOrder,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    category: p.category,
  }
}

export async function listAdminProducts(
  input: AdminProductListQuery,
): Promise<{ rows: AdminProductRow[]; total: number }> {
  const where: Prisma.ProductWhereInput = {
    ...(input.categoryId && { categoryId: input.categoryId }),
    ...(input.kind && { kind: input.kind }),
    ...(input.active === 'true' && { active: true }),
    ...(input.active === 'false' && { active: false }),
    ...(input.q && {
      OR: [
        { name: { contains: input.q, mode: 'insensitive' } },
        { sku: { contains: input.q, mode: 'insensitive' } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: input.direction }],
      skip,
      take: input.limit,
      select: productSelect,
    }),
  ])
  return { total, rows: rows.map(serializeProduct) }
}

export async function getAdminProduct(id: string): Promise<AdminProductRow | null> {
  const p = await prisma.product.findUnique({ where: { id }, select: productSelect })
  return p ? serializeProduct(p) : null
}

export async function createAdminProduct(
  ctx: AdminActCtx,
  input: z.infer<typeof adminProductSchema>,
  meta: AuditMeta,
): Promise<AdminProductRow> {
  if (input.categoryId) {
    const cat = await prisma.productCategory.findUnique({ where: { id: input.categoryId } })
    if (!cat) throw ApiError.badRequest('دسته‌بندی انتخاب‌شده وجود ندارد')
  }
  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        categoryId: input.categoryId ?? null,
        kind: input.kind,
        weightGrams: input.weightGrams,
        premiumToman: input.premiumToman,
        stock: input.stock,
        active: input.active,
        sortOrder: input.sortOrder,
        imageUrl: input.imageUrl ?? null,
      },
      select: productSelect,
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'product.create',
        entityType: 'product',
        entityId: product.id,
        after: { sku: input.sku, name: input.name, kind: input.kind, stock: input.stock },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return product
  })
  return serializeProduct(created)
}

export async function updateAdminProduct(
  ctx: AdminActCtx,
  id: string,
  input: z.infer<typeof adminProductSchema>,
  meta: AuditMeta,
): Promise<AdminProductRow> {
  if (input.categoryId) {
    const cat = await prisma.productCategory.findUnique({ where: { id: input.categoryId } })
    if (!cat) throw ApiError.badRequest('دسته‌بندی انتخاب‌شده وجود ندارد')
  }
  const updated = await prisma.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id }, select: productSelect })
    if (!before) throw ApiError.notFound('محصول یافت نشد')
    const product = await tx.product.update({
      where: { id },
      data: {
        sku: input.sku,
        name: input.name,
        categoryId: input.categoryId ?? null,
        kind: input.kind,
        weightGrams: input.weightGrams,
        premiumToman: input.premiumToman,
        stock: input.stock,
        active: input.active,
        sortOrder: input.sortOrder,
        imageUrl: input.imageUrl ?? null,
      },
      select: productSelect,
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'product.update',
        entityType: 'product',
        entityId: id,
        before: { sku: before.sku, name: before.name, stock: before.stock, active: before.active },
        after: { sku: input.sku, name: input.name, stock: input.stock, active: input.active },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return product
  })
  return serializeProduct(updated)
}

// ---------- Categories ----------

export async function listAdminCategories(
  input: AdminCategoryListQuery,
): Promise<{ rows: AdminCategoryRow[]; total: number }> {
  const where: Prisma.ProductCategoryWhereInput = {
    ...(input.q && {
      OR: [
        { name: { contains: input.q, mode: 'insensitive' } },
        { slug: { contains: input.q, mode: 'insensitive' } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.productCategory.count({ where }),
    prisma.productCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: input.direction }],
      skip,
      take: input.limit,
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        active: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sortOrder: r.sortOrder,
      active: r.active,
      productsCount: r._count.products,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

export async function listAdminCategoryOptions(): Promise<{ id: string; name: string }[]> {
  return prisma.productCategory.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })
}

export async function upsertAdminCategory(
  ctx: AdminActCtx,
  input: z.infer<typeof adminCategorySchema>,
  meta: AuditMeta,
  id?: string,
): Promise<{ id: string }> {
  const result = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.productCategory.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('دسته‌بندی یافت نشد')
    const row = id
      ? await tx.productCategory.update({
          where: { id },
          data: input,
        })
      : await tx.productCategory.create({ data: input })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: id ? 'category.update' : 'category.create',
        entityType: 'product_category',
        entityId: row.id,
        before: before
          ? { name: before.name, slug: before.slug, active: before.active }
          : undefined,
        after: input,
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return row
  })
  return { id: result.id }
}

// ---------- Discount Codes ----------

export async function listAdminDiscounts(
  input: AdminDiscountListQuery,
): Promise<{ rows: AdminDiscountRow[]; total: number }> {
  const where: Prisma.DiscountCodeWhereInput = {
    ...(input.appliesTo && { appliesTo: input.appliesTo }),
    ...(input.active === 'true' && { active: true }),
    ...(input.active === 'false' && { active: false }),
    ...(input.q && { code: { contains: input.q, mode: 'insensitive' } }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.discountCode.count({ where }),
    prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      type: r.type,
      value: r.value.toString(),
      maxUses: r.maxUses,
      usedCount: r.usedCount,
      minPurchase: r.minPurchase?.toString() ?? null,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      appliesTo: r.appliesTo,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

export async function getAdminDiscount(id: string): Promise<AdminDiscountRow | null> {
  const r = await prisma.discountCode.findUnique({ where: { id } })
  if (!r) return null
  return {
    id: r.id,
    code: r.code,
    type: r.type,
    value: r.value.toString(),
    maxUses: r.maxUses,
    usedCount: r.usedCount,
    minPurchase: r.minPurchase?.toString() ?? null,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    appliesTo: r.appliesTo,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
  }
}

export async function upsertAdminDiscount(
  ctx: AdminActCtx,
  input: z.infer<typeof adminDiscountSchema>,
  meta: AuditMeta,
  id?: string,
): Promise<{ id: string }> {
  const data = {
    code: input.code,
    type: input.type,
    value: input.value,
    maxUses: input.maxUses ?? null,
    minPurchase: input.minPurchase ?? null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    appliesTo: input.appliesTo,
    active: input.active,
  }
  const result = await prisma.$transaction(async (tx) => {
    const before = id ? await tx.discountCode.findUnique({ where: { id } }) : null
    if (id && !before) throw ApiError.notFound('کد تخفیف یافت نشد')
    const row = id
      ? await tx.discountCode.update({ where: { id }, data })
      : await tx.discountCode.create({ data })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: id ? 'discount.update' : 'discount.create',
        entityType: 'discount_code',
        entityId: row.id,
        before: before
          ? {
              code: before.code,
              type: before.type,
              value: before.value.toString(),
              active: before.active,
            }
          : undefined,
        after: { ...data, value: data.value.toString(), minPurchase: data.minPurchase?.toString() },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
    return row
  })
  return { id: result.id }
}

// ---------- Coin Holdings (read-only) ----------

export async function listAdminCoinHoldings(
  input: AdminCoinHoldingListQuery,
): Promise<{ rows: AdminCoinHoldingRow[]; total: number }> {
  const where: Prisma.CoinHoldingWhereInput = {
    ...(input.productId && { productId: input.productId }),
    ...(input.from || input.to
      ? {
          updatedAt: {
            ...(input.from && { gte: parseAdminDateBoundary(input.from, false) }),
            ...(input.to && { lte: parseAdminDateBoundary(input.to, true) }),
          },
        }
      : {}),
    ...(input.q && {
      OR: [
        { user: { mobile: { contains: input.q } } },
        { user: { firstName: { contains: input.q, mode: 'insensitive' } } },
        { user: { lastName: { contains: input.q, mode: 'insensitive' } } },
        { product: { name: { contains: input.q, mode: 'insensitive' } } },
        { product: { code: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.coinHolding.count({ where }),
    prisma.coinHolding.findMany({
      where,
      orderBy: { updatedAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        quantity: true,
        journalEntryId: true,
        createdAt: true,
        updatedAt: true,
        product: { select: { id: true, code: true, name: true, kind: true, weightGrams: true } },
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id,
      quantity: r.quantity,
      journalEntryId: r.journalEntryId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      product: { ...r.product, weightGrams: r.product.weightGrams.toString() },
      user: serializeUser(r.user),
    })),
  }
}

export async function listAdminCoinProductOptions(): Promise<
  { id: string; name: string; code: string }[]
> {
  return prisma.coinProduct.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, code: true },
  })
}
