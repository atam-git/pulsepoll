import { NextRequest, NextResponse } from 'next/server'
import { RateLimitService, RateLimitConfig, getRateLimitConfig } from '@/services/rateLimit'
import { AuthenticatedRequest } from './auth'

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Get rate limit configuration
      const rateLimitConfig = config || getRateLimitConfig(new URL(req.url).pathname)

      // Generate appropriate key based on configuration
      let keyGenerator = rateLimitConfig.keyGenerator || RateLimitService.defaultKeyGenerator
      
      // For authenticated requests, we might want to use user-based rate limiting
      const authReq = req as AuthenticatedRequest
      if (authReq.user && !rateLimitConfig.keyGenerator) {
        // Use combined IP and user key for better rate limiting
        keyGenerator = (req: NextRequest) => 
          RateLimitService.combinedKeyGenerator(req, authReq.user?.id)
      }

      // Check rate limit
      const result = await RateLimitService.checkRateLimit(req, {
        ...rateLimitConfig,
        keyGenerator
      })

      // Create response with rate limit headers
      let response: NextResponse

      if (!result.allowed) {
        // Rate limit exceeded
        response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: rateLimitConfig.message || 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter
          },
          { status: 429 }
        )
      } else {
        // Process the request
        response = await handler(authReq, context)
      }

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())

      if (result.retryAfter) {
        response.headers.set('Retry-After', result.retryAfter.toString())
      }

      return response

    } catch (error) {
      console.error('Rate limiting middleware error:', error)
      // If rate limiting fails, allow the request to proceed
      return await handler(req as AuthenticatedRequest, context)
    }
  }
}

/**
 * Specific rate limiting middleware for voting endpoints
 */
export function withVotingRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many vote attempts. Please wait before voting again.',
    keyGenerator: (req: NextRequest) => {
      // For voting, use IP + poll ID for more granular rate limiting
      const authReq = req as AuthenticatedRequest
      const url = new URL(req.url)
      const pollId = url.pathname.split('/')[3] // Extract poll ID from /api/polls/[id]/vote
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      return `${baseKey}:poll:${pollId}:vote`
    }
  })
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export function withAuthRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many authentication attempts. Please wait before trying again.',
    keyGenerator: (req: NextRequest) => {
      // For auth endpoints, use IP + endpoint for rate limiting
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      const endpoint = new URL(req.url).pathname.split('/').pop()
      return `${baseKey}:auth:${endpoint}`
    }
  })
}

/**
 * Rate limiting middleware for registration endpoint
 */
export function withRegistrationRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 3,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many registration attempts. Please wait before trying again.',
    keyGenerator: (req: NextRequest) => {
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      return `${baseKey}:register`
    }
  })
}

/**
 * Rate limiting middleware for admin endpoints
 */
export function withAdminRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many admin requests. Please wait before trying again.',
    keyGenerator: (req: NextRequest) => {
      const authReq = req as AuthenticatedRequest
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      const userId = authReq.user?.id || 'anonymous'
      return `${baseKey}:admin:${userId}`
    }
  })
}

/**
 * Rate limiting middleware for poll creation
 */
export function withPollCreationRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many poll creation attempts. Please wait before creating another poll.',
    keyGenerator: (req: NextRequest) => {
      const authReq = req as AuthenticatedRequest
      if (authReq.user) {
        return `user:${authReq.user.id}:create-poll`
      }
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      return `${baseKey}:create-poll`
    }
  })
}

/**
 * Rate limiting middleware for export endpoints
 */
export function withExportRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many export requests. Please wait before requesting another export.',
    keyGenerator: (req: NextRequest) => {
      const authReq = req as AuthenticatedRequest
      if (authReq.user) {
        return `user:${authReq.user.id}:export`
      }
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      return `${baseKey}:export`
    }
  })
}

/**
 * Rate limiting middleware for public directory
 */
export function withPublicDirectoryRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many directory requests. Please wait before browsing more.',
    keyGenerator: (req: NextRequest) => {
      const baseKey = RateLimitService.defaultKeyGenerator(req)
      return `${baseKey}:directory`
    }
  })
}

/**
 * Combine rate limiting with other middleware
 */
export function combineWithRateLimit(
  rateLimitMiddleware: (handler: any) => any,
  otherMiddleware: (handler: any) => any
) {
  return (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
    return rateLimitMiddleware(otherMiddleware(handler))
  }
}

/**
 * Global rate limiting middleware that applies to all requests
 */
export function withGlobalRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRateLimit(handler, {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests from this IP. Please slow down.',
    keyGenerator: RateLimitService.defaultKeyGenerator
  })
}