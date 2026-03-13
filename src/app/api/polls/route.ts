import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, withOptionalAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withPollCreationRateLimit, withRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import Poll from '@/models/Poll'
import User from '@/models/User' // Import User model to ensure it's registered
import connectDB from '@/lib/mongodb'

/**
 * POST /api/polls
 * Create a new poll
 */
async function createPoll(req: AuthenticatedRequest) {
  try {
    const body = await req.json()
    const {
      title,
      description,
      type,
      options,
      settings = {},
      privacy
    } = body

    // Validate required fields
    if (!type || !options) {
      return NextResponse.json(
        { error: 'Type and options are required' },
        { status: 400 }
      )
    }

    // Validate poll type
    const validTypes = ['single', 'multiple', 'ranking', 'yesno', 'survey']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid poll type' },
        { status: 400 }
      )
    }

    // Validate options based on poll type
    if (type === 'yesno') {
      // Yes/No polls should have exactly 2 options
      if (!Array.isArray(options) || options.length !== 2) {
        return NextResponse.json(
          { error: 'Yes/No polls must have exactly 2 options' },
          { status: 400 }
        )
      }
    } else if (['single', 'multiple', 'ranking'].includes(type)) {
      // Choice-based polls need at least 2 options with either text or imageUrl
      const validOptions = options.filter((opt: any) => 
        (opt.text && opt.text.trim()) || opt.imageUrl
      )
      if (!Array.isArray(options) || validOptions.length < 2) {
        return NextResponse.json(
          { error: 'Choice-based polls must have at least 2 options (each option must have text or an image)' },
          { status: 400 }
        )
      }
    } else if (type === 'survey') {
      // Survey polls can have any number of questions
      const validOptions = options.filter((opt: any) => 
        (opt.text && opt.text.trim()) || opt.imageUrl
      )
      if (!Array.isArray(options) || validOptions.length < 1) {
        return NextResponse.json(
          { error: 'Survey polls must have at least 1 question (each option must have text or an image)' },
          { status: 400 }
        )
      }
    }

    // Validate title length (if provided)
    if (title && title.length > 200) {
      return NextResponse.json(
        { error: 'Title cannot exceed 200 characters' },
        { status: 400 }
      )
    }

    // Validate description length
    if (description && description.length > 1000) {
      return NextResponse.json(
        { error: 'Description cannot exceed 1000 characters' },
        { status: 400 }
      )
    }

    // Validate expiration date
    if (settings.expiresAt) {
      const expirationDate = new Date(settings.expiresAt)
      if (expirationDate <= new Date()) {
        return NextResponse.json(
          { error: 'Expiration date must be in the future' },
          { status: 400 }
        )
      }
    }

    await connectDB()

    // Create poll data
    const pollData = {
      title: title?.trim() || '',
      description: description?.trim() || '',
      type,
      options: options.map((option: any, index: number) => ({
        id: `option_${index + 1}`,
        text: option.text?.trim() || '',
        imageUrl: option.imageUrl || undefined,
        voteCount: 0,
        ...(type === 'survey' && option.type && { type: option.type })
      })),
      creatorId: req.user!.id, // Use creatorId instead of createdBy
      status: 'active',
      privacy: typeof privacy === 'string' ? privacy : (privacy?.isPublic === false ? 'private' : 'public'), // Handle both string and object formats
      settings: {
        allowAnonymous: typeof privacy === 'object' ? (privacy.allowAnonymous !== false) : settings.allowAnonymous !== false, // Default to true
        requireCaptcha: settings.requireCaptcha || false,
        expiresAt: settings.expiresAt ? new Date(settings.expiresAt) : undefined,
        maxVotes: settings.maxVotesPerUser || undefined
      },
      metadata: {
        totalVotes: 0,
        uniqueVoters: 0,
        viewCount: 0
      },
      moderation: {
        isFlagged: false,
        flags: []
      },
      analytics: {
        referralSources: new Map(),
        deviceTypes: new Map(),
        locations: new Map()
      },
      tags: Array.isArray(body.tags) ? body.tags : []
    }

    // Create the poll
    const poll = new Poll(pollData)
    await poll.save()

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
        metadata: poll.metadata,
        creatorId: poll.creatorId,
        status: poll.status,
        createdAt: poll.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating poll:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/polls
 * Get list of polls with filtering and pagination
 */
async function getPolls(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || 'active'
    const createdBy = searchParams.get('createdBy') || ''
    const isPublic = searchParams.get('public') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    await connectDB()

    // Build query
    const query: any = {}

    // Filter by status
    if (status) {
      query.status = status
    }

    // Filter by type
    if (type && ['single', 'multiple', 'ranking', 'yesno', 'survey'].includes(type)) {
      query.type = type
    }

    // Filter by creator
    if (createdBy) {
      query.creatorId = createdBy
    }

    // Filter by public/private
    if (isPublic) {
      query.privacy = 'public'
    }

    // Filter by featured
    if (featured) {
      query['metadata.featured'] = true
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Check if user can see private polls
    if (!req.user || req.user.role !== 'admin') {
      // Non-admin users can only see public polls or their own polls
      if (!createdBy) {
        query.$or = [
          { privacy: 'public' },
          ...(req.user ? [{ creatorId: req.user.id }] : [])
        ]
      } else if (req.user && createdBy !== req.user.id) {
        // Can't see other users' private polls
        query.privacy = 'public'
      }
    }

    // Get total count
    const total = await Poll.countDocuments(query)

    // Build sort object
    const sort: any = {}
    if (sortBy === 'votes') {
      sort['metadata.totalVotes'] = sortOrder
    } else if (sortBy === 'title') {
      sort.title = sortOrder
    } else {
      sort.createdAt = sortOrder
    }

    // Get polls with pagination
    const polls = await Poll.find(query)
      .populate('creatorId', 'email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      polls: polls.map(poll => ({
        id: poll._id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        options: poll.options,
        settings: poll.settings,
        privacy: poll.privacy,
        metadata: poll.metadata,
        creatorId: poll.creatorId,
        status: poll.status,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt
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

// Apply authentication middleware with rate limiting
export const POST = combineWithRateLimit(withPollCreationRateLimit, withUserAuth)(createPoll)
export const GET = combineWithRateLimit(
  (handler: any) => withRateLimit(handler, {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Too many poll requests. Please wait before requesting more polls.'
  }),
  withOptionalAuth
)(getPolls)