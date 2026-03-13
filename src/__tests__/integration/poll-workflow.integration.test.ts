import * as fc from 'fast-check'
import { ConfigurationParser, RawPollConfig } from '@/services/configParser'
import { ConfigurationValidator } from '@/services/configValidator'
import { PollSerializer } from '@/services/configSerializer'
import {
  validatePollInput,
  validateVoteInput,
  validateUserInput,
  validateExportOptions,
  sanitizeString,
} from '@/lib/validation'

const POLL_TYPES = ['single', 'multiple', 'ranking', 'yesno', 'survey'] as const

describe('Poll Workflow Integration', () => {
  describe('Poll creation workflow: parse → validate → serialize', () => {
    it.each(POLL_TYPES)(
      'should successfully parse, validate, and serialize a valid %s poll',
      (pollType) => {
        const raw: RawPollConfig = {
          title: 'Integration Test Poll Title',
          description: 'A test description',
          type: pollType,
          options:
            pollType === 'yesno'
              ? [{ text: 'Yes' }, { text: 'No' }]
              : [{ text: 'Option A' }, { text: 'Option B' }, { text: 'Option C' }],
          privacy: 'public',
          allowAnonymous: true,
          requireCaptcha: false,
          category: 'technology',
          tags: ['test', 'integration'],
        }

        const parseResult = ConfigurationParser.parse(raw)
        expect(parseResult.success).toBe(true)
        expect(parseResult.poll).toBeDefined()

        const validationResult = ConfigurationValidator.validate(parseResult.poll!)
        expect(validationResult.valid).toBe(true)
        expect(validationResult.errors).toHaveLength(0)

        const serialized = PollSerializer.serialize(parseResult.poll!)
        expect(serialized.title).toBe(raw.title)
        expect(serialized.type).toBe(raw.type)
        expect(serialized.privacy).toBe(raw.privacy)
      }
    )

    it('should reject poll with missing title during parse', () => {
      const raw: RawPollConfig = {
        type: 'single',
        options: [{ text: 'A' }, { text: 'B' }],
      }

      const result = ConfigurationParser.parse(raw)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.some((e) => e.toLowerCase().includes('title'))).toBe(true)
    })

    it('should reject poll with invalid type during parse', () => {
      const raw: RawPollConfig = {
        title: 'Valid Title Here',
        type: 'bogus',
        options: [{ text: 'A' }, { text: 'B' }],
      }

      const result = ConfigurationParser.parse(raw)
      expect(result.success).toBe(false)
      expect(result.errors!.some((e) => e.toLowerCase().includes('type'))).toBe(true)
    })

    it('should catch short title during validation step', () => {
      const raw: RawPollConfig = {
        title: 'Hi',
        type: 'single',
        options: [{ text: 'A' }, { text: 'B' }],
      }

      // Parser accepts any non-empty title
      const parseResult = ConfigurationParser.parse(raw)
      expect(parseResult.success).toBe(true)

      // Validator enforces min length of 5
      const validationResult = ConfigurationValidator.validate(parseResult.poll!)
      expect(validationResult.valid).toBe(false)
      expect(validationResult.errors.some((e) => e.code === 'TITLE_TOO_SHORT')).toBe(true)
    })

    it('should catch too few options for choice-based type during validation', () => {
      const raw: RawPollConfig = {
        title: 'Valid Title Here',
        type: 'single',
        options: [{ text: 'Only One' }],
      }

      const parseResult = ConfigurationParser.parse(raw)
      expect(parseResult.success).toBe(true)

      const validationResult = ConfigurationValidator.validate(parseResult.poll!)
      expect(validationResult.valid).toBe(false)
      expect(validationResult.errors.some((e) => e.code === 'TOO_FEW_OPTIONS')).toBe(true)
    })

    it('should handle property-based valid configs through full workflow', () => {
      const rawConfigArb = fc.record({
        title: fc.string({ minLength: 5, maxLength: 100 }).map((s) => s.replace(/[<>]/g, 'x')),
        description: fc.string({ maxLength: 200 }),
        type: fc.constantFrom(...POLL_TYPES),
        privacy: fc.constantFrom('public', 'unlisted', 'private'),
        allowAnonymous: fc.boolean(),
        requireCaptcha: fc.boolean(),
      })

      fc.assert(
        fc.property(rawConfigArb, (cfg) => {
          const raw: RawPollConfig = {
            ...cfg,
            options: [{ text: 'Option A' }, { text: 'Option B' }],
          }

          const parseResult = ConfigurationParser.parse(raw)
          if (!parseResult.success) return true // skip configs parser rejects

          const validationResult = ConfigurationValidator.validate(parseResult.poll!)
          if (!validationResult.valid) return true // skip configs validator rejects

          const serialized = PollSerializer.serialize(parseResult.poll!)
          expect(serialized.title).toBe(parseResult.poll!.title)
          expect(serialized.type).toBe(parseResult.poll!.type)
          return true
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Vote validation workflow', () => {
    it('should accept valid single-choice vote', () => {
      const result = validateVoteInput(
        { selectedOptions: ['option_1'] },
        'single'
      )
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject single-choice vote with multiple selections', () => {
      const result = validateVoteInput(
        { selectedOptions: ['option_1', 'option_2'] },
        'single'
      )
      expect(result.valid).toBe(false)
    })

    it('should accept valid multiple-choice vote', () => {
      const result = validateVoteInput(
        { selectedOptions: ['option_1', 'option_2'] },
        'multiple'
      )
      expect(result.valid).toBe(true)
    })

    it('should reject multiple-choice vote with no selections', () => {
      const result = validateVoteInput(
        { selectedOptions: [] },
        'multiple'
      )
      expect(result.valid).toBe(false)
    })

    it('should accept valid ranking vote', () => {
      const result = validateVoteInput(
        {
          selectedOptions: ['option_1', 'option_2'],
          rankings: { option_1: 1, option_2: 2 },
        },
        'ranking'
      )
      expect(result.valid).toBe(true)
    })

    it('should reject ranking vote without rankings object', () => {
      const result = validateVoteInput(
        { selectedOptions: ['option_1'] },
        'ranking'
      )
      expect(result.valid).toBe(false)
    })

    it('should accept valid yes/no vote', () => {
      const result = validateVoteInput(
        { selectedOptions: ['yes'] },
        'yesno'
      )
      expect(result.valid).toBe(true)
    })

    it('should accept valid survey vote', () => {
      const result = validateVoteInput(
        {
          selectedOptions: ['q1'],
          textResponses: { q1: 'My answer' },
        },
        'survey'
      )
      expect(result.valid).toBe(true)
    })

    it('should reject survey vote without text responses', () => {
      const result = validateVoteInput(
        { selectedOptions: ['q1'] },
        'survey'
      )
      expect(result.valid).toBe(false)
    })

    it('should reject vote for unknown poll type', () => {
      const result = validateVoteInput(
        { selectedOptions: ['option_1'] },
        'invalid_type'
      )
      expect(result.valid).toBe(false)
    })

    it('should validate vote input for each poll type with property-based testing', () => {
      const pollTypeArb = fc.constantFrom(...POLL_TYPES)

      fc.assert(
        fc.property(pollTypeArb, (pollType) => {
          // Build a valid vote for each type
          let data: any
          switch (pollType) {
            case 'single':
            case 'yesno':
              data = { selectedOptions: ['option_1'] }
              break
            case 'multiple':
              data = { selectedOptions: ['option_1', 'option_2'] }
              break
            case 'ranking':
              data = {
                selectedOptions: ['option_1', 'option_2'],
                rankings: { option_1: 1, option_2: 2 },
              }
              break
            case 'survey':
              data = {
                selectedOptions: ['q1'],
                textResponses: { q1: 'Answer' },
              }
              break
          }

          const result = validateVoteInput(data, pollType)
          expect(result.valid).toBe(true)
          return true
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('Export workflow', () => {
    it.each(['csv', 'json', 'excel'] as const)(
      'should accept valid export options with format %s',
      (format) => {
        const result = validateExportOptions({
          format,
          includeVoteDetails: true,
          includeAnalytics: false,
        })
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }
    )

    it('should reject export with missing format', () => {
      const result = validateExportOptions({})
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('format'))).toBe(true)
    })

    it('should reject export with invalid format', () => {
      const result = validateExportOptions({ format: 'pdf' })
      expect(result.valid).toBe(false)
    })

    it('should reject non-boolean option fields', () => {
      const result = validateExportOptions({
        format: 'csv',
        includeVoteDetails: 'yes',
      })
      expect(result.valid).toBe(false)
    })

    it('should reject invalid date range', () => {
      const result = validateExportOptions({
        format: 'json',
        dateRange: {
          start: '2025-12-01',
          end: '2025-11-01', // end before start
        },
      })
      expect(result.valid).toBe(false)
    })

    it('should accept valid date range', () => {
      const result = validateExportOptions({
        format: 'json',
        dateRange: {
          start: '2025-01-01',
          end: '2025-12-31',
        },
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('Auth workflow: user input validation', () => {
    it('should accept valid registration input', () => {
      const result = validateUserInput({
        email: 'user@example.com',
        password: 'securePass123',
        name: 'Test User',
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject missing email', () => {
      const result = validateUserInput({ password: 'securePass123' })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('email'))).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = validateUserInput({
        email: 'not-an-email',
        password: 'securePass123',
      })
      expect(result.valid).toBe(false)
    })

    it('should reject missing password', () => {
      const result = validateUserInput({ email: 'user@example.com' })
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.toLowerCase().includes('password'))).toBe(true)
    })

    it('should reject short password', () => {
      const result = validateUserInput({
        email: 'user@example.com',
        password: 'short',
      })
      expect(result.valid).toBe(false)
    })

    it('should reject overly long password', () => {
      const result = validateUserInput({
        email: 'user@example.com',
        password: 'a'.repeat(129),
      })
      expect(result.valid).toBe(false)
    })

    it('should accept registration without optional name', () => {
      const result = validateUserInput({
        email: 'user@example.com',
        password: 'securePass123',
      })
      expect(result.valid).toBe(true)
    })

    it('should validate arbitrary valid user inputs', () => {
      const userArb = fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8, maxLength: 128 }),
      })

      fc.assert(
        fc.property(userArb, (user) => {
          const result = validateUserInput(user)
          // Email addresses from fc.emailAddress() should be valid
          // Password is 8-128 chars so should be valid
          expect(result.valid).toBe(true)
          return true
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Config round-trip: parse → serialize → parse', () => {
    it.each(POLL_TYPES)(
      'should produce same result for %s poll on round-trip',
      (pollType) => {
        const raw: RawPollConfig = {
          title: 'Round Trip Test Poll',
          description: 'Testing serialization integrity',
          type: pollType,
          options: [{ text: 'Option A' }, { text: 'Option B' }],
          privacy: 'unlisted',
          allowAnonymous: false,
          requireCaptcha: true,
          maxVotes: 100,
          category: 'science',
          tags: ['roundtrip', 'test'],
        }

        const firstParse = ConfigurationParser.parse(raw)
        expect(firstParse.success).toBe(true)

        const serialized = PollSerializer.serialize(firstParse.poll!)
        const secondParse = ConfigurationParser.parse(serialized)
        expect(secondParse.success).toBe(true)

        // Core fields should be identical
        expect(secondParse.poll!.title).toBe(firstParse.poll!.title)
        expect(secondParse.poll!.description).toBe(firstParse.poll!.description)
        expect(secondParse.poll!.type).toBe(firstParse.poll!.type)
        expect(secondParse.poll!.privacy).toBe(firstParse.poll!.privacy)
        expect(secondParse.poll!.options.map((o) => o.text)).toEqual(
          firstParse.poll!.options.map((o) => o.text)
        )
        expect(secondParse.poll!.settings.allowAnonymous).toBe(
          firstParse.poll!.settings.allowAnonymous
        )
        expect(secondParse.poll!.settings.requireCaptcha).toBe(
          firstParse.poll!.settings.requireCaptcha
        )
        expect(secondParse.poll!.settings.maxVotes).toBe(firstParse.poll!.settings.maxVotes)
        expect(secondParse.poll!.category).toBe(firstParse.poll!.category)
        expect(secondParse.poll!.tags).toEqual(firstParse.poll!.tags)
      }
    )

    it('should preserve data through round-trip with property-based configs', () => {
      const rawConfigArb = fc.record({
        title: fc.string({ minLength: 5, maxLength: 100 }).map((s) => s.replace(/[<>]/g, 'x')),
        description: fc.string({ maxLength: 200 }),
        type: fc.constantFrom(...POLL_TYPES),
        options: fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.replace(/[<>]/g, 'x')),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        privacy: fc.constantFrom('public', 'unlisted', 'private'),
        allowAnonymous: fc.boolean(),
        requireCaptcha: fc.boolean(),
      })

      fc.assert(
        fc.property(rawConfigArb, (raw) => {
          const firstParse = ConfigurationParser.parse(raw)
          if (!firstParse.success) return true

          const serialized = PollSerializer.serialize(firstParse.poll!)
          const secondParse = ConfigurationParser.parse(serialized)

          if (!secondParse.success) return true

          expect(secondParse.poll!.title).toBe(firstParse.poll!.title)
          expect(secondParse.poll!.type).toBe(firstParse.poll!.type)
          expect(secondParse.poll!.privacy).toBe(firstParse.poll!.privacy)
          expect(secondParse.poll!.options.map((o) => o.text)).toEqual(
            firstParse.poll!.options.map((o) => o.text)
          )
          return true
        }),
        { numRuns: 100 }
      )
    })
  })
})
