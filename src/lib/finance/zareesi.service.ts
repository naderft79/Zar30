// ============================================
// Zar30 - Zareesi Card Service (کارت زرسی) v2
// ============================================
// کارت فیزیکی اعتباری که با موجودی طلایی کیف پول خرید انجام می‌دهد
// صدور: کارمزد گرمی از کیف پول GOLD کاربر کسر می‌شود (ledger تراکنشی)
//   - کارمزد صدور: از PlatformSetting zareesi.config.feeGold (پیش‌فرض 0.05 گرم)
//   - ارسال پستی: کارمزد تومانی zareesi.config.feePost (پیش‌فرض 0)
//   - تحویل حضوری: بدون کارمزد ارسال
// چرخه: PENDING → (ادمین) PRODUCTION → SHIPPED → ACTIVE / REJECTED
// REJECTED → کارمزد گرمی و تومانی کامل برگشت می‌خورد
// ============================================

import { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { toAuditData } from '@/lib/audit/audit'
import { Decimal } from './money'
import { postJournal } from './ledger.service'
import { ensureAssetAccount } from './wallet.service'
import { notifyFinancial } from './notify'
import { formatGoldAmount } from '@/lib/utils/format'

type Tx = Prisma.TransactionClient

// ---------- پیکربندی (PlatformSetting) ----------

export interface ZareesiConfig {
  /** کارمزد صدور به گرم طلا */
  feeGold: string
  /** کارمزد ارسال پستی به تومان */
  feePost: bigint
  /** حداکثر تعداد کارت فعال همزمان برای هر کاربر */
  maxActiveCards: number
}

const ZAREESI_CONFIG_KEY = 'zareesi.config'

const DEFAULT_ZAREESI_CONFIG: ZareesiConfig = {
  feeGold: '0.05',
  feePost: 0n,
  maxActiveCards: 3,
}

export async function getZareesiConfig(tx: Tx | typeof prisma = prisma): Promise<ZareesiConfig> {
  const row = await tx.platformSetting.findUnique({ where: { key: ZAREESI_CONFIG_KEY } })
  if (!row) return DEFAULT_ZAREESI_CONFIG
  const v = row.value as Partial<Record<keyof ZareesiConfig, unknown>>
  return {
    feeGold: String(v.feeGold ?? DEFAULT_ZAREESI_CONFIG.feeGold),
    feePost: BigInt(String(v.feePost ?? '0')),
    maxActiveCards: Number(v.maxActiveCards ?? DEFAULT_ZAREESI_CONFIG.maxActiveCards),
  }
}

export async function setZareesiConfig(
  adminId: string,
  config: ZareesiConfig,
): Promise<ZareesiConfig> {
  const value = {
    feeGold: config.feeGold,
    feePost: config.feePost.toString(),
    maxActiveCards: config.maxActiveCards,
  }
  const row = await prisma.platformSetting.upsert({
    where: { key: ZAREESI_CONFIG_KEY },
    create: { key: ZAREESI_CONFIG_KEY, value },
    update: { value },
  })
  await prisma.auditLog.create({
    data: toAuditData({
      actorType: 'admin',
      actorId: adminId,
      action: 'zareesi.config.update',
      entityType: 'PlatformSetting',
      entityId: ZAREESI_CONFIG_KEY,
      after: value,
    }),
  })
  const saved = row.value as Partial<Record<keyof ZareesiConfig, unknown>>
  return {
    feeGold: String(saved.feeGold ?? config.feeGold),
    feePost: BigInt(String(saved.feePost ?? config.feePost)),
    maxActiveCards: Number(saved.maxActiveCards ?? config.maxActiveCards),
  }
}

// ---------- شماره کارت ----------

// ZRC-XXXX-XXXX — الفبای بدون ابهام (بدون 0/O و 1/I)
const CARD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCardNumber(): string {
  const seg = (n: number) =>
    Array.from(
      { length: n },
      () => CARD_ALPHABET[Math.floor(Math.random() * CARD_ALPHABET.length)],
    ).join('')
  return `ZRC-${seg(4)}-${seg(4)}`
}

// ---------- DTO serializer — BigInt/Decimal → string (JSON-safe) ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = Record<string, any>

function serializeCard<T extends AnyCard>(card: T): T {
  return {
    ...card,
    feeGold: card.feeGold != null ? String(card.feeGold) : card.feeGold,
    feeToman: card.feeToman != null ? String(card.feeToman) : card.feeToman,
  }
}

// ---------- سفارش کارت ----------

export interface OrderZareesiCardInput {
  color: 'GOLD' | 'NAVY' | 'CREAM'
  holderName: string
  shippingMethod: 'POST' | 'PICKUP'
  deliveryAddressId?: string
}

export async function orderZareesiCard(userId: string, input: OrderZareesiCardInput) {
  const config = await getZareesiConfig()
  const feeGold = new Decimal(config.feeGold)
  if (feeGold.lte(0)) throw ApiError.internal('کارمزد صدور کارت پیکربندی نشده است')

  if (input.shippingMethod === 'POST') {
    if (!input.deliveryAddressId)
      throw ApiError.badRequest('برای ارسال پستی انتخاب آدرس الزامی است')
    const address = await prisma.address.findFirst({
      where: { id: input.deliveryAddressId, userId },
    })
    if (!address) throw ApiError.badRequest('آدرس انتخاب‌شده متعلق به شما نیست')
  }

  // سقف کارت‌های فعال — شامل درخواست‌های در جریان
  const activeCount = await prisma.zareesiCard.count({
    where: { userId, status: { in: ['PENDING', 'APPROVED', 'PRODUCTION', 'SHIPPED', 'ACTIVE'] } },
  })
  if (activeCount >= config.maxActiveCards) {
    throw ApiError.badRequest(
      `حداکثر ${formatGoldAmount(String(config.maxActiveCards))} کارت فعال همزمان می‌توانید داشته باشید`,
    )
  }

  const card = await prisma.$transaction(async (tx) => {
    const gold = await ensureAssetAccount(tx, userId, 'GOLD')

    // کسر کارمزد صدور گرمی — سند ممیزی جدا
    const feeJournal = await postJournal(tx, {
      referenceType: 'ZAREESI_FEE',
      referenceId: userId,
      description: `Zareesi card issuance fee — ${feeGold.toString()}g`,
      legs: [
        {
          account: 'ASSET_GOLD',
          side: 'CREDIT',
          amountGold: feeGold.toString(),
          assetAccountId: gold.id,
        },
        { account: 'LIABILITY_GOLD_INVENTORY', side: 'DEBIT', amountGold: feeGold.toString() },
        { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: 1n },
        { account: 'REVENUE_FEE', side: 'CREDIT', amountToman: 1n },
      ],
    })

    // کسر کارمزد پست تومانی
    let feePostJournalId: string | null = null
    if (input.shippingMethod === 'POST' && config.feePost > 0n) {
      const toman = await ensureAssetAccount(tx, userId, 'TOMAN')
      const j = await postJournal(tx, {
        referenceType: 'ZAREESI_SHIPPING',
        referenceId: userId,
        description: `Zareesi card shipping fee — ${config.feePost.toString()} TOMAN`,
        legs: [
          {
            account: 'ASSET_TOMAN',
            side: 'CREDIT',
            amountToman: config.feePost,
            assetAccountId: toman.id,
          },
          { account: 'LIABILITY_USER_TOMAN', side: 'DEBIT', amountToman: config.feePost },
          { account: 'ASSET_PLATFORM_TOMAN', side: 'DEBIT', amountToman: config.feePost },
          { account: 'REVENUE_FEE', side: 'CREDIT', amountToman: config.feePost },
        ],
      })
      feePostJournalId = j.id
    }

    const created = await tx.zareesiCard.create({
      data: {
        userId,
        color: input.color,
        status: 'PENDING',
        cardNumber: generateCardNumber(),
        holderName: input.holderName,
        deliveryAddressId: input.shippingMethod === 'POST' ? input.deliveryAddressId : null,
        shippingMethod: input.shippingMethod,
        feeGold: feeGold.toString(),
        feeToman: input.shippingMethod === 'POST' ? config.feePost : 0n,
        approvedBy: null,
      },
      include: { address: true },
    })

    await tx.journalEntry.update({
      where: { id: feeJournal.id },
      data: { referenceId: created.id },
    })
    if (feePostJournalId) {
      await tx.journalEntry.update({
        where: { id: feePostJournalId },
        data: { referenceId: created.id },
      })
    }

    return created
  })

  notifyFinancial(
    userId,
    'zareesi_card_ordered',
    'سفارش کارت زرسی ثبت شد',
    `درخواست کارت ${input.color === 'GOLD' ? 'طلایی' : input.color === 'NAVY' ? 'سورمه‌ای' : 'کرمی'} شما ثبت شد و پس از تایید، مراحل تولید آغاز می‌شود.`,
    { zareesiCardId: card.id },
  )

  return serializeCard(card)
}

// ---------- لیست کارت‌های کاربر ----------

export async function listZareesiCards(userId: string) {
  const cards = await prisma.zareesiCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // واکشی آدرس فقط وقتی حداقل یک کارت آدرس داشته باشد — جلوگیری از کوئری IN (NULL)
  const addressIds = [
    ...new Set(cards.map((c) => c.deliveryAddressId).filter((id): id is string => !!id)),
  ]
  const addressMap = new Map(
    addressIds.length
      ? (
          await prisma.address.findMany({
            where: { id: { in: addressIds } },
            select: { id: true, city: true, province: true, address: true },
          })
        ).map((a) => [a.id, a])
      : [],
  )

  return cards.map((c) =>
    serializeCard({
      ...c,
      address: c.deliveryAddressId ? (addressMap.get(c.deliveryAddressId) ?? null) : null,
    }),
  )
}

// ---------- برگشت کارمزد هنگام رد (ادمین) ----------

export async function rejectZareesiCard(cardId: string, adminId: string, reason: string) {
  const card = await prisma.zareesiCard.findUnique({ where: { id: cardId } })
  if (!card) throw ApiError.notFound('کارت یافت نشد')
  if (card.status !== 'PENDING' && card.status !== 'APPROVED') {
    throw ApiError.badRequest('فقط کارت‌های در انتظار یا تاییدشده قابل رد هستند')
  }

  return prisma.$transaction(async (tx) => {
    const gold = await ensureAssetAccount(tx, card.userId, 'GOLD')

    // برگشت کامل کارمزد گرمی
    await postJournal(tx, {
      referenceType: 'ZAREESI_REFUND',
      referenceId: card.id,
      description: `Zareesi card rejected refund — ${card.feeGold}g`,
      legs: [
        { account: 'ASSET_GOLD', side: 'DEBIT', amountGold: card.feeGold, assetAccountId: gold.id },
        { account: 'LIABILITY_GOLD_INVENTORY', side: 'CREDIT', amountGold: card.feeGold },
      ],
    })

    // برگشت کارمزد پست اگر پرداخت شده
    if (card.feeToman > 0n) {
      const toman = await ensureAssetAccount(tx, card.userId, 'TOMAN')
      await postJournal(tx, {
        referenceType: 'ZAREESI_REFUND',
        referenceId: card.id,
        description: `Zareesi shipping refund — ${card.feeToman.toString()} TOMAN`,
        legs: [
          {
            account: 'ASSET_TOMAN',
            side: 'DEBIT',
            amountToman: card.feeToman,
            assetAccountId: toman.id,
          },
          { account: 'ASSET_PLATFORM_TOMAN', side: 'CREDIT', amountToman: card.feeToman },
        ],
      })
    }

    const updated = await tx.zareesiCard.update({
      where: { id: card.id },
      data: { status: 'REJECTED', rejectedReason: reason },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: adminId,
        action: 'zareesi.reject',
        entityType: 'ZareesiCard',
        entityId: card.id,
        before: { status: card.status },
        after: { status: 'REJECTED', reason },
        targetUserId: card.userId,
      }),
    })

    notifyFinancial(
      card.userId,
      'zareesi_card_rejected',
      'سفارش کارت زرسی رد شد',
      `سفارش کارت زرسی شما رد شد: ${reason} — کارمزد به کیف پول شما برگشت خورد.`,
      { zareesiCardId: card.id },
    )

    return serializeCard(updated)
  })
}

// ---------- تغییر وضعیت (ادمین) ----------

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PRODUCTION', 'REJECTED'],
  PRODUCTION: ['SHIPPED'],
  SHIPPED: ['ACTIVE'],
  ACTIVE: ['BLOCKED'],
  BLOCKED: ['ACTIVE'],
}

export async function transitionZareesiCard(
  cardId: string,
  adminId: string,
  next: string,
  adminNote?: string,
) {
  const card = await prisma.zareesiCard.findUnique({ where: { id: cardId } })
  if (!card) throw ApiError.notFound('کارت یافت نشد')

  const allowed = ALLOWED_TRANSITIONS[card.status] ?? []
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(`تغییر وضعیت از ${card.status} به ${next} مجاز نیست`)
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.zareesiCard.update({
      where: { id: card.id },
      data: {
        status: next as never,
        adminNote: adminNote ?? card.adminNote,
        approvedBy: next === 'APPROVED' ? adminId : card.approvedBy,
        approvedAt: next === 'APPROVED' ? new Date() : card.approvedAt,
        activatedAt: next === 'ACTIVE' ? new Date() : card.activatedAt,
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: adminId,
        action: `zareesi.${next.toLowerCase()}`,
        entityType: 'ZareesiCard',
        entityId: card.id,
        before: { status: card.status },
        after: { status: next },
        targetUserId: card.userId,
        reason: adminNote,
      }),
    })
    return serializeCard(u)
  })

  const titles: Record<string, string> = {
    APPROVED: 'سفارش کارت زرسی تایید شد',
    PRODUCTION: 'کارت زرسی شما در حال تولید است',
    SHIPPED: 'کارت زرسی شما ارسال شد',
    ACTIVE: 'کارت زرسی شما فعال شد',
    BLOCKED: 'کارت زرسی شما مسدود شد',
  }
  if (titles[next]) {
    notifyFinancial(card.userId, `zareesi_card_${next.toLowerCase()}`, titles[next], '', {
      zareesiCardId: card.id,
    })
  }

  return updated
}

// ---------- اتصال کد رهگیری (ادمین) ----------

export async function setZareesiTracking(cardId: string, adminId: string, trackingCode: string) {
  const card = await prisma.$transaction(async (tx) => {
    const updated = await tx.zareesiCard.update({
      where: { id: cardId },
      data: { trackingCode },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: adminId,
        action: 'zareesi.tracking',
        entityType: 'ZareesiCard',
        entityId: card.id,
        after: { trackingCode },
        targetUserId: card.userId,
      }),
    })
    return updated
  })
  return serializeCard(card)
}
