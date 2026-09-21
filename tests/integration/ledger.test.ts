// ============================================
// Zar30 - Double-Entry Ledger Integration Test
// ============================================
// این تست روی PostgreSQL واقعی اجرا می شود
// بررسی: تراز Debit/Credit، Rollback، Idempotency
// پیش نیاز: docker compose up -d && prisma migrate deploy
// ============================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '../../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

describe('Double-Entry Ledger (Real PostgreSQL)', () => {
  let assetToman: { id: string }
  let revenueFee: { id: string }
  let equityCapital: { id: string }

  beforeAll(async () => {
    assetToman = await prisma.ledgerAccount.findUniqueOrThrow({
      where: { code: 'ASSET_TOMAN' },
      select: { id: true },
    })
    revenueFee = await prisma.ledgerAccount.findUniqueOrThrow({
      where: { code: 'REVENUE_FEE' },
      select: { id: true },
    })
    equityCapital = await prisma.ledgerAccount.findUniqueOrThrow({
      where: { code: 'EQUITY_CAPITAL' },
      select: { id: true },
    })
  })

  afterAll(async () => {
    // پاکسازی داده های تست
    await prisma.ledgerEntry.deleteMany({
      where: { journalEntry: { description: { startsWith: 'TEST_' } } },
    })
    await prisma.journalEntry.deleteMany({
      where: { description: { startsWith: 'TEST_' } },
    })
    await prisma.idempotencyRecord.deleteMany({
      where: { key: { startsWith: 'test_' } },
    })
    await prisma.$disconnect()
  })

  it('balanced journal entry commits successfully', async () => {
    const result = await prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.create({
        data: {
          description: 'TEST_balanced_entry',
          referenceType: 'TEST',
          referenceId: 'test-ref-1',
        },
      })

      // Debit: دارایی تومان +1,000,000
      await tx.ledgerEntry.create({
        data: {
          journalEntryId: journal.id,
          ledgerAccountId: assetToman.id,
          entryType: 'DEBIT',
          amountToman: 1_000_000n,
        },
      })

      // Credit: سرمایه -1,000,000
      await tx.ledgerEntry.create({
        data: {
          journalEntryId: journal.id,
          ledgerAccountId: equityCapital.id,
          entryType: 'CREDIT',
          amountToman: 1_000_000n,
        },
      })

      return journal
    })

    // بررسی تراز
    const entries = await prisma.ledgerEntry.findMany({
      where: { journalEntryId: result.id },
    })

    const debits = entries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((sum, e) => sum + (e.amountToman ?? 0n), 0n)
    const credits = entries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((sum, e) => sum + (e.amountToman ?? 0n), 0n)

    expect(debits).toBe(credits)
    expect(entries.length).toBe(2)
  })

  it('rollback discards uncommitted entries on error', async () => {
    let journalId: string | null = null

    await expect(
      prisma.$transaction(async (tx) => {
        const journal = await tx.journalEntry.create({
          data: {
            description: 'TEST_rollback_entry',
            referenceType: 'TEST',
            referenceId: 'test-ref-rollback',
          },
        })
        journalId = journal.id

        await tx.ledgerEntry.create({
          data: {
            journalEntryId: journal.id,
            ledgerAccountId: assetToman.id,
            entryType: 'DEBIT',
            amountToman: 500n,
          },
        })

        // خطای عمدی برای تست rollback
        throw new Error('Intentional rollback')
      }),
    ).rejects.toThrow('Intentional rollback')

    // بعد از rollback هیچ رکوردی نباید وجود داشته باشد
    const journal = await prisma.journalEntry.findUnique({ where: { id: journalId! } })
    const entries = await prisma.ledgerEntry.findMany({
      where: { journalEntryId: journalId! },
    })

    expect(journal).toBeNull()
    expect(entries.length).toBe(0)
  })

  it('idempotency record enforces unique key constraint', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const record = await prisma.idempotencyRecord.create({
      data: {
        key: 'test_idem_key_1',
        endpoint: '/api/v1/test',
        requestHash: 'test_hash_1',
        responseBody: { ok: true },
        expiresAt,
      },
    })

    // ایجاد رکورد با همان key باید fail شود
    await expect(
      prisma.idempotencyRecord.create({
        data: {
          key: 'test_idem_key_1',
          endpoint: '/api/v1/test',
          requestHash: 'test_hash_1',
          responseBody: { ok: true },
          expiresAt,
        },
      }),
    ).rejects.toThrow()

    expect(record.key).toBe('test_idem_key_1')
  })

  it('ledger entries require valid journal entry (FK RESTRICT)', async () => {
    await expect(
      prisma.ledgerEntry.create({
        data: {
          journalEntryId: 'nonexistent-journal-id',
          ledgerAccountId: assetToman.id,
          entryType: 'DEBIT',
          amountToman: 100n,
        },
      }),
    ).rejects.toThrow()
  })

  it('multi-entry journal: fee split stays balanced', async () => {
    // سناریو: خرید 1,000,000 تومان + 5,000 تومان کارمزد
    const result = await prisma.$transaction(async (tx) => {
      const journal = await tx.journalEntry.create({
        data: {
          description: 'TEST_fee_split',
          referenceType: 'ORDER',
          referenceId: 'test-order-1',
        },
      })

      // کاربر 1,005,000 تومان پرداخت می کند
      await tx.ledgerEntry.create({
        data: {
          journalEntryId: journal.id,
          ledgerAccountId: assetToman.id,
          entryType: 'DEBIT',
          amountToman: 1_005_000n,
        },
      })

      // 1,000,000 به سرمایه، 5,000 کارمزد
      await tx.ledgerEntry.create({
        data: {
          journalEntryId: journal.id,
          ledgerAccountId: equityCapital.id,
          entryType: 'CREDIT',
          amountToman: 1_000_000n,
        },
      })
      await tx.ledgerEntry.create({
        data: {
          journalEntryId: journal.id,
          ledgerAccountId: revenueFee.id,
          entryType: 'CREDIT',
          amountToman: 5_000n,
        },
      })

      return journal
    })

    const entries = await prisma.ledgerEntry.findMany({
      where: { journalEntryId: result.id },
    })

    const debits = entries
      .filter((e) => e.entryType === 'DEBIT')
      .reduce((s, e) => s + (e.amountToman ?? 0n), 0n)
    const credits = entries
      .filter((e) => e.entryType === 'CREDIT')
      .reduce((s, e) => s + (e.amountToman ?? 0n), 0n)

    expect(debits).toBe(credits)
    expect(debits).toBe(1_005_000n)
  })
})
