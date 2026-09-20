import type { Prisma } from '@/generated/prisma'
import prisma from '@/lib/db/prisma'
import type {
  AdminInstallmentQuery,
  AdminInvestmentQuery,
  AdminReferralQuery,
  AdminTicketQuery,
} from '@/lib/validators/admin-operations'

export interface AdminInstallmentRow {
  id: string
  status: string
  method: string
  principal: string
  totalPayable: string
  downPayment: string
  createdAt: string
  user: { id: string; mobile: string; name: string }
  plan: { id: string; name: string; months: number }
  paymentsCount: number
}

export interface AdminInvestmentRow {
  id: string
  status: string
  goldAmount: string
  startDate: string
  endDate: string
  createdAt: string
  user: { id: string; mobile: string; name: string }
  plan: { id: string; name: string; durationDays: number; rate: string }
  payoutsCount: number
}

export interface AdminReferralRow {
  id: string
  status: string
  rewardAmount: string | null
  rewardType: string | null
  qualifiedAt: string | null
  createdAt: string
  referrer: { id: string; mobile: string; name: string; referralCode: string }
  referred: { id: string; mobile: string; name: string }
}

export interface AdminTicketRow {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  department: string | null
  slaDeadline: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; mobile: string; name: string }
  assignee: { id: string; name: string } | null
  messagesCount: number
}

function nameOf(user: { firstName: string | null; lastName: string | null; mobile: string }) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.mobile
}

export async function listAdminInstallments(
  input: AdminInstallmentQuery,
): Promise<{ rows: AdminInstallmentRow[]; total: number }> {
  const where: Prisma.InstallmentContractWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
        { plan: { name: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.installmentContract.count({ where }),
    prisma.installmentContract.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: { createdAt: input.direction },
      select: {
        id: true,
        status: true,
        method: true,
        principal: true,
        totalPayable: true,
        downPayment: true,
        createdAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
        plan: { select: { id: true, name: true, months: true } },
        _count: { select: { payments: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status,
      method: row.method,
      principal: row.principal.toString(),
      totalPayable: row.totalPayable.toString(),
      downPayment: row.downPayment.toString(),
      createdAt: row.createdAt.toISOString(),
      user: { id: row.user.id, mobile: row.user.mobile, name: nameOf(row.user) },
      plan: row.plan,
      paymentsCount: row._count.payments,
    })),
  }
}

export async function listAdminInvestments(
  input: AdminInvestmentQuery,
): Promise<{ rows: AdminInvestmentRow[]; total: number }> {
  const where: Prisma.InvestmentPositionWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
        { plan: { name: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.investmentPosition.count({ where }),
    prisma.investmentPosition.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: { createdAt: input.direction },
      select: {
        id: true,
        status: true,
        goldAmount: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
        plan: { select: { id: true, name: true, durationDays: true, rate: true } },
        _count: { select: { payouts: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status,
      goldAmount: row.goldAmount.toString(),
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      user: { id: row.user.id, mobile: row.user.mobile, name: nameOf(row.user) },
      plan: { ...row.plan, rate: row.plan.rate.toString() },
      payoutsCount: row._count.payouts,
    })),
  }
}

export async function listAdminReferrals(
  input: AdminReferralQuery,
): Promise<{ rows: AdminReferralRow[]; total: number }> {
  const where: Prisma.ReferralWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { referrer: { mobile: { contains: input.q, mode: 'insensitive' } } },
        { referrer: { referralCode: { contains: input.q, mode: 'insensitive' } } },
        { referred: { mobile: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const selectUser = { id: true, mobile: true, firstName: true, lastName: true } as const
  const [total, rows] = await prisma.$transaction([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: { createdAt: input.direction },
      select: {
        id: true,
        status: true,
        rewardAmount: true,
        rewardType: true,
        qualifiedAt: true,
        createdAt: true,
        referrer: { select: { ...selectUser, referralCode: true } },
        referred: { select: selectUser },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((row) => ({
      id: row.id,
      status: row.status,
      rewardAmount: row.rewardAmount?.toString() ?? null,
      rewardType: row.rewardType,
      qualifiedAt: row.qualifiedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      referrer: {
        id: row.referrer.id,
        mobile: row.referrer.mobile,
        name: nameOf(row.referrer),
        referralCode: row.referrer.referralCode,
      },
      referred: {
        id: row.referred.id,
        mobile: row.referred.mobile,
        name: nameOf(row.referred),
      },
    })),
  }
}

export async function listAdminTickets(
  input: AdminTicketQuery,
): Promise<{ rows: AdminTicketRow[]; total: number }> {
  const where: Prisma.TicketWhereInput = {
    ...(input.status && { status: input.status }),
    ...(input.priority && { priority: input.priority }),
    ...(input.q && {
      OR: [
        { id: { contains: input.q, mode: 'insensitive' } },
        { subject: { contains: input.q, mode: 'insensitive' } },
        { user: { mobile: { contains: input.q, mode: 'insensitive' } } },
      ],
    }),
  }
  const [total, rows] = await prisma.$transaction([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      orderBy: { createdAt: input.direction },
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        department: true,
        slaDeadline: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, mobile: true, firstName: true, lastName: true } },
        assignee: {
          select: { id: true, user: { select: { mobile: true, firstName: true, lastName: true } } },
        },
        _count: { select: { messages: true } },
      },
    }),
  ])
  return {
    total,
    rows: rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      department: row.department,
      slaDeadline: row.slaDeadline?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: { id: row.user.id, mobile: row.user.mobile, name: nameOf(row.user) },
      assignee: row.assignee ? { id: row.assignee.id, name: nameOf(row.assignee.user) } : null,
      messagesCount: row._count.messages,
    })),
  }
}
