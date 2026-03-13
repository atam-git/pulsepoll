import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Simple file storage utility for exports
 * In production, this would integrate with cloud storage like Vercel Blob, AWS S3, etc.
 */
export class FileStorage {
  private static readonly STORAGE_DIR = path.join(process.cwd(), '.storage', 'exports')
  
  /**
   * Initialize storage directory
   */
  static async init(): Promise<void> {
    try {
      await fs.mkdir(this.STORAGE_DIR, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize storage directory:', error)
    }
  }

  /**
   * Store file and return storage info
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
    await this.init()
    
    // Generate unique file ID
    const fileId = crypto.randomUUID()
    const fileExtension = path.extname(filename)
    const storedFilename = `${fileId}${fileExtension}`
    const filePath = path.join(this.STORAGE_DIR, storedFilename)
    
    // Store file
    await fs.writeFile(filePath, data)
    
    // Get file size
    const stats = await fs.stat(filePath)
    const fileSize = stats.size
    
    // Set expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    // Generate download URL (in production, this would be a signed URL)
    const downloadUrl = `/api/storage/download/${fileId}`
    
    return {
      fileId,
      downloadUrl,
      fileSize,
      expiresAt
    }
  }

  /**
   * Retrieve file
   */
  static async getFile(fileId: string): Promise<{
    data: Buffer
    exists: boolean
    mimeType?: string
  }> {
    await this.init()
    
    try {
      // Find file with this ID (check all extensions)
      const files = await fs.readdir(this.STORAGE_DIR)
      const matchingFile = files.find(file => file.startsWith(fileId))
      
      if (!matchingFile) {
        return { data: Buffer.alloc(0), exists: false }
      }
      
      const filePath = path.join(this.STORAGE_DIR, matchingFile)
      const data = await fs.readFile(filePath)
      
      // Determine MIME type from extension
      const extension = path.extname(matchingFile).toLowerCase()
      let mimeType: string
      
      switch (extension) {
        case '.csv':
          mimeType = 'text/csv'
          break
        case '.json':
          mimeType = 'application/json'
          break
        case '.xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        default:
          mimeType = 'application/octet-stream'
      }
      
      return { data, exists: true, mimeType }
      
    } catch (error) {
      console.error('Error retrieving file:', error)
      return { data: Buffer.alloc(0), exists: false }
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    await this.init()
    
    try {
      const files = await fs.readdir(this.STORAGE_DIR)
      const matchingFile = files.find(file => file.startsWith(fileId))
      
      if (matchingFile) {
        const filePath = path.join(this.STORAGE_DIR, matchingFile)
        await fs.unlink(filePath)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  /**
   * Clean up expired files
   */
  static async cleanupExpiredFiles(): Promise<number> {
    await this.init()
    
    try {
      const files = await fs.readdir(this.STORAGE_DIR)
      let deletedCount = 0
      
      for (const file of files) {
        const filePath = path.join(this.STORAGE_DIR, file)
        const stats = await fs.stat(filePath)
        
        // Delete files older than 24 hours
        const fileAge = Date.now() - stats.mtime.getTime()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        
        if (fileAge > maxAge) {
          await fs.unlink(filePath)
          deletedCount++
        }
      }
      
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up files:', error)
      return 0
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    oldestFile?: Date
    newestFile?: Date
  }> {
    await this.init()
    
    try {
      const files = await fs.readdir(this.STORAGE_DIR)
      let totalSize = 0
      let oldestFile: Date | undefined
      let newestFile: Date | undefined
      
      for (const file of files) {
        const filePath = path.join(this.STORAGE_DIR, file)
        const stats = await fs.stat(filePath)
        
        totalSize += stats.size
        
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime
        }
        
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime
        }
      }
      
      return {
        totalFiles: files.length,
        totalSize,
        oldestFile,
        newestFile
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return {
        totalFiles: 0,
        totalSize: 0
      }
    }
  }
}

/**
 * Cloud Storage Integration (placeholder for production)
 * This would integrate with services like Vercel Blob, AWS S3, Google Cloud Storage, etc.
 */
export class CloudStorage {
  
  /**
   * Upload file to cloud storage
   */
  static async uploadFile(
    data: string | Buffer,
    filename: string,
    options: {
      contentType?: string
      expiresIn?: number // seconds
      metadata?: Record<string, string>
    } = {}
  ): Promise<{
    url: string
    key: string
    expiresAt?: Date
  }> {
    // Placeholder implementation
    // In production, this would use actual cloud storage APIs
    
    const key = `exports/${crypto.randomUUID()}/${filename}`
    const url = `https://storage.example.com/${key}`
    
    const expiresAt = options.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 1000)
      : undefined
    
    console.log('Mock cloud upload:', { key, url, size: data.length })
    
    return { url, key, expiresAt }
  }

  /**
   * Generate signed download URL
   */
  static async getSignedUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    // Placeholder implementation
    const signedUrl = `https://storage.example.com/${key}?expires=${Date.now() + expiresIn * 1000}`
    return signedUrl
  }

  /**
   * Delete file from cloud storage
   */
  static async deleteFile(key: string): Promise<boolean> {
    // Placeholder implementation
    console.log('Mock cloud delete:', key)
    return true
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
    const isProduction = process.env.NODE_ENV === 'production'
    const useCloudStorage = process.env.USE_CLOUD_STORAGE === 'true'
    
    return {
      useCloudStorage: isProduction && useCloudStorage,
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

  /**
   * Get recommended storage method based on file size
   */
  static getRecommendedStorage(fileSize: number): 'local' | 'cloud' {
    const config = this.getConfig()
    
    if (config.useCloudStorage && fileSize > 1024 * 1024) { // 1MB threshold
      return 'cloud'
    }
    
    return 'local'
  }
}