import { describe, expect, it } from 'vitest'
import {
  adminInstallmentQuerySchema,
  adminInvestmentQuerySchema,
  adminReferralQuerySchema,
  adminTicketQuerySchema,
} from '@/lib/validators/admin-operations'

describe('Admin operations validators', () => {
  it('defaults pagination safely', () => {
    expect(adminInstallmentQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 20,
      direction: 'desc',
    })
  })
  it('rejects invalid statuses and excessive limits', () => {
    expect(adminInvestmentQuerySchema.safeParse({ status: 'FAKE' }).success).toBe(false)
    expect(adminReferralQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
    expect(adminTicketQuerySchema.safeParse({ priority: 'ROOT' }).success).toBe(false)
  })
  it('accepts documented filters', () => {
    expect(adminInstallmentQuerySchema.safeParse({ status: 'ACTIVE', q: '0912' }).success).toBe(
      true,
    )
    expect(adminTicketQuerySchema.safeParse({ status: 'OPEN', priority: 'URGENT' }).success).toBe(
      true,
    )
  })
})
