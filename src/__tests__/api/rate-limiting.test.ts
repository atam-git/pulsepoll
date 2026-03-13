import { NextRequest } from 'next/server'
import { RateLimitService, RateLimitConfigs, getRateLimitConfig, cleanup } from '@/services/rateLimit'

// Mock NextResponse for testing
const mockNextResponse = {
  json: jest.fn().mockImplementation((data, options) => ({
    json: () => Promise.resolve(data),
    status: options?.status || 200,
    headers: new Map()
  })),
  next: jest.fn().mockImplementation(() => ({
    headers: new Map()
  }))
}

// Mock next/server before importing anything that uses it
jest.mock('next/server', () => ({
  NextResponse: mockNextResponse
}))

describe('Rate Limiting System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any existing rate limit data
    jest.clearAllTimers()
    jest.useFakeTimers()
    // Clean up rate limit store
    cleanup()
  })

  afterEach(() => {
    jest.useRealTimers()
    cleanup()
  })

  describe('RateLimitService', () => {
    it('should allow requests within rate limit', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const result = await RateLimitService.checkRateLimit(mockRequest, {
        maxRequests: 10,
        windowMs: 60000
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
      expect(result.limit).toBe(10)
    })

    it('should block requests exceeding rate limit', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const config = {
        maxRequests: 2,
        windowMs: 60000
      }

      // Make requests up to the limit
      await RateLimitService.checkRateLimit(mockRequest, config)
      await RateLimitService.checkRateLimit(mockRequest, config)
      
      // This should be blocked
      const result = await RateLimitService.checkRateLimit(mockRequest, config)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should reset rate limit after window expires', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const config = {
        maxRequests: 1,
        windowMs: 1000 // 1 second
      }

      // Use up the rate limit
      const firstResult = await RateLimitService.checkRateLimit(mockRequest, config)
      expect(firstResult.allowed).toBe(true)

      const secondResult = await RateLimitService.checkRateLimit(mockRequest, config)
      expect(secondResult.allowed).toBe(false)

      // Fast forward time past the window
      jest.advanceTimersByTime(1001)

      // Should be allowed again
      const thirdResult = await RateLimitService.checkRateLimit(mockRequest, config)
      expect(thirdResult.allowed).toBe(true)
    })

    it('should use different keys for different IPs', async () => {
      const request1 = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const request2 = {
        headers: new Map([['x-forwarded-for', '192.168.1.2']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const config = {
        maxRequests: 1,
        windowMs: 60000
      }

      // Use up rate limit for first IP
      const result1 = await RateLimitService.checkRateLimit(request1, config)
      expect(result1.allowed).toBe(true)

      const result2 = await RateLimitService.checkRateLimit(request1, config)
      expect(result2.allowed).toBe(false)

      // Second IP should still be allowed
      const result3 = await RateLimitService.checkRateLimit(request2, config)
      expect(result3.allowed).toBe(true)
    })

    it('should use custom key generator when provided', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const customKeyGenerator = jest.fn().mockReturnValue('custom-key')

      await RateLimitService.checkRateLimit(mockRequest, {
        maxRequests: 10,
        windowMs: 60000,
        keyGenerator: customKeyGenerator
      })

      expect(customKeyGenerator).toHaveBeenCalledWith(mockRequest)
    })
  })

  describe('Rate Limit Configurations', () => {
    it('should have correct voting rate limits', () => {
      expect(RateLimitConfigs.voting.maxRequests).toBe(10)
      expect(RateLimitConfigs.voting.windowMs).toBe(60 * 1000)
      expect(RateLimitConfigs.voting.message).toContain('vote')
    })

    it('should have correct authentication rate limits', () => {
      expect(RateLimitConfigs.authentication.maxRequests).toBe(5)
      expect(RateLimitConfigs.authentication.windowMs).toBe(60 * 1000)
      expect(RateLimitConfigs.authentication.message).toContain('authentication')
    })

    it('should have correct registration rate limits', () => {
      expect(RateLimitConfigs.registration.maxRequests).toBe(3)
      expect(RateLimitConfigs.registration.windowMs).toBe(60 * 1000)
      expect(RateLimitConfigs.registration.message).toContain('registration')
    })

    it('should have correct admin rate limits', () => {
      expect(RateLimitConfigs.admin.maxRequests).toBe(50)
      expect(RateLimitConfigs.admin.windowMs).toBe(60 * 1000)
      expect(RateLimitConfigs.admin.message).toContain('admin')
    })

    it('should have correct export rate limits', () => {
      expect(RateLimitConfigs.export.maxRequests).toBe(5)
      expect(RateLimitConfigs.export.windowMs).toBe(60 * 1000)
      expect(RateLimitConfigs.export.message).toContain('export')
    })
  })

  describe('getRateLimitConfig', () => {
    it('should return voting config for vote endpoints', () => {
      const config = getRateLimitConfig('/api/polls/123/vote')
      expect(config).toEqual(RateLimitConfigs.voting)
    })

    it('should return registration config for register endpoint', () => {
      const config = getRateLimitConfig('/api/auth/register')
      expect(config).toEqual(RateLimitConfigs.registration)
    })

    it('should return admin config for admin endpoints', () => {
      const config = getRateLimitConfig('/api/admin/users')
      expect(config).toEqual(RateLimitConfigs.admin)
    })

    it('should return export config for export endpoints', () => {
      const config = getRateLimitConfig('/api/polls/123/export')
      expect(config).toEqual(RateLimitConfigs.export)
    })

    it('should return general config for unknown endpoints', () => {
      const config = getRateLimitConfig('/api/unknown/endpoint')
      expect(config).toEqual(RateLimitConfigs.general)
    })
  })

  describe('Key Generators', () => {
    it('should generate IP-based keys by default', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1, 10.0.0.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const key = RateLimitService.defaultKeyGenerator(mockRequest)
      expect(key).toBe('ip:192.168.1.1')
    })

    it('should generate user-based keys when user ID provided', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const key = RateLimitService.userKeyGenerator(mockRequest, 'user123')
      expect(key).toBe('user:user123')
    })

    it('should generate combined keys for IP and user', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const key = RateLimitService.combinedKeyGenerator(mockRequest, 'user123')
      expect(key).toBe('ip:192.168.1.1:user:user123')
    })

    it('should generate endpoint-specific keys', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const key = RateLimitService.endpointKeyGenerator(mockRequest, 'vote')
      expect(key).toBe('ip:192.168.1.1:endpoint:vote')
    })

    it('should handle missing x-forwarded-for header', () => {
      const mockRequest = {
        headers: new Map(),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const key = RateLimitService.defaultKeyGenerator(mockRequest)
      expect(key).toBe('ip:unknown')
    })
  })

  describe('Rate Limit Store Cleanup', () => {
    it('should clean up expired entries', async () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        url: 'http://localhost:3000/api/test'
      } as unknown as NextRequest

      const config = {
        maxRequests: 1,
        windowMs: 1000 // 1 second
      }

      // Create an entry
      await RateLimitService.checkRateLimit(mockRequest, config)

      // Fast forward past expiration
      jest.advanceTimersByTime(1001)

      // Next request should be allowed (entry should be cleaned up)
      const result = await RateLimitService.checkRateLimit(mockRequest, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0) // First request in new window
    })
  })
})