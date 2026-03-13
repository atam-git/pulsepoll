import mongoose, { Document, Schema } from 'mongoose'

export interface IPollOption {
  id: string
  text: string
  description?: string
  imageUrl?: string
  voteCount: number
}

export interface IPollFlag {
  reason: 'inappropriate' | 'spam' | 'offensive' | 'misleading' | 'other'
  description?: string
  flaggedBy: mongoose.Types.ObjectId
  flaggedAt: Date
}

export interface IPoll extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  type: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  category?: string
  tags?: string[]
  options: IPollOption[]
  privacy: 'public' | 'unlisted' | 'private'
  creatorId: mongoose.Types.ObjectId
  status: 'draft' | 'active' | 'expired' | 'closed'
  moderation: {
    isFlagged: boolean
    flags: IPollFlag[]
    reviewedBy?: mongoose.Types.ObjectId
    reviewedAt?: Date
    reviewNotes?: string
  }
  settings: {
    allowAnonymous: boolean
    requireCaptcha: boolean
    expiresAt?: Date
    maxVotes?: number
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    publishedAt?: Date
    totalVotes: number
    viewCount: number
  }
  analytics: {
    referralSources: Map<string, number>
    deviceTypes: Map<string, number>
    locations: Map<string, number>
  }
}

const PollOptionSchema = new Schema<IPollOption>({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  text: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, 'Option text cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Option description cannot exceed 500 characters']
  },
  imageUrl: {
    type: String,
    trim: true,
    maxlength: [1000, 'Image URL cannot exceed 1000 characters']
  },
  voteCount: {
    type: Number,
    default: 0,
    min: [0, 'Vote count cannot be negative']
  }
}, { _id: false })

// Add validation to ensure each option has either text or imageUrl
PollOptionSchema.pre('validate', function() {
  if (!this.text && !this.imageUrl) {
    throw new Error('Each option must have either text or an image')
  }
})

const PollSchema = new Schema<IPoll>({
  title: {
    type: String,
    required: false,
    trim: true,
    maxlength: [200, 'Poll title cannot exceed 200 characters'],
    default: ''
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Poll description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['single', 'multiple', 'ranking', 'yesno', 'survey'],
      message: 'Poll type must be one of: single, multiple, ranking, yesno, survey'
    },
    required: [true, 'Poll type is required']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    enum: {
      values: [
        'general', 'politics', 'technology', 'entertainment', 'sports', 
        'business', 'education', 'health', 'lifestyle', 'science',
        'food', 'travel', 'gaming', 'music', 'movies', 'books',
        'fashion', 'art', 'environment', 'social', 'other'
      ],
      message: 'Category must be a valid category'
    }
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 10 && tags.every(tag => tag.length <= 30)
      },
      message: 'Maximum 10 tags allowed, each tag must be 30 characters or less'
    }
  },
  options: {
    type: [PollOptionSchema],
    required: [true, 'Poll options are required'],
    validate: {
      validator: function(options: IPollOption[]) {
        // Basic validation - at least 1 option required
        return options.length >= 1
      },
      message: 'At least 1 option is required'
    }
  },
  privacy: {
    type: String,
    enum: {
      values: ['public', 'unlisted', 'private'],
      message: 'Privacy must be one of: public, unlisted, private'
    },
    default: 'public'
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'expired', 'closed'],
      message: 'Status must be one of: draft, active, expired, closed'
    },
    default: 'active'
  },
  moderation: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    flags: [{
      reason: {
        type: String,
        enum: ['inappropriate', 'spam', 'offensive', 'misleading', 'other'],
        required: true
      },
      description: {
        type: String,
        maxlength: [500, 'Flag description cannot exceed 500 characters']
      },
      flaggedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      flaggedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: {
      type: String,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters']
    }
  },
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    requireCaptcha: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      validate: {
        validator: function(date: Date) {
          return !date || date > new Date()
        },
        message: 'Expiration date must be in the future'
      }
    },
    maxVotes: {
      type: Number,
      min: [1, 'Maximum votes must be at least 1']
    }
  },
  metadata: {
    publishedAt: Date,
    totalVotes: {
      type: Number,
      default: 0,
      min: [0, 'Total votes cannot be negative']
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative']
    }
  },
  analytics: {
    referralSources: {
      type: Map,
      of: Number,
      default: new Map()
    },
    deviceTypes: {
      type: Map,
      of: Number,
      default: new Map()
    },
    locations: {
      type: Map,
      of: Number,
      default: new Map()
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt to metadata
  collection: 'polls'
})

// Indexes for performance
PollSchema.index({ creatorId: 1, createdAt: -1 })
PollSchema.index({ privacy: 1, status: 1, createdAt: -1 })
PollSchema.index({ 'metadata.totalVotes': -1 })
PollSchema.index({ 'settings.expiresAt': 1 })
PollSchema.index({ status: 1, 'settings.expiresAt': 1 })
PollSchema.index({ title: 'text', description: 'text' }) // Text search index
PollSchema.index({ category: 1, createdAt: -1 }) // Category filtering
PollSchema.index({ tags: 1 }) // Tag filtering
PollSchema.index({ privacy: 1, status: 1, category: 1, createdAt: -1 }) // Combined filtering
PollSchema.index({ 'moderation.isFlagged': 1, createdAt: -1 }) // Moderation queue
PollSchema.index({ 'moderation.reviewedAt': 1 }) // Reviewed polls

// Virtual for poll ID as string
PollSchema.virtual('id').get(function() {
  return this._id.toHexString()
})

// Ensure virtual fields are serialized
PollSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v
    return ret
  }
})

// Pre-save middleware to validate poll configuration
PollSchema.pre('save', function() {
  // Set publishedAt when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.metadata.publishedAt) {
    this.metadata.publishedAt = new Date()
  }

  // Validate expiration date
  if (this.settings.expiresAt && this.settings.expiresAt <= new Date()) {
    throw new Error('Expiration date must be in the future')
  }

  // Validate option count based on poll type
  if (['single', 'multiple', 'ranking', 'yesno'].includes(this.type) && this.options.length < 2) {
    throw new Error('Choice-based polls must have at least 2 options')
  }
})

// Static method to find polls by creator
PollSchema.statics.findByCreator = function(creatorId: string, filters?: any) {
  const query = { creatorId: new mongoose.Types.ObjectId(creatorId) }
  if (filters) {
    Object.assign(query, filters)
  }
  return this.find(query).sort({ createdAt: -1 })
}

// Static method to find public polls
PollSchema.statics.findPublic = function(filters?: any) {
  const query = { privacy: 'public', status: 'active' }
  if (filters) {
    Object.assign(query, filters)
  }
  return this.find(query).sort({ 'metadata.totalVotes': -1 })
}

// Instance method to check if poll is expired
PollSchema.methods.isExpired = function() {
  if (this.settings.expiresAt && this.settings.expiresAt <= new Date()) {
    return true
  }
  if (this.settings.maxVotes && this.metadata.totalVotes >= this.settings.maxVotes) {
    return true
  }
  return false
}

// Instance method to check if poll can be edited
PollSchema.methods.canBeEdited = function() {
  // Can't edit if poll has received votes (to prevent invalidating existing votes)
  return this.metadata.totalVotes === 0
}

// Instance method to increment vote count
PollSchema.methods.incrementVoteCount = function(optionId: string) {
  const option = this.options.find((opt: IPollOption) => opt.id === optionId)
  if (option) {
    option.voteCount += 1
    this.metadata.totalVotes += 1
    this.markModified('options')
    this.markModified('metadata')
  }
  return this.save()
}

// Instance method to update analytics
PollSchema.methods.updateAnalytics = function(data: {
  referralSource?: string
  deviceType?: string
  location?: string
}) {
  if (data.referralSource) {
    const current = this.analytics.referralSources.get(data.referralSource) || 0
    this.analytics.referralSources.set(data.referralSource, current + 1)
  }
  if (data.deviceType) {
    const current = this.analytics.deviceTypes.get(data.deviceType) || 0
    this.analytics.deviceTypes.set(data.deviceType, current + 1)
  }
  if (data.location) {
    const current = this.analytics.locations.get(data.location) || 0
    this.analytics.locations.set(data.location, current + 1)
  }
  this.markModified('analytics')
  return this.save()
}

export default mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema)