// ============================================
// Zar30 - Gold Delivery Service (Assets v2 + Admin Phase 1)
// ============================================
// درخواست تحویل فیزیکی طلا:
//   - هنگام ثبت، طلا قفل می‌شود (D ASSET_LOCKED_GOLD / C ASSET_GOLD)
//   - هزینه تحویل از PlatformSetting خوانده و به تومان کسر می‌شود
//   - REJECTED/CANCELLED → قفل آزاد و هزینه برگشت می‌خورد
//   - DELIVERED → طلا از حساب تسویه می‌شود (C ASSET_LOCKED_GOLD / D LIABILITY_GOLD_INVENTORY)
// ============================================

import { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData, type AuditEntry } from '@/lib/audit/audit'
import { Decimal } from './money'
import { postJournal } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { notifyFinancial } from './notify'
import { formatGoldAmount } from '@/lib/utils/format'

type Tx = Prisma.TransactionClient

// ---------- تنظیمات تحویل (PlatformSetting) ----------

export interface DeliveryConfig {
  feePost: bigint
  feePickup: bigint
  minGrams: string
}

const DELIVERY_CONFIG_KEY = 'delivery.config'

const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  feePost: 0n,
  feePickup: 0n,
  minGrams: '0.1',
}

// خواندن پیکربندی تحویل — در نبود رکورد مقادیر پیش‌فرض
export async function getDeliveryConfig(tx: Tx | typeof prisma = prisma): Promise<DeliveryConfig> {
  const row = await tx.platformSetting.findUnique({ where: { key: DELIVERY_CONFIG_KEY } })
  if (!row) return DEFAULT_DELIVERY_CONFIG
  const v = row.value as Partial<Record<keyof DeliveryConfig, unknown>>
  return {
    feePost: BigInt(String(v.feePost ?? '0')),
    feePickup: BigInt(String(v.feePickup ?? '0')),
    minGrams: String(v.minGrams ?? DEFAULT_DELIVERY_CONFIG.minGrams),
  }
}

// ذخیره پیکربندی — فقط از مسیر ادمین
export async function setDeliveryConfig(
  adminId: string,
  config: DeliveryConfig,
): Promise<DeliveryConfig> {
  const value = {
    feePost: config.feePost.toString(),
    feePickup: config.feePickup.toString(),
    minGrams: config.minGrams,
  }
  await prisma.platformSetting.upsert({
    where: { key: DELIVERY_CONFIG_KEY },
    update: { value, updatedBy: adminId },
    create: { key: DELIVERY_CONFIG_KEY, value, updatedBy: adminId },
  })
  return config
}

// ---------- کاربر ----------

async function lockDeliveryRow(tx: Tx, id: string) {
  const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
    SELECT id, status FROM gold_delivery_requests WHERE id::text = ${id} FOR UPDATE
  `
  return rows[0] ?? null
}

// آزادسازی قفل طلا — برگشت به موجودی آزاد
async function unlockDeliveryGold(tx: Tx, userId: string, grams: string, refId: string) {
  const gold = await ensureAssetAccount(tx, userId, 'GOLD')
  return postJournal(tx, {
    referenceType: 'DELIVERY_UNLOCK',
    referenceId: refId,
    description: `Delivery unlock — ${grams}g released`,
    legs: [
      {
        account: 'ASSET_GOLD',
        side: 'DEBIT',
        amountGold: grams,
        assetAccountId: gold.id,
      },
      {
        account: 'ASSET_LOCKED_GOLD',
        side: 'CREDIT',
        amountGold: grams,
        assetAccountId: gold.id,
      },
    ],
  })
}

// برگشت هزینه تحویل به تومان کاربر
async function refundDeliveryFee(tx: Tx, userId: string, fee: bigint, refId: string) {
  if (fee <= 0n) return null
  const toman = await ensureAssetAccount(tx, userId, 'TOMAN')
  return postJournal(tx, {
    referenceType: 'DELIVERY_FEE_REFUND',
    referenceId: refId,
    description: `Delivery fee refund — ${fee.toString()} TOMAN`,
    legs: [
      { account: 'ASSET_TOMAN', side: 'DEBIT', amountToman: fee, assetAccountId: toman.id },
      { account: 'LIABILITY_USER_TOMAN', side: 'CREDIT', amountToman: fee },
      { account: 'ASSET_PLATFORM_TOMAN', side: 'CREDIT', amountToman: fee },
      { account: 'REVENUE_DELIVERY', side: 'DEBIT', amountToman: fee },
    ],
  })
}

// ثبت درخواست — قفل طلا + کسر هزینه، همه در یک transaction
export async function createDeliveryRequest(
  userId: string,
  input: { grams: string; method: 'POST' | 'PICKUP'; addressId?: string },
) {
  const grams = new Decimal(input.grams)
  if (grams.lte(0)) throw ApiError.badRequest('مقدار طلا باید مثبت باشد')

  const config = await getDeliveryConfig()
  if (grams.lt(config.minGrams)) {
    throw ApiError.badRequest(`حداقل مقدار تحویل ${formatGoldAmount(config.minGrams)} گرم است`)
  }
  const fee = input.method === 'POST' ? config.feePost : config.feePickup

  if (input.method === 'POST') {
    if (!input.addressId) throw ApiError.badRequest('برای ارسال پستی انتخاب آدرس الزامی است')
    const address = await prisma.address.findFirst({
      where: { id: input.addressId, userId },
    })
    if (!address) throw ApiError.badRequest('آدرس انتخاب‌شده متعلق به شما نیست')
  }

  const request = await prisma.$transaction(async (tx) => {
    const gold = await ensureAssetAccount(tx, userId, 'GOLD')

    // هزینه تحویل به تومان — کسر از موجودی آزاد (سند جدا برای ردگیری ممیزی)
    let feeJournalId: string | null = null
    if (fee > 0n) {
      const toman = await ensureAssetAccount(tx, userId, 'TOMAN')
      const feeJournal = await postJournal(tx, {
        referenceType: 'DELIVERY_FEE',
        referenceId: userId,
        description: `Delivery fee — ${fee.toString()} TOMAN`,
        legs: [
          { account: 'ASSET_TOMAN', side: 'CREDIT', amountToman: fee, assetAccountId: toman.id },
          { account: 'LIABILITY_USER_TOMAN', side: 'DEBIT', amountToman: fee },
          { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: fee },
          { account: 'REVENUE_DELIVERY', side: 'CREDIT', amountToman: fee },
        ],
      })
      feeJournalId = feeJournal.id
    }

    const journal = await postJournal(tx, {
      referenceType: 'DELIVERY_LOCK',
      referenceId: userId,
      description: `Delivery lock — ${grams.toString()}g`,
      legs: [
        {
          account: 'ASSET_LOCKED_GOLD',
          side: 'DEBIT',
          amountGold: grams.toString(),
          assetAccountId: gold.id,
        },
        {
          account: 'ASSET_GOLD',
          side: 'CREDIT',
          amountGold: grams.toString(),
          assetAccountId: gold.id,
        },
      ],
    })

    const created = await tx.goldDeliveryRequest.create({
      data: {
        userId,
        grams,
        method: input.method,
        addressId: input.method === 'POST' ? input.addressId : null,
        feeToman: fee > 0n ? fee : null,
        journalEntryId: journal.id,
      },
      include: { address: true },
    })

    // پیوند اسناد به درخواست واقعی
    await tx.journalEntry.update({ where: { id: journal.id }, data: { referenceId: created.id } })
    if (feeJournalId) {
      await tx.journalEntry.update({
        where: { id: feeJournalId },
        data: { referenceId: created.id },
      })
    }

    return created
  })

  notifyFinancial(userId, 'delivery_requested', 'درخواست تحویل فیزیکی طلا ثبت شد', '', {
    deliveryRequestId: request.id,
    grams: grams.toString(),
    method: input.method,
  })

  return request
}

export async function listDeliveryRequests(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.goldDeliveryRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { address: { select: { city: true, province: true } } },
    }),
    prisma.goldDeliveryRequest.count({ where: { userId } }),
  ])
  return { items, total }
}

// لغو توسط کاربر — فقط PENDING؛ قفل آزاد و هزینه برمی‌گردد
export async function cancelDeliveryRequest(userId: string, id: string) {
  const request = await prisma.$transaction(async (tx) => {
    const locked = await lockDeliveryRow(tx, id)
    if (!locked) throw ApiError.notFound('درخواست تحویل یافت نشد')
    if (locked.status !== 'PENDING') {
      throw ApiError.badRequest('فقط درخواست‌های در انتظار بررسی قابل لغو هستند')
    }
    const req = await tx.goldDeliveryRequest.findUniqueOrThrow({ where: { id } })
    if (req.userId !== userId) throw ApiError.forbidden('این درخواست متعلق به شما نیست')

    // فقط اگر سند قفل دارد آزاد می‌شود — درخواست‌های قدیمی بدون lock هستند
    if (req.journalEntryId) {
      await unlockDeliveryGold(tx, userId, req.grams.toString(), id)
      if (req.feeToman) await refundDeliveryFee(tx, userId, req.feeToman, id)
    }

    return tx.goldDeliveryRequest.update({ where: { id }, data: { status: 'CANCELLED' } })
  })

  notifyFinancial(userId, 'delivery_cancelled', 'درخواست تحویل فیزیکی لغو شد', '', {
    deliveryRequestId: id,
  })
  return request
}

// ---------- ادمین ----------

interface AdminActCtx {
  adminId: string
  adminRole: string
}

interface AuditMeta {
  ip?: string
  userAgent?: string
  requestId?: string
}

function adminAudit(ctx: AdminActCtx, action: string, entry: Partial<AuditEntry>) {
  return toAuditData({
    actorType: 'admin',
    actorId: ctx.adminId,
    actorRole: ctx.adminRole,
    action,
    ...entry,
  } as AuditEntry)
}

async function transition(
  ctx: AdminActCtx,
  id: string,
  input: {
    from: readonly string[]
    to: string
    action: string
    note?: string
    patch?: Record<string, unknown>
    settle?: 'unlock' | 'deliver'
    refundFee?: boolean
    notify?: { type: string; title: string; body?: string }
  },
  audit: AuditMeta,
) {
  const result = await prisma.$transaction(async (tx) => {
    const locked = await lockDeliveryRow(tx, id)
    if (!locked) throw ApiError.notFound('درخواست تحویل یافت نشد')
    if (!input.from.includes(locked.status)) {
      throw ApiError.badRequest(`درخواست در وضعیت ${locked.status} قابل تغییر نیست`)
    }
    const req = await tx.goldDeliveryRequest.findUniqueOrThrow({ where: { id } })

    // فقط اگر سند قفل دارد آزاد می‌شود — درخواست‌های قدیمی بدون lock هستند
    if (input.settle === 'unlock' && req.journalEntryId) {
      await unlockDeliveryGold(tx, req.userId, req.grams.toString(), id)
    }
    if (input.refundFee && req.feeToman) {
      await refundDeliveryFee(tx, req.userId, req.feeToman, id)
    }
    if (input.settle === 'deliver') {
      const gold = await ensureAssetAccount(tx, req.userId, 'GOLD')
      // قفل دارد → از موجودی قفل‌شده تسویه؛ درخواست قدیمی بدون lock → از موجودی آزاد
      const goldAccount = req.journalEntryId ? 'ASSET_LOCKED_GOLD' : 'ASSET_GOLD'
      await postJournal(tx, {
        referenceType: 'DELIVERY_SETTLE',
        referenceId: id,
        description: `Delivery settle — ${req.grams.toString()}g delivered`,
        legs: [
          {
            account: goldAccount,
            side: 'CREDIT',
            amountGold: req.grams.toString(),
            assetAccountId: gold.id,
          },
          { account: 'LIABILITY_GOLD_INVENTORY', side: 'DEBIT', amountGold: req.grams.toString() },
        ],
      })
    }

    const updated = await tx.goldDeliveryRequest.update({
      where: { id },
      data: {
        status: input.to as Prisma.GoldDeliveryRequestUpdateInput['status'],
        processedBy: ctx.adminId,
        processedAt: new Date(),
        ...(input.note !== undefined ? { reviewNote: input.note } : {}),
        ...input.patch,
      },
    })

    await tx.auditLog.create({
      data: adminAudit(ctx, input.action, {
        entityType: 'delivery',
        entityId: id,
        targetUserId: req.userId,
        reason: input.note,
        before: { status: locked.status },
        after: { status: input.to, ...input.patch },
        ip: audit.ip,
        userAgent: audit.userAgent,
        requestId: audit.requestId,
      }),
    })

    return { id: updated.id, status: updated.status, userId: req.userId }
  })

  if (input.notify) {
    notifyFinancial(result.userId, input.notify.type, input.notify.title, input.notify.body ?? '', {
      deliveryRequestId: result.id,
    })
  }
  return { id: result.id, status: result.status }
}

// تایید درخواست — PENDING → APPROVED
export function approveDelivery(
  ctx: AdminActCtx,
  id: string,
  note: string | undefined,
  audit: AuditMeta,
) {
  return transition(
    ctx,
    id,
    {
      from: ['PENDING'],
      to: 'APPROVED',
      action: 'delivery.approve',
      note,
      notify: { type: 'delivery_approved', title: 'درخواست تحویل تایید شد' },
    },
    audit,
  )
}

// شروع آماده‌سازی — APPROVED → PREPARING
export function prepareDelivery(ctx: AdminActCtx, id: string, audit: AuditMeta) {
  return transition(
    ctx,
    id,
    {
      from: ['APPROVED'],
      to: 'PREPARING',
      action: 'delivery.prepare',
      notify: { type: 'delivery_preparing', title: 'درخواست تحویل در حال آماده‌سازی است' },
    },
    audit,
  )
}

// ارسال/زمان‌بندی تحویل — PREPARING → SHIPPED
// POST → trackingCode اجباری | PICKUP → pickupBranch + pickupAt
export function shipDelivery(
  ctx: AdminActCtx,
  id: string,
  input: { trackingCode?: string; pickupBranch?: string; pickupAt?: Date },
  audit: AuditMeta,
) {
  const patch: Record<string, unknown> = {}
  if (input.trackingCode) patch.trackingCode = input.trackingCode
  if (input.pickupBranch) patch.pickupBranch = input.pickupBranch
  if (input.pickupAt) patch.pickupAt = input.pickupAt
  return transition(
    ctx,
    id,
    {
      from: ['PREPARING'],
      to: 'SHIPPED',
      action: 'delivery.ship',
      patch,
      notify: { type: 'delivery_shipped', title: 'سفارش تحویل فیزیکی ارسال/زمان‌بندی شد' },
    },
    audit,
  )
}

// تحویل نهایی — SHIPPED → DELIVERED؛ طلا از حساب کاربر تسویه می‌شود
export function deliverDelivery(ctx: AdminActCtx, id: string, audit: AuditMeta) {
  return transition(
    ctx,
    id,
    {
      from: ['SHIPPED'],
      to: 'DELIVERED',
      action: 'delivery.deliver',
      settle: 'deliver',
      notify: { type: 'delivery_delivered', title: 'طلا تحویل داده شد' },
    },
    audit,
  )
}

// رد درخواست — PENDING|APPROVED|PREPARING → REJECTED؛ قفل آزاد + هزینه برمی‌گردد
export function rejectDelivery(ctx: AdminActCtx, id: string, reason: string, audit: AuditMeta) {
  return transition(
    ctx,
    id,
    {
      from: ['PENDING', 'APPROVED', 'PREPARING'],
      to: 'REJECTED',
      action: 'delivery.reject',
      note: reason,
      settle: 'unlock',
      refundFee: true,
      notify: { type: 'delivery_rejected', title: 'درخواست تحویل رد شد', body: reason },
    },
    audit,
  )
}
