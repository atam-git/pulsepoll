import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF protection for PulsePoll platform
 * Generates and validates tokens to prevent cross-site request forgery
 */

interface CSRFTokenEntry {
  token: string
  expiresAt: number
}

/**
 * In-memory CSRF token store
 * In production, this should be replaced with Redis for distributed systems
 */
class CSRFTokenStore {
  private store = new Map<string, CSRFTokenEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key)
      }
    }
  }

  set(token: string, expiresAt: number): void {
    this.store.set(token, { token, expiresAt })
  }

  has(token: string): boolean {
    const entry = this.store.get(token)
    if (!entry) return false
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(token)
      return false
    }
    return true
  }

  delete(token: string): void {
    this.store.delete(token)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Global token store instance
const tokenStore = new CSRFTokenStore()

// Token TTL: 1 hour
const TOKEN_TTL_MS = 60 * 60 * 1000

/**
 * Generate a secure random CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + TOKEN_TTL_MS

  tokenStore.set(token, expiresAt)

  return token
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const isValid = tokenStore.has(token)

  if (isValid) {
    // Consume the token (single use)
    tokenStore.delete(token)
  }

  return isValid
}

// HTTP methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

/**
 * Middleware that validates CSRF token on state-changing requests
 * Expects token in the `x-csrf-token` header
 */
export function withCSRFProtection(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    // Only validate on state-changing methods
    if (!PROTECTED_METHODS.includes(req.method)) {
      return await handler(req, context)
    }

    const token = req.headers.get('x-csrf-token')

    if (!token) {
      return NextResponse.json(
        { error: 'CSRF token missing' },
        { status: 403 }
      )
    }

    if (!validateCSRFToken(token)) {
      return NextResponse.json(
        { error: 'Invalid or expired CSRF token' },
        { status: 403 }
      )
    }

    return await handler(req, context)
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export function destroy(): void {
  tokenStore.destroy()
}

// Handle process cleanup
if (typeof process !== 'undefined') {
  process.on('SIGTERM', destroy)
  process.on('SIGINT', destroy)
}
