// ============================================
// Zar30 - API Response Helpers
// ============================================
// Response envelope: { success: bool, data?, error?, meta? }
// ============================================

import { NextResponse } from 'next/server'
import { ApiError, errorResponse } from '@/lib/errors/api-error'
import { logger } from '@/lib/logger/logger'

interface ApiMeta {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

interface SuccessResponse<T> {
  success: true
  data: T
  meta?: ApiMeta
}

interface ErrorResponseBody {
  success: false
  error: ReturnType<typeof errorResponse>
}

export function ok<T>(data: T, meta?: ApiMeta, status = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status })
}

export function created<T>(data: T): NextResponse<SuccessResponse<T>> {
  return ok(data, undefined, 201)
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function fail(error: ApiError | Error, requestId?: string): NextResponse<ErrorResponseBody> {
  const status = error instanceof ApiError ? error.statusCode : 500

  if (status >= 500) {
    logger.error({ err: error, requestId }, 'API internal error')
  } else {
    logger.warn({ err: error, requestId }, 'API client error')
  }

  return NextResponse.json({ success: false, error: errorResponse(error) }, { status })
}

// Wrapper برای Route Handlers با error handling یکپارچه
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return fail(error instanceof Error ? error : new Error('Unknown error'))
    }
  }
}
