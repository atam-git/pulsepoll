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
  isAdmin(): boolean
  updateLastLogin(): Promise<IUser>
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
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'users'
})

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ createdAt: -1 })
UserSchema.index({ role: 1 })
UserSchema.index({ emailVerified: 1 })

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
  return this.save()
}

export default (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema)