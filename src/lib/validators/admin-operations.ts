import { z } from 'zod'

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(80).optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
})

export const adminInstallmentQuerySchema = pagination.extend({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'DEFAULTED']).optional(),
})

export const adminInvestmentQuerySchema = pagination.extend({
  status: z.enum(['ACTIVE', 'MATURED', 'EARLY_CLOSED']).optional(),
})

export const adminReferralQuerySchema = pagination.extend({
  status: z.enum(['PENDING', 'QUALIFIED', 'REWARDED']).optional(),
})

export const adminTicketQuerySchema = pagination.extend({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ANSWERED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

export type AdminInstallmentQuery = z.infer<typeof adminInstallmentQuerySchema>
export type AdminInvestmentQuery = z.infer<typeof adminInvestmentQuerySchema>
export type AdminReferralQuery = z.infer<typeof adminReferralQuerySchema>
export type AdminTicketQuery = z.infer<typeof adminTicketQuerySchema>
