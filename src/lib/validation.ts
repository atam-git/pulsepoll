import { NextRequest, NextResponse } from 'next/server'

/**
 * Input validation and sanitization for PulsePoll platform
 * Prevents XSS, validates API inputs, and provides middleware for request validation
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// Valid poll types
const VALID_POLL_TYPES = ['single', 'multiple', 'ranking', 'yesno', 'survey'] as const
const VALID_PRIVACY_OPTIONS = ['public', 'unlisted', 'private'] as const
const VALID_EXPORT_FORMATS = ['csv', 'json', 'excel'] as const

// Choice-based poll types that require at least 2 options
const CHOICE_POLL_TYPES = ['single', 'multiple', 'ranking', 'yesno']

/**
 * Sanitize a string by stripping HTML tags and encoding special characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''

  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Encode special HTML characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove null bytes
    .replace(/\0/g, '')
    .trim()
}

/**
 * Validate poll creation input
 */
export function validatePollInput(data: any): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid object'] }
  }

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string')
  } else {
    const title = data.title.trim()
    if (title.length < 5) {
      errors.push('Title must be at least 5 characters')
    }
    if (title.length > 200) {
      errors.push('Title cannot exceed 200 characters')
    }
  }

  // Description validation (optional)
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string')
    } else if (data.description.length > 500) {
      errors.push('Description cannot exceed 500 characters')
    }
  }

  // Type validation
  if (!data.type || typeof data.type !== 'string') {
    errors.push('Poll type is required and must be a string')
  } else if (!VALID_POLL_TYPES.includes(data.type as any)) {
    errors.push(`Poll type must be one of: ${VALID_POLL_TYPES.join(', ')}`)
  }

  // Options validation
  if (!data.options || !Array.isArray(data.options)) {
    errors.push('Options are required and must be an array')
  } else {
    // Choice-based polls need at least 2 options
    if (CHOICE_POLL_TYPES.includes(data.type) && data.options.length < 2) {
      errors.push('Choice-based polls must have at least 2 options')
    }

    if (data.options.length < 1) {
      errors.push('At least 1 option is required')
    }

    for (let i = 0; i < data.options.length; i++) {
      const option = data.options[i]
      if (!option || typeof option !== 'object') {
        errors.push(`Option ${i + 1} must be a valid object`)
        continue
      }
      if (!option.text || typeof option.text !== 'string') {
        errors.push(`Option ${i + 1} text is required and must be a string`)
      } else if (option.text.trim().length === 0) {
        errors.push(`Option ${i + 1} text cannot be empty`)
      } else if (option.text.length > 200) {
        errors.push(`Option ${i + 1} text cannot exceed 200 characters`)
      }
    }
  }

  // Privacy validation (optional, defaults to 'public')
  if (data.privacy !== undefined && data.privacy !== null) {
    if (typeof data.privacy !== 'string' || !VALID_PRIVACY_OPTIONS.includes(data.privacy as any)) {
      errors.push(`Privacy must be one of: ${VALID_PRIVACY_OPTIONS.join(', ')}`)
    }
  }

  // Category validation (optional)
  if (data.category !== undefined && data.category !== null) {
    if (typeof data.category !== 'string') {
      errors.push('Category must be a string')
    } else if (data.category.length > 50) {
      errors.push('Category cannot exceed 50 characters')
    }
  }

  // Tags validation (optional)
  if (data.tags !== undefined && data.tags !== null) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (data.tags.length > 10) {
        errors.push('Maximum 10 tags allowed')
      }
      for (const tag of data.tags) {
        if (typeof tag !== 'string') {
          errors.push('Each tag must be a string')
          break
        }
        if (tag.length > 30) {
          errors.push('Each tag must be 30 characters or less')
          break
        }
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate vote submission input
 */
export function validateVoteInput(data: any, pollType: string): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid object'] }
  }

  // Validate selectedOptions based on poll type
  switch (pollType) {
    case 'single':
    case 'yesno':
      if (!data.selectedOptions || !Array.isArray(data.selectedOptions)) {
        errors.push('selectedOptions is required and must be an array')
      } else if (data.selectedOptions.length !== 1) {
        errors.push('Exactly one option must be selected for this poll type')
      } else if (typeof data.selectedOptions[0] !== 'string') {
        errors.push('Selected option must be a string')
      }
      break

    case 'multiple':
      if (!data.selectedOptions || !Array.isArray(data.selectedOptions)) {
        errors.push('selectedOptions is required and must be an array')
      } else if (data.selectedOptions.length < 1) {
        errors.push('At least one option must be selected')
      } else {
        for (const opt of data.selectedOptions) {
          if (typeof opt !== 'string') {
            errors.push('Each selected option must be a string')
            break
          }
        }
      }
      break

    case 'ranking':
      if (!data.rankings || typeof data.rankings !== 'object') {
        errors.push('rankings is required and must be an object')
      } else {
        const entries = Object.entries(data.rankings)
        if (entries.length < 1) {
          errors.push('At least one ranking must be provided')
        }
        for (const [key, value] of entries) {
          if (typeof key !== 'string') {
            errors.push('Ranking keys must be strings')
            break
          }
          if (typeof value !== 'number' || !Number.isInteger(value) || (value as number) < 1) {
            errors.push('Ranking values must be positive integers')
            break
          }
        }
      }
      // Rankings also need selectedOptions for the Vote model
      if (!data.selectedOptions || !Array.isArray(data.selectedOptions)) {
        errors.push('selectedOptions is required and must be an array')
      }
      break

    case 'survey':
      if (!data.textResponses || typeof data.textResponses !== 'object') {
        errors.push('textResponses is required and must be an object')
      } else {
        for (const [key, value] of Object.entries(data.textResponses)) {
          if (typeof value !== 'string') {
            errors.push('Text response values must be strings')
            break
          }
          if ((value as string).length > 2000) {
            errors.push('Text response cannot exceed 2000 characters')
            break
          }
        }
      }
      // Survey also needs selectedOptions for the Vote model
      if (!data.selectedOptions || !Array.isArray(data.selectedOptions)) {
        errors.push('selectedOptions is required and must be an array')
      }
      break

    default:
      errors.push(`Unknown poll type: ${pollType}`)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate user registration input
 */
export function validateUserInput(data: any): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid object'] }
  }

  // Email validation
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Please provide a valid email address')
    }
    if (data.email.length > 254) {
      errors.push('Email cannot exceed 254 characters')
    }
  }

  // Password validation
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required and must be a string')
  } else {
    if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (data.password.length > 128) {
      errors.push('Password cannot exceed 128 characters')
    }
  }

  // Name validation (optional)
  if (data.name !== undefined && data.name !== null) {
    if (typeof data.name !== 'string') {
      errors.push('Name must be a string')
    } else if (data.name.length > 100) {
      errors.push('Name cannot exceed 100 characters')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate export options
 */
export function validateExportOptions(data: any): ValidationResult {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a valid object'] }
  }

  // Format validation
  if (!data.format || typeof data.format !== 'string') {
    errors.push('Export format is required and must be a string')
  } else if (!VALID_EXPORT_FORMATS.includes(data.format as any)) {
    errors.push(`Format must be one of: ${VALID_EXPORT_FORMATS.join(', ')}`)
  }

  // Boolean fields validation
  const booleanFields = ['includeVoteDetails', 'includeAnalytics', 'includeTimestamps', 'includeDemographics']
  for (const field of booleanFields) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`)
    }
  }

  // Date range validation
  if (data.dateRange !== undefined && data.dateRange !== null) {
    if (typeof data.dateRange !== 'object') {
      errors.push('dateRange must be an object')
    } else {
      const start = new Date(data.dateRange.start)
      const end = new Date(data.dateRange.end)

      if (isNaN(start.getTime())) {
        errors.push('dateRange.start must be a valid date')
      }
      if (isNaN(end.getTime())) {
        errors.push('dateRange.end must be a valid date')
      }
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
        errors.push('Start date must be before end date')
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Schema types for validation middleware
 */
type ValidationSchema = 'poll' | 'vote' | 'user' | 'export'

/**
 * Middleware wrapper that validates request body before passing to handler
 */
export function withValidation(schema: ValidationSchema) {
  return (
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>
  ) => {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        const body = await req.clone().json()

        let result: ValidationResult

        switch (schema) {
          case 'poll':
            result = validatePollInput(body)
            break
          case 'vote': {
            const pollType = body.pollType || 'single'
            result = validateVoteInput(body, pollType)
            break
          }
          case 'user':
            result = validateUserInput(body)
            break
          case 'export':
            result = validateExportOptions(body)
            break
          default:
            result = { valid: true, errors: [] }
        }

        if (!result.valid) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: result.errors
            },
            { status: 400 }
          )
        }

        return await handler(req, context)
      } catch (error) {
        // If body parsing fails, return validation error
        if (error instanceof SyntaxError) {
          return NextResponse.json(
            {
              error: 'Validation failed',
              details: ['Invalid JSON in request body']
            },
            { status: 400 }
          )
        }

        return await handler(req, context)
      }
    }
  }
}
