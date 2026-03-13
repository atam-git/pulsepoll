import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/auth'
import User from '@/models/User'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/admin/stats
 * Get platform-wide statistics (admin only)
 */
async function getStats(req: AuthenticatedRequest) {
  try {
    await connectDB()

    // Get total counts
    const [totalUsers, totalPolls, totalVotes] = await Promise.all([
      User.countDocuments(),
      Poll.countDocuments(),
      Vote.countDocuments()
    ])

    // Get active polls count
    const activePolls = await Poll.countDocuments({
      status: 'active',
      $or: [
        { 'settings.expiresAt': { $gt: new Date() } },
        { 'settings.expiresAt': null }
      ]
    })

    // Get recent activity (last 10 items)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('email createdAt')

    const recentPolls = await Poll.find()
      .sort({ 'metadata.createdAt': -1 })
      .limit(3)
      .select('title metadata.createdAt')

    const recentVotes = await Vote.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('pollId', 'title')
      .select('pollId createdAt')

    // Combine and sort recent activity
    const recentActivity = [
      ...recentUsers.map((user: any) => ({
        type: 'user' as const,
        description: `New user registered: ${user.email}`,
        timestamp: user.createdAt
      })),
      ...recentPolls.map((poll: any) => ({
        type: 'poll' as const,
        description: `New poll created: ${poll.title}`,
        timestamp: poll.metadata.createdAt
      })),
      ...recentVotes.map((vote: any) => ({
        type: 'vote' as const,
        description: `New vote on: ${vote.pollId?.title || 'Unknown poll'}`,
        timestamp: vote.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalPolls,
        totalVotes,
        activePolls,
        recentActivity
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

export const GET = withAdminAuth(getStats)
