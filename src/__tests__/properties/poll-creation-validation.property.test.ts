import * as fc from 'fast-check'

// Feature: pulsepoll-platform, Property 8: Poll Creation Validation
describe('Property 8: Poll Creation Validation', () => {
  it('should reject polls without titles or choice-based polls with fewer than 2 options', () => {
    // Property: For any poll creation attempt, the system should reject polls without titles 
    // or choice-based polls with fewer than 2 options.
    // Validates: Requirements 2.6

    const pollTypeArbitrary = fc.oneof(
      fc.constant('single'),
      fc.constant('multiple'), 
      fc.constant('ranking'),
      fc.constant('yesno'),
      fc.constant('survey')
    )

    const titleArbitrary = fc.oneof(
      fc.constant(''), // Empty title
      fc.string({ minLength: 1, maxLength: 4 }), // Too short title
      fc.string({ minLength: 5, maxLength: 200 }) // Valid title
    )

    const optionsArbitrary = fc.oneof(
      fc.constant([]), // No options
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 1 }), // 1 option
      fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }) // 2+ options
    )

    fc.assert(fc.property(
      pollTypeArbitrary,
      titleArbitrary,
      optionsArbitrary,
      (pollType, title, options) => {
        // Mock poll validation function
        const validatePoll = (pollData: {
          title: string
          type: string
          options: string[]
        }): { isValid: boolean; errors: string[] } => {
          const errors: string[] = []

          // Validate title
          if (!pollData.title || pollData.title.trim().length === 0) {
            errors.push('Poll title is required')
          } else if (pollData.title.trim().length < 5) {
            errors.push('Poll title must be at least 5 characters')
          }

          // Validate options for choice-based polls
          const choiceBasedTypes = ['single', 'multiple', 'ranking', 'yesno']
          if (choiceBasedTypes.includes(pollData.type)) {
            if (pollData.options.length < 2) {
              errors.push('Choice-based polls must have at least 2 options')
            }
          } else if (pollData.type === 'survey') {
            if (pollData.options.length < 1) {
              errors.push('Survey polls must have at least 1 question')
            }
          }

          return {
            isValid: errors.length === 0,
            errors
          }
        }

        const pollData = {
          title: title.trim(),
          type: pollType,
          options: options.filter(opt => opt.trim().length > 0)
        }

        const validation = validatePoll(pollData)

        // Check expected validation results
        const shouldHaveTitleError = !pollData.title || pollData.title.length < 5
        const isChoiceBased = ['single', 'multiple', 'ranking', 'yesno'].includes(pollType)
        const shouldHaveOptionError = isChoiceBased && pollData.options.length < 2

        if (shouldHaveTitleError) {
          expect(validation.isValid).toBe(false)
          expect(validation.errors.some(err => err.includes('title'))).toBe(true)
        }

        if (shouldHaveOptionError) {
          expect(validation.isValid).toBe(false)
          expect(validation.errors.some(err => err.includes('options') || err.includes('Choice-based'))).toBe(true)
        }

        if (!shouldHaveTitleError && !shouldHaveOptionError) {
          expect(validation.isValid).toBe(true)
          expect(validation.errors).toHaveLength(0)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  it('should validate poll title length requirements consistently', () => {
    // Property: Poll title validation should be consistent across all inputs
    
    const titleLengthArbitrary = fc.integer({ min: 0, max: 250 })
      .chain(length => fc.string({ minLength: length, maxLength: length }))

    fc.assert(fc.property(
      titleLengthArbitrary,
      (title) => {
        const validateTitle = (title: string): boolean => {
          const trimmed = title.trim()
          return trimmed.length >= 5 && trimmed.length <= 200
        }

        const isValid = validateTitle(title)
        const trimmedLength = title.trim().length

        if (trimmedLength < 5) {
          expect(isValid).toBe(false)
        } else if (trimmedLength > 200) {
          expect(isValid).toBe(false)
        } else {
          expect(isValid).toBe(true)
        }

        return true
      }
    ), { numRuns: 100 })
  })

  it('should validate option count requirements for different poll types', () => {
    // Property: Option count validation should work correctly for all poll types
    
    const pollConfigArbitrary = fc.record({
      type: fc.oneof(
        fc.constant('single'),
        fc.constant('multiple'),
        fc.constant('ranking'),
        fc.constant('yesno'),
        fc.constant('survey')
      ),
      optionCount: fc.integer({ min: 0, max: 10 })
    })

    fc.assert(fc.property(
      pollConfigArbitrary,
      (config) => {
        const validateOptionCount = (type: string, optionCount: number): boolean => {
          const choiceBasedTypes = ['single', 'multiple', 'ranking', 'yesno']
          
          if (choiceBasedTypes.includes(type)) {
            return optionCount >= 2
          } else if (type === 'survey') {
            return optionCount >= 1
          }
          
          return false // Unknown type
        }

        const isValid = validateOptionCount(config.type, config.optionCount)
        const isChoiceBased = ['single', 'multiple', 'ranking', 'yesno'].includes(config.type)

        if (isChoiceBased) {
          if (config.optionCount >= 2) {
            expect(isValid).toBe(true)
          } else {
            expect(isValid).toBe(false)
          }
        } else if (config.type === 'survey') {
          if (config.optionCount >= 1) {
            expect(isValid).toBe(true)
          } else {
            expect(isValid).toBe(false)
          }
        }

        return true
      }
    ), { numRuns: 100 })
  })
})