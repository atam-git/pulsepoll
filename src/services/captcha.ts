import crypto from 'crypto'

/**
 * CAPTCHA service for PulsePoll platform
 * Generates math-based challenges and detects suspicious voting patterns
 */

export interface CaptchaChallenge {
  id: string
  challenge: string
  answer: string
  expiresAt: Date
}

interface CaptchaEntry {
  answer: string
  expiresAt: Date
  used: boolean
}

interface SubmissionRecord {
  timestamps: number[]
  pollIds: Set<string>
}

/**
 * In-memory CAPTCHA challenge store
 * In production, this should be replaced with Redis for distributed systems
 */
class CaptchaChallengeStore {
  private store = new Map<string, CaptchaEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired challenges every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt.getTime() <= now) {
        this.store.delete(key)
      }
    }
  }

  set(id: string, entry: CaptchaEntry): void {
    this.store.set(id, entry)
  }

  get(id: string): CaptchaEntry | undefined {
    const entry = this.store.get(id)
    if (entry && entry.expiresAt.getTime() <= Date.now()) {
      this.store.delete(id)
      return undefined
    }
    return entry
  }

  markUsed(id: string): void {
    const entry = this.store.get(id)
    if (entry) {
      entry.used = true
    }
  }

  delete(id: string): void {
    this.store.delete(id)
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Global stores
const challengeStore = new CaptchaChallengeStore()
const submissionTracking = new Map<string, SubmissionRecord>()

/**
 * CAPTCHA service for bot detection and abuse prevention
 */
export class CaptchaService {
  // Thresholds for suspicious pattern detection
  private static readonly RAPID_SUBMISSION_WINDOW_MS = 60 * 1000 // 1 minute
  private static readonly RAPID_SUBMISSION_THRESHOLD = 5
  private static readonly MULTI_POLL_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
  private static readonly MULTI_POLL_THRESHOLD = 10
  private static readonly CHALLENGE_TTL_MS = 5 * 60 * 1000 // 5 minutes

  /**
   * Determine if a CAPTCHA should be required based on suspicious patterns
   */
  static shouldRequireCaptcha(req: { headers: { get(name: string): string | null } }, pollId: string): boolean {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const key = `ip:${ip}`

    const record = submissionTracking.get(key)
    if (!record) {
      return false
    }

    const now = Date.now()

    // Check for rapid submissions from same IP
    const recentSubmissions = record.timestamps.filter(
      ts => now - ts < this.RAPID_SUBMISSION_WINDOW_MS
    )
    if (recentSubmissions.length >= this.RAPID_SUBMISSION_THRESHOLD) {
      return true
    }

    // Check for same IP voting on many different polls in a short window
    const recentMultiPoll = record.timestamps.filter(
      ts => now - ts < this.MULTI_POLL_WINDOW_MS
    )
    if (recentMultiPoll.length >= this.MULTI_POLL_THRESHOLD && record.pollIds.size > 3) {
      return true
    }

    return false
  }

  /**
   * Generate a simple math-based CAPTCHA challenge
   */
  static generateChallenge(): CaptchaChallenge {
    const id = crypto.randomBytes(16).toString('hex')

    // Generate random math problem
    const operators = ['+', '-', '*'] as const
    const operator = operators[Math.floor(Math.random() * operators.length)]

    let a: number
    let b: number
    let answer: number

    switch (operator) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1
        b = Math.floor(Math.random() * 50) + 1
        answer = a + b
        break
      case '-':
        a = Math.floor(Math.random() * 50) + 10
        b = Math.floor(Math.random() * a) + 1
        answer = a - b
        break
      case '*':
        a = Math.floor(Math.random() * 12) + 1
        b = Math.floor(Math.random() * 12) + 1
        answer = a * b
        break
    }

    const challenge = `What is ${a} ${operator} ${b}?`
    const expiresAt = new Date(Date.now() + this.CHALLENGE_TTL_MS)

    challengeStore.set(id, {
      answer: answer.toString(),
      expiresAt,
      used: false
    })

    return {
      id,
      challenge,
      answer: answer.toString(),
      expiresAt
    }
  }

  /**
   * Verify a CAPTCHA response
   */
  static verifyCaptcha(challengeId: string, answer: string): boolean {
    const entry = challengeStore.get(challengeId)

    if (!entry) {
      return false
    }

    if (entry.used) {
      return false
    }

    const isCorrect = entry.answer === answer.trim()

    // Mark as used regardless of correctness to prevent brute force
    challengeStore.markUsed(challengeId)
    challengeStore.delete(challengeId)

    return isCorrect
  }

  /**
   * Record a submission attempt for suspicious pattern tracking
   */
  static recordSubmission(req: { headers: { get(name: string): string | null } }, pollId: string): void {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const key = `ip:${ip}`
    const now = Date.now()

    let record = submissionTracking.get(key)
    if (!record) {
      record = { timestamps: [], pollIds: new Set() }
      submissionTracking.set(key, record)
    }

    record.timestamps.push(now)
    record.pollIds.add(pollId)

    // Clean up old timestamps (older than 10 minutes)
    const cutoff = now - 10 * 60 * 1000
    record.timestamps = record.timestamps.filter(ts => ts > cutoff)
  }

  /**
   * Clean up expired tracking data
   */
  static cleanup(): void {
    const now = Date.now()
    const cutoff = now - 10 * 60 * 1000

    for (const [key, record] of submissionTracking.entries()) {
      record.timestamps = record.timestamps.filter(ts => ts > cutoff)
      if (record.timestamps.length === 0) {
        submissionTracking.delete(key)
      }
    }
  }

  /**
   * Destroy all stores for graceful shutdown
   */
  static destroy(): void {
    challengeStore.destroy()
    submissionTracking.clear()
  }
}

// Handle process cleanup
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => CaptchaService.destroy())
  process.on('SIGINT', () => CaptchaService.destroy())
}
