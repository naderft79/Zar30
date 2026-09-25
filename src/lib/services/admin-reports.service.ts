// ============================================
// Zar30 - Admin Reports & Ledger Service (Phase 4)
// ============================================
// خروجی CSV گزارش‌ها (orders/transactions/withdrawals/users/transfers/payments)
// + تاریخچه خروجی‌ها + دفتر کل (اسناد و مانده حساب‌ها)
// ============================================

import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { toAuditData } from '@/lib/audit/audit'
import { parseAdminDateBoundary } from '@/lib/utils/admin-time'
import { Decimal } from '@/lib/finance/money'
import type { AdminJournalQuery } from '@/lib/validators/admin-risk'
import type { adminExportSchema } from '@/lib/validators/admin-risk'
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

const MAX_EXPORT_ROWS = 5000

// ---------- CSV helpers ----------

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  // BOM برای نمایش درست فارسی در Excel
  const lines = [headers.map(csvEscape).join(',')]
  for (const r of rows) lines.push(r.map(csvEscape).join(','))
  return '﻿' + lines.join('\r\n')
}

function dateRange(from?: string, to?: string) {
  return {
    ...(from && { gte: parseAdminDateBoundary(from, false) }),
    ...(to && { lte: parseAdminDateBoundary(to, true) }),
  }
}

// ---------- CSV Export ----------

export async function generateAdminExport(
  ctx: AdminActCtx,
  input: z.infer<typeof adminExportSchema>,
  meta: AuditMeta,
): Promise<{ filename: string; csv: string; rowCount: number }> {
  const range = dateRange(input.from, input.to)
  let headers: string[] = []
  let rows: (string | number | null)[][] = []

  switch (input.kind) {
    case 'orders': {
      const data = await prisma.order.findMany({
        where: { createdAt: range },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        include: { user: { select: { mobile: true } } },
      })
      headers = [
        'شناسه',
        'کاربر',
        'نوع',
        'مبلغ تومان',
        'کارمزد',
        'مجموع',
        'گرم طلا',
        'وضعیت',
        'زمان',
      ]
      rows = data.map((o) => [
        o.id,
        o.user.mobile,
        o.type,
        o.tomanAmount.toString(),
        o.fee.toString(),
        o.total.toString(),
        o.goldAmount.toString(),
        o.status,
        o.createdAt.toISOString(),
      ])
      break
    }
    case 'transactions': {
      const data = await prisma.transaction.findMany({
        where: { createdAt: range },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        include: { user: { select: { mobile: true } } },
      })
      headers = ['شناسه', 'کاربر', 'نوع', 'مبلغ', 'وضعیت', 'مرجع درگاه', 'زمان']
      rows = data.map((t) => [
        t.id,
        t.user.mobile,
        t.type,
        t.amount.toString(),
        t.status,
        t.gatewayRef ?? '',
        t.createdAt.toISOString(),
      ])
      break
    }
    case 'withdrawals': {
      const data = await prisma.withdrawalRequest.findMany({
        where: { createdAt: range },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        include: { user: { select: { mobile: true } } },
      })
      headers = ['شناسه', 'کاربر', 'مبلغ', 'شبا', 'وضعیت', 'زمان']
      rows = data.map((w) => [
        w.id,
        w.user.mobile,
        w.amount.toString(),
        w.iban,
        w.status,
        w.createdAt.toISOString(),
      ])
      break
    }
    case 'users': {
      const data = await prisma.user.findMany({
        where: { createdAt: range },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
      })
      headers = ['شناسه', 'موبایل', 'نام', 'نام خانوادگی', 'سطح KYC', 'وضعیت', 'عضویت']
      rows = data.map((u) => [
        u.id,
        u.mobile,
        u.firstName ?? '',
        u.lastName ?? '',
        u.kycLevel,
        u.status,
        u.createdAt.toISOString(),
      ])
      break
    }
    case 'transfers': {
      const data = await prisma.internalTransfer.findMany({
        where: { createdAt: range },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        include: {
          sender: { select: { mobile: true } },
          recipient: { select: { mobile: true } },
        },
      })
      headers = ['شناسه', 'فرستنده', 'گیرنده', 'نوع', 'تومان', 'گرم', 'پرچم', 'زمان']
      rows = data.map((t) => [
        t.id,
        t.sender.mobile,
        t.recipient.mobile,
        t.kind,
        t.tomanAmount?.toString() ?? '',
        t.goldAmount?.toString() ?? '',
        t.flaggedAt ? 'بله' : '',
        t.createdAt.toISOString(),
      ])
      break
    }
    case 'payments': {
      const data = await prisma.payment.findMany({
        where: { createdAt: range },
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        include: { user: { select: { mobile: true } } },
      })
      headers = ['شناسه', 'کاربر', 'مبلغ', 'وضعیت', 'refId', 'خطا', 'زمان']
      rows = data.map((p) => [
        p.id,
        p.user.mobile,
        p.amount.toString(),
        p.status,
        p.refId ?? '',
        p.failureReason ?? '',
        p.createdAt.toISOString(),
      ])
      break
    }
  }

  const csv = toCsv(headers, rows)
  const filename = `zar30-${input.kind}-${new Date().toISOString().slice(0, 10)}.csv`

  // ثبت در تاریخچه خروجی‌ها + audit
  await prisma.$transaction(async (tx) => {
    await tx.exportRecord.create({
      data: {
        adminId: ctx.adminId,
        kind: input.kind,
        params: { from: input.from ?? null, to: input.to ?? null },
        rowCount: rows.length,
      },
    })
    await tx.auditLog.create({
      data: toAuditData({
        actorType: 'admin',
        actorId: ctx.adminId,
        actorRole: ctx.adminRole,
        action: 'export.create',
        entityType: 'export_record',
        after: { kind: input.kind, rows: rows.length },
        ip: meta.ip,
        userAgent: meta.userAgent,
        requestId: meta.requestId,
      }),
    })
  })

  return { filename, csv, rowCount: rows.length }
}

// ---------- Export History ----------

export interface AdminExportRow {
  id: string
  kind: string
  rowCount: number
  createdAt: string
  admin: { id: string; name: string }
}

export async function listAdminExports(page: number, limit: number) {
  const skip = (page - 1) * limit
  const [total, rows] = await prisma.$transaction([
    prisma.exportRecord.count(),
    prisma.exportRecord.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        admin: {
          select: { id: true, user: { select: { firstName: true, lastName: true, mobile: true } } },
        },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((r) => {
      const params = (r.params ?? {}) as { from?: string; to?: string }
      return {
        id: r.id,
        kind: r.kind,
        rowCount: r.rowCount,
        createdAt: r.createdAt.toISOString(),
        from: params.from ?? null,
        to: params.to ?? null,
        admin: {
          id: r.admin.id,
          name:
            [r.admin.user.firstName, r.admin.user.lastName].filter(Boolean).join(' ') ||
            r.admin.user.mobile,
        },
      }
    }),
  }
}

// ---------- Ledger (Journal) ----------

export interface AdminJournalRow {
  id: string
  referenceType: string | null
  referenceId: string | null
  description: string | null
  status: string
  reversalOf: string | null
  createdAt: string
  legs: {
    accountCode: string
    entryType: string
    amountToman: string | null
    amountGold: string | null
  }[]
}

export async function listAdminJournalEntries(
  input: AdminJournalQuery,
): Promise<{ rows: AdminJournalRow[]; total: number }> {
  const where: Prisma.JournalEntryWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.q && {
      OR: [
        { referenceId: { contains: input.q } },
        { description: { contains: input.q, mode: 'insensitive' } },
        { referenceType: { contains: input.q, mode: 'insensitive' } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.journalEntry.count({ where }),
    prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      include: {
        ledgerEntries: {
          include: { ledgerAccount: { select: { code: true } } },
        },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((j) => ({
      id: j.id,
      referenceType: j.referenceType,
      referenceId: j.referenceId,
      description: j.description,
      status: j.status,
      reversalOf: j.reversalOf,
      createdAt: j.createdAt.toISOString(),
      legs: j.ledgerEntries.map((e) => ({
        accountCode: e.ledgerAccount.code,
        entryType: e.entryType,
        amountToman: e.amountToman?.toString() ?? null,
        amountGold: e.amountGold?.toString() ?? null,
      })),
    })),
  }
}

export interface AdminLedgerAccountRow {
  code: string
  name: string
  type: string
  assetType: string | null
  netToman: string
  netGold: string
  entriesCount: number
}

// مانده هر حساب دفتر کل = Σ(DEBIT − CREDIT)
export async function listAdminLedgerAccounts(): Promise<AdminLedgerAccountRow[]> {
  const accounts = await prisma.ledgerAccount.findMany({ orderBy: { code: 'asc' } })
  const sums = await prisma.ledgerEntry.groupBy({
    by: ['ledgerAccountId', 'entryType'],
    orderBy: { ledgerAccountId: 'asc' },
    _sum: { amountToman: true, amountGold: true },
    _count: { _all: true },
  })

  const byAccount = new Map<string, { toman: Decimal; gold: Decimal; count: number }>()
  for (const s of sums) {
    const acc = byAccount.get(s.ledgerAccountId) ?? {
      toman: new Decimal(0),
      gold: new Decimal(0),
      count: 0,
    }
    const sign = s.entryType === 'DEBIT' ? 1 : -1
    acc.toman = acc.toman.add(new Decimal((s._sum.amountToman ?? 0n).toString()).mul(sign))
    acc.gold = acc.gold.add(new Decimal(s._sum.amountGold ?? 0).mul(sign))
    acc.count += typeof s._count === 'object' ? (s._count._all ?? 0) : 0
    byAccount.set(s.ledgerAccountId, acc)
  }

  return accounts.map((a) => {
    const s = byAccount.get(a.id)
    return {
      code: a.code,
      name: a.name,
      type: a.type,
      assetType: a.assetType,
      netToman: s ? s.toman.toString() : '0',
      netGold: s ? s.gold.toString() : '0',
      entriesCount: s?.count ?? 0,
    }
  })
}
