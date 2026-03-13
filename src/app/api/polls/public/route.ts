import { NextResponse } from 'next/server'
import { withOptionalAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withPublicDirectoryRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'

export interface PublicPollsQuery {
  search?: string
  category?: string
  tags?: string
  type?: string
  status?: string
  sortBy?: 'newest' | 'oldest' | 'popular' | 'trending' | 'votes' | 'recent_activity' | 'engagement' | 'views'
  page?: number
  limit?: number
  dateFrom?: string
  dateTo?: string
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'custom'
  minVotes?: number
  maxVotes?: number
  hasDescription?: boolean
}

export interface PopularityMetrics {
  totalVotes: number
  recentActivity: number // votes in last 24 hours
  trendingScore: number
  engagementRate: number // votes per view
}

export interface PublicPollResponse {
  id: string
  title: string
  description?: string
  type: string
  category?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  popularity: PopularityMetrics
  metadata: {
    totalVotes: number
    viewCount: number
    status: string
  }
  creator: {
    id: string
    email?: string
  }
  options: Array<{
    id: string
    text: string
    voteCount: number
    percentage: number
  }>
}

/**
 * GET /api/polls/public
 * Get public polls with search, filtering, and popularity metrics
 */
async function getPublicPolls(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse query parameters
    const query: PublicPollsQuery = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      tags: searchParams.get('tags') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || 'active',
      sortBy: (searchParams.get('sortBy') as any) || 'popular',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 50), // Max 50 per page
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      dateRange: (searchParams.get('dateRange') as any) || undefined,
      minVotes: searchParams.get('minVotes') ? parseInt(searchParams.get('minVotes')!) : undefined,
      maxVotes: searchParams.get('maxVotes') ? parseInt(searchParams.get('maxVotes')!) : undefined,
      hasDescription: searchParams.get('hasDescription') === 'true' ? true : searchParams.get('hasDescription') === 'false' ? false : undefined
    }

    await connectDB()

    // Build MongoDB query
    const mongoQuery: any = {
      privacy: 'public', // Only public polls
      status: 'active' // Only active polls by default
    }

    // Apply status filter if specified
    if (query.status && query.status !== 'all') {
      if (query.status === 'active') {
        mongoQuery.status = 'active'
        mongoQuery.$or = [
          { 'settings.expiresAt': { $exists: false } },
          { 'settings.expiresAt': null },
          { 'settings.expiresAt': { $gt: new Date() } }
        ]
      } else {
        mongoQuery.status = query.status
      }
    }

    // Apply poll type filter
    if (query.type && ['single', 'multiple', 'ranking', 'yesno', 'survey'].includes(query.type)) {
      mongoQuery.type = query.type
    }

    // Apply category filter
    if (query.category && query.category !== 'all') {
      mongoQuery.category = query.category
    }

    // Apply tags filter
    if (query.tags && query.tags.trim()) {
      const tagsArray = query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      if (tagsArray.length > 0) {
        mongoQuery.tags = { $in: tagsArray }
      }
    }

    // Apply description filter
    if (query.hasDescription !== undefined) {
      if (query.hasDescription) {
        mongoQuery.description = { $exists: true, $ne: null, $not: { $eq: '' } }
      } else {
        mongoQuery.$and = mongoQuery.$and || []
        mongoQuery.$and.push({
          $or: [
            { description: { $exists: false } },
            { description: null },
            { description: '' }
          ]
        })
      }
    }

    // Apply vote count filters
    if (query.minVotes !== undefined || query.maxVotes !== undefined) {
      mongoQuery['metadata.totalVotes'] = {}
      if (query.minVotes !== undefined) {
        mongoQuery['metadata.totalVotes'].$gte = query.minVotes
      }
      if (query.maxVotes !== undefined) {
        mongoQuery['metadata.totalVotes'].$lte = query.maxVotes
      }
    }

    // Apply search filter
    if (query.search && query.search.trim()) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' }
      mongoQuery.$and = mongoQuery.$and || []
      mongoQuery.$and.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $elemMatch: searchRegex } }
        ]
      })
    }

    // Apply date range filter
    if (query.dateRange || query.dateFrom || query.dateTo) {
      mongoQuery.createdAt = {}
      
      if (query.dateRange) {
        const now = new Date()
        let startDate: Date
        
        switch (query.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          default:
            startDate = new Date(0) // No filter if invalid range
        }
        
        if (query.dateRange !== 'custom') {
          mongoQuery.createdAt.$gte = startDate
        }
      }
      
      // Custom date range overrides predefined ranges
      if (query.dateFrom) {
        mongoQuery.createdAt.$gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        mongoQuery.createdAt.$lte = new Date(query.dateTo)
      }
    }

    // Build sort options
    let sortOptions: any = {}
    switch (query.sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 }
        break
      case 'oldest':
        sortOptions = { createdAt: 1 }
        break
      case 'popular':
        sortOptions = { 'metadata.totalVotes': -1 }
        break
      case 'votes':
        sortOptions = { 'metadata.totalVotes': -1 }
        break
      case 'views':
        sortOptions = { 'metadata.viewCount': -1 }
        break
      case 'engagement':
        // Will be calculated in aggregation pipeline
        break
      case 'recent_activity':
        sortOptions = { updatedAt: -1 }
        break
      case 'trending':
        // Calculate trending score in aggregation pipeline
        break
      default:
        sortOptions = { 'metadata.totalVotes': -1, createdAt: -1 }
    }

    // Calculate pagination
    const skip = ((query.page || 1) - 1) * (query.limit || 20)

    let polls: any[]
    let totalCount: number

    if (query.sortBy === 'trending' || query.sortBy === 'engagement') {
      // Use aggregation pipeline for complex sorting calculations
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      // Create sort object based on sortBy
      const sortStage = query.sortBy === 'engagement' 
        ? { engagementRate: -1 as const, 'metadata.totalVotes': -1 as const }
        : { trendingScore: -1 as const, updatedAt: -1 as const }
      
      const aggregationPipeline = [
        { $match: mongoQuery },
        {
          $addFields: {
            // Calculate recent activity (votes in last 24 hours)
            recentActivity: {
              $cond: {
                if: { $gte: ['$updatedAt', oneDayAgo] },
                then: '$metadata.totalVotes',
                else: 0
              }
            },
            // Calculate engagement rate
            engagementRate: {
              $cond: {
                if: { $gt: ['$metadata.viewCount', 0] },
                then: { $divide: ['$metadata.totalVotes', '$metadata.viewCount'] },
                else: 0
              }
            },
            // Calculate trending score
            trendingScore: {
              $add: [
                { $multiply: ['$metadata.totalVotes', 1] },
                { $multiply: ['$metadata.viewCount', 0.1] },
                {
                  $multiply: [
                    {
                      $cond: {
                        if: { $gte: ['$updatedAt', oneDayAgo] },
                        then: '$metadata.totalVotes',
                        else: 0
                      }
                    },
                    5
                  ]
                }
              ]
            }
          }
        },
        { $sort: sortStage },
        {
          $lookup: {
            from: 'users',
            localField: 'creatorId',
            foreignField: '_id',
            as: 'creator',
            pipeline: [{ $project: { email: 1 } }]
          }
        },
        { $skip: skip },
        { $limit: query.limit || 20 }
      ]

      polls = await Poll.aggregate(aggregationPipeline as any)
      
      // Get total count for complex sorting
      const countPipeline = [
        { $match: mongoQuery },
        { $count: 'total' }
      ]
      const countResult = await Poll.aggregate(countPipeline)
      totalCount = countResult[0]?.total || 0
    } else {
      // Regular query with sort
      const [pollsResult, count] = await Promise.all([
        Poll.find(mongoQuery)
          .populate('creatorId', 'email')
          .sort(sortOptions)
          .skip(skip)
          .limit(query.limit || 20)
          .lean(),
        Poll.countDocuments(mongoQuery)
      ])
      
      polls = pollsResult
      totalCount = count
    }

    // Calculate popularity metrics and format response
    const formattedPolls: PublicPollResponse[] = await Promise.all(
      polls.map(async (poll) => {
        const popularity = await calculatePopularityMetrics(poll)
        
        // Calculate option percentages
        const totalVotes = poll.metadata?.totalVotes || 0
        const options = poll.options.map((option: any) => ({
          id: option.id,
          text: option.text,
          voteCount: option.voteCount || 0,
          percentage: totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100 * 10) / 10 : 0
        }))

        return {
          id: poll._id.toString(),
          title: poll.title,
          description: poll.description,
          type: poll.type,
          category: poll.category,
          tags: poll.tags || [],
          createdAt: poll.createdAt,
          updatedAt: poll.updatedAt,
          popularity,
          metadata: {
            totalVotes: poll.metadata?.totalVotes || 0,
            viewCount: poll.metadata?.viewCount || 0,
            status: poll.status
          },
          creator: {
            id: poll.creatorId?.toString() || poll.creator?.[0]?._id?.toString(),
            email: req.user?.role === 'admin' ? (poll.creatorId?.email || poll.creator?.[0]?.email) : undefined
          },
          options
        }
      })
    )

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / (query.limit || 20))
    const hasNextPage = (query.page || 1) < totalPages
    const hasPrevPage = (query.page || 1) > 1

    return NextResponse.json({
      success: true,
      polls: formattedPolls,
      pagination: {
        currentPage: query.page || 1,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: query.limit || 20
      },
      filters: {
        search: query.search,
        category: query.category,
        tags: query.tags,
        type: query.type,
        status: query.status,
        sortBy: query.sortBy,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        dateRange: query.dateRange,
        minVotes: query.minVotes,
        maxVotes: query.maxVotes,
        hasDescription: query.hasDescription
      },
      metadata: {
        generatedAt: new Date(),
        cacheExpiry: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }
    })

  } catch (error) {
    console.error('Error fetching public polls:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch public polls',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate popularity metrics for a poll
 */
async function calculatePopularityMetrics(poll: any): Promise<PopularityMetrics> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  // Basic metrics from poll metadata
  const totalVotes = poll.metadata?.totalVotes || 0
  const viewCount = poll.metadata?.viewCount || 0

  // Calculate recent activity (simplified - using updatedAt as proxy)
  const recentActivity = poll.updatedAt >= oneDayAgo ? totalVotes : 0

  // Calculate engagement rate (votes per view)
  const engagementRate = viewCount > 0 ? (totalVotes / viewCount) * 100 : 0

  // Calculate trending score
  const ageInDays = Math.max(1, (now.getTime() - new Date(poll.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  const trendingScore = (
    (totalVotes * 1) +
    (viewCount * 0.1) +
    (recentActivity * 5)
  ) / Math.log(ageInDays + 1) // Decay over time

  return {
    totalVotes,
    recentActivity,
    trendingScore: Math.round(trendingScore * 100) / 100,
    engagementRate: Math.round(engagementRate * 10) / 10
  }
}

// Apply optional authentication with rate limiting
export const GET = combineWithRateLimit(withPublicDirectoryRateLimit, withOptionalAuth)(getPublicPolls)