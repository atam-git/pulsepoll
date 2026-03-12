import mongoose, { Document, Schema } from 'mongoose'

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId
  pollId: mongoose.Types.ObjectId
  sessionId: string
  ipAddress: string
  fingerprint: string
  userId?: mongoose.Types.ObjectId
  createdAt: Date
  expiresAt: Date
  lastActivity?: Date
  updatedAt?: Date
  extend(hours?: number): Promise<ISession>
  isExpired(): boolean
}

const SessionSchema = new Schema<ISession>({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: [true, 'Poll ID is required'],
    index: true
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    trim: true,
    maxlength: [100, 'Session ID cannot exceed 100 characters']
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    maxlength: [45, 'IP address cannot exceed 45 characters'] // IPv6 max length
  },
  fingerprint: {
    type: String,
    required: [true, 'Device fingerprint is required'],
    trim: true,
    maxlength: [100, 'Fingerprint cannot exceed 100 characters']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous sessions
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'sessions'
})

// Compound unique index to prevent duplicate sessions
SessionSchema.index({ pollId: 1, sessionId: 1 }, { unique: true })
SessionSchema.index({ pollId: 1, ipAddress: 1 })
SessionSchema.index({ pollId: 1, fingerprint: 1 })
SessionSchema.index({ pollId: 1, userId: 1 })

// TTL index for automatic cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Virtual for session ID as string
SessionSchema.virtual('id').get(function() {
  return this._id.toHexString()
})

// Ensure virtual fields are serialized
SessionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v
    return ret
  }
})

// Static method to check if session exists
SessionSchema.statics.exists = function(pollId: string, sessionId: string) {
  return this.findOne({
    pollId: new mongoose.Types.ObjectId(pollId),
    sessionId: sessionId,
    expiresAt: { $gt: new Date() }
  })
}

// Static method to check for duplicate by IP
SessionSchema.statics.checkIPDuplicate = function(pollId: string, ipAddress: string) {
  return this.findOne({
    pollId: new mongoose.Types.ObjectId(pollId),
    ipAddress: ipAddress,
    expiresAt: { $gt: new Date() }
  })
}

// Static method to check for duplicate by fingerprint
SessionSchema.statics.checkFingerprintDuplicate = function(pollId: string, fingerprint: string) {
  return this.findOne({
    pollId: new mongoose.Types.ObjectId(pollId),
    fingerprint: fingerprint,
    expiresAt: { $gt: new Date() }
  })
}

// Static method to check for duplicate by user
SessionSchema.statics.checkUserDuplicate = function(pollId: string, userId: string) {
  return this.findOne({
    pollId: new mongoose.Types.ObjectId(pollId),
    userId: new mongoose.Types.ObjectId(userId),
    expiresAt: { $gt: new Date() }
  })
}

// Static method to create or update session
SessionSchema.statics.createOrUpdate = function(
  sessionId: string,
  sessionData: {
    pollId: string
    voterId?: string | null
    ipAddress?: string
    fingerprint?: string | null
    lastActivity: Date
    expiresAt: Date
  }
) {
  const data = {
    pollId: new mongoose.Types.ObjectId(sessionData.pollId),
    sessionId: sessionId,
    ipAddress: sessionData.ipAddress,
    fingerprint: sessionData.fingerprint,
    userId: sessionData.voterId ? new mongoose.Types.ObjectId(sessionData.voterId) : undefined,
    lastActivity: sessionData.lastActivity,
    expiresAt: sessionData.expiresAt,
    updatedAt: new Date()
  }

  return this.findOneAndUpdate(
    { pollId: data.pollId, sessionId: sessionId },
    data,
    { upsert: true, new: true, runValidators: true }
  )
}

// Instance method to extend expiration
SessionSchema.methods.extend = function(hours: number = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  return this.save()
}

// Instance method to check if expired
SessionSchema.methods.isExpired = function() {
  return this.expiresAt <= new Date()
}

export interface ISessionModel extends mongoose.Model<ISession> {
  findByPoll(pollId: string): Promise<ISession[]>
  checkIpDuplicate(pollId: string, ipAddress: string): Promise<ISession | null>
  checkFingerprintDuplicate(pollId: string, fingerprint: string): Promise<ISession | null>
  checkUserDuplicate(pollId: string, userId: string): Promise<ISession | null>
  createOrUpdate(
    sessionId: string,
    sessionData: {
      pollId: string
      voterId?: string | null
      ipAddress?: string
      fingerprint?: string | null
      lastActivity: Date
      expiresAt: Date
    }
  ): Promise<ISession>
}

export default (mongoose.models.Session as ISessionModel) || mongoose.model<ISession, ISessionModel>('Session', SessionSchema)