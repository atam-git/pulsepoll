import { NextRequest } from 'next/server'

/**
 * Rate limiting service for PulsePoll platform
 * Implements different rate limits for different endpoint types
 */

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

/**
 * In-memory rate limit store
 * In production, this should be replaced with Redis for distributed systems
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)
    if (entry && entry.resetTime <= Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    let entry = this.get(key)

    if (!entry) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      }
    } else {
      entry.count++
    }

    this.set(key, entry)
    return entry
  }

  clear(): void {
    this.store.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore()

/**
 * Rate limiting service
 */
export class RateLimitService {
  /**
   * Check if request is within rate limit
   */
  static async checkRateLimit(
    req: NextRequest,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const {
      maxRequests,
      windowMs,
      keyGenerator = RateLimitService.defaultKeyGenerator
    } = config

    const key = keyGenerator(req)
    const entry = rateLimitStore.increment(key, windowMs)

    const allowed = entry.count <= maxRequests
    const remaining = Math.max(0, maxRequests - entry.count)
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - Date.now()) / 1000)

    return {
      allowed,
      limit: maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter
    }
  }

  /**
   * Default key generator using IP address
   */
  static defaultKeyGenerator(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return `ip:${ip}`
  }

  /**
   * User-based key generator
   */
  static userKeyGenerator(req: NextRequest, userId?: string): string {
    if (userId) {
      return `user:${userId}`
    }
    return RateLimitService.defaultKeyGenerator(req)
  }

  /**
   * Combined IP and user key generator
   */
  static combinedKeyGenerator(req: NextRequest, userId?: string): string {
    const ipKey = RateLimitService.defaultKeyGenerator(req)
    if (userId) {
      return `${ipKey}:user:${userId}`
    }
    return ipKey
  }

  /**
   * Endpoint-specific key generator
   */
  static endpointKeyGenerator(req: NextRequest, endpoint: string): string {
    const baseKey = RateLimitService.defaultKeyGenerator(req)
    return `${baseKey}:endpoint:${endpoint}`
  }
}

/**
 * Predefined rate limit configurations for different endpoint types
 */
export const RateLimitConfigs = {
  // Voting endpoints - more restrictive to prevent spam voting
  voting: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many vote attempts. Please wait before voting again.'
  } as RateLimitConfig,

  // Authentication endpoints - moderate limits to prevent brute force
  authentication: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many authentication attempts. Please wait before trying again.'
  } as RateLimitConfig,

  // Registration endpoint - very restrictive to prevent spam accounts
  registration: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many registration attempts. Please wait before trying again.'
  } as RateLimitConfig,

  // Password reset - restrictive to prevent abuse
  passwordReset: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many password reset attempts. Please wait before trying again.'
  } as RateLimitConfig,

  // General API endpoints - less restrictive for normal usage
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  } as RateLimitConfig,

  // Admin endpoints - moderate limits
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many admin requests. Please wait before trying again.'
  } as RateLimitConfig,

  // Poll creation - moderate limits to prevent spam
  pollCreation: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many poll creation attempts. Please wait before creating another poll.'
  } as RateLimitConfig,

  // Export endpoints - restrictive due to resource intensity
  export: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many export requests. Please wait before requesting another export.'
  } as RateLimitConfig,

  // Public directory - moderate limits for browsing
  publicDirectory: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many directory requests. Please wait before browsing more.'
  } as RateLimitConfig,

  // Real-time connections - higher limits for SSE
  realtime: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many real-time connection attempts. Please wait before reconnecting.'
  } as RateLimitConfig
}

/**
 * Rate limit configurations by endpoint pattern
 */
export const EndpointRateLimits: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  '/api/auth/register': RateLimitConfigs.registration,
  '/api/auth/signin': RateLimitConfigs.authentication,
  '/api/auth/signout': RateLimitConfigs.authentication,
  '/api/auth/reset-password': RateLimitConfigs.passwordReset,

  // Voting endpoints
  '/api/polls/*/vote': RateLimitConfigs.voting,

  // Poll management
  '/api/polls': RateLimitConfigs.pollCreation,
  '/api/polls/*/duplicate': RateLimitConfigs.pollCreation,

  // Export endpoints
  '/api/polls/*/export': RateLimitConfigs.export,
  '/api/polls/*/export/*/download': RateLimitConfigs.export,

  // Admin endpoints
  '/api/admin/*': RateLimitConfigs.admin,

  // Public directory
  '/api/polls/public': RateLimitConfigs.publicDirectory,

  // Real-time endpoints
  '/api/polls/*/events': RateLimitConfigs.realtime,

  // Default for all other endpoints
  '*': RateLimitConfigs.general
}

/**
 * Get rate limit configuration for a specific endpoint
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for exact matches first
  if (EndpointRateLimits[pathname]) {
    return EndpointRateLimits[pathname]
  }

  // Check for pattern matches
  for (const [pattern, config] of Object.entries(EndpointRateLimits)) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$')
      if (regex.test(pathname)) {
        return config
      }
    }
  }

  // Return default configuration
  return EndpointRateLimits['*']
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  rateLimitStore.clear()
}

/**
 * Destroy function for complete cleanup
 */
export function destroy(): void {
  rateLimitStore.destroy()
}

// Handle process cleanup
if (typeof process !== 'undefined') {
  process.on('SIGTERM', destroy)
  process.on('SIGINT', destroy)
}