import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withAdminRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import User from '@/models/User'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import SystemMetrics from '@/models/SystemMetrics'
import AuditLog from '@/models/AuditLog'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/admin/analytics
 * Get platform-wide analytics including system metrics and audit logs (admin only)
 */
async function getAnalytics(req: AuthenticatedRequest) {
  try {
    await connectDB()

    // Calculate date for "this week" (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Calculate date for "last 24 hours"
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    // Get platform stats
    const [totalUsers, totalPolls, totalVotes, activePolls] = await Promise.all([
      User.countDocuments(),
      Poll.countDocuments(),
      Vote.countDocuments(),
      Poll.countDocuments({
        status: 'active',
        $or: [
          { 'settings.expiresAt': { $gt: new Date() } },
          { 'settings.expiresAt': null }
        ]
      })
    ])

    // Get growth metrics (this week)
    const [usersThisWeek, pollsThisWeek, votesThisWeek] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Poll.countDocuments({ 'metadata.createdAt': { $gte: oneWeekAgo } }),
      Vote.countDocuments({ createdAt: { $gte: oneWeekAgo } })
    ])

    // Get top polls by votes
    const topPolls = await Poll.find()
      .sort({ 'metadata.totalVotes': -1 })
      .limit(5)
      .select('title metadata.totalVotes metadata.uniqueVoters')

    // Get poll type distribution
    const pollTypeDistribution = await Poll.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    // Get system performance metrics (last 24 hours)
    const systemMetrics = await SystemMetrics.find({
      timestamp: { $gte: oneDayAgo },
      period: 'hour'
    })
      .sort({ timestamp: -1 })
      .limit(24)

    // Calculate average system performance
    const avgSystemMetrics = systemMetrics.length > 0 ? {
      responseTime: {
        avg: systemMetrics.reduce((sum, m) => sum + m.metrics.responseTime.avg, 0) / systemMetrics.length,
        p95: systemMetrics.reduce((sum, m) => sum + m.metrics.responseTime.p95, 0) / systemMetrics.length,
        p99: systemMetrics.reduce((sum, m) => sum + m.metrics.responseTime.p99, 0) / systemMetrics.length
      },
      errorRate: {
        avg: systemMetrics.reduce((sum, m) => sum + m.metrics.errorRate.rate, 0) / systemMetrics.length,
        total: systemMetrics.reduce((sum, m) => sum + m.metrics.errorRate.total, 0)
      },
      requestCount: {
        total: systemMetrics.reduce((sum, m) => sum + m.metrics.requestCount.total, 0)
      },
      databaseStats: {
        avgQueryTime: systemMetrics.reduce((sum, m) => sum + m.metrics.databaseStats.avgQueryTime, 0) / systemMetrics.length,
        avgConnectionPoolSize: systemMetrics.reduce((sum, m) => sum + m.metrics.databaseStats.connectionPoolSize, 0) / systemMetrics.length
      }
    } : null

    // Get recent audit logs (last 50 entries)
    const auditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'email')
      .select('userId userEmail action resourceType resourceId status createdAt errorMessage')

    // Get audit log statistics
    const auditStats = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: {
            action: '$action',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          total: { $sum: '$count' },
          success: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'success'] }, '$count', 0]
            }
          },
          failure: {
            $sum: {
              $cond: [{ $eq: ['$_id.status', 'failure'] }, '$count', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          action: '$_id',
          total: 1,
          success: 1,
          failure: 1,
          successRate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$success', '$total'] }, 100] }
            ]
          }
        }
      },
      {
        $sort: { total: -1 }
      }
    ])

    return NextResponse.json({
      success: true,
      analytics: {
        platformStats: {
          totalUsers,
          totalPolls,
          totalVotes,
          activePolls
        },
        growthMetrics: {
          usersThisWeek,
          pollsThisWeek,
          votesThisWeek
        },
        topPolls: topPolls.map((poll: any) => ({
          id: poll._id.toString(),
          title: poll.title,
          totalVotes: poll.metadata.totalVotes,
          uniqueVoters: poll.metadata.uniqueVoters
        })),
        pollTypeDistribution,
        systemMetrics: avgSystemMetrics,
        systemMetricsTimeline: systemMetrics.map((metric: any) => ({
          timestamp: metric.timestamp,
          responseTime: metric.metrics.responseTime.avg,
          errorRate: metric.metrics.errorRate.rate,
          requestCount: metric.metrics.requestCount.total,
          activeConnections: metric.metrics.activeConnections
        })),
        auditLogs: auditLogs.map((log: any) => ({
          id: log._id.toString(),
          userEmail: log.userEmail || (log.userId?.email),
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          status: log.status,
          createdAt: log.createdAt,
          errorMessage: log.errorMessage
        })),
        auditStats
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export const GET = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(getAnalytics)
