// ============================================
// Zar30 - Admin Finance Service (Read-Only)
// ============================================
// Explorer مالی فقط‌خواندنی — accounts/wallets/gold/orders/transactions/
// deposits/withdrawals/pricing. هیچ mutation و هیچ داده fake.
// تمام BigInt/Decimal فقط string؛ Date فقط ISO؛ هیچ محاسبه JS روی پول.
// ============================================

import type {
  AssetType,
  JournalEntryStatus,
  LedgerAccountType,
  LedgerEntryType,
  OrderStatus,
  OrderType,
  Prisma,
  TransactionStatus,
  TransactionType,
  UserStatus,
  WithdrawalStatus,
} from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { parseAdminDateBoundary } from '@/lib/utils/admin-time'
import type {
  AdminAccountListQuery,
  AdminDepositListQuery,
  AdminOrderListQuery,
  AdminPricingListQuery,
  AdminTransactionListQuery,
  AdminWalletListQuery,
  AdminWithdrawalListQuery,
} from '@/lib/validators/admin-finance'

// ---------- Types ----------

export interface AdminUserRef {
  id: string
  mobile: string
  firstName: string | null
  lastName: string | null
}

export interface AdminLedgerEntryRow {
  id: string
  entryType: LedgerEntryType
  amountGold: string | null
  amountRial: string | null
  balanceAfter: string | null
  createdAt: string
  ledgerAccount: {
    code: string
    name: string
    type: LedgerAccountType
    assetType: AssetType | null
  }
  journalEntry: {
    id: string
    referenceType: string | null
    referenceId: string | null
    description: string | null
    status: JournalEntryStatus
    createdAt: string
  }
}

export interface AdminAuditRow {
  id: string
  action: string
  actorType: string
  actorRole: string | null
  reason: string | null
  createdAt: string
}

export interface AdminAccountListRow {
  id: string
  assetType: AssetType
  balance: string
  lockedBalance: string
  createdAt: string
  updatedAt: string
  wallet: { id: string; user: AdminUserRef }
}

export interface AdminAccountDetail extends AdminAccountListRow {
  wallet: {
    id: string
    status: string
    createdAt: string
    user: AdminUserRef & { status: UserStatus }
  }
  ledgerEntries: AdminLedgerEntryRow[]
}

export interface AdminWalletListRow {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  user: AdminUserRef
  accounts: { assetType: AssetType; balance: string; lockedBalance: string }[]
}

export interface AdminWalletDetail extends AdminWalletListRow {
  transactions: AdminTransactionListRow[]
}

export interface AdminGoldHoldings {
  summary: { balance: string; lockedBalance: string; accountsCount: number }
  rows: AdminAccountListRow[]
  total: number
}

export interface AdminOrderListRow {
  id: string
  type: OrderType
  status: OrderStatus
  goldAmount: string
  rialAmount: string
  unitPrice: string
  spread: string
  fee: string
  total: string
  otpConfirmed: boolean
  priceLockExpiresAt: string | null
  journalEntryId: string | null
  createdAt: string
  user: AdminUserRef
}

export interface AdminOrderDetail extends AdminOrderListRow {
  journal: AdminJournalBlock | null
  audit: AdminAuditRow[]
}

export interface AdminJournalBlock {
  id: string
  referenceType: string | null
  referenceId: string | null
  description: string | null
  status: JournalEntryStatus
  reversalOf: string | null
  createdAt: string
  ledgerEntries: AdminLedgerEntryRow[]
}

export interface AdminTransactionListRow {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: string
  gatewayRef: string | null
  bankRef: string | null
  walletId: string
  journalEntryId: string | null
  createdAt: string
  user: AdminUserRef
}

export interface AdminTransactionDetail extends AdminTransactionListRow {
  wallet: { id: string; status: string } | null
  journal: AdminJournalBlock | null
  audit: AdminAuditRow[]
}

export interface AdminWithdrawalListRow {
  id: string
  amount: string
  ibanMasked: string
  status: WithdrawalStatus
  processedAt: string | null
  createdAt: string
  user: AdminUserRef
  processor: { id: string; firstName: string | null; lastName: string | null } | null
}

export interface AdminWithdrawalDetail extends AdminWithdrawalListRow {
  audit: AdminAuditRow[]
}

export interface AdminPriceListRow {
  id: string
  buyPrice: string
  sellPrice: string
  rawPrice: string
  spread: string
  source: string
  recordedAt: string
}

// ---------- Helpers ----------

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

// ماسک شبا — خام هرگز در return type قرار نمی‌گیرد
function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, '')
  if (clean.length < 8) return '••••'
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`
}

const userSelect = {
  id: true,
  mobile: true,
  firstName: true,
  lastName: true,
} as const

const ledgerEntrySelect = {
  id: true,
  entryType: true,
  amountGold: true,
  amountRial: true,
  balanceAfter: true,
  createdAt: true,
  ledgerAccount: {
    select: { code: true, name: true, type: true, assetType: true },
  },
  journalEntry: {
    select: {
      id: true,
      referenceType: true,
      referenceId: true,
      description: true,
      status: true,
      createdAt: true,
    },
  },
} as const

type RawLedgerEntry = {
  id: string
  entryType: LedgerEntryType
  amountGold: { toString(): string } | null
  amountRial: bigint | null
  balanceAfter: { toString(): string } | null
  createdAt: Date
  ledgerAccount: {
    code: string
    name: string
    type: LedgerAccountType
    assetType: AssetType | null
  }
  journalEntry: {
    id: string
    referenceType: string | null
    referenceId: string | null
    description: string | null
    status: JournalEntryStatus
    createdAt: Date
  }
}

function serializeLedgerEntry(e: RawLedgerEntry): AdminLedgerEntryRow {
  return {
    id: e.id,
    entryType: e.entryType,
    amountGold: e.amountGold?.toString() ?? null,
    amountRial: e.amountRial?.toString() ?? null,
    balanceAfter: e.balanceAfter?.toString() ?? null,
    createdAt: e.createdAt.toISOString(),
    ledgerAccount: e.ledgerAccount,
    journalEntry: {
      id: e.journalEntry.id,
      referenceType: e.journalEntry.referenceType,
      referenceId: e.journalEntry.referenceId,
      description: e.journalEntry.description,
      status: e.journalEntry.status,
      createdAt: e.journalEntry.createdAt.toISOString(),
    },
  }
}

type RawJournal = {
  id: string
  referenceType: string | null
  referenceId: string | null
  description: string | null
  status: JournalEntryStatus
  reversalOf: string | null
  createdAt: Date
  ledgerEntries: RawLedgerEntry[]
}

const journalSelect = {
  id: true,
  referenceType: true,
  referenceId: true,
  description: true,
  status: true,
  reversalOf: true,
  createdAt: true,
  ledgerEntries: {
    select: ledgerEntrySelect,
    orderBy: { createdAt: 'asc' as const },
  },
} as const

function serializeJournal(j: RawJournal): AdminJournalBlock {
  return {
    id: j.id,
    referenceType: j.referenceType,
    referenceId: j.referenceId,
    description: j.description,
    status: j.status,
    reversalOf: j.reversalOf,
    createdAt: j.createdAt.toISOString(),
    ledgerEntries: j.ledgerEntries.map(serializeLedgerEntry),
  }
}

const auditSelect = {
  id: true,
  action: true,
  actorType: true,
  actorRole: true,
  reason: true,
  createdAt: true,
} as const

async function auditsFor(entityType: string, entityId: string): Promise<AdminAuditRow[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: auditSelect,
  })
  return rows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))
}

// بازه createdAt — date-only به روز کامل UTC نگاشت می‌شود (admin-time contract)
function rangeFilter(from?: string, to?: string) {
  const createdAt: { gte?: Date; lte?: Date } = {}
  if (from) createdAt.gte = parseAdminDateBoundary(from, false)
  if (to) createdAt.lte = parseAdminDateBoundary(to, true)
  return Object.keys(createdAt).length ? { createdAt } : {}
}

// ---------- Accounts ----------

export async function listAdminAccounts(
  input: AdminAccountListQuery,
): Promise<{ rows: AdminAccountListRow[]; total: number }> {
  const where: Prisma.AssetAccountWhereInput = {
    ...(input.assetType && { assetType: input.assetType }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { walletId: { contains: input.q, mode: 'insensitive' } },
        { wallet: { user: { mobile: { contains: input.q, mode: 'insensitive' } } } },
        { wallet: { user: { firstName: { contains: input.q, mode: 'insensitive' } } } },
        { wallet: { user: { lastName: { contains: input.q, mode: 'insensitive' } } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.assetAccount.count({ where }),
    prisma.assetAccount.findMany({
      where,
      orderBy: { updatedAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        assetType: true,
        balance: true,
        lockedBalance: true,
        createdAt: true,
        updatedAt: true,
        wallet: { select: { id: true, user: { select: userSelect } } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((a) => ({
      id: a.id,
      assetType: a.assetType,
      balance: a.balance.toString(),
      lockedBalance: a.lockedBalance.toString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      wallet: { id: a.wallet.id, user: a.wallet.user },
    })),
  }
}

export async function getAdminAccountDetail(id: string): Promise<AdminAccountDetail> {
  const account = await prisma.assetAccount.findUnique({
    where: { id },
    select: {
      id: true,
      assetType: true,
      balance: true,
      lockedBalance: true,
      createdAt: true,
      updatedAt: true,
      wallet: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: { select: { ...userSelect, status: true } },
        },
      },
      ledgerEntries: {
        select: ledgerEntrySelect,
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })
  if (!account) throw ApiError.notFound('حساب دارایی یافت نشد')
  return {
    id: account.id,
    assetType: account.assetType,
    balance: account.balance.toString(),
    lockedBalance: account.lockedBalance.toString(),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    wallet: {
      id: account.wallet.id,
      status: account.wallet.status,
      createdAt: account.wallet.createdAt.toISOString(),
      user: account.wallet.user,
    },
    ledgerEntries: account.ledgerEntries.map(serializeLedgerEntry),
  }
}

// ---------- Wallets ----------

const walletAccountSelect = { assetType: true, balance: true, lockedBalance: true } as const

export async function listAdminWallets(
  input: AdminWalletListQuery,
): Promise<{ rows: AdminWalletListRow[]; total: number }> {
  const where: Prisma.WalletWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
        { user: { firstName: { contains: input.q, mode: 'insensitive' } } },
        { user: { lastName: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.wallet.count({ where }),
    prisma.wallet.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: userSelect },
        assetAccounts: { select: walletAccountSelect },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((w) => ({
      id: w.id,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      user: w.user,
      accounts: w.assetAccounts.map((a) => ({
        assetType: a.assetType,
        balance: a.balance.toString(),
        lockedBalance: a.lockedBalance.toString(),
      })),
    })),
  }
}

const transactionSelect = {
  id: true,
  type: true,
  status: true,
  amount: true,
  gatewayRef: true,
  bankRef: true,
  walletId: true,
  journalEntryId: true,
  createdAt: true,
  user: { select: userSelect },
} as const

type RawTransaction = {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: bigint
  gatewayRef: string | null
  bankRef: string | null
  walletId: string
  journalEntryId: string | null
  createdAt: Date
  user: AdminUserRef
}

function serializeTransaction(t: RawTransaction): AdminTransactionListRow {
  return {
    id: t.id,
    type: t.type,
    status: t.status,
    amount: t.amount.toString(),
    gatewayRef: t.gatewayRef,
    bankRef: t.bankRef,
    walletId: t.walletId,
    journalEntryId: t.journalEntryId,
    createdAt: t.createdAt.toISOString(),
    user: t.user,
  }
}

export async function getAdminWalletDetail(id: string): Promise<AdminWalletDetail> {
  const wallet = await prisma.wallet.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: { select: userSelect },
      assetAccounts: { select: walletAccountSelect },
    },
  })
  if (!wallet) throw ApiError.notFound('کیف پول یافت نشد')
  const transactions = await prisma.transaction.findMany({
    where: { walletId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: transactionSelect,
  })
  return {
    id: wallet.id,
    status: wallet.status,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
    user: wallet.user,
    accounts: wallet.assetAccounts.map((a) => ({
      assetType: a.assetType,
      balance: a.balance.toString(),
      lockedBalance: a.lockedBalance.toString(),
    })),
    transactions: transactions.map(serializeTransaction),
  }
}

// ---------- Gold Holdings ----------

export async function getAdminGoldHoldings(input: {
  page: number
  limit: number
}): Promise<AdminGoldHoldings> {
  const skip = (input.page - 1) * input.limit
  const [aggregate, total, rows] = await prisma.$transaction([
    prisma.assetAccount.aggregate({
      where: { assetType: 'GOLD' },
      _sum: { balance: true, lockedBalance: true },
      _count: true,
    }),
    prisma.assetAccount.count({ where: { assetType: 'GOLD' } }),
    prisma.assetAccount.findMany({
      where: { assetType: 'GOLD' },
      orderBy: { balance: 'desc' },
      skip,
      take: input.limit,
      select: {
        id: true,
        assetType: true,
        balance: true,
        lockedBalance: true,
        createdAt: true,
        updatedAt: true,
        wallet: { select: { id: true, user: { select: userSelect } } },
      },
    }),
  ])
  return {
    summary: {
      balance: (aggregate._sum.balance ?? 0).toString(),
      lockedBalance: (aggregate._sum.lockedBalance ?? 0).toString(),
      accountsCount: aggregate._count,
    },
    total,
    rows: rows.map((a) => ({
      id: a.id,
      assetType: a.assetType,
      balance: a.balance.toString(),
      lockedBalance: a.lockedBalance.toString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      wallet: { id: a.wallet.id, user: a.wallet.user },
    })),
  }
}

// ---------- Orders ----------

const orderSelect = {
  id: true,
  type: true,
  status: true,
  goldAmount: true,
  rialAmount: true,
  unitPrice: true,
  spread: true,
  fee: true,
  total: true,
  otpConfirmed: true,
  priceLockExpiresAt: true,
  journalEntryId: true,
  createdAt: true,
  user: { select: userSelect },
} as const

type RawOrder = {
  id: string
  type: OrderType
  status: OrderStatus
  goldAmount: { toString(): string }
  rialAmount: bigint
  unitPrice: bigint
  spread: { toString(): string }
  fee: bigint
  total: bigint
  otpConfirmed: boolean
  priceLockExpiresAt: Date | null
  journalEntryId: string | null
  createdAt: Date
  user: AdminUserRef
}

function serializeOrder(o: RawOrder): AdminOrderListRow {
  return {
    id: o.id,
    type: o.type,
    status: o.status,
    goldAmount: o.goldAmount.toString(),
    rialAmount: o.rialAmount.toString(),
    unitPrice: o.unitPrice.toString(),
    spread: o.spread.toString(),
    fee: o.fee.toString(),
    total: o.total.toString(),
    otpConfirmed: o.otpConfirmed,
    priceLockExpiresAt: iso(o.priceLockExpiresAt),
    journalEntryId: o.journalEntryId,
    createdAt: o.createdAt.toISOString(),
    user: o.user,
  }
}

export async function listAdminOrders(
  input: AdminOrderListQuery,
): Promise<{ rows: AdminOrderListRow[]; total: number }> {
  const where: Prisma.OrderWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.type && { type: input.type }),
    ...rangeFilter(input.from, input.to),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: orderSelect,
    }),
  ])
  return { total, rows: rows.map(serializeOrder) }
}

export async function getAdminOrderDetail(id: string): Promise<AdminOrderDetail> {
  const order = await prisma.order.findUnique({
    where: { id },
    select: { ...orderSelect, journalEntry: { select: journalSelect } },
  })
  if (!order) throw ApiError.notFound('سفارش یافت نشد')
  const { journalEntry, ...rest } = order
  return {
    ...serializeOrder(rest),
    journal: journalEntry ? serializeJournal(journalEntry) : null,
    audit: await auditsFor('order', id),
  }
}

// ---------- Transactions ----------

function transactionWhere(input: {
  q?: string
  status?: TransactionStatus
  type?: TransactionType
  from?: string
  to?: string
}): Prisma.TransactionWhereInput {
  return {
    ...(input.status && { status: input.status }),
    ...(input.type && { type: input.type }),
    ...rangeFilter(input.from, input.to),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
}

export async function listAdminTransactions(
  input: AdminTransactionListQuery,
): Promise<{ rows: AdminTransactionListRow[]; total: number }> {
  const where = transactionWhere(input)
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: transactionSelect,
    }),
  ])
  return { total, rows: rows.map(serializeTransaction) }
}

export async function getAdminTransactionDetail(id: string): Promise<AdminTransactionDetail> {
  const tx = await prisma.transaction.findUnique({
    where: { id },
    select: { ...transactionSelect, journalEntry: { select: journalSelect } },
  })
  if (!tx) throw ApiError.notFound('تراکنش یافت نشد')
  const wallet = await prisma.wallet.findUnique({
    where: { id: tx.walletId },
    select: { id: true, status: true },
  })
  const { journalEntry, ...rest } = tx
  return {
    ...serializeTransaction(rest),
    wallet,
    journal: journalEntry ? serializeJournal(journalEntry) : null,
    audit: await auditsFor('transaction', id),
  }
}

// ---------- Deposits — همان مدل Transaction با type=DEPOSIT ----------

export async function listAdminDeposits(
  input: AdminDepositListQuery,
): Promise<{ rows: AdminTransactionListRow[]; total: number }> {
  const where = transactionWhere({ ...input, type: 'DEPOSIT' })
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: transactionSelect,
    }),
  ])
  return { total, rows: rows.map(serializeTransaction) }
}

// ---------- Withdrawals ----------

type RawWithdrawal = {
  id: string
  amount: bigint
  iban: string
  status: WithdrawalStatus
  processedAt: Date | null
  createdAt: Date
  user: AdminUserRef
  processor: { id: string; user: { firstName: string | null; lastName: string | null } } | null
}

const withdrawalSelect = {
  id: true,
  amount: true,
  iban: true,
  status: true,
  processedAt: true,
  createdAt: true,
  user: { select: userSelect },
  processor: {
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  },
} as const

function serializeWithdrawal(w: RawWithdrawal): AdminWithdrawalListRow {
  return {
    id: w.id,
    amount: w.amount.toString(),
    ibanMasked: maskIban(w.iban),
    status: w.status,
    processedAt: iso(w.processedAt),
    createdAt: w.createdAt.toISOString(),
    user: w.user,
    processor: w.processor
      ? {
          id: w.processor.id,
          firstName: w.processor.user.firstName,
          lastName: w.processor.user.lastName,
        }
      : null,
  }
}

export async function listAdminWithdrawals(
  input: AdminWithdrawalListQuery,
): Promise<{ rows: AdminWithdrawalListRow[]; total: number }> {
  const where: Prisma.WithdrawalRequestWhereInput = {
    ...(input.status && { status: input.status }),
    ...rangeFilter(input.from, input.to),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows] = await prisma.$transaction([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: input.direction },
      skip,
      take: input.limit,
      select: withdrawalSelect,
    }),
  ])
  return { total, rows: rows.map(serializeWithdrawal) }
}

export async function getAdminWithdrawalDetail(id: string): Promise<AdminWithdrawalDetail> {
  const w = await prisma.withdrawalRequest.findUnique({
    where: { id },
    select: withdrawalSelect,
  })
  if (!w) throw ApiError.notFound('درخواست برداشت یافت نشد')
  return { ...serializeWithdrawal(w), audit: await auditsFor('withdrawal_request', id) }
}

// ---------- Pricing ----------

export async function listAdminPrices(input: AdminPricingListQuery): Promise<{
  rows: AdminPriceListRow[]
  total: number
  latest: AdminPriceListRow | null
}> {
  const where: Prisma.GoldPriceWhereInput = {
    ...(input.source && { source: { contains: input.source, mode: 'insensitive' } }),
    ...(input.from || input.to
      ? {
          recordedAt: {
            ...(input.from && { gte: parseAdminDateBoundary(input.from, false) }),
            ...(input.to && { lte: parseAdminDateBoundary(input.to, true) }),
          },
        }
      : {}),
  }
  const skip = (input.page - 1) * input.limit
  const [total, rows, latest] = await prisma.$transaction([
    prisma.goldPrice.count({ where }),
    prisma.goldPrice.findMany({
      where,
      orderBy: { recordedAt: input.direction },
      skip,
      take: input.limit,
    }),
    prisma.goldPrice.findFirst({ orderBy: { recordedAt: 'desc' } }),
  ])
  const serialize = (p: (typeof rows)[number]): AdminPriceListRow => ({
    id: p.id,
    buyPrice: p.buyPrice.toString(),
    sellPrice: p.sellPrice.toString(),
    rawPrice: p.rawPrice.toString(),
    spread: p.spread.toString(),
    source: p.source,
    recordedAt: p.recordedAt.toISOString(),
  })
  return { total, rows: rows.map(serialize), latest: latest ? serialize(latest) : null }
}
