import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/middleware/auth'
import Poll from '@/models/Poll'
import User from '@/models/User' // Import User model to ensure it's registered
import connectDB from '@/lib/mongodb'

interface RouteParams {}

/**
 * GET /api/user/polls
 * Get user's polls with filtering, sorting, and pagination
 */
async function getUserPolls(req: AuthenticatedRequest, {}: RouteParams) {
  try {
    if (!req.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filter parameters
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    // Build query
    const query: any = { creatorId: req.user.id }

    // Apply status filter
    if (filter !== 'all') {
      switch (filter) {
        case 'active':
          query.status = 'active'
          query.$or = [
            { 'settings.expiresAt': { $exists: false } },
            { 'settings.expiresAt': null },
            { 'settings.expiresAt': { $gt: new Date() } }
          ]
          break
        case 'inactive':
          query.status = 'closed'
          break
        case 'expired':
          query['settings.expiresAt'] = { $lte: new Date() }
          break
        case 'draft':
          query.status = 'draft'
          break
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ]
    }

    // Build sort options
    let sortOptions: any = {}
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 }
        break
      case 'oldest':
        sortOptions = { createdAt: 1 }
        break
      case 'most_votes':
        sortOptions = { 'metadata.totalVotes': -1 }
        break
      case 'least_votes':
        sortOptions = { 'metadata.totalVotes': 1 }
        break
      case 'title_asc':
        sortOptions = { title: 1 }
        break
      case 'title_desc':
        sortOptions = { title: -1 }
        break
      default:
        sortOptions = { createdAt: -1 }
    }

    // Execute queries
    const [polls, totalCount] = await Promise.all([
      Poll.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select({
          title: 1,
          description: 1,
          type: 1,
          status: 1,
          'metadata.totalVotes': 1,
          'metadata.uniqueVoters': 1,
          'metadata.viewCount': 1,
          'settings.expiresAt': 1,
          privacy: 1,
          createdAt: 1,
          updatedAt: 1
        }),
      Poll.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Format response
    const formattedPolls = polls.map(poll => ({
      id: poll._id.toString(),
      title: poll.title,
      description: poll.description,
      type: poll.type,
      status: poll.status,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      metadata: {
        totalVotes: poll.metadata.totalVotes || 0,
        uniqueVoters: poll.metadata.uniqueVoters || 0,
        viewCount: poll.metadata.viewCount || 0
      },
      settings: {
        expiresAt: poll.settings?.expiresAt,
        isPublic: poll.privacy === 'public'
      }
    }))

    return NextResponse.json({
      polls: formattedPolls,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
        total: totalCount
      },
      filters: {
        filter,
        search,
        sort
      }
    })

  } catch (error) {
    console.error('Error fetching user polls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/polls
 * Create a new poll for the authenticated user
 */
async function createUserPoll(req: AuthenticatedRequest, {}: RouteParams) {
  try {
    if (!req.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      options,
      settings = {},
      privacy = {}
    } = body

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Poll title is required' },
        { status: 400 }
      )
    }

    if (!type || !['single', 'multiple', 'ranking', 'yesno', 'survey'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid poll type is required' },
        { status: 400 }
      )
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Create poll data
    const pollData = {
      title: title.trim(),
      description: description?.trim() || '',
      type,
      options: options.map((option: any, index: number) => ({
        id: `option_${index + 1}`,
        text: option.text?.trim() || option,
        voteCount: 0
      })),
      creatorId: req.user.id,
      status: 'active',
      privacy: privacy.isPublic === false ? 'private' : 'public',
      settings: {
        allowAnonymous: privacy.allowAnonymous !== false,
        requireCaptcha: settings.requireCaptcha || false,
        expiresAt: settings.expiresAt ? new Date(settings.expiresAt) : undefined,
        maxVotes: settings.maxVotes || undefined
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

    const poll = new Poll(pollData)
    await poll.save()

    return NextResponse.json({
      success: true,
      message: 'Poll created successfully',
      poll: {
        id: poll._id.toString(),
        title: poll.title,
        description: poll.description,
        type: poll.type,
        status: poll.status,
        createdAt: poll.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const GET = withAuth(getUserPolls)
export const POST = withAuth(createUserPoll)