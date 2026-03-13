import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import Export from '@/models/Export'
import connectDB from '@/lib/mongodb'
import { AnalyticsEngine } from './analytics'
import { FileStorage, StorageConfig } from '@/lib/storage'

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel'
  includeVoteDetails?: boolean
  includeAnalytics?: boolean
  includeTimestamps?: boolean
  includeDemographics?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ExportData {
  poll: {
    id: string
    title: string
    description: string
    type: string
    options: Array<{
      id: string
      text: string
      voteCount: number
    }>
    metadata: any
  }
  votes?: Array<{
    id: string
    submittedAt: Date
    voteData: any
    voterInfo?: any
    demographics?: any
  }>
  analytics?: any
  exportMetadata: {
    exportedAt: Date
    format: string
    totalRecords: number
    options: ExportOptions
  }
}

/**
 * Export Service for generating poll data in multiple formats
 */
export class ExportService {
  
  /**
   * Generate export data for a poll
   */
  static async generateExport(
    pollId: string, 
    userId: string, 
    options: ExportOptions
  ): Promise<{ exportId: string; downloadUrl?: string; data?: string }> {
    await connectDB()
    
    const poll = await Poll.findById(pollId)
    if (!poll) {
      throw new Error('Poll not found')
    }

    // Check if user can export this poll
    if (poll.creatorId.toString() !== userId) {
      throw new Error('Access denied')
    }

    // Create export record
    const exportRecord = new Export({
      pollId,
      userId,
      format: options.format,
      status: 'processing',
      options,
      createdAt: new Date()
    })
    await exportRecord.save()

    try {
      // Generate export data
      const exportData = await this.prepareExportData(pollId, options)
      
      // Format data based on requested format
      let formattedData: string
      let mimeType: string
      let fileExtension: string

      switch (options.format) {
        case 'csv':
          formattedData = this.formatAsCSV(exportData)
          mimeType = 'text/csv'
          fileExtension = 'csv'
          break
        
        case 'json':
          formattedData = this.formatAsJSON(exportData)
          mimeType = 'application/json'
          fileExtension = 'json'
          break
        
        case 'excel':
          formattedData = this.formatAsExcel(exportData)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          fileExtension = 'xlsx'
          break
        
        default:
          throw new Error(`Unsupported format: ${options.format}`)
      }

      // For small exports, return data directly
      if (formattedData.length < 1024 * 1024) { // 1MB
        await Export.findByIdAndUpdate(exportRecord._id, {
          status: 'completed',
          completedAt: new Date(),
          fileSize: formattedData.length
        })

        return {
          exportId: exportRecord._id.toString(),
          data: formattedData
        }
      }

      // For large exports, store in file system
      try {
        const storageResult = await FileStorage.storeFile(
          formattedData,
          `poll-${pollId}-export.${fileExtension}`,
          mimeType
        )
        
        await Export.findByIdAndUpdate(exportRecord._id, {
          status: 'completed',
          completedAt: new Date(),
          downloadUrl: storageResult.downloadUrl,
          fileSize: storageResult.fileSize,
          expiresAt: storageResult.expiresAt,
          storageFileId: storageResult.fileId
        })

        return {
          exportId: exportRecord._id.toString(),
          downloadUrl: storageResult.downloadUrl
        }
      } catch (storageError) {
        console.error('Storage error:', storageError)
        
        // Fallback: return data directly even for large files
        await Export.findByIdAndUpdate(exportRecord._id, {
          status: 'completed',
          completedAt: new Date(),
          fileSize: formattedData.length
        })

        return {
          exportId: exportRecord._id.toString(),
          data: formattedData
        }
      }

    } catch (error) {
      await Export.findByIdAndUpdate(exportRecord._id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Export failed'
      })
      throw error
    }
  }

  /**
   * Prepare export data from database
   */
  private static async prepareExportData(pollId: string, options: ExportOptions): Promise<ExportData> {
    const poll = await Poll.findById(pollId).lean()
    if (!poll) {
      throw new Error('Poll not found')
    }

    // Build vote query with optional filters
    const voteQuery: any = { pollId }
    
    if (options.dateRange) {
      voteQuery['metadata.submittedAt'] = {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      }
    }

    // Fetch votes if requested
    let votes: any[] = []
    if (options.includeVoteDetails) {
      votes = await Vote.find(voteQuery).lean()
    }

    // Generate analytics if requested
    let analytics: any = null
    if (options.includeAnalytics) {
      analytics = await AnalyticsEngine.calculatePollAnalytics(pollId)
    }

    // Prepare export data
    const exportData: ExportData = {
      poll: {
        id: poll._id.toString(),
        title: poll.title,
        description: poll.description || '',
        type: poll.type,
        options: poll.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          voteCount: opt.voteCount
        })),
        metadata: poll.metadata
      },
      exportMetadata: {
        exportedAt: new Date(),
        format: options.format,
        totalRecords: votes.length,
        options
      }
    }

    // Add votes if requested
    if (options.includeVoteDetails && votes.length > 0) {
      exportData.votes = votes.map(vote => ({
        id: vote._id.toString(),
        submittedAt: vote.metadata.submittedAt,
        voteData: vote.voteData,
        ...(options.includeTimestamps && { 
          timestamps: {
            submittedAt: vote.metadata.submittedAt,
            createdAt: vote.createdAt
          }
        }),
        ...(options.includeDemographics && vote.metadata.demographics && {
          demographics: vote.metadata.demographics
        })
      }))
    }

    // Add analytics if requested
    if (options.includeAnalytics && analytics) {
      exportData.analytics = analytics
    }

    return exportData
  }

  /**
   * Format data as CSV
   */
  private static formatAsCSV(data: ExportData): string {
    const lines: string[] = []
    
    // Poll information header
    lines.push('# Poll Information')
    lines.push(`Title,${this.escapeCSV(data.poll.title)}`)
    lines.push(`Description,${this.escapeCSV(data.poll.description)}`)
    lines.push(`Type,${data.poll.type}`)
    lines.push(`Total Votes,${data.poll.metadata.totalVotes}`)
    lines.push(`Exported At,${data.exportMetadata.exportedAt.toISOString()}`)
    lines.push('')

    // Poll options
    lines.push('# Poll Options')
    lines.push('Option ID,Option Text,Vote Count')
    data.poll.options.forEach(option => {
      lines.push(`${option.id},${this.escapeCSV(option.text)},${option.voteCount}`)
    })
    lines.push('')

    // Vote details if included
    if (data.votes && data.votes.length > 0) {
      lines.push('# Vote Details')
      
      // Determine columns based on poll type and options
      const columns = ['Vote ID', 'Submitted At']
      
      if (data.poll.type === 'single' || data.poll.type === 'yesno') {
        columns.push('Selected Option')
      } else if (data.poll.type === 'multiple') {
        columns.push('Selected Options')
      } else if (data.poll.type === 'ranking') {
        columns.push('Ranked Options')
      } else if (data.poll.type === 'survey') {
        columns.push('Responses')
      }

      if (data.exportMetadata.options.includeDemographics) {
        columns.push('Device Type', 'Location', 'Referral Source')
      }

      lines.push(columns.join(','))

      // Vote data rows
      data.votes.forEach(vote => {
        const row = [
          vote.id,
          vote.submittedAt.toISOString()
        ]

        // Format vote data based on poll type
        if (data.poll.type === 'single' || data.poll.type === 'yesno') {
          row.push(vote.voteData.selectedOption || '')
        } else if (data.poll.type === 'multiple') {
          row.push((vote.voteData.selectedOptions || []).join(';'))
        } else if (data.poll.type === 'ranking') {
          const rankings = vote.voteData.rankedOptions || []
          const rankingStr = rankings.map((r: any) => `${r.optionId}:${r.rank}`).join(';')
          row.push(rankingStr)
        } else if (data.poll.type === 'survey') {
          const responses = vote.voteData.responses || {}
          row.push(JSON.stringify(responses))
        }

        // Add demographics if included
        if (data.exportMetadata.options.includeDemographics && vote.demographics) {
          row.push(
            vote.demographics.deviceType || '',
            vote.demographics.location || '',
            vote.demographics.referralSource || ''
          )
        }

        lines.push(row.map(cell => this.escapeCSV(String(cell))).join(','))
      })
    }

    // Analytics summary if included
    if (data.analytics) {
      lines.push('')
      lines.push('# Analytics Summary')
      lines.push(`Total Votes,${data.analytics.totalVotes}`)
      lines.push(`Response Rate,${data.analytics.responseRate.toFixed(2)}%`)
      lines.push(`Completion Rate,${data.analytics.completionRate.toFixed(2)}%`)
    }

    return lines.join('\n')
  }

  /**
   * Format data as JSON
   */
  private static formatAsJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2)
  }

  /**
   * Format data as Excel (simplified - would use a library like xlsx in production)
   */
  private static formatAsExcel(data: ExportData): string {
    // For now, return CSV format with Excel-compatible formatting
    // In production, you would use a library like 'xlsx' to generate actual Excel files
    return this.formatAsCSV(data)
  }

  /**
   * Escape CSV values
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Get export status
   */
  static async getExportStatus(exportId: string): Promise<any> {
    await connectDB()
    
    const exportRecord = await Export.findById(exportId)
    if (!exportRecord) {
      throw new Error('Export not found')
    }

    return {
      id: exportRecord._id,
      status: exportRecord.status,
      format: exportRecord.format,
      createdAt: exportRecord.createdAt,
      completedAt: exportRecord.completedAt,
      downloadUrl: exportRecord.downloadUrl,
      fileSize: exportRecord.fileSize,
      expiresAt: exportRecord.expiresAt,
      error: exportRecord.error
    }
  }

  /**
   * List exports for a poll
   */
  static async listExports(pollId: string, userId: string): Promise<any[]> {
    await connectDB()
    
    const exports = await Export.find({ 
      pollId, 
      userId 
    }).sort({ createdAt: -1 }).limit(10)

    return exports.map(exp => ({
      id: exp._id,
      format: exp.format,
      status: exp.status,
      createdAt: exp.createdAt,
      completedAt: exp.completedAt,
      fileSize: exp.fileSize,
      downloadUrl: exp.downloadUrl,
      expiresAt: exp.expiresAt
    }))
  }

  /**
   * Clean up expired exports
   */
  static async cleanupExpiredExports(): Promise<number> {
    await connectDB()
    
    const result = await Export.deleteMany({
      expiresAt: { $lt: new Date() },
      status: 'completed'
    })

    return result.deletedCount || 0
  }
}

/**
 * Helper functions for export operations
 */
export class ExportHelper {
  
  /**
   * Validate export options
   */
  static validateExportOptions(options: ExportOptions): string[] {
    const errors: string[] = []
    
    if (!['csv', 'json', 'excel'].includes(options.format)) {
      errors.push('Invalid format. Must be csv, json, or excel')
    }
    
    if (options.dateRange) {
      if (options.dateRange.start >= options.dateRange.end) {
        errors.push('Start date must be before end date')
      }
      
      if (options.dateRange.end > new Date()) {
        errors.push('End date cannot be in the future')
      }
    }
    
    return errors
  }

  /**
   * Get recommended format based on data size and type
   */
  static getRecommendedFormat(voteCount: number, includeAnalytics: boolean): 'csv' | 'json' | 'excel' {
    if (includeAnalytics || voteCount > 10000) {
      return 'json' // Better for complex data structures
    } else if (voteCount > 1000) {
      return 'excel' // Good for medium datasets
    } else {
      return 'csv' // Simple and widely supported
    }
  }

  /**
   * Estimate export file size
   */
  static estimateFileSize(voteCount: number, options: ExportOptions): number {
    let baseSize = 1024 // 1KB for headers and poll info
    
    if (options.includeVoteDetails) {
      // Rough estimate: 200 bytes per vote for basic data
      baseSize += voteCount * 200
      
      if (options.includeDemographics) {
        baseSize += voteCount * 100 // Additional demographic data
      }
    }
    
    if (options.includeAnalytics) {
      baseSize += 5120 // 5KB for analytics data
    }
    
    // Format multipliers
    switch (options.format) {
      case 'json':
        return Math.round(baseSize * 1.5) // JSON is more verbose
      case 'excel':
        return Math.round(baseSize * 1.2) // Excel has some overhead
      default:
        return baseSize
    }
  }
}