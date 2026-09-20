import { describe, expect, it } from 'vitest'
import prisma from '@/lib/db/prisma'
import { redis } from '@/lib/redis/client'
import { register, verifyRegisterOtp } from '@/lib/services/auth.service'
import {
  listAdminInstallments,
  listAdminInvestments,
  listAdminReferrals,
  listAdminTickets,
} from '@/lib/services/admin-operations.service'

const meta = { ip: '127.0.0.1', userAgent: 'vitest-admin-operations' }
function mobile() {
  return `0915${String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0')}`
}
async function user() {
  const value = mobile()
  await register({ mobile: value, password: 'Test@1234' }, meta)
  const code = await redis.get(`devotp:${value}`)
  await verifyRegisterOtp(value, code!, meta)
  return prisma.user.findUniqueOrThrow({ where: { mobile: value } })
}

describe('Admin product and support operations', () => {
  it('returns real installment, investment, referral and ticket rows with exact values', async () => {
    const first = await user()
    const second = await user()
    const installmentPlan = await prisma.installmentPlan.create({
      data: {
        name: `TEST-I-${first.id}`,
        months: 12,
        downPaymentPercent: '20',
        interestRate: '10',
        fee: '2',
        minAmount: 1n,
        maxAmount: 1000000n,
      },
    })
    const contract = await prisma.installmentContract.create({
      data: {
        userId: first.id,
        planId: installmentPlan.id,
        principal: 9007199254740993n,
        downPayment: 100n,
        totalPayable: 9007199254741993n,
        method: 'INTERNAL_CREDIT',
      },
    })
    const investmentPlan = await prisma.investmentPlan.create({
      data: {
        name: `TEST-V-${first.id}`,
        durationDays: 30,
        minGoldGram: '0.1',
        interestRateType: 'FIXED',
        rate: '1.25',
      },
    })
    const position = await prisma.investmentPosition.create({
      data: {
        userId: first.id,
        planId: investmentPlan.id,
        goldAmount: '1.23456789',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      },
    })
    const referral = await prisma.referral.create({
      data: { referrerId: first.id, referredId: second.id },
    })
    const ticket = await prisma.ticket.create({
      data: {
        userId: first.id,
        subject: `TEST-S-${first.id}`,
        category: 'technical',
        priority: 'URGENT',
      },
    })

    const installments = await listAdminInstallments({
      page: 1,
      limit: 20,
      q: first.mobile,
      direction: 'desc',
    })
    expect(installments.rows.find((row) => row.id === contract.id)?.principal).toBe(
      '9007199254740993',
    )

    const investments = await listAdminInvestments({
      page: 1,
      limit: 20,
      q: first.mobile,
      direction: 'desc',
    })
    expect(investments.rows.find((row) => row.id === position.id)?.goldAmount).toBe('1.23456789')

    const referrals = await listAdminReferrals({
      page: 1,
      limit: 20,
      q: first.mobile,
      direction: 'desc',
    })
    expect(
      referrals.rows.some((row) => row.id === referral.id && row.referred.id === second.id),
    ).toBe(true)

    const tickets = await listAdminTickets({
      page: 1,
      limit: 20,
      q: ticket.subject,
      direction: 'desc',
    })
    expect(tickets.rows.find((row) => row.id === ticket.id)?.priority).toBe('URGENT')
  })
})
