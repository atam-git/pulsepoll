import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId
  userEmail?: string
  action: string
  resourceType: 'user' | 'poll' | 'vote' | 'system' | 'export'
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failure'
  errorMessage?: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  userEmail: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['user', 'poll', 'vote', 'system', 'export'],
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    required: false
  },
  details: {
    type: Schema.Types.Mixed,
    required: false
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
    default: 'success'
  },
  errorMessage: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, createdAt: -1 })
AuditLogSchema.index({ resourceType: 1, createdAt: -1 })
AuditLogSchema.index({ action: 1, createdAt: -1 })

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
