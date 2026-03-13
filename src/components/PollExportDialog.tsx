'use client'

import React, { useState } from 'react'
import { ExportOptions } from '@/services/export'

interface PollExportDialogProps {
  pollId: string
  isOpen: boolean
  onClose: () => void
  onExportCreated?: (exportData: any) => void
}

export function PollExportDialog({ 
  pollId, 
  isOpen, 
  onClose, 
  onExportCreated 
}: PollExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeVoteDetails: true,
    includeAnalytics: false,
    includeTimestamps: true,
    includeDemographics: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/polls/${pollId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const result = await response.json()
      
      // If data is included (small export), trigger download immediately
      if (result.export.data) {
        downloadData(result.export.data, options.format, pollId)
      }
      
      onExportCreated?.(result.export)
      onClose()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadData = (data: string, format: string, pollId: string) => {
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poll-${pollId}-export.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export Poll Data</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={options.format}
              onChange={(e) => setOptions(prev => ({ 
                ...prev, 
                format: e.target.value as 'csv' | 'json' | 'excel'
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="csv">CSV (Comma Separated Values)</option>
              <option value="json">JSON (JavaScript Object Notation)</option>
              <option value="excel">Excel (XLSX)</option>
            </select>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Data
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeVoteDetails}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeVoteDetails: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Vote Details</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeAnalytics}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeAnalytics: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Analytics Summary</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeTimestamps}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeTimestamps: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Timestamps</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeDemographics}
                  onChange={(e) => setOptions(prev => ({ 
                    ...prev, 
                    includeDemographics: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm">Demographics Data</span>
              </label>
            </div>
          </div>

          {/* Format Description */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {options.format === 'csv' && (
              <p>CSV format is ideal for spreadsheet applications and data analysis tools. Compatible with Excel, Google Sheets, and most data processing software.</p>
            )}
            {options.format === 'json' && (
              <p>JSON format preserves data structure and is ideal for developers and advanced analytics. Includes complete poll and vote data with nested objects.</p>
            )}
            {options.format === 'excel' && (
              <p>Excel format provides a structured spreadsheet with multiple sheets for different data types. Best for business reporting and presentations.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {loading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Export History Component
 */
interface ExportHistoryProps {
  pollId: string
}

export function ExportHistory({ pollId }: ExportHistoryProps) {
  const [exports, setExports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExports = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}/export`)
      if (response.ok) {
        const data = await response.json()
        setExports(data.exports)
      }
    } catch (error) {
      console.error('Error fetching exports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (exportId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/export/${exportId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export-${exportId}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const error = await response.json()
        alert(error.error || 'Download failed')
      }
    } catch (error) {
      console.error('Error downloading export:', error)
      alert('Download failed')
    }
  }

  React.useEffect(() => {
    fetchExports()
  }, [pollId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (exports.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        No exports yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {exports.map((exp) => (
        <div key={exp.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <div className="font-medium capitalize">{exp.format} Export</div>
            <div className="text-sm text-gray-600">
              Created: {new Date(exp.createdAt).toLocaleString()}
            </div>
            {exp.fileSize && (
              <div className="text-sm text-gray-600">
                Size: {(exp.fileSize / 1024).toFixed(1)} KB
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded ${
              exp.status === 'completed' ? 'bg-green-100 text-green-800' :
              exp.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {exp.status}
            </span>
            
            {exp.status === 'completed' && (
              <button
                onClick={() => handleDownload(exp.id)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Download
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}