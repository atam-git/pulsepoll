import { NextRequest, NextResponse } from 'next/server'
import { FileStorage } from '@/lib/storage'

interface RouteParams {
  params: Promise<{ fileId: string }>
}

/**
 * GET /api/storage/download/[fileId]
 * Download stored file
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Retrieve file from storage
    const { data, exists, mimeType } = await FileStorage.getFile(fileId)

    if (!exists) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      )
    }

    // Set headers for file download
    const headers = new Headers({
      'Content-Type': mimeType || 'application/octet-stream',
      'Content-Length': data.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })

    return new NextResponse(new Uint8Array(data), { headers })

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}