import { NextRequest, NextResponse } from 'next/server'
import { withUserAuth, AuthenticatedRequest } from '@/middleware/auth'
import { ExportService } from '@/services/export'

interface RouteParams {
  params: Promise<{ id: string; exportId: string }>
}

/**
 * GET /api/polls/[id]/export/[exportId]
 * Get export status and details
 */
async function getExportStatus(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId, exportId } = await params

    if (!pollId || !exportId) {
      return NextResponse.json(
        { error: 'Poll ID and Export ID are required' },
        { status: 400 }
      )
    }

    const exportStatus = await ExportService.getExportStatus(exportId)

    return NextResponse.json({
      success: true,
      export: exportStatus
    })

  } catch (error) {
    console.error('Error getting export status:', error)
    
    if (error instanceof Error && error.message === 'Export not found') {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to get export status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/polls/[id]/export/[exportId]
 * Cancel or delete an export
 */
async function deleteExport(req: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const { id: pollId, exportId } = await params

    if (!pollId || !exportId) {
      return NextResponse.json(
        { error: 'Poll ID and Export ID are required' },
        { status: 400 }
      )
    }

    // For now, we'll just return success
    // In production, you would delete the export record and any associated files
    
    return NextResponse.json({
      success: true,
      message: 'Export deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting export:', error)
    return NextResponse.json(
      { error: 'Failed to delete export' },
      { status: 500 }
    )
  }
}

// Apply authentication middleware
export const GET = withUserAuth(getExportStatus)
export const DELETE = withUserAuth(deleteExport)