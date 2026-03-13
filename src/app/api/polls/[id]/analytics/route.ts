import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth, AuthenticatedRequest } from '@/middleware/auth'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'
import { AnalyticsEngine, AnalyticsHelper } from '@/services/analytics'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/polls/[id]/analytics
 * Get comprehensive analytics for a poll
 */
async function getPollAnalytics(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId } = await params
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'full' // full, summary, chart

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(pollId)
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can access this poll's analytics
    const canAccess = 
      poll.privacy.isPublic || 
      (req.user && (
        req.user.id === poll.creatorId.toString() || 
        req.user.role === 'admin'
      ))

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Return different formats based on request
    switch (format) {
      case 'summary':
        const summary = await AnalyticsHelper.getAnalyticsSummary(pollId)
        return NextResponse.json({
          success: true,
          analytics: summary
        })

      case 'chart':
        const chartData = await AnalyticsEngine.generateChartData(pollId)
        return NextResponse.json({
          success: true,
          chartData
        })

      case 'realtime':
        const realtimeUpdate = await AnalyticsHelper.generateRealTimeUpdate(pollId)
        return NextResponse.json({
          success: true,
          ...realtimeUpdate
        })

      default: // 'full'
        const fullAnalytics = await AnalyticsEngine.calculatePollAnalytics(pollId)
        const fullChartData = await AnalyticsEngine.generateChartData(pollId)
        
        return NextResponse.json({
          success: true,
          analytics: fullAnalytics,
          chartData: fullChartData,
          poll: {
            id: poll._id,
            title: poll.title,
            type: poll.type,
            status: poll.metadata.status
          }
        })
    }

  } catch (error) {
    console.error('Error fetching poll analytics:', error)
    
    if (error instanceof Error && error.message === 'Poll not found') {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware (optional auth for public polls)
export const GET = withOptionalAuth(getPollAnalytics)