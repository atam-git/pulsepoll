import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'
import { RealTimeHelper } from '@/services/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/polls/[id]/status
 * Update poll status (activate, deactivate, archive, etc.)
 */
async function updatePollStatus(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, reason } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'archived', 'draft']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: active, inactive, archived, draft' },
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

    // Check if user can modify this poll
    const canModify = 
      req.user!.id === poll.createdBy.toString() || 
      req.user!.role === 'admin'

    if (!canModify) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate status transitions
    const currentStatus = poll.metadata.status
    
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'draft': ['active', 'archived'],
      'active': ['inactive', 'archived'],
      'inactive': ['active', 'archived'],
      'archived': [] // Archived polls cannot be changed
    }

    if (currentStatus === 'archived' && status !== 'archived') {
      return NextResponse.json(
        { error: 'Cannot change status of archived polls' },
        { status: 400 }
      )
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { 
          error: `Cannot transition from ${currentStatus} to ${status}`,
          validTransitions: validTransitions[currentStatus] || []
        },
        { status: 400 }
      )
    }

    // Update poll status
    const updates: any = {
      'metadata.status': status,
      'metadata.updatedAt': new Date()
    }

    // Add status change reason if provided
    if (reason) {
      updates['metadata.statusReason'] = reason
      updates['metadata.statusChangedAt'] = new Date()
      updates['metadata.statusChangedBy'] = req.user!.id
    }

    // Handle specific status logic
    if (status === 'archived') {
      // When archiving, also set as private
      updates['privacy.isPublic'] = false
    } else if (status === 'active' && currentStatus === 'draft') {
      // When activating from draft, set creation timestamp
      updates['metadata.activatedAt'] = new Date()
    }

    const updatedPoll = await Poll.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email')

    // Prepare response data
    const responseData = {
      success: true,
      poll: {
        id: updatedPoll._id,
        title: updatedPoll.title,
        metadata: updatedPoll.metadata,
        privacy: updatedPoll.privacy
      },
      statusChange: {
        from: currentStatus,
        to: status,
        reason: reason || null,
        changedAt: new Date(),
        changedBy: req.user!.id
      }
    }

    // Broadcast real-time status change to connected clients
    try {
      RealTimeHelper.broadcastStatusChange(
        id,
        status,
        reason || `Status changed from ${currentStatus} to ${status}`
      )
    } catch (broadcastError) {
      console.error('Error broadcasting status change:', broadcastError)
      // Don't fail the status update if broadcast fails
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error updating poll status:', error)
    return NextResponse.json(
      { error: 'Failed to update poll status' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/polls/[id]/status
 * Get poll status and expiration information
 */
async function getPollStatus(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(id).select('metadata settings privacy createdBy')

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can access this poll
    const canAccess = 
      poll.privacy.isPublic || 
      (req.user && (
        req.user.id === poll.createdBy.toString() || 
        req.user.role === 'admin'
      ))

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check expiration
    const now = new Date()
    const isExpired = poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= now
    const timeUntilExpiration = poll.settings.expiresAt 
      ? Math.max(0, new Date(poll.settings.expiresAt).getTime() - now.getTime())
      : null

    return NextResponse.json({
      success: true,
      status: {
        current: poll.metadata.status,
        isExpired,
        expiresAt: poll.settings.expiresAt,
        timeUntilExpiration,
        statusReason: poll.metadata.statusReason || null,
        statusChangedAt: poll.metadata.statusChangedAt || null,
        statusChangedBy: poll.metadata.statusChangedBy || null,
        activatedAt: poll.metadata.activatedAt || null
      }
    })

  } catch (error) {
    console.error('Error fetching poll status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll status' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const PUT = withUserAuth(updatePollStatus)
export const GET = withUserAuth(getPollStatus)