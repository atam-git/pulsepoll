import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth, withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import User from '@/models/User' // Import User model to ensure it's registered
import connectDB from '@/lib/mongodb'
import { RealTimeHelper } from '@/services/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/polls/[id]
 * Get a specific poll by ID
 */
async function getPoll(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(id)
      .populate('creatorId', 'email')
      .lean()

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can access this poll
    const canAccess = 
      poll.privacy === 'public' || 
      (req.user && (
        req.user.id === poll.creatorId._id?.toString() || 
        req.user.role === 'admin'
      ))

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if poll has expired
    const isExpired = poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= new Date()

    // Increment view count for public polls or when accessed by non-owner
    // Don't increment for the poll owner to avoid inflating view counts
    const shouldIncrementView = 
      poll.privacy === 'public' && 
      (!req.user || req.user.id !== poll.creatorId._id?.toString())

    if (shouldIncrementView) {
      try {
        await Poll.findByIdAndUpdate(
          id,
          { $inc: { 'metadata.viewCount': 1 } },
          { new: false } // Don't return updated document to save bandwidth
        )
      } catch (viewError) {
        console.error('Error incrementing view count:', viewError)
        // Don't fail the request if view tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      poll: {
        id: poll._id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        options: poll.options,
        settings: poll.settings,
        privacy: poll.privacy,
        metadata: {
          ...poll.metadata,
          isExpired,
          // Include incremented view count in response for public polls
          viewCount: shouldIncrementView ? (poll.metadata.viewCount || 0) + 1 : poll.metadata.viewCount
        },
        creatorId: poll.creatorId,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/polls/[id]
 * Update a specific poll
 */
async function updatePoll(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(id)

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can edit this poll
    const canEdit = 
      req.user!.id === poll.creatorId.toString() || 
      req.user!.role === 'admin'

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if poll has votes and restrict editing
    if (poll.metadata.totalVotes > 0) {
      // Only allow certain fields to be updated if poll has votes
      const allowedFields = ['description', 'settings.showResults', 'settings.allowComments', 'privacy']
      const updateFields = Object.keys(body)
      const restrictedFields = updateFields.filter(field => !allowedFields.includes(field))
      
      if (restrictedFields.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot modify poll structure after votes have been cast',
            restrictedFields 
          },
          { status: 400 }
        )
      }
    }

    // Validate updates
    const updates: any = {}

    if (body.title !== undefined) {
      if (body.title.length > 200) {
        return NextResponse.json(
          { error: 'Title cannot exceed 200 characters' },
          { status: 400 }
        )
      }
      updates.title = body.title.trim()
    }

    if (body.description !== undefined) {
      if (body.description.length > 1000) {
        return NextResponse.json(
          { error: 'Description cannot exceed 1000 characters' },
          { status: 400 }
        )
      }
      updates.description = body.description.trim()
    }

    if (body.settings) {
      updates.settings = { ...poll.settings, ...body.settings }
      
      // Validate expiration date
      if (body.settings.expiresAt) {
        const expirationDate = new Date(body.settings.expiresAt)
        if (expirationDate <= new Date()) {
          return NextResponse.json(
            { error: 'Expiration date must be in the future' },
            { status: 400 }
          )
        }
        updates.settings.expiresAt = expirationDate
      }
    }

    if (body.privacy) {
      updates.privacy = body.privacy === 'private' ? 'private' : 'public'
    }

    if (body.options && poll.metadata.totalVotes === 0) {
      // Only allow option updates if no votes yet
      updates.options = body.options.map((option: any, index: number) => ({
        id: option.id || `option_${index + 1}`,
        text: option.text?.trim() || option,
        voteCount: option.voteCount || 0,
        ...(poll.type === 'survey' && option.type && { type: option.type })
      }))
    }

    // Update metadata
    updates['metadata.updatedAt'] = new Date()

    const updatedPoll = await Poll.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('creatorId', 'email')

    // Prepare response data
    const responseData = {
      success: true,
      poll: {
        id: updatedPoll._id,
        title: updatedPoll.title,
        description: updatedPoll.description,
        type: updatedPoll.type,
        options: updatedPoll.options,
        settings: updatedPoll.settings,
        privacy: updatedPoll.privacy,
        metadata: updatedPoll.metadata,
        creatorId: updatedPoll.creatorId,
        createdAt: updatedPoll.createdAt,
        updatedAt: updatedPoll.updatedAt
      }
    }

    // Broadcast real-time poll update to connected clients
    try {
      RealTimeHelper.broadcastPollUpdate(id, {
        title: updatedPoll.title,
        description: updatedPoll.description,
        settings: updatedPoll.settings,
        privacy: updatedPoll.privacy,
        updatedAt: updatedPoll.updatedAt
      })
    } catch (broadcastError) {
      console.error('Error broadcasting poll update:', broadcastError)
      // Don't fail the poll update if broadcast fails
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error updating poll:', error)
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/polls/[id]
 * Delete a specific poll
 */
async function deletePoll(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(id)

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can delete this poll
    const canDelete = 
      req.user!.id === poll.creatorId.toString() || 
      req.user!.role === 'admin'

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete associated votes first
    await Vote.deleteMany({ pollId: id })

    // Delete the poll
    await Poll.findByIdAndDelete(id)

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

// Apply authentication middleware
export const GET = withOptionalAuth(getPoll)
export const PUT = withUserAuth(updatePoll)
export const DELETE = withUserAuth(deletePoll)