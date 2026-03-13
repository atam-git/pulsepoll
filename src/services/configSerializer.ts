import { PollConfig, RawPollConfig } from './configParser'

/**
 * Poll Serializer for converting PollConfig back to raw config format
 */
export class PollSerializer {
  /**
   * Convert PollConfig back to RawPollConfig
   * Ensures round-trip integrity: parse(serialize(parse(raw))) === parse(raw)
   */
  static serialize(poll: PollConfig): RawPollConfig {
    const raw: RawPollConfig = {
      title: poll.title,
      description: poll.description,
      type: poll.type,
      options: poll.options.map(option => ({
        text: option.text,
        ...(option.description && { description: option.description })
      })),
      privacy: poll.privacy,
      allowAnonymous: poll.settings.allowAnonymous,
      requireCaptcha: poll.settings.requireCaptcha
    }

    // Handle date serialization: Date -> ISO string
    if (poll.settings.expiresAt) {
      raw.expiresAt = poll.settings.expiresAt.toISOString()
    }

    if (poll.settings.maxVotes !== undefined) {
      raw.maxVotes = poll.settings.maxVotes
    }

    if (poll.category) {
      raw.category = poll.category
    }

    if (poll.tags) {
      raw.tags = [...poll.tags]
    }

    return raw
  }
}
