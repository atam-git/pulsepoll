'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PollRealTimeUpdates, usePollWithRealTime } from '@/components/PollRealTimeUpdates'
import { PollShareDialog } from '@/components/PollShareDialog'
import { Button } from '@/components/ui/Button'

interface Poll {
  id: string
  title: string
  description: string
  type: string
  options: Array<{
    id: string
    text: string
    voteCount: number
    imageUrl?: string
  }>
  metadata: {
    totalVotes: number
    status: string
    viewCount?: number
  }
}

export default function PollDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const pollId = params.id as string
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'results' | 'analytics'>('results')
  const [showShareDialog, setShowShareDialog] = useState(false)

  const {
    poll: realtimePoll,
    lastUpdate,
    handlePollUpdate,
    handleVoteReceived
  } = usePollWithRealTime(poll)

  useEffect(() => {
    if (pollId) {
      fetchPollDetails()
    }
  }, [pollId])

  const fetchPollDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/polls/${pollId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch poll')
      }
      const data = await response.json()
      setPoll(data.poll)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll')
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (voteCount: number, totalVotes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((voteCount / totalVotes) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading poll details...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="mb-4">{error || 'Poll not found'}</p>
        <Button
          href="/polls"
          variant="primary"
          size="md"
        >
          Back to Polls
        </Button>
      </div>
    )
  }

  const currentPoll = realtimePoll || poll

  return (
    <div>
        {/* Real-time updates component */}
        <div className="hidden">
          <PollRealTimeUpdates
            pollId={pollId}
            onPollUpdate={handlePollUpdate}
            onVoteReceived={handleVoteReceived}
            showConnectionStatus={false}
          />
        </div>

        {/* Poll header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            {currentPoll.title || 'Untitled Poll'}
          </h1>
          {currentPoll.description && (
            <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">{currentPoll.description}</p>
          )}
          
          {/* Poll info */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-800 mb-4">
              <span>Type: <span className="font-medium capitalize">{currentPoll.type}</span></span>
              <span>Status: <span className="font-medium">{currentPoll.metadata.status}</span></span>
              <span><span className="font-medium">{currentPoll.metadata.totalVotes}</span> votes</span>
              <span><span className="font-medium">{currentPoll.metadata.viewCount || 0}</span> views</span>
              {lastUpdate && (
                <span>Last updated: <span className="font-medium">{lastUpdate.toLocaleTimeString()}</span></span>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => setShowShareDialog(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share Poll</span>
            </button>
            
            <a
              href={`/vote/${pollId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Voting Page</span>
            </a>

            <Link
              href={`/poll/${pollId}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Poll</span>
            </Link>

            <button
              onClick={async () => {
                if (confirm('Are you sure you want to clear all votes? This action cannot be undone.')) {
                  try {
                    const response = await fetch(`/api/polls/${pollId}/clear-votes`, { method: 'POST' })
                    if (response.ok) {
                      // Refresh poll data
                      fetchPollDetails()
                    }
                  } catch (error) {
                    console.error('Failed to clear votes:', error)
                  }
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Votes</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8">
              <button
                onClick={() => setActiveTab('results')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Results
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Preview
              </button>
              {/* <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Analytics
              </button> */}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Results</h2>
            
            {currentPoll.metadata.totalVotes === 0 ? (
              <p className="text-gray-800 text-center py-8 text-sm sm:text-base font-medium">No votes yet</p>
            ) : (
              // Always show detailed results
              <div className="space-y-3 sm:space-y-4">
                {/* Summary Stats */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{currentPoll.metadata.totalVotes}</div>
                      <div className="text-sm text-gray-600">Total Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{currentPoll.metadata.viewCount || 0}</div>
                      <div className="text-sm text-gray-600">Views</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentPoll.metadata.viewCount > 0 
                          ? Math.round((currentPoll.metadata.totalVotes / currentPoll.metadata.viewCount) * 100) 
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentPoll.options.length}
                      </div>
                      <div className="text-sm text-gray-600">Options</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                {currentPoll.options.map((option: { id: string; text: string; voteCount: number; imageUrl?: string }, index: number) => {
                  const percentage = calculatePercentage(option.voteCount, currentPoll.metadata.totalVotes)
                  const isWinning = option.voteCount === Math.max(...currentPoll.options.map((opt: any) => opt.voteCount))
                  
                  return (
                    <div key={option.id} className={`border rounded-lg p-3 sm:p-4 ${isWinning && option.voteCount > 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Image thumbnail for image-based options */}
                            {option.imageUrl && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={option.imageUrl}
                                  alt={option.text || `Option ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm sm:text-base text-gray-900">
                                  {option.imageUrl && option.text ? option.text : (option.text || `Option ${index + 1}`)}
                                </span>
                                {isWinning && option.voteCount > 0 && (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Leading
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {option.imageUrl ? (
                                  option.text ? `Option ${index + 1} • Image Poll` : `Image Option ${index + 1}`
                                ) : (
                                  `Option ${index + 1}`
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-gray-900">{option.voteCount}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{percentage}%</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ease-out ${
                            isWinning && option.voteCount > 0 ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      {/* Vote Count Details */}
                      <div className="mt-2 text-xs text-gray-500">
                        {option.voteCount === 1 ? '1 vote' : `${option.voteCount} votes`}
                        {currentPoll.metadata.totalVotes > 0 && (
                          <span className="ml-2">
                            • {((option.voteCount / currentPoll.metadata.totalVotes) * 100).toFixed(1)}% of total
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Additional Insights */}
                {currentPoll.metadata.totalVotes > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Poll Insights</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>
                        • Most popular choice: <span className="font-medium">
                          {currentPoll.options.find((opt: any) => 
                            opt.voteCount === Math.max(...currentPoll.options.map((o: any) => o.voteCount))
                          )?.text}
                        </span>
                      </div>
                      <div>
                        • Average votes per option: <span className="font-medium">
                          {(currentPoll.metadata.totalVotes / currentPoll.options.length).toFixed(1)}
                        </span>
                      </div>
                      {currentPoll.metadata.viewCount > 0 && (
                        <div>
                          • Engagement rate: <span className="font-medium">
                            {Math.round((currentPoll.metadata.totalVotes / currentPoll.metadata.viewCount) * 100)}% 
                          </span> of viewers voted
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Poll Preview</h2>
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
                  Preview Mode - This is how voters see your poll
                </div>
              </div>
              
              {/* Poll Question Display */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{currentPoll.title || 'Untitled Poll'}</h2>
                {currentPoll.description && (
                  <p className="text-gray-700 mb-6">{currentPoll.description}</p>
                )}
                
                {/* Poll Options as they appear to voters */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-3">Choose your answer:</p>
                  
                  {/* Check if any option has an image to determine layout */}
                  {currentPoll.options.some((option: any) => option.imageUrl) ? (
                    // Image-based poll layout (grid)
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentPoll.options.map((option: { id: string; text: string; imageUrl?: string }, index: number) => (
                        <div key={option.id} className="flex flex-col gap-3 cursor-pointer">
                          {/* Image wrapper with aspect ratio */}
                          <div className="w-full aspect-[4/5] overflow-hidden rounded border-2 border-gray-200 bg-gray-100 hover:border-gray-300 transition-colors">
                            {option.imageUrl ? (
                              <img
                                src={option.imageUrl}
                                alt={option.text || `Option ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
                                <span className="text-lg font-medium text-gray-600 text-center">
                                  {option.text || `Option ${index + 1}`}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Radio button and label */}
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              {currentPoll.type === 'multiple_choice' ? (
                                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                              ) : (
                                <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
                              )}
                            </div>
                            <span className="text-gray-900 font-medium text-lg">
                              {option.text || `Option ${index + 1}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Text-only poll layout (list)
                    <div className="space-y-3">
                      {currentPoll.options.map((option: { id: string; text: string }, index: number) => (
                        <div key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex-shrink-0">
                            {currentPoll.type === 'multiple_choice' ? (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                            )}
                          </div>
                          <span className="text-gray-900 flex-1">{option.text}</span>
                          <span className="text-xs text-gray-500">Option {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Mock Vote Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button 
                    disabled
                    className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                  >
                    Submit Vote (Preview Mode)
                  </button>
                </div>
              </div>
              
              {/* Poll Info as voters see it */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Poll Type: <span className="font-medium capitalize">{currentPoll.type.replace('_', ' ')}</span></span>
                  <span>Status: <span className="font-medium">{currentPoll.metadata.status}</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* {activeTab === 'analytics' && (
          <div className="mb-6">
            <PollAnalyticsDashboard 
              pollId={pollId}
              showRealTimeUpdates={true}
            />
          </div>
        )} */}

        {/* Share Dialog */}
        <PollShareDialog
          pollId={pollId}
          pollTitle={currentPoll.title || 'Untitled Poll'}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      </div>
  )
}
