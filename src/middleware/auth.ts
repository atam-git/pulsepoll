import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: 'user' | 'admin'
    emailVerified: boolean
  }
}

/**
 * Authentication middleware for API routes
 * Validates JWT tokens and attaches user information to request
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    requireEmailVerified?: boolean
    allowedRoles?: ('user' | 'admin')[]
  } = {}
) {
  const {
    requireAuth = true,
    requireEmailVerified = false,
    allowedRoles = ['user', 'admin']
  } = options

  return async (req: NextRequest, context?: any) => {
    try {
      // Get JWT token from request
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET
      })

      // Create authenticated request object
      const authReq = req as AuthenticatedRequest

      if (token && token.sub) {
        // Attach user information to request
        authReq.user = {
          id: token.sub,
          email: token.email as string,
          role: (token.role as 'user' | 'admin') || 'user',
          emailVerified: Boolean(token.emailVerified)
        }
      }

      // Check authentication requirements
      if (requireAuth && !authReq.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check email verification requirements
      if (requireEmailVerified && authReq.user && !authReq.user.emailVerified) {
        return NextResponse.json(
          { error: 'Email verification required' },
          { status: 403 }
        )
      }

      // Check role requirements
      if (authReq.user && !allowedRoles.includes(authReq.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Call the actual handler with context if provided
      return await handler(authReq, context)

    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware for admin-only routes
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    requireEmailVerified: true,
    allowedRoles: ['admin']
  })
}

/**
 * Middleware for authenticated user routes (email verification optional)
 */
export function withUserAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    requireEmailVerified: false,
    allowedRoles: ['user', 'admin']
  })
}

/**
 * Middleware for verified user routes (email verification required)
 */
export function withVerifiedUserAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    requireEmailVerified: true,
    allowedRoles: ['user', 'admin']
  })
}

/**
 * Middleware for optional authentication (allows anonymous access)
 */
export function withOptionalAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: false,
    requireEmailVerified: false,
    allowedRoles: ['user', 'admin']
  })
}

/**
 * Rate limiting middleware
 * Simple in-memory rate limiter for development
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  options: {
    maxRequests?: number
    windowMs?: number
    keyGenerator?: (req: NextRequest) => string
  } = {}
) {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = (req) => {
      // Use IP address as default key
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return ip
    }
  } = options

  return async (req: NextRequest, context?: any) => {
    const key = keyGenerator(req)
    const now = Date.now()
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime <= now) {
        rateLimitStore.delete(k)
      }
    }

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowMs }
      rateLimitStore.set(key, entry)
    }

    // Check rate limit
    if (entry.count >= maxRequests) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        }
      )
    }

    // Increment counter
    entry.count++

    // Add rate limit headers to response
    const response = await handler(req as AuthenticatedRequest, context)
    
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', (maxRequests - entry.count).toString())
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())

    return response
  }
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    )
  }
}

/**
 * CORS middleware for API routes
 */
export function withCORS(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  options: {
    origin?: string | string[]
    methods?: string[]
    allowedHeaders?: string[]
    credentials?: boolean
  } = {}
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = true
  } = options

  return async (req: NextRequest, context?: any) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(',') : origin,
          'Access-Control-Allow-Methods': methods.join(','),
          'Access-Control-Allow-Headers': allowedHeaders.join(','),
          'Access-Control-Allow-Credentials': credentials.toString(),
          'Access-Control-Max-Age': '86400'
        }
      })
    }

    // Process the request
    const response = await handler(req as AuthenticatedRequest, context)

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(',') : origin)
    response.headers.set('Access-Control-Allow-Methods', methods.join(','))
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(','))
    response.headers.set('Access-Control-Allow-Credentials', credentials.toString())

    return response
  }
}