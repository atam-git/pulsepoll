import crypto from 'crypto'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * File storage utility using Cloudinary
 * Stores export files (CSV, JSON, Excel) with automatic expiration
 */
export class FileStorage {
  
  /**
   * Store file in Cloudinary and return storage info
   */
  static async storeFile(
    data: string | Buffer, 
    filename: string, 
    mimeType: string
  ): Promise<{
    fileId: string
    downloadUrl: string
    fileSize: number
    expiresAt: Date
  }> {
    // Generate unique file ID
    const fileId = crypto.randomUUID()
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
    
    // Determine resource type and format from MIME type
    let resourceType: 'raw' | 'auto' = 'raw'
    let format = filename.split('.').pop() || 'txt'
    
    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'pulsepoll/exports',
          public_id: fileId,
          resource_type: resourceType,
          format: format,
          // Cloudinary doesn't support auto-expiration, but we can track it in metadata
          context: `expires_at=${Date.now() + 24 * 60 * 60 * 1000}`
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })
    
    // Set expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    return {
      fileId: uploadResult.public_id,
      downloadUrl: uploadResult.secure_url,
      fileSize: buffer.length,
      expiresAt
    }
  }

  /**
   * Retrieve file from Cloudinary
   */
  static async getFile(fileId: string): Promise<{
    data: Buffer
    exists: boolean
    mimeType?: string
  }> {
    try {
      // Get file info from Cloudinary
      const resource = await cloudinary.api.resource(`pulsepoll/exports/${fileId}`, {
        resource_type: 'raw'
      })
      
      if (!resource) {
        return { data: Buffer.alloc(0), exists: false }
      }
      
      // Download file from Cloudinary URL
      const response = await fetch(resource.secure_url)
      if (!response.ok) {
        return { data: Buffer.alloc(0), exists: false }
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const data = Buffer.from(arrayBuffer)
      
      // Determine MIME type from format
      let mimeType: string
      switch (resource.format) {
        case 'csv':
          mimeType = 'text/csv'
          break
        case 'json':
          mimeType = 'application/json'
          break
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        default:
          mimeType = 'application/octet-stream'
      }
      
      return { data, exists: true, mimeType }
      
    } catch (error) {
      console.error('Error retrieving file from Cloudinary:', error)
      return { data: Buffer.alloc(0), exists: false }
    }
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(`pulsepoll/exports/${fileId}`, {
        resource_type: 'raw'
      })
      return true
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error)
      return false
    }
  }

  /**
   * Clean up expired files from Cloudinary
   * Note: This requires manual tracking since Cloudinary doesn't auto-expire
   */
  static async cleanupExpiredFiles(): Promise<number> {
    try {
      // List all files in the exports folder
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'pulsepoll/exports/',
        resource_type: 'raw',
        max_results: 500
      })
      
      let deletedCount = 0
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      for (const resource of result.resources) {
        // Check expiration from context or created_at
        const createdAt = new Date(resource.created_at).getTime()
        const fileAge = now - createdAt
        
        if (fileAge > maxAge) {
          await cloudinary.uploader.destroy(resource.public_id, {
            resource_type: 'raw'
          })
          deletedCount++
        }
      }
      
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up files from Cloudinary:', error)
      return 0
    }
  }

  /**
   * Get storage statistics from Cloudinary
   */
  static async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    oldestFile?: Date
    newestFile?: Date
  }> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'pulsepoll/exports/',
        resource_type: 'raw',
        max_results: 500
      })
      
      let totalSize = 0
      let oldestFile: Date | undefined
      let newestFile: Date | undefined
      
      for (const resource of result.resources) {
        totalSize += resource.bytes || 0
        
        const createdAt = new Date(resource.created_at)
        
        if (!oldestFile || createdAt < oldestFile) {
          oldestFile = createdAt
        }
        
        if (!newestFile || createdAt > newestFile) {
          newestFile = createdAt
        }
      }
      
      return {
        totalFiles: result.resources.length,
        totalSize,
        oldestFile,
        newestFile
      }
    } catch (error) {
      console.error('Error getting storage stats from Cloudinary:', error)
      return {
        totalFiles: 0,
        totalSize: 0
      }
    }
  }
}

/**
 * Storage configuration and utilities
 */
export class StorageConfig {
  
  /**
   * Get storage configuration based on environment
   */
  static getConfig() {
    return {
      maxFileSize: parseInt(process.env.MAX_EXPORT_SIZE || '10485760'), // 10MB default
      expirationHours: parseInt(process.env.EXPORT_EXPIRATION_HOURS || '24'),
      cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL_HOURS || '6')
    }
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number): boolean {
    const config = this.getConfig()
    return size <= config.maxFileSize
  }
}
