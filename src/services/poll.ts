import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import connectDB from '@/lib/mongodb'

export interface PollValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface PollCreationData {
  title: string
  description?: string
  type: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  options: Array<{
    text: string
    type?: string // For survey questions
  }>
  settings?: {
    allowMultipleVotes?: boolean
    requireAuth?: boolean
    showResults?: boolean
    allowComments?: boolean
    expiresAt?: Date | string
    maxVotesPerUser?: number
  }
  privacy?: {
    isPublic?: boolean
    allowAnonymous?: boolean
    requireEmailVerification?: boolean
    restrictedDomains?: string[]
  }
  tags?: string[]
}

/**
 * Poll Service for business logic and validation
 */
export class PollService {
  /**
   * Validate poll creation data
   */
  static validatePollData(data: PollCreationData): PollValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required')
    } else if (data.title.length > 200) {
      errors.push('Title cannot exceed 200 characters')
    } else if (data.title.length < 3) {
      warnings.push('Title is very short, consider making it more descriptive')
    }

    // Validate description
    if (data.description && data.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters')
    }

    // Validate poll type
    const validTypes = ['single', 'multiple', 'ranking', 'yesno', 'survey']
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('Invalid poll type')
    }

    // Validate options based on poll type
    if (!data.options || !Array.isArray(data.options)) {
      errors.push('Options are required')
    } else {
      switch (data.type) {
        case 'yesno':
          if (data.options.length !== 2) {
            errors.push('Yes/No polls must have exactly 2 options')
          }
          break
        case 'single':
        case 'multiple':
        case 'ranking':
          if (data.options.length < 2) {
            errors.push('Choice-based polls must have at least 2 options')
          } else if (data.options.length > 20) {
            warnings.push('Polls with many options may be difficult for users to navigate')
          }
          break
        case 'survey':
          if (data.options.length < 1) {
            errors.push('Survey polls must have at least 1 question')
          } else if (data.options.length > 50) {
            warnings.push('Very long surveys may have lower completion rates')
          }
          break
      }

      // Validate individual options
      data.options.forEach((option, index) => {
        const text = typeof option === 'string' ? option : option.text
        if (!text || text.trim().length === 0) {
          errors.push(`Option ${index + 1} cannot be empty`)
        } else if (text.length > 500) {
          errors.push(`Option ${index + 1} cannot exceed 500 characters`)
        }
      })

      // Check for duplicate options
      const optionTexts = data.options.map(opt => 
        (typeof opt === 'string' ? opt : opt.text).toLowerCase().trim()
      )
      const duplicates = optionTexts.filter((text, index) => 
        optionTexts.indexOf(text) !== index
      )
      if (duplicates.length > 0) {
        errors.push('Duplicate options are not allowed')
      }
    }

    // Validate settings
    if (data.settings) {
      if (data.settings.expiresAt) {
        const expirationDate = new Date(data.settings.expiresAt)
        if (isNaN(expirationDate.getTime())) {
          errors.push('Invalid expiration date format')
        } else if (expirationDate <= new Date()) {
          errors.push('Expiration date must be in the future')
        } else if (expirationDate.getTime() - Date.now() > 365 * 24 * 60 * 60 * 1000) {
          warnings.push('Expiration date is more than a year in the future')
        }
      }

      if (data.settings.maxVotesPerUser !== undefined) {
        if (data.settings.maxVotesPerUser < 1) {
          errors.push('Maximum votes per user must be at least 1')
        } else if (data.settings.maxVotesPerUser > 100) {
          warnings.push('Very high vote limits may affect poll integrity')
        }
      }
    }

    // Validate privacy settings
    if (data.privacy?.restrictedDomains) {
      data.privacy.restrictedDomains.forEach((domain, index) => {
        if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
          errors.push(`Invalid domain format at index ${index}`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Check if a poll can be edited
   */
  static async canEditPoll(pollId: string, userId: string, userRole: string): Promise<{
    canEdit: boolean
    reason?: string
    allowedFields?: string[]
  }> {
    try {
      await connectDB()
      
      const poll = await Poll.findById(pollId)
      if (!poll) {
        return { canEdit: false, reason: 'Poll not found' }
      }

      // Check ownership or admin role
      if (poll.createdBy.toString() !== userId && userRole !== 'admin') {
        return { canEdit: false, reason: 'Access denied' }
      }

      // Check if poll has votes
      if (poll.metadata.totalVotes > 0) {
        return {
          canEdit: true,
          reason: 'Limited editing due to existing votes',
          allowedFields: [
            'description',
            'settings.showResults',
            'settings.allowComments',
            'privacy.isPublic'
          ]
        }
      }

      return { canEdit: true }
    } catch (error) {
      console.error('Error checking poll edit permissions:', error)
      return { canEdit: false, reason: 'Internal error' }
    }
  }

  /**
   * Check if a poll can be deleted
   */
  static async canDeletePoll(pollId: string, userId: string, userRole: string): Promise<{
    canDelete: boolean
    reason?: string
    requiresConfirmation?: boolean
  }> {
    try {
      await connectDB()
      
      const poll = await Poll.findById(pollId)
      if (!poll) {
        return { canDelete: false, reason: 'Poll not found' }
      }

      // Check ownership or admin role
      if (poll.createdBy.toString() !== userId && userRole !== 'admin') {
        return { canDelete: false, reason: 'Access denied' }
      }

      // Check if poll has votes
      if (poll.metadata.totalVotes > 0) {
        return {
          canDelete: true,
          requiresConfirmation: true,
          reason: 'Poll has votes and deletion cannot be undone'
        }
      }

      return { canDelete: true }
    } catch (error) {
      console.error('Error checking poll delete permissions:', error)
      return { canDelete: false, reason: 'Internal error' }
    }
  }

  /**
   * Get poll statistics
   */
  static async getPollStatistics(pollId: string): Promise<{
    totalVotes: number
    uniqueVoters: number
    votesByOption: Record<string, number>
    votesByDate: Record<string, number>
    averageVotesPerDay: number
    completionRate?: number // For surveys
  } | null> {
    try {
      await connectDB()
      
      const poll = await Poll.findById(pollId)
      if (!poll) return null

      const votes = await Vote.find({ pollId }).lean()
      
      const stats = {
        totalVotes: poll.metadata.totalVotes,
        uniqueVoters: poll.metadata.uniqueVoters,
        votesByOption: {} as Record<string, number>,
        votesByDate: {} as Record<string, number>,
        averageVotesPerDay: 0
      }

      // Calculate votes by option
      poll.options.forEach((option: any) => {
        stats.votesByOption[option.id] = option.voteCount
      })

      // Calculate votes by date
      votes.forEach(vote => {
        const date = vote.createdAt.toISOString().split('T')[0]
        stats.votesByDate[date] = (stats.votesByDate[date] || 0) + 1
      })

      // Calculate average votes per day
      const daysSinceCreation = Math.max(1, 
        Math.ceil((Date.now() - poll.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      )
      stats.averageVotesPerDay = stats.totalVotes / daysSinceCreation

      return stats
    } catch (error) {
      console.error('Error getting poll statistics:', error)
      return null
    }
  }

  /**
   * Archive expired polls
   */
  static async archiveExpiredPolls(): Promise<number> {
    try {
      await connectDB()
      
      const now = new Date()
      const result = await Poll.updateMany(
        {
          'settings.expiresAt': { $lte: now },
          'metadata.status': { $ne: 'archived' }
        },
        {
          $set: {
            'metadata.status': 'archived',
            'metadata.statusReason': 'Automatically archived due to expiration',
            'metadata.statusChangedAt': now,
            'metadata.updatedAt': now
          }
        }
      )

      return result.modifiedCount
    } catch (error) {
      console.error('Error archiving expired polls:', error)
      return 0
    }
  }

  /**
   * Get trending polls
   */
  static async getTrendingPolls(limit: number = 10): Promise<any[]> {
    try {
      await connectDB()
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      // Get polls with recent activity
      const trendingPolls = await Poll.aggregate([
        {
          $match: {
            'privacy.isPublic': true,
            'metadata.status': 'active',
            'metadata.updatedAt': { $gte: oneDayAgo }
          }
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ['$metadata.totalVotes', 1] },
                { $multiply: ['$metadata.uniqueVoters', 2] }
              ]
            }
          }
        },
        {
          $sort: { trendingScore: -1, 'metadata.updatedAt': -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'creator',
            pipeline: [{ $project: { email: 1 } }]
          }
        }
      ])

      return trendingPolls
    } catch (error) {
      console.error('Error getting trending polls:', error)
      return []
    }
  }
}