// ============================================
// Zarnama - API Error Handling (RFC 7807)
// ============================================
// خطاهای API بر اساس Problem Details استاندارد هستند
// اطلاعات حساس هرگز به کلاینت بازگردانده نمی شود
// ============================================

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly type: string
  public readonly title: string
  public readonly detail: string
  public readonly instance?: string

  constructor(
    statusCode: number,
    title: string,
    detail?: string,
    type = 'about:blank',
    instance?: string,
  ) {
    super(detail ?? title)
    this.statusCode = statusCode
    this.type = type
    this.title = title
    this.detail = detail ?? title
    this.instance = instance
    this.name = 'ApiError'
  }

  static badRequest(detail: string, type = 'https://zarnama.ir/errors/bad-request') {
    return new ApiError(400, 'Bad Request', detail, type)
  }

  static unauthorized(detail = 'Authentication required') {
    return new ApiError(401, 'Unauthorized', detail, 'https://zarnama.ir/errors/unauthorized')
  }

  static forbidden(detail = 'Insufficient permissions') {
    return new ApiError(403, 'Forbidden', detail, 'https://zarnama.ir/errors/forbidden')
  }

  static notFound(detail = 'Resource not found') {
    return new ApiError(404, 'Not Found', detail, 'https://zarnama.ir/errors/not-found')
  }

  static conflict(detail: string) {
    return new ApiError(409, 'Conflict', detail, 'https://zarnama.ir/errors/conflict')
  }

  static unprocessableEntity(detail: string) {
    return new ApiError(422, 'Unprocessable Entity', detail, 'https://zarnama.ir/errors/validation')
  }

  static tooManyRequests(detail = 'Rate limit exceeded') {
    return new ApiError(429, 'Too Many Requests', detail, 'https://zarnama.ir/errors/rate-limit')
  }

  static internal(detail = 'Internal server error') {
    return new ApiError(500, 'Internal Server Error', detail, 'https://zarnama.ir/errors/internal')
  }
}

// فرمت پاسخ خطا مطابق RFC 7807
export function errorResponse(error: ApiError | Error) {
  if (error instanceof ApiError) {
    return {
      type: error.type,
      title: error.title,
      status: error.statusCode,
      detail: error.detail,
      instance: error.instance,
    }
  }
  // خطاهای ناشناخته — جزئیات داخلی را نشت نمی دهیم
  return {
    type: 'https://zarnama.ir/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
  }
}
