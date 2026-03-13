import mongoose, { Document, Schema, Model } from 'mongoose'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  emailVerified: boolean
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  profile: {
    name?: string
    avatar?: string
  }
  status: 'active' | 'suspended' | 'banned'
  suspendedUntil?: Date
  suspensionReason?: string
  bannedAt?: Date
  banReason?: string
  activityLog: {
    lastActive?: Date
    pollsCreated: number
    votesSubmitted: number
    loginCount: number
  }
  isAdmin(): boolean
  updateLastLogin(): Promise<IUser>
  isSuspended(): boolean
  isBanned(): boolean
  canLogin(): boolean
  suspend(until: Date, reason: string): Promise<IUser>
  ban(reason: string): Promise<IUser>
  unsuspend(): Promise<IUser>
  unban(): Promise<IUser>
  recordActivity(activityType: 'login' | 'poll_created' | 'vote_submitted'): Promise<IUser>
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
    minlength: [60, 'Password hash must be at least 60 characters'] // bcrypt hash length
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  profile: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    avatar: {
      type: String,
      trim: true,
      maxlength: [500, 'Avatar URL cannot exceed 500 characters']
    }
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  suspendedUntil: {
    type: Date,
    default: null
  },
  suspensionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Suspension reason cannot exceed 500 characters']
  },
  bannedAt: {
    type: Date,
    default: null
  },
  banReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Ban reason cannot exceed 500 characters']
  },
  activityLog: {
    lastActive: {
      type: Date,
      default: null
    },
    pollsCreated: {
      type: Number,
      default: 0,
      min: 0
    },
    votesSubmitted: {
      type: Number,
      default: 0,
      min: 0
    },
    loginCount: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'users'
})

// Indexes for performance
UserSchema.index({ createdAt: -1 })
UserSchema.index({ role: 1 })
UserSchema.index({ emailVerified: 1 })
UserSchema.index({ status: 1 })
UserSchema.index({ 'activityLog.lastActive': -1 })

// Virtual for user ID as string
UserSchema.virtual('id').get(function() {
  return this._id.toHexString()
})

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).passwordHash // Never return password hash
    delete (ret as any).__v
    return ret
  }
})

// Pre-save middleware to validate email format
UserSchema.pre('save', function() {
  if (this.isModified('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format')
    }
  }
})

// Static method to find user by email
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() })
}

// Instance method to check if user is admin
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin'
}

// Instance method to update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date()
  this.activityLog.lastActive = new Date()
  this.activityLog.loginCount += 1
  return this.save()
}

// Instance method to check if user is suspended
UserSchema.methods.isSuspended = function() {
  if (this.status !== 'suspended') return false
  if (!this.suspendedUntil) return false
  
  // Check if suspension has expired
  if (new Date() > this.suspendedUntil) {
    // Auto-unsuspend if time has passed
    this.status = 'active'
    this.suspendedUntil = undefined
    this.suspensionReason = undefined
    this.save()
    return false
  }
  
  return true
}

// Instance method to check if user is banned
UserSchema.methods.isBanned = function() {
  return this.status === 'banned'
}

// Instance method to check if user can login
UserSchema.methods.canLogin = function() {
  return !this.isSuspended() && !this.isBanned()
}

// Instance method to suspend user
UserSchema.methods.suspend = function(until: Date, reason: string) {
  this.status = 'suspended'
  this.suspendedUntil = until
  this.suspensionReason = reason
  return this.save()
}

// Instance method to ban user
UserSchema.methods.ban = function(reason: string) {
  this.status = 'banned'
  this.bannedAt = new Date()
  this.banReason = reason
  return this.save()
}

// Instance method to unsuspend user
UserSchema.methods.unsuspend = function() {
  this.status = 'active'
  this.suspendedUntil = undefined
  this.suspensionReason = undefined
  return this.save()
}

// Instance method to unban user
UserSchema.methods.unban = function() {
  this.status = 'active'
  this.bannedAt = undefined
  this.banReason = undefined
  return this.save()
}

// Instance method to record activity
UserSchema.methods.recordActivity = function(activityType: 'login' | 'poll_created' | 'vote_submitted') {
  this.activityLog.lastActive = new Date()
  
  switch (activityType) {
    case 'login':
      this.activityLog.loginCount += 1
      break
    case 'poll_created':
      this.activityLog.pollsCreated += 1
      break
    case 'vote_submitted':
      this.activityLog.votesSubmitted += 1
      break
  }
  
  return this.save()
}

export default (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema)