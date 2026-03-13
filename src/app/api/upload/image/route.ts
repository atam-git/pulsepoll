import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'

const UPLOAD_DIR = path.join(process.cwd(), '.storage', 'images')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_WIDTH = 1200
const MAX_HEIGHT = 800

// Initialize upload directory
async function initUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create upload directory:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await initUploadDir()

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileId = crypto.randomUUID()
    const originalExtension = path.extname(file.name)
    const filename = `${fileId}${originalExtension}`
    const filePath = path.join(UPLOAD_DIR, filename)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image with Sharp (resize and optimize)
    let processedBuffer: Buffer

    try {
      processedBuffer = await sharp(buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 }) // Convert to JPEG for consistency and smaller size
        .toBuffer()
    } catch (error) {
      console.error('Image processing error:', error)
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      )
    }

    // Save processed image
    const processedFilename = `${fileId}.jpg`
    const processedFilePath = path.join(UPLOAD_DIR, processedFilename)
    await fs.writeFile(processedFilePath, processedBuffer)

    // Get image metadata
    const metadata = await sharp(processedBuffer).metadata()

    // Generate public URL
    const imageUrl = `/api/upload/image/${fileId}.jpg`

    return NextResponse.json({
      success: true,
      imageUrl,
      fileId,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        size: processedBuffer.length,
        format: 'jpeg'
      }
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}