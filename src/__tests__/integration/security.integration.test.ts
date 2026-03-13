import { sanitizeString, validatePollInput, validateVoteInput, validateUserInput } from '@/lib/validation'
import { CaptchaService } from '@/services/captcha'
import { generateCSRFToken, validateCSRFToken } from '@/lib/csrf'

describe('Security Integration Tests', () => {
  describe('Input validation - XSS prevention', () => {
    it('should reject script tags in poll title', () => {
      const result = validatePollInput({
        title: '<script>alert("xss")</script>Valid Title',
        type: 'single',
        options: [{ text: 'A' }, { text: 'B' }],
      })
      expect(result.valid).toBe(true)
      const sanitized = sanitizeString('<script>alert("xss")</script>')
      expect(sanitized).not.toContain('<script>')
    })

    it('should reject event handler attributes', () => {
      const sanitized = sanitizeString('<img onerror="alert(1)" src=x>')
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('<img')
    })

    it('should reject encoded XSS attacks', () => {
      const sanitized = sanitizeString('&#60;script&#62;alert(1)&#60;/script&#62;')
      expect(sanitized).not.toContain('<script>')
    })

    it('should reject polls with missing required fields', () => {
      const result = validatePollInput({})
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject polls with title too short', () => {
      const result = validatePollInput({
        title: 'Hi',
        type: 'single',
        options: [{ text: 'A' }, { text: 'B' }],
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('5 characters')]))
    })
  })

  describe('sanitizeString effectiveness', () => {
    it('should strip all HTML tags', () => {
      expect(sanitizeString('<b>bold</b>')).not.toContain('<b>')
      expect(sanitizeString('<div class="x">text</div>')).not.toContain('<div')
    })

    it('should encode ampersands and quotes', () => {
      const result = sanitizeString('a & b "c" \'d\'')
      expect(result).toContain('&amp;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
    })

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld')
    })

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello')
    })
  })

  describe('CAPTCHA math verification', () => {
    afterEach(() => {
      CaptchaService.destroy()
    })

    it('should generate challenges with correct answers', () => {
      for (let i = 0; i < 20; i++) {
        const challenge = CaptchaService.generateChallenge()
        const isValid = CaptchaService.verifyCaptcha(challenge.id, challenge.answer)
        expect(isValid).toBe(true)
      }
    })

    it('should reject incorrect answers', () => {
      const challenge = CaptchaService.generateChallenge()
      const wrong = String(Number(challenge.answer) + 999)
      expect(CaptchaService.verifyCaptcha(challenge.id, wrong)).toBe(false)
    })

    it('should reject reuse of a consumed challenge', () => {
      const challenge = CaptchaService.generateChallenge()
      CaptchaService.verifyCaptcha(challenge.id, challenge.answer)
      expect(CaptchaService.verifyCaptcha(challenge.id, challenge.answer)).toBe(false)
    })
  })

  describe('CSRF token security', () => {
    it('should generate unique tokens every time', () => {
      const tokens = new Set<string>()
      for (let i = 0; i < 50; i++) {
        tokens.add(generateCSRFToken())
      }
      expect(tokens.size).toBe(50)
    })

    it('should validate a freshly generated token', () => {
      const token = generateCSRFToken()
      expect(validateCSRFToken(token)).toBe(true)
    })

    it('should reject a token after it has been consumed', () => {
      const token = generateCSRFToken()
      validateCSRFToken(token)
      expect(validateCSRFToken(token)).toBe(false)
    })

    it('should reject invalid tokens', () => {
      expect(validateCSRFToken('not-a-real-token')).toBe(false)
      expect(validateCSRFToken('')).toBe(false)
    })
  })

  describe('Rate limit enforcement', () => {
    it('should block requests exceeding the limit', async () => {
      const { RateLimitService, cleanup } = await import('@/services/rateLimit')
      const mockReq = {
        headers: new Map([['x-forwarded-for', '99.99.99.99']]),
      } as any
      const limit = 3
      const config = { maxRequests: limit, windowMs: 60000 }

      for (let i = 0; i < limit; i++) {
        const r = await RateLimitService.checkRateLimit(mockReq, config)
        expect(r.allowed).toBe(true)
      }
      const blocked = await RateLimitService.checkRateLimit(mockReq, config)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
      cleanup()
    })
  })
})
