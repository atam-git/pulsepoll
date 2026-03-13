import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import connectDB from '@/lib/mongodb'
import { ReferralTracker } from './referral'

export interface PollAnalytics {
  totalVotes: number
  uniqueVoters: number
  responseRate: number
  completionRate: number
  averageTimeToVote?: number
  peakVotingTime?: Date
  demographics: {
    locations: Record<string, number>
    deviceTypes: Record<string, number>
    referralSources: Record<string, number>
  }
  timeline: VotingTimelineEntry[]
  optionAnalytics: OptionAnalytics[]
}

export interface OptionAnalytics {
  optionId: string
  text: string
  voteCount: number
  percentage: number
  rank?: number
  averageRank?: number // For ranking polls
}

export interface VotingTimelineEntry {
  timestamp: Date
  cumulativeVotes: number
  votesInPeriod: number
  period: 'hour' | 'day' | 'week'
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line' | 'ranking'
  labels: string[]
  datasets: ChartDataset[]
  metadata: {
    totalVotes: number
    pollType: string
    generatedAt: Date
  }
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string[]
  borderColor?: string[]
  borderWidth?: number
}

/**
 * Analytics Engine for calculating poll results and generating insights
 */
export class AnalyticsEngine {
  
  /**
   * Calculate comprehensive analytics for a poll
   */
  static async calculatePollAnalytics(pollId: string): Promise<PollAnalytics> {
    await connectDB()
    
    const poll = await Poll.findById(pollId)
    if (!poll) {
      throw new Error('Poll not found')
    }

    const votes = await Vote.find({ pollId }).sort({ 'metadata.submittedAt': 1 })
    
    // Basic metrics
    const totalVotes = votes.length
    const uniqueVoters = new Set(votes.map(vote => 
      vote.voterId || vote.voterInfo.ipAddress
    )).size

    // Calculate response and completion rates
    const responseRate = poll.metadata.viewCount > 0 
      ? (totalVotes / poll.metadata.viewCount) * 100 
      : 0
    
    const completionRate = this.calculateCompletionRate(poll, votes)

    // Demographics analysis
    const demographics = this.analyzeDemographics(votes)

    // Timeline analysis
    const timeline = this.generateVotingTimeline(votes)

    // Option analytics with percentages and rankings
    const optionAnalytics = this.calculateOptionAnalytics(poll, votes)

    // Voting patterns
    const averageTimeToVote = this.calculateAverageTimeToVote(votes)
    const peakVotingTime = this.findPeakVotingTime(votes)

    return {
      totalVotes,
      uniqueVoters,
      responseRate,
      completionRate,
      averageTimeToVote,
      peakVotingTime,
      demographics,
      timeline,
      optionAnalytics
    }
  }

  /**
   * Generate chart data for different poll types
   */
  static async generateChartData(pollId: string): Promise<ChartData> {
    await connectDB()
    
    const poll = await Poll.findById(pollId)
    if (!poll) {
      throw new Error('Poll not found')
    }

    const analytics = await this.calculatePollAnalytics(pollId)
    
    switch (poll.type) {
      case 'single':
      case 'yesno':
        return this.generatePieChartData(poll, analytics)
      
      case 'multiple':
        return this.generateBarChartData(poll, analytics)
      
      case 'ranking':
        return this.generateRankingChartData(poll, analytics)
      
      case 'survey':
        return this.generateSurveyChartData(poll, analytics)
      
      default:
        throw new Error(`Unsupported poll type: ${poll.type}`)
    }
  }

  /**
   * Calculate percentage with proper rounding
   */
  static calculatePercentage(value: number, total: number, decimals: number = 1): number {
    if (total === 0) return 0
    const percentage = (value / total) * 100
    return Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }

  /**
   * Calculate vote count accuracy (for property testing)
   */
  static validateVoteCounts(poll: any, votes: any[]): boolean {
    const calculatedTotal = poll.options.reduce((sum: number, option: any) => 
      sum + option.voteCount, 0
    )
    
    // For single/yesno polls, total should equal vote count
    if (['single', 'yesno'].includes(poll.type)) {
      return calculatedTotal === votes.length
    }
    
    // For multiple choice, total can be higher than vote count
    if (poll.type === 'multiple') {
      return calculatedTotal >= votes.length
    }
    
    // For ranking, each vote should contribute to multiple options
    if (poll.type === 'ranking') {
      return calculatedTotal >= votes.length
    }
    
    return true
  }

  /**
   * Private helper methods
   */
  private static calculateCompletionRate(poll: any, votes: any[]): number {
    if (poll.type !== 'survey') {
      return 100 // Non-survey polls are always "complete" if submitted
    }
    
    const requiredQuestions = poll.options.filter((q: any) => q.required).length
    if (requiredQuestions === 0) return 100
    
    const completeVotes = votes.filter(vote => {
      const responses = vote.voteData.responses || {}
      return poll.options
        .filter((q: any) => q.required)
        .every((q: any) => responses[q.id] !== undefined && responses[q.id] !== '')
    })
    
    return votes.length > 0 ? (completeVotes.length / votes.length) * 100 : 0
  }

  private static analyzeDemographics(votes: any[]): PollAnalytics['demographics'] {
    const locations: Record<string, number> = {}
    const deviceTypes: Record<string, number> = {}
    const referralSources: Record<string, number> = {}

    votes.forEach(vote => {
      // Location analysis
      if (vote.metadata?.demographics?.location) {
        const location = vote.metadata.demographics.location
        locations[location] = (locations[location] || 0) + 1
      }

      // Device type analysis
      if (vote.metadata?.demographics?.deviceType) {
        const deviceType = vote.metadata.demographics.deviceType
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1
      } else if (vote.voterInfo.userAgent) {
        // Fallback to extracting from user agent
        const deviceType = this.extractDeviceType(vote.voterInfo.userAgent)
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1
      }

      // Referral source analysis
      const referral = vote.metadata?.demographics?.referralSource || 'direct'
      referralSources[referral] = (referralSources[referral] || 0) + 1
    })

    return { locations, deviceTypes, referralSources }
  }

  private static extractDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  private static generateVotingTimeline(votes: any[]): VotingTimelineEntry[] {
    if (votes.length === 0) return []

    const timeline: VotingTimelineEntry[] = []
    const sortedVotes = votes.sort((a, b) => 
      new Date(a.metadata.submittedAt).getTime() - new Date(b.metadata.submittedAt).getTime()
    )

    // Group votes by hour for timeline
    const hourlyGroups = new Map<string, number>()
    
    sortedVotes.forEach((vote, index) => {
      const timestamp = new Date(vote.metadata.submittedAt)
      const hourKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`
      
      hourlyGroups.set(hourKey, (hourlyGroups.get(hourKey) || 0) + 1)
      
      // Add cumulative entry
      timeline.push({
        timestamp,
        cumulativeVotes: index + 1,
        votesInPeriod: 1,
        period: 'hour'
      })
    })

    return timeline
  }

  private static calculateOptionAnalytics(poll: any, votes: any[]): OptionAnalytics[] {
    const totalVotes = votes.length
    
    return poll.options.map((option: any, index: number) => {
      const voteCount = option.voteCount || 0
      const percentage = this.calculatePercentage(voteCount, totalVotes)
      
      let rank: number | undefined
      let averageRank: number | undefined

      // Calculate ranking-specific metrics
      if (poll.type === 'ranking') {
        const rankings = votes
          .map(vote => vote.voteData.rankedOptions || [])
          .filter(rankedOptions => rankedOptions.some((ro: any) => ro.optionId === option.id))
          .map(rankedOptions => rankedOptions.find((ro: any) => ro.optionId === option.id)?.rank)
          .filter(rank => rank !== undefined)

        if (rankings.length > 0) {
          averageRank = rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length
          rank = Math.round(averageRank)
        }
      }

      return {
        optionId: option.id,
        text: option.text,
        voteCount,
        percentage,
        rank,
        averageRank
      }
    })
  }

  private static calculateAverageTimeToVote(votes: any[]): number | undefined {
    // This would require tracking when users started vs completed voting
    // For now, return undefined as we don't track start times
    return undefined
  }

  private static findPeakVotingTime(votes: any[]): Date | undefined {
    if (votes.length === 0) return undefined

    const hourCounts = new Map<number, number>()
    
    votes.forEach(vote => {
      const hour = new Date(vote.metadata.submittedAt).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    })

    let peakHour = 0
    let maxCount = 0
    
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count
        peakHour = hour
      }
    })

    // Return a date representing the peak hour (using today as base)
    const today = new Date()
    today.setHours(peakHour, 0, 0, 0)
    return today
  }

  private static generatePieChartData(poll: any, analytics: PollAnalytics): ChartData {
    const labels = analytics.optionAnalytics.map(opt => opt.text)
    const data = analytics.optionAnalytics.map(opt => opt.voteCount)
    const colors = this.generateColors(labels.length)

    return {
      type: 'pie',
      labels,
      datasets: [{
        label: 'Votes',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2
      }],
      metadata: {
        totalVotes: analytics.totalVotes,
        pollType: poll.type,
        generatedAt: new Date()
      }
    }
  }

  private static generateBarChartData(poll: any, analytics: PollAnalytics): ChartData {
    const labels = analytics.optionAnalytics.map(opt => opt.text)
    const data = analytics.optionAnalytics.map(opt => opt.voteCount)
    const colors = this.generateColors(labels.length)

    return {
      type: 'bar',
      labels,
      datasets: [{
        label: 'Votes',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2
      }],
      metadata: {
        totalVotes: analytics.totalVotes,
        pollType: poll.type,
        generatedAt: new Date()
      }
    }
  }

  private static generateRankingChartData(poll: any, analytics: PollAnalytics): ChartData {
    // Sort by average rank (lower is better)
    const sortedOptions = [...analytics.optionAnalytics]
      .filter(opt => opt.averageRank !== undefined)
      .sort((a, b) => (a.averageRank || 0) - (b.averageRank || 0))

    const labels = sortedOptions.map(opt => opt.text)
    const data = sortedOptions.map(opt => opt.averageRank || 0)
    const colors = this.generateColors(labels.length)

    return {
      type: 'ranking',
      labels,
      datasets: [{
        label: 'Average Rank',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2
      }],
      metadata: {
        totalVotes: analytics.totalVotes,
        pollType: poll.type,
        generatedAt: new Date()
      }
    }
  }

  private static generateSurveyChartData(poll: any, analytics: PollAnalytics): ChartData {
    // For surveys, show response counts per question
    const labels = analytics.optionAnalytics.map(opt => opt.text)
    const data = analytics.optionAnalytics.map(opt => opt.voteCount)
    const colors = this.generateColors(labels.length)

    return {
      type: 'bar',
      labels,
      datasets: [{
        label: 'Responses',
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2
      }],
      metadata: {
        totalVotes: analytics.totalVotes,
        pollType: poll.type,
        generatedAt: new Date()
      }
    }
  }

  private static generateColors(count: number): string[] {
    const baseColors = [
      'rgba(54, 162, 235, 0.8)',   // Blue
      'rgba(255, 99, 132, 0.8)',   // Red
      'rgba(255, 205, 86, 0.8)',   // Yellow
      'rgba(75, 192, 192, 0.8)',   // Green
      'rgba(153, 102, 255, 0.8)',  // Purple
      'rgba(255, 159, 64, 0.8)',   // Orange
      'rgba(199, 199, 199, 0.8)',  // Grey
      'rgba(83, 102, 255, 0.8)',   // Indigo
    ]

    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length])
    }
    return colors
  }
}

/**
 * Helper functions for analytics calculations
 */
export class AnalyticsHelper {
  
  /**
   * Calculate percentage with validation
   */
  static calculatePercentage(value: number, total: number, decimals: number = 1): number {
    return AnalyticsEngine.calculatePercentage(value, total, decimals)
  }

  /**
   * Validate vote count accuracy
   */
  static validateVoteCounts(poll: any, votes: any[]): boolean {
    return AnalyticsEngine.validateVoteCounts(poll, votes)
  }

  /**
   * Get analytics summary for dashboard
   */
  static async getAnalyticsSummary(pollId: string) {
    const analytics = await AnalyticsEngine.calculatePollAnalytics(pollId)
    
    return {
      totalVotes: analytics.totalVotes,
      uniqueVoters: analytics.uniqueVoters,
      responseRate: Math.round(analytics.responseRate * 10) / 10,
      completionRate: Math.round(analytics.completionRate * 10) / 10,
      topOption: analytics.optionAnalytics
        .sort((a, b) => b.voteCount - a.voteCount)[0],
      peakVotingTime: analytics.peakVotingTime,
      lastUpdated: new Date()
    }
  }

  /**
   * Generate real-time analytics update
   */
  static async generateRealTimeUpdate(pollId: string) {
    const summary = await this.getAnalyticsSummary(pollId)
    const chartData = await AnalyticsEngine.generateChartData(pollId)
    
    return {
      summary,
      chartData,
      timestamp: new Date()
    }
  }
}