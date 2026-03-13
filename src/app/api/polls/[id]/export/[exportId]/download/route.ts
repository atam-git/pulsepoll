import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ExportService } from '@/services/export'
import Poll from '@/models/Poll'
import Export from '@/models/Export'
import connectDB from '@/lib/mongodb'

interface RouteParams {
  params: Promise<{ id: string; exportId: string }>
}

/**
 * GET /api/polls/[id]/export/[exportId]/download
 * Download export file
 */
async function downloadExport(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId, exportId } = await params

    if (!pollId || !exportId) {
      return NextResponse.json(
        { error: 'Poll ID and Export ID are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get export record
    const exportRecord = await Export.findById(exportId)
    if (!exportRecord) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }

    // Check if export has expired
    if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Export has expired' },
        { status: 410 }
      )
    }

    // Check if export is completed
    if (exportRecord.status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Export not ready',
          status: exportRecord.status 
        },
        { status: 202 }
      )
    }

    // Get poll to verify access
    const poll = await Poll.findById(pollId)
    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Check if user can download this export
    if (poll.creatorId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // For this demo, we'll regenerate the export data
    // In production, you would retrieve the stored file from cloud storage
    const regeneratedExport = await ExportService.generateExport(
      pollId,
      req.user!.id,
      exportRecord.options
    )

    if (!regeneratedExport.data) {
      return NextResponse.json(
        { error: 'Export data not available for download' },
        { status: 404 }
      )
    }

    // Determine content type and filename
    let contentType: string
    let filename: string

    switch (exportRecord.format) {
      case 'csv':
        contentType = 'text/csv'
        filename = `poll-${pollId}-export.csv`
        break
      case 'json':
        contentType = 'application/json'
        filename = `poll-${pollId}-export.json`
        break
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `poll-${pollId}-export.xlsx`
        break
      default:
        contentType = 'application/octet-stream'
        filename = `poll-${pollId}-export.txt`
    }

    // Set headers for file download
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': regeneratedExport.data.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })

    return new NextResponse(regeneratedExport.data, { headers })

  } catch (error) {
    console.error('Error downloading export:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Export not found') {
        return NextResponse.json(
          { error: 'Export not found' },
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
      { error: 'Failed to download export' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const GET = withUserAuth(downloadExport)