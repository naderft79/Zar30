// ============================================
// Zar30 - Referral Service
// ============================================
// جریان کامل دعوت:
//   1. ثبت‌نام با کد معرف → User.referredById (در auth.service)
//   2. ایجاد رکورد Referral(PENDING) — lazy، در اولین نیاز
//   3. اولین خرید معتبر ≥ حداقل حجم (admin: referral.min_buy_toman)
//      → PENDING → QUALIFIED
//   4. پرداخت پاداش تومانی به معرف با سند double-entry:
//        DEBIT  ASSET_PLATFORM_TOMAN   (خروج نقد پلتفرم)
//        CREDIT ASSET_TOMAN[referrer]  (اعتبار معرف)
//      → REWARDED + rewardAmount ثبت در رکورد
// محافظت‌ها: self-referral (در ثبت‌نام ممکن نیست)، یک پاداش per referral
// (referredId unique)، قفل ردیفی روی Referral، fire-and-forget از مسیر خرید
// (شکست referral هرگز سفارش را خراب نمی‌کند)
// ============================================

import prisma from '@/lib/db/prisma'
import { Decimal } from '@/lib/finance/money'
import { FinanceErrors } from '@/lib/finance/errors'
import { postJournal } from '@/lib/finance/ledger.service'
import { ensureAssetAccount } from '@/lib/finance/wallet.service'
import { notifyFinancial } from '@/lib/finance/notify'
import { getReferralMinBuyToman, getReferralRewardToman } from '@/lib/config/platform-config'

// ساخت رکورد Referral در صورت نبود — idempotent؛ بعد از ثبت‌نام با کد
export async function ensureReferralRecord(referredId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: referredId },
    select: { referredById: true },
  })
  if (!user?.referredById) return

  await prisma.referral.upsert({
    where: { referredId },
    update: {},
    create: { referrerId: user.referredById, referredId, status: 'PENDING' },
  })
}

// فراخوانی بعد از هر خرید FILLED — fire-and-forget از مسیر سفارش
// qualified شدن: مجموع خریدهای FILLED کاربر ≥ حداقل حجم (admin-configurable)
export async function qualifyReferralOnBuy(userId: string, _buyToman: bigint): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true },
    })
    if (!user?.referredById) return

    const minBuy = await getReferralMinBuyToman()

    // مجموع خریدهای موفق کاربر از ابتدا
    const agg = await prisma.order.aggregate({
      where: { userId, type: 'BUY', status: 'FILLED' },
      _sum: { total: true },
    })
    const totalBuy = agg._sum.total ?? 0n
    if (totalBuy < minBuy) return

    // قفل رکورد referral — جلوگیری از پرداخت دوباره در خریدهای همزمان
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status::text AS status FROM referrals WHERE "referred_id"::text = ${userId} FOR UPDATE
      `
      const row = locked[0]
      if (!row || row.status !== 'PENDING') return // نیست یا قبلاً qualified/rewarded

      await tx.referral.update({
        where: { id: row.id },
        data: { status: 'QUALIFIED', qualifiedAt: new Date() },
      })
    })
  } catch (err) {
    // fail-open — مشکل referral نباید مسیر خرید را خراب کند
    console.error('referral qualify failed', err)
  }
}

// پرداخت پاداش معرف — توسط ادمین (صف admin/referrals)
// QUALIFIED → REWARDED با سند متوازن — الگوی همان واریز:
//   D ASSET_TOMAN[user]      (افزایش موجودی معرف)
//   C LIABILITY_USER_TOMAN   (افزایش بدهی پلتفرم)
export async function payReferralReward(
  ctx: { adminId: string },
  referralId: string,
): Promise<{ rewardAmount: string; referrerId: string }> {
  const reward = await getReferralRewardToman()
  if (reward <= 0n) {
    throw FinanceErrors.invalidAmount('پاداش دعوت غیرفعال است (مبلغ صفر است)')
  }

  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string; status: string; referrer_id: string }[]>`
      SELECT id, status::text AS status, "referrer_id"::text AS "referrer_id"
      FROM referrals WHERE id::text = ${referralId} FOR UPDATE
    `
    const row = locked[0]
    if (!row) throw FinanceErrors.invalidState('رکورد دعوت یافت نشد')
    if (row.status === 'REWARDED') {
      throw FinanceErrors.invalidState('پاداش این دعوت قبلاً پرداخت شده است')
    }
    if (row.status !== 'QUALIFIED') {
      throw FinanceErrors.invalidState('این دعوت هنوز شرایط پاداش را احرا نکرده است')
    }

    const referrerToman = await ensureAssetAccount(tx, row.referrer_id, 'TOMAN')

    const journal = await postJournal(tx, {
      referenceType: 'REFERRAL_REWARD',
      referenceId: row.id,
      description: `Referral reward — ${reward.toString()} TOMAN`,
      legs: [
        {
          account: 'ASSET_TOMAN',
          side: 'DEBIT',
          amountToman: reward,
          assetAccountId: referrerToman.id,
        },
        {
          account: 'LIABILITY_USER_TOMAN',
          side: 'CREDIT',
          amountToman: reward,
        },
      ],
    })

    const updated = await tx.referral.update({
      where: { id: row.id },
      data: {
        status: 'REWARDED',
        rewardAmount: new Decimal(reward.toString()),
        rewardType: 'TOMAN',
      },
    })

    await tx.auditLog.create({
      data: {
        actorType: 'admin',
        actorId: ctx.adminId,
        action: 'referral.reward',
        entityType: 'referral',
        entityId: row.id,
        targetUserId: row.referrer_id,
        after: { rewardAmount: reward.toString(), journalId: journal.id },
      },
    })

    return { referral: updated, referrerId: row.referrer_id, reward }
  })

  notifyFinancial(result.referrerId, 'referral_rewarded', 'پاداش دعوت شما پرداخت شد', '', {
    referralId,
    amount: result.reward.toString(),
  })

  return { rewardAmount: result.reward.toString(), referrerId: result.referrerId }
}

// آمار دعوت کاربر — برای صفحه referral پنل کاربری
export async function getReferralStats(userId: string) {
  const [referrer, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: { firstName: true, lastName: true, mobile: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const rewarded = referrals.filter((r) => r.status === 'REWARDED')
  const totalReward = rewarded.reduce(
    (acc, r) => acc.add(r.rewardAmount ?? new Decimal(0)),
    new Decimal(0),
  )

  return {
    referralCode: referrer?.referralCode ?? '',
    total: referrals.length,
    qualified: referrals.filter((r) => r.status === 'QUALIFIED').length,
    rewarded: rewarded.length,
    totalReward: totalReward.toString(),
    items: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      qualifiedAt: r.qualifiedAt,
      rewardAmount: r.rewardAmount?.toString() ?? null,
      referred: {
        name:
          [r.referred.firstName, r.referred.lastName].filter(Boolean).join(' ') ||
          r.referred.mobile,
        joinedAt: r.referred.createdAt,
      },
    })),
  }
}

// صف ادمین — ارجاع به admin-operations.service برای list؛ اینجا فقط reward
export async function listPendingRewards() {
  const rows = await prisma.referral.findMany({
    where: { status: 'QUALIFIED' },
    include: {
      referrer: { select: { id: true, mobile: true, firstName: true, lastName: true } },
      referred: { select: { id: true, mobile: true } },
    },
    orderBy: { qualifiedAt: 'asc' },
  })
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    qualifiedAt: r.qualifiedAt,
    referrer: {
      id: r.referrer.id,
      mobile: r.referrer.mobile,
      name:
        [r.referrer.firstName, r.referrer.lastName].filter(Boolean).join(' ') || r.referrer.mobile,
    },
    referredId: r.referred.id,
  }))
}
