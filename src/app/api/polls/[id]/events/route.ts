import { NextRequest, NextResponse } from 'next/server'
import { RealTimeEngine } from '@/services/realtime'
import { RateLimitService, RateLimitConfigs } from '@/services/rateLimit'
import connectDB from '@/lib/mongodb'
import Poll from '@/models/Poll'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/polls/[id]/events - Server-Sent Events endpoint for real-time poll updates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params

    // Apply rate limiting for real-time connections
    const rateLimitResult = await RateLimitService.checkRateLimit(
      request,
      RateLimitConfigs.realtime
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many real-time connection attempts. Please wait before reconnecting.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Validate poll exists and is accessible
    await connectDB()
    const poll = await Poll.findById(pollId)
    
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if poll is active
    if (poll.status !== 'active') {
      return NextResponse.json(
        { error: 'Poll is not active' },
        { status: 403 }
      )
    }

    // Get user session for authenticated connections
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Create SSE connection
    const realTimeEngine = RealTimeEngine.getInstance()
    const { stream, connectionId } = realTimeEngine.createConnection(
      pollId,
      request,
      userId
    )

    // Set SSE headers with rate limit information
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
    })

    console.log(`SSE connection established for poll ${pollId}, connection ${connectionId}`)

    return new Response(stream, { headers })

  } catch (error) {
    console.error('Error creating SSE connection:', error)
    return NextResponse.json(
      { error: 'Failed to establish connection' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/polls/[id]/events - Handle CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}