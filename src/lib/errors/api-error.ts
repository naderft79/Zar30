// ============================================
// Zar30 - API Error Handling (RFC 7807)
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

  static badRequest(detail: string, type = 'https://zar30.com/errors/bad-request') {
    return new ApiError(400, 'Bad Request', detail, type)
  }

  static unauthorized(detail = 'Authentication required') {
    return new ApiError(401, 'Unauthorized', detail, 'https://zar30.com/errors/unauthorized')
  }

  static forbidden(detail = 'Insufficient permissions') {
    return new ApiError(403, 'Forbidden', detail, 'https://zar30.com/errors/forbidden')
  }

  static notFound(detail = 'Resource not found') {
    return new ApiError(404, 'Not Found', detail, 'https://zar30.com/errors/not-found')
  }

  static conflict(detail: string) {
    return new ApiError(409, 'Conflict', detail, 'https://zar30.com/errors/conflict')
  }

  static unprocessableEntity(detail: string) {
    return new ApiError(422, 'Unprocessable Entity', detail, 'https://zar30.com/errors/validation')
  }

  static tooManyRequests(detail = 'Rate limit exceeded') {
    return new ApiError(429, 'Too Many Requests', detail, 'https://zar30.com/errors/rate-limit')
  }

  static internal(detail = 'Internal server error') {
    return new ApiError(500, 'Internal Server Error', detail, 'https://zar30.com/errors/internal')
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
    type: 'https://zar30.com/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
  }
}
