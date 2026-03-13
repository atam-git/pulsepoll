import * as fc from 'fast-check'
import { CaptchaService } from '@/services/captcha'
import { generateCSRFToken, validateCSRFToken } from '@/lib/csrf'
import { SecurityLogger } from '@/services/securityLogger'
import { sanitizeString } from '@/lib/validation'

describe('Security Workflow Integration', () => {
  afterEach(() => {
    CaptchaService.destroy()
    SecurityLogger.destroy()
  })

  describe('CAPTCHA workflow', () => {
    it('should generate a challenge and verify correct answer', () => {
      const challenge = CaptchaService.generateChallenge()

      expect(challenge.id).toBeTruthy()
      expect(challenge.challenge).toBeTruthy()
      expect(challenge.answer).toBeTruthy()
      expect(challenge.expiresAt).toBeInstanceOf(Date)
      expect(challenge.expiresAt.getTime()).toBeGreaterThan(Date.now())

      const result = CaptchaService.verifyCaptcha(challenge.id, challenge.answer)
      expect(result).toBe(true)
    })

    it('should reject wrong answer', () => {
      const challenge = CaptchaService.generateChallenge()

      const wrongAnswer = String(Number(challenge.answer) + 9999)
      const result = CaptchaService.verifyCaptcha(challenge.id, wrongAnswer)
      expect(result).toBe(false)
    })

    it('should reject reuse of a consumed challenge', () => {
      const challenge = CaptchaService.generateChallenge()

      // First verification consumes and deletes the challenge
      CaptchaService.verifyCaptcha(challenge.id, challenge.answer)

      // Second attempt should fail — challenge is gone
      const result = CaptchaService.verifyCaptcha(challenge.id, challenge.answer)
      expect(result).toBe(false)
    })

    it('should reject verification with nonexistent challenge id', () => {
      const result = CaptchaService.verifyCaptcha('nonexistent-id', '42')
      expect(result).toBe(false)
    })

    it('should generate unique challenge ids', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 20; i++) {
        ids.add(CaptchaService.generateChallenge().id)
      }
      expect(ids.size).toBe(20)
    })

    it('should produce solvable math challenges', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 99 }), () => {
          const challenge = CaptchaService.generateChallenge()

          // The challenge string should match "What is X op Y?"
          expect(challenge.challenge).toMatch(/^What is \d+ [+\-*] \d+\?$/)

          // Extract operands and operator to verify answer
          const match = challenge.challenge.match(/^What is (\d+) ([+\-*]) (\d+)\?$/)
          expect(match).not.toBeNull()

          const a = Number(match![1])
          const op = match![2]
          const b = Number(match![3])
          let expected: number

          switch (op) {
            case '+':
              expected = a + b
              break
            case '-':
              expected = a - b
              break
            case '*':
              expected = a * b
              break
            default:
              throw new Error(`Unexpected operator: ${op}`)
          }

          expect(challenge.answer).toBe(String(expected))
          return true
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('CSRF workflow', () => {
    it('should generate a token and validate it successfully', () => {
      const token = generateCSRFToken()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)

      const isValid = validateCSRFToken(token)
      expect(isValid).toBe(true)
    })

    it('should consume token on first validation (single-use)', () => {
      const token = generateCSRFToken()

      expect(validateCSRFToken(token)).toBe(true)
      // Token is consumed — second use should fail
      expect(validateCSRFToken(token)).toBe(false)
    })

    it('should reject invalid / fabricated token', () => {
      expect(validateCSRFToken('totally-fake-token')).toBe(false)
    })

    it('should reject empty or non-string input', () => {
      expect(validateCSRFToken('')).toBe(false)
      expect(validateCSRFToken(null as any)).toBe(false)
      expect(validateCSRFToken(undefined as any)).toBe(false)
    })

    it('should generate unique tokens', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 20; i++) {
        tokens.add(generateCSRFToken())
      }
      expect(tokens.size).toBe(20)
    })

    it('should allow multiple independent tokens simultaneously', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      const token3 = generateCSRFToken()

      // Validate in different order than generated
      expect(validateCSRFToken(token2)).toBe(true)
      expect(validateCSRFToken(token3)).toBe(true)
      expect(validateCSRFToken(token1)).toBe(true)

      // All consumed
      expect(validateCSRFToken(token1)).toBe(false)
      expect(validateCSRFToken(token2)).toBe(false)
      expect(validateCSRFToken(token3)).toBe(false)
    })
  })

  describe('Security logging', () => {
    it('should log events and retrieve by type', () => {
      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        details: 'Wrong password',
        severity: 'medium',
      })
      SecurityLogger.logEvent({
        type: 'csrf_violation',
        timestamp: new Date(),
        ipAddress: '10.0.0.1',
        details: 'Missing CSRF token',
        severity: 'high',
      })
      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(),
        ipAddress: '192.168.1.2',
        details: 'Account not found',
        severity: 'low',
      })

      const failedLogins = SecurityLogger.getEventsByType('failed_login')
      expect(failedLogins).toHaveLength(2)
      expect(failedLogins.every((e) => e.type === 'failed_login')).toBe(true)

      const csrfEvents = SecurityLogger.getEventsByType('csrf_violation')
      expect(csrfEvents).toHaveLength(1)
      expect(csrfEvents[0].ipAddress).toBe('10.0.0.1')
    })

    it('should retrieve events filtered by severity', () => {
      SecurityLogger.logEvent({
        type: 'suspicious_activity',
        timestamp: new Date(),
        ipAddress: '10.0.0.1',
        details: 'Unusual pattern',
        severity: 'high',
      })
      SecurityLogger.logEvent({
        type: 'invalid_input',
        timestamp: new Date(),
        ipAddress: '10.0.0.2',
        details: 'Bad request body',
        severity: 'low',
      })
      SecurityLogger.logEvent({
        type: 'rate_limit_exceeded',
        timestamp: new Date(),
        ipAddress: '10.0.0.3',
        details: 'Too many requests',
        severity: 'high',
      })

      const highSeverity = SecurityLogger.getRecentEvents({ severity: 'high' })
      expect(highSeverity).toHaveLength(2)
      expect(highSeverity.every((e) => e.severity === 'high')).toBe(true)

      const lowSeverity = SecurityLogger.getRecentEvents({ severity: 'low' })
      expect(lowSeverity).toHaveLength(1)
    })

    it('should filter events by IP address', () => {
      const targetIp = '172.16.0.1'

      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(),
        ipAddress: targetIp,
        details: 'Attempt 1',
        severity: 'medium',
      })
      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(),
        ipAddress: '172.16.0.2',
        details: 'Attempt from other IP',
        severity: 'medium',
      })
      SecurityLogger.logEvent({
        type: 'account_locked',
        timestamp: new Date(),
        ipAddress: targetIp,
        details: 'Locked after failures',
        severity: 'high',
      })

      const events = SecurityLogger.getRecentEvents({ ipAddress: targetIp })
      expect(events).toHaveLength(2)
      expect(events.every((e) => e.ipAddress === targetIp)).toBe(true)
    })

    it('should return events sorted most recent first', () => {
      const now = Date.now()

      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(now - 3000),
        ipAddress: '1.1.1.1',
        details: 'Old event',
        severity: 'low',
      })
      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(now),
        ipAddress: '1.1.1.1',
        details: 'New event',
        severity: 'low',
      })
      SecurityLogger.logEvent({
        type: 'failed_login',
        timestamp: new Date(now - 1000),
        ipAddress: '1.1.1.1',
        details: 'Middle event',
        severity: 'low',
      })

      const events = SecurityLogger.getRecentEvents()
      expect(events[0].details).toBe('New event')
      expect(events[1].details).toBe('Middle event')
      expect(events[2].details).toBe('Old event')
    })

    it('should respect limit filter', () => {
      for (let i = 0; i < 10; i++) {
        SecurityLogger.logEvent({
          type: 'invalid_input',
          timestamp: new Date(),
          ipAddress: '1.1.1.1',
          details: `Event ${i}`,
          severity: 'low',
        })
      }

      const limited = SecurityLogger.getRecentEvents({ limit: 3 })
      expect(limited).toHaveLength(3)
    })
  })

  describe('Rate limiting logic', () => {
    it('should track CAPTCHA requirement after rapid submissions', () => {
      const mockReq = {
        headers: { get: (name: string) => (name === 'x-forwarded-for' ? '99.99.99.99' : null) },
      }

      // Initially no captcha required
      expect(CaptchaService.shouldRequireCaptcha(mockReq, 'poll-1')).toBe(false)

      // Record rapid submissions to trigger threshold (5 in 1 minute)
      for (let i = 0; i < 6; i++) {
        CaptchaService.recordSubmission(mockReq, 'poll-1')
      }

      expect(CaptchaService.shouldRequireCaptcha(mockReq, 'poll-1')).toBe(true)
    })

    it('should not require captcha for infrequent submissions', () => {
      const mockReq = {
        headers: { get: (name: string) => (name === 'x-forwarded-for' ? '88.88.88.88' : null) },
      }

      CaptchaService.recordSubmission(mockReq, 'poll-1')
      CaptchaService.recordSubmission(mockReq, 'poll-2')

      expect(CaptchaService.shouldRequireCaptcha(mockReq, 'poll-1')).toBe(false)
    })
  })

  describe('Input sanitization', () => {
    it('should strip HTML tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>Hello')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('</script>')
      expect(result).toContain('Hello')
    })

    it('should encode special HTML characters', () => {
      // Use & and quotes which don't form HTML tags
      const result = sanitizeString('a & b "c" \'d\'')
      expect(result).toContain('&amp;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
    })

    it('should remove null bytes', () => {
      const result = sanitizeString('hello\0world')
      expect(result).not.toContain('\0')
      expect(result).toContain('helloworld')
    })

    it('should trim whitespace', () => {
      const result = sanitizeString('  hello  ')
      expect(result).toBe('hello')
    })

    it('should handle empty and non-string input', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString(42 as any)).toBe('')
      expect(sanitizeString(null as any)).toBe('')
    })

    it('should strip common XSS vectors', () => {
      const vectors = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<a href="javascript:alert(1)">click</a>',
        '<div style="background:url(javascript:alert(1))">',
        '"><script>alert(document.cookie)</script>',
      ]

      for (const vector of vectors) {
        const result = sanitizeString(vector)
        expect(result).not.toMatch(/<[a-z]/i)
      }
    })

    it('should preserve safe text content through sanitization', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter((s) => /^[a-zA-Z0-9 ]+$/.test(s)),
          (input) => {
            const result = sanitizeString(input)
            expect(result).toBe(input.trim())
            return true
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
