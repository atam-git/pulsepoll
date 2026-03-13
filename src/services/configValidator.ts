import { PollConfig } from './configParser'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const VALID_CATEGORIES = [
  'politics', 'technology', 'sports', 'entertainment',
  'science', 'education', 'health', 'business',
  'lifestyle', 'other'
]

const CHOICE_BASED_TYPES = ['single', 'multiple', 'ranking', 'yesno']

/**
 * Configuration Validator for parsed poll configs
 */
export class ConfigurationValidator {
  /**
   * Validate a parsed poll config
   */
  static validate(config: PollConfig): ValidationResult {
    const errors: ValidationError[] = []

    // Validate title: 5-200 characters
    if (config.title.length < 5) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 5 characters long',
        code: 'TITLE_TOO_SHORT'
      })
    } else if (config.title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title cannot exceed 200 characters',
        code: 'TITLE_TOO_LONG'
      })
    }

    // Validate description: max 500 characters
    if (config.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters',
        code: 'DESCRIPTION_TOO_LONG'
      })
    }

    // Validate options for choice-based types
    if (CHOICE_BASED_TYPES.includes(config.type)) {
      if (config.options.length < 2) {
        errors.push({
          field: 'options',
          message: 'Choice-based polls must have at least 2 options',
          code: 'TOO_FEW_OPTIONS'
        })
      }
    }

    // Validate individual option text: max 200 chars
    config.options.forEach((option, index) => {
      if (option.text.length > 200) {
        errors.push({
          field: `options[${index}].text`,
          message: `Option ${index + 1} text cannot exceed 200 characters`,
          code: 'OPTION_TEXT_TOO_LONG'
        })
      }
    })

    // Validate expiration date must be in the future
    if (config.settings.expiresAt) {
      if (config.settings.expiresAt <= new Date()) {
        errors.push({
          field: 'settings.expiresAt',
          message: 'Expiration date must be in the future',
          code: 'EXPIRATION_IN_PAST'
        })
      }
    }

    // Validate maxVotes must be >= 1 if set
    if (config.settings.maxVotes !== undefined) {
      if (config.settings.maxVotes < 1) {
        errors.push({
          field: 'settings.maxVotes',
          message: 'Maximum votes must be at least 1',
          code: 'INVALID_MAX_VOTES'
        })
      }
    }

    // Validate privacy
    const validPrivacyValues = ['public', 'unlisted', 'private']
    if (!validPrivacyValues.includes(config.privacy)) {
      errors.push({
        field: 'privacy',
        message: `Privacy must be one of: ${validPrivacyValues.join(', ')}`,
        code: 'INVALID_PRIVACY'
      })
    }

    // Validate category if provided
    if (config.category) {
      if (!VALID_CATEGORIES.includes(config.category)) {
        errors.push({
          field: 'category',
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY'
        })
      }
    }

    // Validate tags: max 10 tags, each max 30 chars
    if (config.tags) {
      if (config.tags.length > 10) {
        errors.push({
          field: 'tags',
          message: 'Cannot have more than 10 tags',
          code: 'TOO_MANY_TAGS'
        })
      }

      config.tags.forEach((tag, index) => {
        if (tag.length > 30) {
          errors.push({
            field: `tags[${index}]`,
            message: `Tag "${tag}" cannot exceed 30 characters`,
            code: 'TAG_TOO_LONG'
          })
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
