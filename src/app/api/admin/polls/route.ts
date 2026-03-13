import { NextResponse } from 'next/server'
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withAdminRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'

/**
 * GET /api/admin/polls
 * Get list of all polls (admin only)
 */
async function getPolls(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const flagged = searchParams.get('flagged') || '' // Filter for flagged polls

    await connectDB()

    // Build query
    const query: any = {}
    
    if (search) {
      query.title = { $regex: search, $options: 'i' }
    }
    
    if (status && ['draft', 'active', 'expired', 'closed'].includes(status)) {
      query.status = status
    }

    if (flagged === 'true') {
      query['moderation.isFlagged'] = true
    } else if (flagged === 'false') {
      query['moderation.isFlagged'] = false
    }

    // Get total count
    const total = await Poll.countDocuments(query)

    // Get polls with pagination
    const polls = await Poll.find(query)
      .populate('creatorId', 'email')
      .sort({ 'metadata.createdAt': -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      success: true,
      polls: polls.map((poll: any) => ({
        id: poll._id.toString(),
        title: poll.title,
        description: poll.description,
        type: poll.type,
        status: poll.status,
        privacy: poll.privacy,
        creatorId: poll.creatorId._id.toString(),
        creatorEmail: poll.creatorId.email,
        totalVotes: poll.metadata.totalVotes,
        uniqueVoters: poll.metadata.uniqueVoters,
        createdAt: poll.metadata.createdAt,
        updatedAt: poll.metadata.updatedAt,
        moderation: {
          isFlagged: poll.moderation?.isFlagged || false,
          flagCount: poll.moderation?.flags?.length || 0,
          flags: poll.moderation?.flags || [],
          reviewedAt: poll.moderation?.reviewedAt
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching polls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/polls
 * Update poll status or moderation (admin only)
 * Supports bulk operations
 */
async function updatePoll(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const { pollId, pollIds, status, action, flagReason, flagDescription, reviewNotes } = body

    await connectDB()

    // Handle bulk operations
    if (pollIds && Array.isArray(pollIds)) {
      if (action === 'bulkDelete') {
        await Poll.deleteMany({ _id: { $in: pollIds } })
        return NextResponse.json({
          success: true,
          message: `${pollIds.length} polls deleted successfully`
        })
      }

      if (action === 'bulkStatusChange' && status) {
        if (!['draft', 'active', 'expired', 'closed'].includes(status)) {
          return NextResponse.json(
            { error: 'Valid status is required' },
            { status: 400 }
          )
        }

        await Poll.updateMany(
          { _id: { $in: pollIds } },
          { 
            status,
            'metadata.updatedAt': new Date()
          }
        )

        return NextResponse.json({
          success: true,
          message: `${pollIds.length} polls updated to ${status}`
        })
      }

      if (action === 'bulkFlag') {
        if (!flagReason || !['inappropriate', 'spam', 'offensive', 'misleading', 'other'].includes(flagReason)) {
          return NextResponse.json(
            { error: 'Valid flag reason is required' },
            { status: 400 }
          )
        }

        await Poll.updateMany(
          { _id: { $in: pollIds } },
          {
            'moderation.isFlagged': true,
            $push: {
              'moderation.flags': {
                reason: flagReason,
                description: flagDescription,
                flaggedBy: req.user.userId,
                flaggedAt: new Date()
              }
            }
          }
        )

        return NextResponse.json({
          success: true,
          message: `${pollIds.length} polls flagged successfully`
        })
      }

      if (action === 'bulkUnflag') {
        await Poll.updateMany(
          { _id: { $in: pollIds } },
          {
            'moderation.isFlagged': false,
            'moderation.flags': [],
            'moderation.reviewedBy': req.user.userId,
            'moderation.reviewedAt': new Date(),
            'moderation.reviewNotes': reviewNotes || 'Bulk unflagged by admin'
          }
        )

        return NextResponse.json({
          success: true,
          message: `${pollIds.length} polls unflagged successfully`
        })
      }

      return NextResponse.json(
        { error: 'Invalid bulk action' },
        { status: 400 }
      )
    }

    // Handle single poll operations
    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // Flag poll
    if (action === 'flag') {
      if (!flagReason || !['inappropriate', 'spam', 'offensive', 'misleading', 'other'].includes(flagReason)) {
        return NextResponse.json(
          { error: 'Valid flag reason is required' },
          { status: 400 }
        )
      }

      const poll = await Poll.findByIdAndUpdate(
        pollId,
        {
          'moderation.isFlagged': true,
          $push: {
            'moderation.flags': {
              reason: flagReason,
              description: flagDescription,
              flaggedBy: req.user.userId,
              flaggedAt: new Date()
            }
          }
        },
        { new: true }
      )

      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Poll flagged successfully',
        poll: {
          id: poll._id.toString(),
          title: poll.title,
          moderation: poll.moderation
        }
      })
    }

    // Unflag poll (approve)
    if (action === 'unflag' || action === 'approve') {
      const poll = await Poll.findByIdAndUpdate(
        pollId,
        {
          'moderation.isFlagged': false,
          'moderation.flags': [],
          'moderation.reviewedBy': req.user.userId,
          'moderation.reviewedAt': new Date(),
          'moderation.reviewNotes': reviewNotes || 'Approved by admin'
        },
        { new: true }
      )

      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Poll approved successfully',
        poll: {
          id: poll._id.toString(),
          title: poll.title,
          moderation: poll.moderation
        }
      })
    }

    // Reject poll (flag and close)
    if (action === 'reject') {
      const poll = await Poll.findByIdAndUpdate(
        pollId,
        {
          status: 'closed',
          'moderation.isFlagged': true,
          'moderation.reviewedBy': req.user.userId,
          'moderation.reviewedAt': new Date(),
          'moderation.reviewNotes': reviewNotes || 'Rejected by admin'
        },
        { new: true }
      )

      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Poll rejected successfully',
        poll: {
          id: poll._id.toString(),
          title: poll.title,
          status: poll.status,
          moderation: poll.moderation
        }
      })
    }

    // Update status
    if (status) {
      if (!['draft', 'active', 'expired', 'closed'].includes(status)) {
        return NextResponse.json(
          { error: 'Valid status is required (draft, active, expired, closed)' },
          { status: 400 }
        )
      }

      const poll = await Poll.findByIdAndUpdate(
        pollId,
        { 
          status,
          'metadata.updatedAt': new Date()
        },
        { new: true, runValidators: true }
      )

      if (!poll) {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        poll: {
          id: poll._id.toString(),
          title: poll.title,
          status: poll.status,
          updatedAt: poll.metadata.updatedAt
        }
      })
    }

    return NextResponse.json(
      { error: 'No valid action or status provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating poll:', error)
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/polls
 * Delete a poll or multiple polls (admin only)
 */
async function deletePoll(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pollId = searchParams.get('pollId')
    const pollIds = searchParams.get('pollIds')

    await connectDB()

    // Handle bulk deletion
    if (pollIds) {
      const ids = pollIds.split(',')
      await Poll.deleteMany({ _id: { $in: ids } })

      return NextResponse.json({
        success: true,
        message: `${ids.length} polls deleted successfully`
      })
    }

    // Handle single deletion
    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    const poll = await Poll.findByIdAndDelete(pollId)

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // TODO: Also delete associated votes and sessions
    // This would be implemented in a production system

    return NextResponse.json({
      success: true,
      message: 'Poll deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting poll:', error)
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 }
    )
  }
}

// Apply admin authentication middleware with rate limiting
export const GET = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(getPolls)
export const PUT = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(updatePoll)
export const DELETE = combineWithRateLimit(withAdminRateLimit, withAdminAuth)(deletePoll)
