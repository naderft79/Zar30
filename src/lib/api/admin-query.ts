import { z } from 'zod'
import { ApiError } from '@/lib/errors/api-error'

export function parseAdminQuery<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema,
): z.output<TSchema> {
  const values = Object.fromEntries(new URL(req.url).searchParams.entries())
  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0]?.message ?? 'پارامترهای جستجو نامعتبر هستند')
  }
  return parsed.data
}

export function paginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
}
