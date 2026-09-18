// ============================================
// Zarnama - API Error Test
// ============================================
import { describe, it, expect } from 'vitest'
import { ApiError, errorResponse } from '@/lib/errors/api-error'

describe('API Error', () => {
  it('should create badRequest error', () => {
    const error = ApiError.badRequest('Invalid input')
    expect(error.statusCode).toBe(400)
    expect(error.title).toBe('Bad Request')
  })

  it('should create unauthorized error', () => {
    const error = ApiError.unauthorized()
    expect(error.statusCode).toBe(401)
    expect(error.title).toBe('Unauthorized')
  })

  it('should format error response correctly', () => {
    const error = ApiError.notFound('User not found')
    const response = errorResponse(error)
    expect(response.status).toBe(404)
    expect(response.type).toContain('not-found')
  })
})
