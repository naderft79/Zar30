// ============================================
// Zar30 - Bank Account Service (Assets v2)
// ============================================
// کارت‌های بانکی کاربر — شبا با checksum واقعی (مد-۹۷) اعتبارسنجی شده
// نام بانک فقط سمت سرور از کد شبا تشخیص داده می‌شود (ورودی کاربر پذیرفته نیست)
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { detectBank } from '@/lib/banks'

const MAX_CARDS = 5

export async function listBankAccounts(userId: string) {
  const items = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
  return items.map((a) => ({
    id: a.id,
    bankCode: a.bankCode,
    bankName: a.bankName,
    iban: a.iban,
    cardPan: a.cardPan,
    alias: a.alias,
    isDefault: a.isDefault,
    createdAt: a.createdAt,
  }))
}

export async function createBankAccount(
  userId: string,
  input: { iban: string; cardPan?: string; alias?: string },
) {
  const count = await prisma.bankAccount.count({ where: { userId } })
  if (count >= MAX_CARDS) {
    throw ApiError.badRequest(`حداکثر ${MAX_CARDS} حساب بانکی قابل ثبت است`)
  }

  const existing = await prisma.bankAccount.findUnique({
    where: { userId_iban: { userId, iban: input.iban } },
  })
  if (existing) throw ApiError.conflict('این شبا قبلاً ثبت شده است')

  const bank = detectBank(input.iban)
  const account = await prisma.bankAccount.create({
    data: {
      userId,
      bankCode: bank.code,
      bankName: bank.name,
      iban: input.iban,
      cardPan: input.cardPan,
      alias: input.alias?.trim() || null,
      isDefault: count === 0, // اولین کارت = پیش‌فرض
    },
  })
  return { id: account.id, bankName: account.bankName, iban: account.iban }
}

export async function deleteBankAccount(userId: string, id: string) {
  const account = await prisma.bankAccount.findFirst({ where: { id, userId } })
  if (!account) throw ApiError.notFound('حساب بانکی یافت نشد')

  await prisma.$transaction(async (tx) => {
    await tx.bankAccount.delete({ where: { id: account.id } })
    // اگر کارت پیش‌فرض حذف شد، قدیمی‌ترین کارت پیش‌فرض شود
    if (account.isDefault) {
      const oldest = await tx.bankAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
      if (oldest) {
        await tx.bankAccount.update({ where: { id: oldest.id }, data: { isDefault: true } })
      }
    }
  })
}

export async function setDefaultBankAccount(userId: string, id: string) {
  const account = await prisma.bankAccount.findFirst({ where: { id, userId } })
  if (!account) throw ApiError.notFound('حساب بانکی یافت نشد')

  await prisma.$transaction([
    prisma.bankAccount.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.bankAccount.update({ where: { id: account.id }, data: { isDefault: true } }),
  ])
}

/** شبای یک کارت متعلق به کاربر — برای برداشت بدون ورود دستی */
export async function getOwnedIban(userId: string, bankAccountId: string): Promise<string> {
  const account = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, userId },
    select: { iban: true },
  })
  if (!account) throw ApiError.badRequest('حساب بانکی انتخاب‌شده متعلق به شما نیست')
  return account.iban
}
