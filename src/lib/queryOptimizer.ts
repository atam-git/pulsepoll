import mongoose from 'mongoose'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import connectDB from '@/lib/mongodb'
import { cacheService } from '@/services/cache'

interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface PollFilters {
  status?: string
  category?: string
  tags?: string[]
  search?: string
  type?: string
}

export class QueryOptimizer {
  static async getPollWithResults(pollId: string): Promise<any> {
    const cacheKey = `poll:withResults:${pollId}`
    const cached = cacheService.get<any>(cacheKey)
    if (cached) return cached

    await connectDB()

    const results = await Poll.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(pollId) } },
      {
        $lookup: {
          from: 'votes',
          localField: '_id',
          foreignField: 'pollId',
          as: 'votes',
          pipeline: [
            {
              $group: {
                _id: null,
                totalVotes: { $sum: 1 },
                uniqueVoters: { $addToSet: '$voterInfo.ipAddress' },
                optionVotes: { $push: '$voteData.selectedOptions' },
              },
            },
            {
              $project: {
                totalVotes: 1,
                uniqueVoters: { $size: '$uniqueVoters' },
                optionVotes: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creatorId',
          foreignField: '_id',
          as: 'creator',
          pipeline: [{ $project: { email: 1, name: 1 } }],
        },
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ['$creator', 0] },
          voteStats: { $arrayElemAt: ['$votes', 0] },
        },
      },
      { $project: { votes: 0, __v: 0 } },
    ])

    const result = results[0] || null
    if (result) {
      cacheService.cachePollResults(pollId, result)
    }

    return result
  }

  static async getPublicPolls(
    filters: PollFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ polls: any[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination

    const cacheKey = `public:polls:${JSON.stringify(filters)}:${page}:${limit}:${sortBy}:${sortOrder}`
    const cached = cacheService.get<{ polls: any[]; total: number }>(cacheKey)
    if (cached) return cached

    await connectDB()

    const query: any = { privacy: 'public', status: 'active' }

    if (filters.category) query.category = filters.category
    if (filters.type) query.type = filters.type
    if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags }
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    const skip = (page - 1) * limit
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const projection = {
      title: 1,
      description: 1,
      type: 1,
      category: 1,
      tags: 1,
      privacy: 1,
      status: 1,
      options: { id: 1, text: 1, voteCount: 1 },
      'metadata.totalVotes': 1,
      'metadata.uniqueVoters': 1,
      'metadata.viewCount': 1,
      createdAt: 1,
      creatorId: 1,
    }

    const [polls, total] = await Promise.all([
      Poll.find(query).select(projection).sort(sort).skip(skip).limit(limit).lean(),
      Poll.countDocuments(query),
    ])

    const result = { polls, total }
    cacheService.set(cacheKey, result, 30 * 1000) // 30s TTL for public listings
    return result
  }

  static async getUserPolls(
    userId: string,
    filters: PollFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ polls: any[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination

    const cacheKey = `user:polls:${userId}:${JSON.stringify(filters)}:${page}:${limit}:${sortBy}:${sortOrder}`
    const cached = cacheService.get<{ polls: any[]; total: number }>(cacheKey)
    if (cached) return cached

    await connectDB()

    const query: any = { creatorId: new mongoose.Types.ObjectId(userId) }

    if (filters.status) query.status = filters.status
    if (filters.category) query.category = filters.category
    if (filters.type) query.type = filters.type
    if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags }
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    const skip = (page - 1) * limit
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const projection = {
      title: 1,
      description: 1,
      type: 1,
      category: 1,
      tags: 1,
      privacy: 1,
      status: 1,
      options: { id: 1, text: 1, voteCount: 1 },
      'metadata.totalVotes': 1,
      'metadata.uniqueVoters': 1,
      'metadata.viewCount': 1,
      'settings.expiresAt': 1,
      createdAt: 1,
    }

    const [polls, total] = await Promise.all([
      Poll.find(query).select(projection).sort(sort).skip(skip).limit(limit).lean(),
      Poll.countDocuments(query),
    ])

    const result = { polls, total }
    cacheService.set(cacheKey, result, 60 * 1000) // 1 min TTL for user dashboard
    return result
  }

  static async getVoteStats(pollId: string): Promise<any> {
    const cacheKey = `poll:voteStats:${pollId}`
    const cached = cacheService.get<any>(cacheKey)
    if (cached) return cached

    await connectDB()

    const stats = await Vote.aggregate([
      { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalVotes: { $sum: 1 },
                uniqueIPs: { $addToSet: '$voterInfo.ipAddress' },
                firstVote: { $min: '$createdAt' },
                lastVote: { $max: '$createdAt' },
              },
            },
            {
              $project: {
                _id: 0,
                totalVotes: 1,
                uniqueVoters: { $size: '$uniqueIPs' },
                firstVote: 1,
                lastVote: 1,
              },
            },
          ],
          byOption: [
            { $unwind: '$voteData.selectedOptions' },
            {
              $group: {
                _id: '$voteData.selectedOptions',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          byDay: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          byHour: [
            {
              $group: {
                _id: { $hour: '$createdAt' },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ])

    const result = {
      summary: stats[0]?.summary[0] || { totalVotes: 0, uniqueVoters: 0 },
      byOption: stats[0]?.byOption || [],
      byDay: stats[0]?.byDay || [],
      byHour: stats[0]?.byHour || [],
    }

    cacheService.set(cacheKey, result, 30 * 1000) // 30s TTL
    return result
  }
}
