import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import connectDB from '@/lib/mongodb'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function clearVotes(req: AuthenticatedRequest, { params }: RouteParams) {
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

    // Find the poll and verify ownership
    const poll = await Poll.findById(id)
    
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user owns the poll
    if (req.user!.id !== poll.creatorId.toString() && req.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - You can only clear votes from your own polls' },
        { status: 403 }
      )
    }

    // Delete all votes for this poll
    await Vote.deleteMany({ pollId: id })

    // Reset vote counts on all options
    poll.options.forEach((option: any) => {
      option.voteCount = 0
    })

    // Reset metadata
    poll.metadata.totalVotes = 0
    poll.metadata.uniqueVoters = 0
    poll.metadata.viewCount = 0
    poll.metadata.updatedAt = new Date()

    await poll.save()

    return NextResponse.json({
      success: true,
      message: 'All votes cleared successfully',
      poll: {
        id: poll._id,
        title: poll.title,
        metadata: poll.metadata
      }
    })
  } catch (error) {
    console.error('Clear votes error:', error)
    return NextResponse.json(
      { error: 'Failed to clear votes' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const POST = withUserAuth(clearVotes)
