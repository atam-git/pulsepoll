/**
 * In-memory caching service for PulsePoll platform
 * Provides TTL-based caching with LRU-like eviction and automatic cleanup
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  lastAccessed: number
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes
const POLL_RESULTS_TTL_MS = 30 * 1000 // 30 seconds for real-time feel
const MAX_ENTRIES = 10000
const CLEANUP_INTERVAL_MS = 60 * 1000 // 60 seconds

export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.removeExpired()
    }, CLEANUP_INTERVAL_MS)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    entry.lastAccessed = Date.now()
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    if (this.cache.size >= MAX_ENTRIES && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) return cached

    const value = await fetcher()
    this.set(key, value, ttlMs)
    return value
  }

  cachePollResults(pollId: string, results: unknown): void {
    this.set(`poll:results:${pollId}`, results, POLL_RESULTS_TTL_MS)
  }

  cachePollData(pollId: string, pollData: unknown): void {
    this.set(`poll:data:${pollId}`, pollData, DEFAULT_TTL_MS)
  }

  invalidatePoll(pollId: string): void {
    this.cache.delete(`poll:results:${pollId}`)
    this.cache.delete(`poll:data:${pollId}`)

    // Also remove any keys that contain the pollId as a segment
    const keysToDelete: string[] = []
    this.cache.forEach((_entry, key) => {
      if (key.includes(pollId)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  private removeExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestAccess = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Singleton instance
export const cacheService = new CacheService()
