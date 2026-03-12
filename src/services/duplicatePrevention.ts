import Vote from '@/models/Vote'
import Session from '@/models/Session'
import connectDB from '@/lib/mongodb'

export interface VoterIdentity {
  userId?: string | null
  ipAddress?: string
  sessionId?: string | null
  fingerprint?: string | null
  userAgent?: string | null
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  duplicateType?: 'user' | 'ip' | 'session' | 'fingerprint'
  originalVote?: {
    id: string
    createdAt: Date
    voterInfo: any
  }
  confidence: number // 0-100, how confident we are this is a duplicate
  riskFactors: string[]
}

export interface DuplicatePreventionConfig {
  enableUserCheck: boolean
  enableIpCheck: boolean
  enableSessionCheck: boolean
  enableFingerprintCheck: boolean
  ipCooldownMinutes: number
  sessionCooldownMinutes: number
  fingerprintCooldownMinutes: number
  maxVotesPerIp: number
  maxVotesPerFingerprint: number
}

/**
 * Comprehensive duplicate prevention system
 */
export class DuplicatePreventionSystem {
  private static defaultConfig: DuplicatePreventionConfig = {
    enableUserCheck: true,
    enableIpCheck: true,
    enableSessionCheck: true,
    enableFingerprintCheck: true,
    ipCooldownMinutes: 60, // 1 hour
    sessionCooldownMinutes: 1440, // 24 hours
    fingerprintCooldownMinutes: 720, // 12 hours
    maxVotesPerIp: 10,
    maxVotesPerFingerprint: 5
  }

  /**
   * Comprehensive duplicate check
   */
  static async checkDuplicate(
    pollId: string,
    voterIdentity: VoterIdentity,
    config: Partial<DuplicatePreventionConfig> = {}
  ): Promise<DuplicateCheckResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    try {
      await connectDB()

      const checks = await Promise.all([
        this.checkUserDuplicate(pollId, voterIdentity, finalConfig),
        this.checkIpDuplicate(pollId, voterIdentity, finalConfig),
        this.checkSessionDuplicate(pollId, voterIdentity, finalConfig),
        this.checkFingerprintDuplicate(pollId, voterIdentity, finalConfig)
      ])

      // Analyze results and determine overall duplicate status
      return this.analyzeResults(checks)
    } catch (error) {
      console.error('Error in duplicate check:', error)
      // Fail safe - allow vote but log the error
      return {
        isDuplicate: false,
        confidence: 0,
        riskFactors: ['duplicate-check-failed']
      }
    }
  }

  /**
   * Check for user-based duplicates
   */
  private static async checkUserDuplicate(
    pollId: string,
    voterIdentity: VoterIdentity,
    config: DuplicatePreventionConfig
  ): Promise<DuplicateCheckResult> {
    if (!config.enableUserCheck || !voterIdentity.userId) {
      return { isDuplicate: false, confidence: 0, riskFactors: [] }
    }

    const existingVote = await Vote.findOne({
      pollId,
      'voterInfo.userId': voterIdentity.userId
    }).sort({ createdAt: -1 })

    if (existingVote) {
      return {
        isDuplicate: true,
        duplicateType: 'user',
        originalVote: {
          id: existingVote._id.toString(),
          createdAt: existingVote.createdAt,
          voterInfo: existingVote.voterInfo
        },
        confidence: 100, // User ID is definitive
        riskFactors: ['authenticated-user-duplicate']
      }
    }

    return { isDuplicate: false, confidence: 0, riskFactors: [] }
  }

  /**
   * Check for IP-based duplicates
   */
  private static async checkIpDuplicate(
    pollId: string,
    voterIdentity: VoterIdentity,
    config: DuplicatePreventionConfig
  ): Promise<DuplicateCheckResult> {
    if (!config.enableIpCheck || !voterIdentity.ipAddress) {
      return { isDuplicate: false, confidence: 0, riskFactors: [] }
    }

    const cutoffTime = new Date(Date.now() - config.ipCooldownMinutes * 60 * 1000)
    
    const recentVotes = await Vote.find({
      pollId,
      'voterInfo.ipAddress': voterIdentity.ipAddress,
      createdAt: { $gte: cutoffTime }
    }).sort({ createdAt: -1 })

    if (recentVotes.length > 0) {
      const confidence = Math.min(80, 40 + (recentVotes.length * 20))
      
      return {
        isDuplicate: recentVotes.length >= 1,
        duplicateType: 'ip',
        originalVote: {
          id: recentVotes[0]._id.toString(),
          createdAt: recentVotes[0].createdAt,
          voterInfo: recentVotes[0].voterInfo
        },
        confidence,
        riskFactors: [
          'ip-address-duplicate',
          ...(recentVotes.length > 1 ? ['multiple-ip-votes'] : [])
        ]
      }
    }

    // Check total votes from this IP
    const totalIpVotes = await Vote.countDocuments({
      pollId,
      'voterInfo.ipAddress': voterIdentity.ipAddress
    })

    if (totalIpVotes >= config.maxVotesPerIp) {
      return {
        isDuplicate: true,
        duplicateType: 'ip',
        confidence: 90,
        riskFactors: ['ip-vote-limit-exceeded']
      }
    }

    return { isDuplicate: false, confidence: 0, riskFactors: [] }
  }

  /**
   * Check for session-based duplicates
   */
  private static async checkSessionDuplicate(
    pollId: string,
    voterIdentity: VoterIdentity,
    config: DuplicatePreventionConfig
  ): Promise<DuplicateCheckResult> {
    if (!config.enableSessionCheck || !voterIdentity.sessionId) {
      return { isDuplicate: false, confidence: 0, riskFactors: [] }
    }

    // Check session record
    const session = await Session.findOne({
      sessionId: voterIdentity.sessionId,
      pollId
    })

    if (session && !session.isExpired()) {
      return {
        isDuplicate: true,
        duplicateType: 'session',
        confidence: 85,
        riskFactors: ['session-duplicate']
      }
    }

    // Check votes with same session ID
    const cutoffTime = new Date(Date.now() - config.sessionCooldownMinutes * 60 * 1000)
    
    const existingVote = await Vote.findOne({
      pollId,
      'voterInfo.sessionId': voterIdentity.sessionId,
      createdAt: { $gte: cutoffTime }
    }).sort({ createdAt: -1 })

    if (existingVote) {
      return {
        isDuplicate: true,
        duplicateType: 'session',
        originalVote: {
          id: existingVote._id.toString(),
          createdAt: existingVote.createdAt,
          voterInfo: existingVote.voterInfo
        },
        confidence: 75,
        riskFactors: ['session-id-duplicate']
      }
    }

    return { isDuplicate: false, confidence: 0, riskFactors: [] }
  }

  /**
   * Check for fingerprint-based duplicates
   */
  private static async checkFingerprintDuplicate(
    pollId: string,
    voterIdentity: VoterIdentity,
    config: DuplicatePreventionConfig
  ): Promise<DuplicateCheckResult> {
    if (!config.enableFingerprintCheck || !voterIdentity.fingerprint) {
      return { isDuplicate: false, confidence: 0, riskFactors: [] }
    }

    const cutoffTime = new Date(Date.now() - config.fingerprintCooldownMinutes * 60 * 1000)
    
    const recentVotes = await Vote.find({
      pollId,
      'voterInfo.fingerprint': voterIdentity.fingerprint,
      createdAt: { $gte: cutoffTime }
    }).sort({ createdAt: -1 })

    if (recentVotes.length > 0) {
      const confidence = Math.min(70, 30 + (recentVotes.length * 15))
      
      return {
        isDuplicate: true,
        duplicateType: 'fingerprint',
        originalVote: {
          id: recentVotes[0]._id.toString(),
          createdAt: recentVotes[0].createdAt,
          voterInfo: recentVotes[0].voterInfo
        },
        confidence,
        riskFactors: [
          'fingerprint-duplicate',
          ...(recentVotes.length > 1 ? ['multiple-fingerprint-votes'] : [])
        ]
      }
    }

    // Check total votes from this fingerprint
    const totalFingerprintVotes = await Vote.countDocuments({
      pollId,
      'voterInfo.fingerprint': voterIdentity.fingerprint
    })

    if (totalFingerprintVotes >= config.maxVotesPerFingerprint) {
      return {
        isDuplicate: true,
        duplicateType: 'fingerprint',
        confidence: 80,
        riskFactors: ['fingerprint-vote-limit-exceeded']
      }
    }

    return { isDuplicate: false, confidence: 0, riskFactors: [] }
  }

  /**
   * Analyze multiple check results to determine overall duplicate status
   */
  private static analyzeResults(results: DuplicateCheckResult[]): DuplicateCheckResult {
    const duplicates = results.filter(r => r.isDuplicate)
    
    if (duplicates.length === 0) {
      return {
        isDuplicate: false,
        confidence: 0,
        riskFactors: []
      }
    }

    // Find the highest confidence duplicate
    const highestConfidence = duplicates.reduce((max, current) => 
      current.confidence > max.confidence ? current : max
    )

    // Combine risk factors
    const allRiskFactors = results.flatMap(r => r.riskFactors)
    const uniqueRiskFactors = [...new Set(allRiskFactors)]

    // Adjust confidence based on multiple detection methods
    let adjustedConfidence = highestConfidence.confidence
    if (duplicates.length > 1) {
      adjustedConfidence = Math.min(100, adjustedConfidence + (duplicates.length - 1) * 10)
    }

    return {
      isDuplicate: true,
      duplicateType: highestConfidence.duplicateType,
      originalVote: highestConfidence.originalVote,
      confidence: adjustedConfidence,
      riskFactors: uniqueRiskFactors
    }
  }

  /**
   * Record a vote attempt for analytics
   */
  static async recordVoteAttempt(
    pollId: string,
    voterIdentity: VoterIdentity,
    result: 'success' | 'duplicate' | 'blocked',
    duplicateResult?: DuplicateCheckResult
  ): Promise<void> {
    try {
      // This could be stored in a separate analytics collection
      const attemptRecord = {
        pollId,
        voterIdentity,
        result,
        duplicateResult,
        timestamp: new Date(),
        metadata: {
          userAgent: voterIdentity.userAgent,
          ipAddress: voterIdentity.ipAddress
        }
      }

      // For now, just log it. In production, you might want to store this
      console.log('Vote attempt recorded:', attemptRecord)
    } catch (error) {
      console.error('Error recording vote attempt:', error)
    }
  }

  /**
   * Get duplicate prevention statistics for a poll
   */
  static async getPreventionStats(pollId: string): Promise<{
    totalAttempts: number
    successfulVotes: number
    duplicatesBlocked: number
    blocksByType: Record<string, number>
    topRiskFactors: Array<{ factor: string; count: number }>
  }> {
    try {
      await connectDB()

      const votes = await Vote.find({ pollId })
      const totalVotes = votes.length

      // This is a simplified version. In production, you'd track attempts separately
      return {
        totalAttempts: totalVotes, // Simplified
        successfulVotes: totalVotes,
        duplicatesBlocked: 0, // Would need separate tracking
        blocksByType: {},
        topRiskFactors: []
      }
    } catch (error) {
      console.error('Error getting prevention stats:', error)
      return {
        totalAttempts: 0,
        successfulVotes: 0,
        duplicatesBlocked: 0,
        blocksByType: {},
        topRiskFactors: []
      }
    }
  }

  /**
   * Clean up expired sessions and old vote records
   */
  static async cleanup(): Promise<{
    expiredSessions: number
    oldVoteRecords: number
  }> {
    try {
      await connectDB()

      // Clean up expired sessions
      const expiredSessionsResult = await Session.deleteMany({
        expiresAt: { $lt: new Date() }
      })

      // Clean up old vote attempt records (if implemented)
      // For now, we don't delete actual votes as they're permanent records
      
      return {
        expiredSessions: expiredSessionsResult.deletedCount,
        oldVoteRecords: 0
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
      return {
        expiredSessions: 0,
        oldVoteRecords: 0
      }
    }
  }
}