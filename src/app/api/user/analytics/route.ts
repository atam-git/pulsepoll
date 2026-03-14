import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/user/analytics
 * Get analytics for the authenticated user's polls
 */
async function getUserAnalytics(req: AuthenticatedRequest) {
  try {
    await connectDB()

    const userId = req.user!.id

    // Calculate date ranges
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Get user's polls
    const userPolls = await Poll.find({ creatorId: userId })

    // Calculate basic stats
    const totalPolls = userPolls.length
    const activePolls = userPolls.filter(poll => 
      poll.metadata.status === 'active' && 
      (!poll.settings.expiresAt || new Date(poll.settings.expiresAt) > new Date())
    ).length

    const totalVotes = userPolls.reduce((sum, poll) => sum + (poll.metadata.totalVotes || 0), 0)
    const totalViews = userPolls.reduce((sum, poll) => sum + (poll.metadata.viewCount || 0), 0)

    // Calculate engagement rate
    const engagementRate = totalViews > 0 ? Math.round((totalVotes / totalViews) * 100) : 0

    // Get polls created this week and month
    const pollsThisWeek = userPolls.filter(poll => 
      new Date(poll.metadata.createdAt) >= oneWeekAgo
    ).length

    const pollsThisMonth = userPolls.filter(poll => 
      new Date(poll.metadata.createdAt) >= oneMonthAgo
    ).length

    // Get votes received this week and month
    const votesThisWeek = userPolls
      .filter(poll => new Date(poll.metadata.createdAt) >= oneWeekAgo)
      .reduce((sum, poll) => sum + (poll.metadata.totalVotes || 0), 0)

    const votesThisMonth = userPolls
      .filter(poll => new Date(poll.metadata.createdAt) >= oneMonthAgo)
      .reduce((sum, poll) => sum + (poll.metadata.totalVotes || 0), 0)

    // Get top performing polls
    const topPolls = userPolls
      .sort((a, b) => (b.metadata.totalVotes || 0) - (a.metadata.totalVotes || 0))
      .slice(0, 5)
      .map(poll => ({
        id: poll._id.toString(),
        title: poll.title || 'Untitled Poll',
        totalVotes: poll.metadata.totalVotes || 0,
        viewCount: poll.metadata.viewCount || 0,
        engagementRate: poll.metadata.viewCount > 0 
          ? Math.round(((poll.metadata.totalVotes || 0) / poll.metadata.viewCount) * 100)
          : 0,
        createdAt: poll.metadata.createdAt,
        status: poll.metadata.status
      }))

    // Get poll type distribution
    const pollTypeDistribution = userPolls.reduce((acc, poll) => {
      const type = poll.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const pollTypeArray = Object.entries(pollTypeDistribution).map(([type, count]) => ({
      type,
      count
    }))

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentPolls = userPolls
      .filter(poll => new Date(poll.metadata.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime())
      .slice(0, 10)
      .map(poll => ({
        id: poll._id.toString(),
        title: poll.title || 'Untitled Poll',
        totalVotes: poll.metadata.totalVotes || 0,
        viewCount: poll.metadata.viewCount || 0,
        createdAt: poll.metadata.createdAt,
        status: poll.metadata.status
      }))

    // Calculate performance trends (compare this month vs last month)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    const lastMonthPolls = userPolls.filter(poll => {
      const createdAt = new Date(poll.metadata.createdAt)
      return createdAt >= twoMonthsAgo && createdAt < oneMonthAgo
    })

    const lastMonthVotes = lastMonthPolls.reduce((sum, poll) => sum + (poll.metadata.totalVotes || 0), 0)
    const lastMonthPollCount = lastMonthPolls.length

    const pollGrowth = lastMonthPollCount > 0 
      ? Math.round(((pollsThisMonth - lastMonthPollCount) / lastMonthPollCount) * 100)
      : pollsThisMonth > 0 ? 100 : 0

    const voteGrowth = lastMonthVotes > 0 
      ? Math.round(((votesThisMonth - lastMonthVotes) / lastMonthVotes) * 100)
      : votesThisMonth > 0 ? 100 : 0

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalPolls,
          activePolls,
          totalVotes,
          totalViews,
          engagementRate
        },
        growth: {
          pollsThisWeek,
          pollsThisMonth,
          votesThisWeek,
          votesThisMonth,
          pollGrowth,
          voteGrowth
        },
        topPolls,
        pollTypeDistribution: pollTypeArray,
        recentActivity: recentPolls,
        trends: {
          thisMonth: {
            polls: pollsThisMonth,
            votes: votesThisMonth
          },
          lastMonth: {
            polls: lastMonthPollCount,
            votes: lastMonthVotes
          },
          growth: {
            polls: pollGrowth,
            votes: voteGrowth
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching user analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

export const GET = combineWithRateLimit(withRateLimit, withAuth)(getUserAnalytics)