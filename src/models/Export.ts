import mongoose, { Document, Schema } from 'mongoose'

export interface IExport extends Document {
  _id: mongoose.Types.ObjectId
  pollId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  format: 'csv' | 'excel' | 'json'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  createdAt: Date
  completedAt?: Date
  expiresAt: Date
  errorMessage?: string
  fileSize?: number
  recordCount?: number
}

const ExportSchema = new Schema<IExport>({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: [true, 'Poll ID is required'],
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  format: {
    type: String,
    enum: {
      values: ['csv', 'excel', 'json'],
      message: 'Format must be one of: csv, excel, json'
    },
    required: [true, 'Export format is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'processing', 'completed', 'failed'],
      message: 'Status must be one of: pending, processing, completed, failed'
    },
    default: 'pending',
    index: true
  },
  downloadUrl: {
    type: String,
    trim: true,
    maxlength: [1000, 'Download URL cannot exceed 1000 characters']
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  },
  fileSize: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  recordCount: {
    type: Number,
    min: [0, 'Record count cannot be negative']
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'exports'
})

// Indexes for performance
ExportSchema.index({ pollId: 1, userId: 1, createdAt: -1 })
ExportSchema.index({ status: 1, createdAt: -1 })
ExportSchema.index({ userId: 1, createdAt: -1 })
ExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

// Virtual for export ID as string
ExportSchema.virtual('id').get(function() {
  return this._id.toHexString()
})

// Ensure virtual fields are serialized
ExportSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v
    return ret
  }
})

// Pre-save middleware to set completion time
ExportSchema.pre('save', function() {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date()
    } else if (this.status === 'failed' && !this.completedAt) {
      this.completedAt = new Date()
    }
  }
})

// Static method to find exports by user
ExportSchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('pollId', 'title type')
}

// Static method to find exports by poll
ExportSchema.statics.findByPoll = function(pollId: string, userId?: string) {
  const query: any = { pollId: new mongoose.Types.ObjectId(pollId) }
  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId)
  }
  return this.find(query).sort({ createdAt: -1 })
}

// Static method to find pending exports
ExportSchema.statics.findPending = function(limit: number = 100) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 }) // FIFO processing
    .limit(limit)
    .populate('pollId', 'title type')
    .populate('userId', 'email')
}

// Static method to cleanup expired exports
ExportSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
    status: { $in: ['completed', 'failed'] }
  })
}

// Static method to get export statistics
ExportSchema.statics.getStatistics = function(userId?: string) {
  const matchStage: any = {}
  if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId)
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalExports: { $sum: 1 },
        completedExports: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedExports: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingExports: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        processingExports: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
        },
        formatBreakdown: {
          $push: '$format'
        },
        totalFileSize: { $sum: '$fileSize' },
        totalRecords: { $sum: '$recordCount' }
      }
    },
    {
      $project: {
        totalExports: 1,
        completedExports: 1,
        failedExports: 1,
        pendingExports: 1,
        processingExports: 1,
        successRate: {
          $cond: [
            { $eq: ['$totalExports', 0] },
            0,
            { $divide: ['$completedExports', '$totalExports'] }
          ]
        },
        formatBreakdown: {
          csv: {
            $size: {
              $filter: {
                input: '$formatBreakdown',
                cond: { $eq: ['$$this', 'csv'] }
              }
            }
          },
          excel: {
            $size: {
              $filter: {
                input: '$formatBreakdown',
                cond: { $eq: ['$$this', 'excel'] }
              }
            }
          },
          json: {
            $size: {
              $filter: {
                input: '$formatBreakdown',
                cond: { $eq: ['$$this', 'json'] }
              }
            }
          }
        },
        totalFileSize: 1,
        totalRecords: 1,
        averageFileSize: {
          $cond: [
            { $eq: ['$completedExports', 0] },
            0,
            { $divide: ['$totalFileSize', '$completedExports'] }
          ]
        }
      }
    }
  ])
}

// Instance method to mark as processing
ExportSchema.methods.markAsProcessing = function() {
  this.status = 'processing'
  return this.save()
}

// Instance method to mark as completed
ExportSchema.methods.markAsCompleted = function(downloadUrl: string, fileSize?: number, recordCount?: number) {
  this.status = 'completed'
  this.downloadUrl = downloadUrl
  this.completedAt = new Date()
  if (fileSize !== undefined) this.fileSize = fileSize
  if (recordCount !== undefined) this.recordCount = recordCount
  return this.save()
}

// Instance method to mark as failed
ExportSchema.methods.markAsFailed = function(errorMessage: string) {
  this.status = 'failed'
  this.errorMessage = errorMessage
  this.completedAt = new Date()
  return this.save()
}

// Instance method to check if expired
ExportSchema.methods.isExpired = function() {
  return this.expiresAt <= new Date()
}

// Instance method to extend expiration
ExportSchema.methods.extendExpiration = function(days: number = 7) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return this.save()
}

// Instance method to get processing duration
ExportSchema.methods.getProcessingDuration = function() {
  if (!this.completedAt) return null
  return this.completedAt.getTime() - this.createdAt.getTime()
}

export default mongoose.models.Export || mongoose.model<IExport>('Export', ExportSchema)