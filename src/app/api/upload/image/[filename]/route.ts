import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), '.storage', 'images')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    if (!filename) {
      return NextResponse.json(
        { error: 'No filename provided' },
        { status: 400 }
      )
    }

    const filePath = path.join(UPLOAD_DIR, filename)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Read and serve the image
    const imageBuffer = await fs.readFile(filePath)
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': imageBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Image serving error:', error)
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    )
  }
}