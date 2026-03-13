import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/polls/[id]/duplicate
 * Duplicate an existing poll
 */
async function duplicatePoll(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title: newTitle, resetVotes = true } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const originalPoll = await Poll.findById(id)

    if (!originalPoll) {
      return NextResponse.json(
        { error: 'Original poll not found' },
        { status: 404 }
      )
    }

    // Check if user can access the original poll
    const canAccess = 
      originalPoll.privacy.isPublic || 
      req.user!.id === originalPoll.creatorId.toString() || 
      req.user!.role === 'admin'

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Access denied to original poll' },
        { status: 403 }
      )
    }

    // Create duplicate poll data
    const duplicateData = {
      title: newTitle || `${originalPoll.title} (Copy)`,
      description: originalPoll.description,
      type: originalPoll.type,
      options: originalPoll.options.map((option: any) => ({
        id: option.id,
        text: option.text,
        voteCount: resetVotes ? 0 : option.voteCount,
        ...(originalPoll.type === 'survey' && option.type && { type: option.type })
      })),
      creatorId: req.user!.id, // New owner is the current user
      settings: {
        ...originalPoll.settings,
        // Reset expiration date to null for duplicated polls
        expiresAt: null
      },
      privacy: {
        ...originalPoll.privacy,
        // Default to public for duplicated polls
        isPublic: true
      },
      metadata: {
        totalVotes: resetVotes ? 0 : originalPoll.metadata.totalVotes,
        uniqueVoters: resetVotes ? 0 : originalPoll.metadata.uniqueVoters,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        featured: false, // Duplicated polls are not featured by default
        tags: originalPoll.metadata.tags || [],
        // Add reference to original poll
        duplicatedFrom: originalPoll._id
      }
    }

    // Validate title length
    if (duplicateData.title.length > 200) {
      return NextResponse.json(
        { error: 'Title cannot exceed 200 characters' },
        { status: 400 }
      )
    }

    // Create the duplicate poll
    const duplicatePoll = new Poll(duplicateData)
    await duplicatePoll.save()

    // Populate the created poll for response
    const populatedPoll = await Poll.findById(duplicatePoll._id)
      .populate('creatorId', 'email')
      .lean()

    return NextResponse.json({
      success: true,
      poll: {
        id: populatedPoll._id,
        title: populatedPoll.title,
        description: populatedPoll.description,
        type: populatedPoll.type,
        options: populatedPoll.options,
        settings: populatedPoll.settings,
        privacy: populatedPoll.privacy,
        metadata: populatedPoll.metadata,
        creatorId: populatedPoll.creatorId,
        createdAt: populatedPoll.createdAt,
        updatedAt: populatedPoll.updatedAt
      },
      originalPoll: {
        id: originalPoll._id,
        title: originalPoll.title
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error duplicating poll:', error)
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to duplicate poll' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const POST = withUserAuth(duplicatePoll)