'use client'

import { useState } from 'react'
import { PollQRCode } from './PollQRCode'

interface PollShareDialogProps {
  pollId: string
  pollTitle: string
  isOpen: boolean
  onClose: () => void
}

export function PollShareDialog({ pollId, pollTitle, isOpen, onClose }: PollShareDialogProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  if (!isOpen) return null

  const votingUrl = `${window.location.origin}/vote/${pollId}`

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Share Poll</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code for Voting</h3>
            <p className="text-gray-900 mb-6">
              Share this QR code for easy access to vote on your poll
            </p>
            <PollQRCode 
              pollId={pollId} 
              pollTitle={pollTitle}
              size={200}
              className="mx-auto mb-6"
              customUrl={`${votingUrl}?utm_source=qr_code&utm_medium=qr&utm_campaign=poll_share`}
            />
            
            {/* Copy Link Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900 mb-3">
                Or copy the voting link directly:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={votingUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(votingUrl)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copySuccess
                      ? 'bg-green-500 text-white'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {copySuccess && (
                <p className="text-green-600 text-sm mt-2">
                  Link copied to clipboard!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
