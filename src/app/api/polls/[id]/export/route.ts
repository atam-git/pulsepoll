import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import { withExportRateLimit, combineWithRateLimit } from '@/middleware/rateLimit'
import Poll from '@/models/Poll'
import connectDB from '@/lib/mongodb'
import { ExportService, ExportHelper, ExportOptions } from '@/services/export'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/polls/[id]/export
 * Create a new export for a poll
 */
async function createExport(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId } = await params
    const body = await req.json()
    
    const {
      format = 'csv',
      includeVoteDetails = true,
      includeAnalytics = false,
      includeTimestamps = true,
      includeDemographics = false,
      dateRange
    } = body

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(pollId)
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can export this poll
    if (poll.creatorId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate export options
    const exportOptions: ExportOptions = {
      format,
      includeVoteDetails,
      includeAnalytics,
      includeTimestamps,
      includeDemographics,
      ...(dateRange && {
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        }
      })
    }

    const validationErrors = ExportHelper.validateExportOptions(exportOptions)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid export options', details: validationErrors },
        { status: 400 }
      )
    }

    // Estimate file size
    const estimatedSize = ExportHelper.estimateFileSize(
      poll.metadata.totalVotes, 
      exportOptions
    )

    // Check if export is too large (10MB limit for direct download)
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          error: 'Export too large for direct download',
          estimatedSize,
          suggestion: 'Consider using date range filters or excluding vote details'
        },
        { status: 413 }
      )
    }

    // Generate export
    const result = await ExportService.generateExport(
      pollId,
      req.user!.id,
      exportOptions
    )

    return NextResponse.json({
      success: true,
      export: {
        id: result.exportId,
        downloadUrl: result.downloadUrl,
        estimatedSize,
        format: exportOptions.format,
        ...(result.data && { data: result.data }) // Include data for small exports
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating export:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Poll not found') {
        return NextResponse.json(
          { error: 'Poll not found' },
          { status: 404 }
        )
      }
      if (error.message === 'Access denied') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/polls/[id]/export
 * List exports for a poll
 */
async function listExports(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId } = await params

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const poll = await Poll.findById(pollId)
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can access this poll's exports
    if (poll.creatorId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const exports = await ExportService.listExports(pollId, req.user!.id)

    return NextResponse.json({
      success: true,
      exports,
      poll: {
        id: poll._id,
        title: poll.title,
        totalVotes: poll.metadata.totalVotes
      }
    })

  } catch (error) {
    console.error('Error listing exports:', error)
    return NextResponse.json(
      { error: 'Failed to list exports' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware with rate limiting
export const POST = combineWithRateLimit(withExportRateLimit, withUserAuth)(createExport)
export const GET = combineWithRateLimit(withExportRateLimit, withUserAuth)(listExports)