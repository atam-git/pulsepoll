import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withVotingRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import Session from '@/models/Session'
import connectDB from '@/lib/mongodb'
import { RealTimeHelper } from '@/services/realtime'
import { ReferralTracker } from '@/services/referral'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/polls/[id]/vote
 * Submit a vote for a specific poll
 */
async function submitVote(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId } = await params
    const body = await req.json()
    const { 
      votes, 
      voterInfo = {},
      sessionId 
    } = body

    if (!pollId || pollId === 'undefined' || pollId === 'null') {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      )
    }

    if (!votes || (Array.isArray(votes) && votes.length === 0)) {
      return NextResponse.json(
        { error: 'Vote data is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get the poll
    const poll = await Poll.findById(pollId)
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if poll is active and not expired
    if (poll.status !== 'active') {
      return NextResponse.json(
        { error: 'Poll is not active' },
        { status: 400 }
      )
    }

    if (poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Poll has expired' },
        { status: 400 }
      )
    }

    // Check authentication requirements
    if (poll.settings.requireAuth && !req.user) {
      return NextResponse.json(
        { error: 'Authentication required for this poll' },
        { status: 401 }
      )
    }

    if (poll.privacy.requireEmailVerification && req.user && !req.user.emailVerified) {
      return NextResponse.json(
        { error: 'Email verification required for this poll' },
        { status: 403 }
      )
    }

    // Parse referral information
    const referer = req.headers.get('referer')
    const userAgent = req.headers.get('user-agent')
    const url = new URL(req.url)
    const referralData = ReferralTracker.parseReferralData(referer, userAgent, url.searchParams)

    // Prepare voter information
    const voterData = {
      userId: req.user?.id || null,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      sessionId: sessionId || null,
      fingerprint: voterInfo.fingerprint || null,
      userAgent: req.headers.get('user-agent') || null,
      location: voterInfo.location ? {
        country: voterInfo.location.country || 'Unknown',
        region: voterInfo.location.region || 'Unknown', 
        city: voterInfo.location.city || voterInfo.location
      } : undefined
    }

    // Check for duplicate votes
    const duplicateCheck = await Vote.checkDuplicate(
      pollId,
      voterData.userId,
      voterData.ipAddress,
      voterData.sessionId,
      voterData.fingerprint
    )

    if (duplicateCheck) {
      return NextResponse.json(
        { 
          error: 'Duplicate vote detected',
          details: 'You have already voted in this poll',
          duplicateType: duplicateCheck.duplicateType,
          originalVoteTime: duplicateCheck.createdAt
        },
        { status: 409 }
      )
    }

    // Validate vote data based on poll type
    const validationResult = validateVoteData(poll, votes)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Invalid vote data', details: validationResult.errors },
        { status: 400 }
      )
    }

    // Create the vote record
    const voteData = {
      pollId,
      voterInfo: {
        ipAddress: voterData.ipAddress,
        userAgent: voterData.userAgent || 'Unknown',
        fingerprint: voterData.fingerprint || 'unknown-' + Date.now(),
        sessionId: voterData.sessionId || 'session-' + Date.now(),
        location: voterData.location
      },
      voteData: formatVoteData(poll.type, votes),
      referralSource: referralData.source,
      metadata: {
        submittedAt: new Date(),
        pollType: poll.type,
        deviceInfo: {
          userAgent: voterData.userAgent,
          ipAddress: voterData.ipAddress
        },
        // Enhanced demographic tracking
        demographics: {
          deviceType: extractDeviceType(voterData.userAgent || ''),
          location: typeof voterData.location === 'string' ? voterData.location : voterData.location?.city,
          referralSource: referralData.source,
          referralMedium: referralData.medium,
          referralUrl: referralData.url,
          referralCampaign: referralData.campaign,
          timestamp: new Date(),
          sessionDuration: null // Could be calculated if we track session start
        }
      }
    }

    const vote = new Vote(voteData)
    await vote.save()

    // Update poll vote counts
    await updatePollVoteCounts(poll, votes)

    // Create/update session for duplicate prevention
    if (voterData.sessionId) {
      await Session.createOrUpdate(voterData.sessionId, {
        pollId,
        voterId: voterData.userId,
        ipAddress: voterData.ipAddress,
        fingerprint: voterData.fingerprint,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
    }

    // Get updated poll data for response
    const updatedPoll = await Poll.findById(pollId)

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Vote submitted successfully',
      vote: {
        id: vote._id,
        submittedAt: vote.metadata.submittedAt,
        pollType: vote.metadata.pollType
      },
      poll: {
        id: updatedPoll._id,
        totalVotes: updatedPoll.metadata.totalVotes,
        options: updatedPoll.options.map((option: any) => ({
          id: option.id,
          text: option.text,
          voteCount: option.voteCount
        }))
      }
    }

    // Broadcast real-time update to connected clients
    try {
      RealTimeHelper.broadcastVoteUpdate(
        pollId,
        {
          id: vote._id,
          submittedAt: vote.metadata.submittedAt,
          pollType: vote.metadata.pollType,
          voterInfo: {
            isAuthenticated: !!voterData.userId,
            location: voterData.location
          }
        },
        responseData.poll
      )
    } catch (broadcastError) {
      console.error('Error broadcasting vote update:', broadcastError)
      // Don't fail the vote submission if broadcast fails
    }

    return NextResponse.json(responseData, { status: 201 })

  } catch (error) {
    console.error('Error submitting vote:', error)
    
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Duplicate vote detected' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}

/**
 * Validate vote data based on poll type
 */
function validateVoteData(poll: any, votes: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (poll.type) {
    case 'single':
      // Single choice: exactly one option selected
      if (!Array.isArray(votes) || votes.length !== 1) {
        errors.push('Single choice polls require exactly one selection')
      } else if (!poll.options.some((opt: any) => opt.id === votes[0])) {
        errors.push('Invalid option selected')
      }
      break

    case 'multiple':
      // Multiple choice: one or more options selected
      if (!Array.isArray(votes) || votes.length === 0) {
        errors.push('Multiple choice polls require at least one selection')
      } else {
        const invalidOptions = votes.filter(voteId => 
          !poll.options.some((opt: any) => opt.id === voteId)
        )
        if (invalidOptions.length > 0) {
          errors.push('Invalid options selected')
        }
        
        // Check max selections if configured
        if (poll.settings.maxSelections && votes.length > poll.settings.maxSelections) {
          errors.push(`Maximum ${poll.settings.maxSelections} selections allowed`)
        }
      }
      break

    case 'ranking':
      // Ranking: ordered list of options
      if (!Array.isArray(votes) || votes.length === 0) {
        errors.push('Ranking polls require at least one ranked option')
      } else {
        // Check for duplicate rankings
        const uniqueVotes = new Set(votes)
        if (uniqueVotes.size !== votes.length) {
          errors.push('Duplicate rankings are not allowed')
        }
        
        // Validate all ranked options exist
        const invalidOptions = votes.filter(voteId => 
          !poll.options.some((opt: any) => opt.id === voteId)
        )
        if (invalidOptions.length > 0) {
          errors.push('Invalid options in ranking')
        }
      }
      break

    case 'yesno':
      // Yes/No: exactly one of the two options
      if (!Array.isArray(votes) || votes.length !== 1) {
        errors.push('Yes/No polls require exactly one selection')
      } else if (!poll.options.some((opt: any) => opt.id === votes[0])) {
        errors.push('Invalid option selected')
      }
      break

    case 'survey':
      // Survey: responses to questions
      if (!votes || typeof votes !== 'object') {
        errors.push('Survey responses are required')
      } else {
        // Validate each question response
        poll.options.forEach((question: any) => {
          const response = votes[question.id]
          if (response === undefined || response === null || response === '') {
            // Allow empty responses unless required
            if (question.required) {
              errors.push(`Response required for: ${question.text}`)
            }
          }
        })
      }
      break

    default:
      errors.push('Invalid poll type')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format vote data based on poll type
 */
function formatVoteData(pollType: string, votes: any): any {
  switch (pollType) {
    case 'single':
    case 'yesno':
      return { selectedOptions: votes } // Keep as array for consistency
    
    case 'multiple':
      return { selectedOptions: votes }
    
    case 'ranking':
      return { 
        selectedOptions: votes, // Keep the selected options
        rankings: votes.reduce((acc: any, optionId: string, index: number) => {
          acc[optionId] = index + 1
          return acc
        }, {})
      }
    
    case 'survey':
      return { 
        selectedOptions: Object.keys(votes), // Survey question IDs
        textResponses: votes 
      }
    
    default:
      return { selectedOptions: Array.isArray(votes) ? votes : [votes] }
  }
}

/**
 * Update poll vote counts
 */
async function updatePollVoteCounts(poll: any, votes: any): Promise<void> {
  const updates: any = {
    $inc: {
      'metadata.totalVotes': 1
    },
    $set: {
      'metadata.updatedAt': new Date()
    }
  }

  // Update individual option vote counts
  switch (poll.type) {
    case 'single':
    case 'yesno':
      // Increment count for selected option
      const optionIndex = poll.options.findIndex((opt: any) => opt.id === votes[0])
      if (optionIndex !== -1) {
        updates.$inc[`options.${optionIndex}.voteCount`] = 1
      }
      break

    case 'multiple':
      // Increment count for each selected option
      votes.forEach((voteId: string) => {
        const optionIndex = poll.options.findIndex((opt: any) => opt.id === voteId)
        if (optionIndex !== -1) {
          updates.$inc[`options.${optionIndex}.voteCount`] = 1
        }
      })
      break

    case 'ranking':
      // For ranking, we might want to weight votes or just count participation
      votes.forEach((voteId: string) => {
        const optionIndex = poll.options.findIndex((opt: any) => opt.id === voteId)
        if (optionIndex !== -1) {
          updates.$inc[`options.${optionIndex}.voteCount`] = 1
        }
      })
      break

    case 'survey':
      // For surveys, count responses per question
      Object.keys(votes).forEach(questionId => {
        const optionIndex = poll.options.findIndex((opt: any) => opt.id === questionId)
        if (optionIndex !== -1 && votes[questionId]) {
          updates.$inc[`options.${optionIndex}.voteCount`] = 1
        }
      })
      break
  }

  await Poll.findByIdAndUpdate(poll._id, updates)
}

/**
 * Extract device type from user agent
 */
function extractDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

// Apply authentication middleware with rate limiting (optional auth allows anonymous voting)
export const POST = combineWithRateLimit(withVotingRateLimit, withOptionalAuth)(submitVote)