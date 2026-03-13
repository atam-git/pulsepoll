'use client'

import { useState } from 'react'
import { PollQRCode } from './PollQRCode'
import { PollEmbedCode } from './PollEmbedCode'

interface PollShareDialogProps {
  pollId: string
  pollTitle: string
  isOpen: boolean
  onClose: () => void
}

export function PollShareDialog({ pollId, pollTitle, isOpen, onClose }: PollShareDialogProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'link' | 'social' | 'embed'>('qr')
  const [copySuccess, setCopySuccess] = useState(false)

  if (!isOpen) return null

  const pollUrl = `${window.location.origin}/poll/${pollId}`
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

  const socialShareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Vote on this poll: ${pollTitle}`)}&url=${encodeURIComponent(votingUrl + '?utm_source=twitter&utm_medium=social&utm_campaign=poll_share')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(votingUrl + '?utm_source=facebook&utm_medium=social&utm_campaign=poll_share')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(votingUrl + '?utm_source=linkedin&utm_medium=social&utm_campaign=poll_share')}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(votingUrl + '?utm_source=reddit&utm_medium=social&utm_campaign=poll_share')}&title=${encodeURIComponent(pollTitle)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Share Poll</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('qr')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'qr'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'link'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Direct Link
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'social'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Social Media
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'embed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Embed Widget
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'qr' && (
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code for Voting</h3>
              <p className="text-gray-600 mb-6">
                Share this QR code for easy access to vote on your poll
              </p>
              <PollQRCode 
                pollId={pollId} 
                pollTitle={pollTitle}
                size={200}
                className="mx-auto"
                customUrl={`${votingUrl}?utm_source=qr_code&utm_medium=qr&utm_campaign=poll_share`}
              />
              <p className="text-sm text-gray-500 mt-4">
                Scans to: {votingUrl}
              </p>
            </div>
          )}

          {activeTab === 'link' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Share Links</h3>
              <p className="text-gray-600 mb-6">
                Share the appropriate link based on your needs
              </p>
              
              {/* Voting Link */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Voting Link</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Share this link for people to vote on your poll
                </p>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={votingUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(votingUrl)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Results Link */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Results Link</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Share this link to view poll results and analytics
                </p>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={pollUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(pollUrl)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {copySuccess && (
                <p className="text-green-600 text-sm">
                  Link copied to clipboard!
                </p>
              )}
            </div>
          )}

          {activeTab === 'social' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
              <p className="text-gray-600 mb-6">
                Share your poll on social media platforms
              </p>
              
              <div className="space-y-3">
                <a
                  href={socialShareUrls.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <span className="font-medium">Share on Twitter</span>
                </a>

                <a
                  href={socialShareUrls.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">f</span>
                  </div>
                  <span className="font-medium">Share on Facebook</span>
                </a>

                <a
                  href={socialShareUrls.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">in</span>
                  </div>
                  <span className="font-medium">Share on LinkedIn</span>
                </a>

                <a
                  href={socialShareUrls.reddit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">r</span>
                  </div>
                  <span className="font-medium">Share on Reddit</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <PollEmbedCode 
              pollId={pollId}
              pollTitle={pollTitle}
            />
          )}
        </div>
      </div>
    </div>
  )
}