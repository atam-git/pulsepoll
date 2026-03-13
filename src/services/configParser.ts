export interface RawPollConfig {
  title?: string
  description?: string
  type?: string
  options?: Array<{ text?: string; description?: string }>
  privacy?: string
  expiresAt?: string | Date
  maxVotes?: number
  allowAnonymous?: boolean
  requireCaptcha?: boolean
  category?: string
  tags?: string[]
}

export interface PollConfig {
  title: string
  description: string
  type: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  options: Array<{ id: string; text: string; description?: string; voteCount: number }>
  privacy: 'public' | 'unlisted' | 'private'
  settings: {
    allowAnonymous: boolean
    requireCaptcha: boolean
    expiresAt?: Date
    maxVotes?: number
  }
  category?: string
  tags?: string[]
}

export interface ParseResult {
  success: boolean
  poll?: PollConfig
  errors?: string[]
}

const VALID_POLL_TYPES = ['single', 'multiple', 'ranking', 'yesno', 'survey'] as const
const VALID_PRIVACY_VALUES = ['public', 'unlisted', 'private'] as const

/**
 * Configuration Parser for raw poll configs
 */
export class ConfigurationParser {
  /**
   * Parse raw poll config into a structured PollConfig
   */
  static parse(config: RawPollConfig): ParseResult {
    const errors: string[] = []

    // Parse title
    if (!config.title || typeof config.title !== 'string' || config.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string')
    }

    // Parse description
    const description = typeof config.description === 'string' ? config.description : ''

    // Parse type
    const type = config.type as typeof VALID_POLL_TYPES[number] | undefined
    if (!type || !VALID_POLL_TYPES.includes(type as any)) {
      errors.push(`Invalid poll type. Must be one of: ${VALID_POLL_TYPES.join(', ')}`)
    }

    // Parse options
    const parsedOptions: PollConfig['options'] = []
    if (!config.options || !Array.isArray(config.options) || config.options.length === 0) {
      errors.push('Options are required and must be a non-empty array')
    } else {
      config.options.forEach((option, index) => {
        if (!option.text || typeof option.text !== 'string' || option.text.trim().length === 0) {
          errors.push(`Option ${index + 1} must have a non-empty text field`)
        } else {
          parsedOptions.push({
            id: `option_${index + 1}`,
            text: option.text.trim(),
            ...(option.description && { description: option.description }),
            voteCount: 0
          })
        }
      })
    }

    // Parse privacy
    let privacy: PollConfig['privacy'] = 'public'
    if (config.privacy) {
      if (VALID_PRIVACY_VALUES.includes(config.privacy as any)) {
        privacy = config.privacy as PollConfig['privacy']
      } else {
        errors.push(`Invalid privacy value. Must be one of: ${VALID_PRIVACY_VALUES.join(', ')}`)
      }
    }

    // Parse settings
    let expiresAt: Date | undefined
    if (config.expiresAt) {
      const date = config.expiresAt instanceof Date ? config.expiresAt : new Date(config.expiresAt)
      if (isNaN(date.getTime())) {
        errors.push('Invalid expiration date format')
      } else {
        expiresAt = date
      }
    }

    let maxVotes: number | undefined
    if (config.maxVotes !== undefined) {
      if (typeof config.maxVotes !== 'number' || !Number.isFinite(config.maxVotes)) {
        errors.push('maxVotes must be a valid number')
      } else {
        maxVotes = config.maxVotes
      }
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }

    const poll: PollConfig = {
      title: config.title!.trim(),
      description,
      type: type as PollConfig['type'],
      options: parsedOptions,
      privacy,
      settings: {
        allowAnonymous: config.allowAnonymous ?? false,
        requireCaptcha: config.requireCaptcha ?? false,
        ...(expiresAt && { expiresAt }),
        ...(maxVotes !== undefined && { maxVotes })
      },
      ...(config.category && { category: config.category }),
      ...(config.tags && { tags: config.tags })
    }

    return { success: true, poll }
  }
}
