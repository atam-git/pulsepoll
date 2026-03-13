/**
 * Security event logging service for PulsePoll platform
 * Tracks security-relevant events for monitoring and incident response
 * In production, this would use MongoDB or a dedicated logging service
 */

export type SecurityEventType =
  | 'failed_login'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'csrf_violation'
  | 'account_locked'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityEvent {
  type: SecurityEventType
  timestamp: Date
  ipAddress: string
  userId?: string
  details: string
  severity: SecuritySeverity
}

interface StoredSecurityEvent extends SecurityEvent {
  id: string
}

/**
 * In-memory security event store
 * In production, this should be replaced with MongoDB or a logging service
 */
class SecurityEventStore {
  private events: StoredSecurityEvent[] = []
  private maxEvents = 10000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up old events every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 30 * 60 * 1000)
  }

  private cleanup(): void {
    // Keep only events from the last 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    this.events = this.events.filter(e => e.timestamp.getTime() > cutoff)
  }

  add(event: StoredSecurityEvent): void {
    this.events.push(event)

    // Evict oldest events if over capacity
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  getAll(): StoredSecurityEvent[] {
    return [...this.events]
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.events = []
  }
}

// Global event store instance
const eventStore = new SecurityEventStore()

// Auto-incrementing event counter
let eventCounter = 0

/**
 * Security logger for monitoring and incident response
 */
export class SecurityLogger {
  /**
   * Log a security event
   */
  static logEvent(event: SecurityEvent): void {
    eventCounter++
    const storedEvent: StoredSecurityEvent = {
      ...event,
      id: `sec-${eventCounter}-${Date.now()}`,
      timestamp: event.timestamp || new Date()
    }

    eventStore.add(storedEvent)

    // Log critical and high severity events to console
    if (event.severity === 'critical' || event.severity === 'high') {
      console.warn(
        `[SECURITY ${event.severity.toUpperCase()}] ${event.type}: ${event.details}` +
          ` | IP: ${event.ipAddress}` +
          (event.userId ? ` | User: ${event.userId}` : '')
      )
    }
  }

  /**
   * Get recent security events with optional filters
   */
  static getRecentEvents(filters?: {
    type?: SecurityEventType
    severity?: SecuritySeverity
    ipAddress?: string
    userId?: string
    since?: Date
    limit?: number
  }): SecurityEvent[] {
    let events = eventStore.getAll()

    if (filters) {
      if (filters.type) {
        events = events.filter(e => e.type === filters.type)
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity)
      }
      if (filters.ipAddress) {
        events = events.filter(e => e.ipAddress === filters.ipAddress)
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId)
      }
      if (filters.since) {
        const sinceTime = filters.since.getTime()
        events = events.filter(e => e.timestamp.getTime() >= sinceTime)
      }
    }

    // Sort by most recent first
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    const limit = filters?.limit || 100
    return events.slice(0, limit)
  }

  /**
   * Get security events filtered by type
   */
  static getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.getRecentEvents({ type })
  }

  /**
   * Destroy the event store for graceful shutdown
   */
  static destroy(): void {
    eventStore.destroy()
    eventCounter = 0
  }
}

// Handle process cleanup
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => SecurityLogger.destroy())
  process.on('SIGINT', () => SecurityLogger.destroy())
}
