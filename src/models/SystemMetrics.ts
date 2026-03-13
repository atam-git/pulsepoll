import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISystemMetrics extends Document {
  timestamp: Date
  metrics: {
    responseTime: {
      avg: number
      p50: number
      p95: number
      p99: number
    }
    errorRate: {
      total: number
      rate: number
      byType: Record<string, number>
    }
    requestCount: {
      total: number
      byEndpoint: Record<string, number>
    }
    activeConnections: number
    databaseStats: {
      connectionPoolSize: number
      activeQueries: number
      avgQueryTime: number
    }
  }
  period: 'minute' | 'hour' | 'day'
}

const SystemMetricsSchema = new Schema<ISystemMetrics>({
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    responseTime: {
      avg: { type: Number, required: true },
      p50: { type: Number, required: true },
      p95: { type: Number, required: true },
      p99: { type: Number, required: true }
    },
    errorRate: {
      total: { type: Number, required: true },
      rate: { type: Number, required: true },
      byType: { type: Map, of: Number, required: true }
    },
    requestCount: {
      total: { type: Number, required: true },
      byEndpoint: { type: Map, of: Number, required: true }
    },
    activeConnections: { type: Number, required: true },
    databaseStats: {
      connectionPoolSize: { type: Number, required: true },
      activeQueries: { type: Number, required: true },
      avgQueryTime: { type: Number, required: true }
    }
  },
  period: {
    type: String,
    enum: ['minute', 'hour', 'day'],
    required: true,
    index: true
  }
})

// Compound index for time-series queries
SystemMetricsSchema.index({ period: 1, timestamp: -1 })

// TTL index to automatically delete old metrics (keep 30 days)
SystemMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

const SystemMetrics: Model<ISystemMetrics> = mongoose.models.SystemMetrics || mongoose.model<ISystemMetrics>('SystemMetrics', SystemMetricsSchema)

export default SystemMetrics
