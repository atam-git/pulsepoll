import mongoose, { Document, Schema } from 'mongoose'

export interface IVoteData {
  selectedOptions: string[] // option IDs
  rankings?: { [optionId: string]: number }
  textResponses?: { [questionId: string]: string }
}

export interface IVoterInfo {
  ipAddress: string
  userAgent: string
  fingerprint: string
  sessionId: string
  location?: {
    country: string
    region: string
    city: string
  }
}

export interface IVote extends Document {
  _id: mongoose.Types.ObjectId
  pollId: mongoose.Types.ObjectId
  voterId?: mongoose.Types.ObjectId // null for anonymous votes
  voterInfo: IVoterInfo
  voteData: IVoteData
  metadata: {
    submittedAt: Date
    pollType: string
    deviceInfo: {
      userAgent?: string
      ipAddress?: string
    }
    demographics?: {
      deviceType: 'mobile' | 'tablet' | 'desktop'
      location?: string
      referralSource: string
      timestamp: Date
      sessionDuration?: number
    }
  }
  createdAt: Date
  referralSource?: string
}

const LocationSchema = new Schema({
  country: {
    type: String,
    trim: true,
    maxlength: [100, 'Country name cannot exceed 100 characters']
  },
  region: {
    type: String,
    trim: true,
    maxlength: [100, 'Region name cannot exceed 100 characters']
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  }
}, { _id: false })

const VoterInfoSchema = new Schema<IVoterInfo>({
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    maxlength: [45, 'IP address cannot exceed 45 characters'] // IPv6 max length
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required'],
    trim: true,
    maxlength: [1000, 'User agent cannot exceed 1000 characters']
  },
  fingerprint: {
    type: String,
    required: [true, 'Device fingerprint is required'],
    trim: true,
    maxlength: [100, 'Fingerprint cannot exceed 100 characters']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    trim: true,
    maxlength: [100, 'Session ID cannot exceed 100 characters']
  },
  location: LocationSchema
}, { _id: false })

const VoteDataSchema = new Schema<IVoteData>({
  selectedOptions: {
    type: [String],
    required: [true, 'Selected options are required'],
    validate: {
      validator: function(options: string[]) {
        return options.length > 0
      },
      message: 'At least one option must be selected'
    }
  },
  rankings: {
    type: Map,
    of: Number
  },
  textResponses: {
    type: Map,
    of: String
  }
}, { _id: false })

const VoteSchema = new Schema<IVote>({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: [true, 'Poll ID is required'],
    index: true
  },
  voterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous votes
  },
  voterInfo: {
    type: VoterInfoSchema,
    required: [true, 'Voter information is required']
  },
  voteData: {
    type: VoteDataSchema,
    required: [true, 'Vote data is required']
  },
  referralSource: {
    type: String,
    trim: true,
    maxlength: [200, 'Referral source cannot exceed 200 characters']
  },
  metadata: {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    pollType: {
      type: String,
      required: true
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String
    }
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  collection: 'votes'
})

// Indexes for performance and duplicate prevention
VoteSchema.index({ pollId: 1, createdAt: -1 })
VoteSchema.index({ pollId: 1, 'voterInfo.ipAddress': 1 })
VoteSchema.index({ pollId: 1, 'voterInfo.sessionId': 1 })
VoteSchema.index({ pollId: 1, voterId: 1 })
VoteSchema.index({ pollId: 1, 'voterInfo.fingerprint': 1 })

// Compound index for duplicate checking
VoteSchema.index({ 
  pollId: 1, 
  'voterInfo.ipAddress': 1, 
  'voterInfo.sessionId': 1,
  'voterInfo.fingerprint': 1 
})

// Virtual for vote ID as string
VoteSchema.virtual('id').get(function() {
  return this._id.toHexString()
})

// Ensure virtual fields are serialized
VoteSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v
    return ret
  }
})

// Static method to find votes by poll
VoteSchema.statics.findByPoll = function(pollId: string) {
  return this.find({ pollId: new mongoose.Types.ObjectId(pollId) })
    .sort({ createdAt: -1 })
}

// Static method to check for duplicate votes
VoteSchema.statics.checkDuplicate = function(
  pollId: string, 
  userId?: string | null,
  ipAddress?: string,
  sessionId?: string | null,
  fingerprint?: string | null
) {
  const query: any = { pollId: new mongoose.Types.ObjectId(pollId) }
  
  // Build OR conditions for different duplicate checks
  const orConditions: any[] = []
  
  if (userId) {
    orConditions.push({ 'voterInfo.userId': userId })
  }
  
  if (ipAddress) {
    orConditions.push({ 'voterInfo.ipAddress': ipAddress })
  }
  
  if (sessionId) {
    orConditions.push({ 'voterInfo.sessionId': sessionId })
  }
  
  if (fingerprint) {
    orConditions.push({ 'voterInfo.fingerprint': fingerprint })
  }
  
  if (orConditions.length > 0) {
    query.$or = orConditions
  } else {
    return Promise.resolve(null) // No identifiers to check
  }
  
  return this.findOne(query).sort({ createdAt: -1 }).then((existingVote: any) => {
    if (existingVote) {
      // Determine duplicate type
      let duplicateType = 'unknown'
      if (userId && existingVote.voterInfo.userId === userId) {
        duplicateType = 'user'
      } else if (sessionId && existingVote.voterInfo.sessionId === sessionId) {
        duplicateType = 'session'
      } else if (fingerprint && existingVote.voterInfo.fingerprint === fingerprint) {
        duplicateType = 'fingerprint'
      } else if (ipAddress && existingVote.voterInfo.ipAddress === ipAddress) {
        duplicateType = 'ip'
      }
      
      return {
        duplicateType,
        createdAt: existingVote.createdAt,
        voterInfo: existingVote.voterInfo
      }
    }
    
    return null
  })
}

// Static method to get vote statistics
VoteSchema.statics.getStatistics = function(pollId: string) {
  return this.aggregate([
    { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        uniqueIPs: { $addToSet: '$voterInfo.ipAddress' },
        uniqueSessions: { $addToSet: '$voterInfo.sessionId' },
        uniqueFingerprints: { $addToSet: '$voterInfo.fingerprint' },
        votingTimeline: {
          $push: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hour: { $hour: '$createdAt' }
          }
        }
      }
    },
    {
      $project: {
        totalVotes: 1,
        uniqueVoters: {
          $size: {
            $setUnion: ['$uniqueIPs', '$uniqueSessions', '$uniqueFingerprints']
          }
        },
        votingTimeline: 1
      }
    }
  ])
}

export interface IVoteModel extends mongoose.Model<IVote> {
  findByPoll(pollId: string): Promise<IVote[]>
  checkDuplicate(
    pollId: string,
    userId?: string | null,
    ipAddress?: string,
    sessionId?: string | null,
    fingerprint?: string | null
  ): Promise<{
    duplicateType: string
    createdAt: Date
    voterInfo: any
  } | null>
  getStatistics(pollId: string): Promise<any>
}

export default (mongoose.models.Vote as IVoteModel) || mongoose.model<IVote, IVoteModel>('Vote', VoteSchema)