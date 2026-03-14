'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PollRealTimeUpdates, usePollWithRealTime } from '@/components/PollRealTimeUpdates'
import { PollShareDialog } from '@/components/PollShareDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Poll {
  id: string
  title: string
  description: string
  type: string
  status: string
  options: Array<{
    id: string
    text: string
    voteCount: number
    imageUrl?: string
  }>
  metadata: {
    totalVotes: number
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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showClearVotesConfirm, setShowClearVotesConfirm] = useState(false)

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

  const togglePollStatus = async () => {
    if (isUpdatingStatus) return
    
    try {
      setIsUpdatingStatus(true)
      const currentStatus = currentPoll.status || 'inactive'
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      const response = await fetch(`/api/polls/${pollId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setPoll(prev => prev ? {
          ...prev,
          status: newStatus
        } : null)
      } else {
        console.error('Failed to update status:', data)
        alert(data.error || 'Failed to update poll status')
      }
    } catch (error) {
      console.error('Failed to update poll status:', error)
      alert('Failed to update poll status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleClearVotes = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}/clear-votes`, { method: 'POST' })
      if (response.ok) {
        fetchPollDetails()
      }
    } catch (error) {
      console.error('Failed to clear votes:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Loading poll details...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 p-16 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-3">Error Loading Poll</h1>
        <p className="text-gray-700 mb-6">{error || 'Poll not found'}</p>
        <Link
          href="/polls"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Polls
        </Link>
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

        {/* Back Button */}
        <button
          onClick={() => router.push('/polls')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back to Polls</span>
        </button>

        {/* Poll header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {currentPoll.title || 'Untitled Poll'}
              </h1>
              {currentPoll.description && (
                <p className="text-gray-600 mb-4 text-base">{currentPoll.description}</p>
              )}
            </div>
            
            {/* Status Toggle */}
            <div className="flex items-center gap-3 ml-4">
              <span className="text-sm font-medium text-gray-700">
                {(currentPoll.status || 'inactive') === 'active' ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={togglePollStatus}
                disabled={isUpdatingStatus}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  (currentPoll.status || 'inactive') === 'active' ? 'bg-green-600' : 'bg-gray-300'
                } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (currentPoll.status || 'inactive') === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {/* Poll info - Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Type</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{currentPoll.type.replace(/_/g, ' ')}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Status</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{currentPoll.status}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Votes</div>
              <div className="text-lg font-semibold text-gray-900">{currentPoll.metadata.totalVotes}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Views</div>
              <div className="text-lg font-semibold text-gray-900">{currentPoll.metadata.viewCount || 0}</div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setShowShareDialog(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            
            <a
              href={`/vote/${pollId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Vote</span>
            </a>

            <Link
              href={`/poll/${pollId}/edit`}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </Link>

            <button
              onClick={() => setShowClearVotesConfirm(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 mb-6 overflow-hidden">
          <nav className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-all ${
                activeTab === 'results'
                  ? 'bg-green-50 text-green-600 border-b-4 border-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Results
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-4 px-6 font-semibold text-sm transition-all ${
                activeTab === 'preview'
                  ? 'bg-green-50 text-green-600 border-b-4 border-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </div>
            </button>
          </nav>

          {/* Tab Content */}
          {activeTab === 'results' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Poll Results</h2>
            
            {currentPoll.metadata.totalVotes === 0 ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-16 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No votes yet</h3>
                <p className="text-gray-600 mb-6">Share your poll to start collecting responses</p>
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share Poll
                </button>
              </div>
            ) : (
              // Always show detailed results
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{currentPoll.metadata.totalVotes}</div>
                      <div className="text-sm text-gray-600 font-medium">Total Votes</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{currentPoll.metadata.viewCount || 0}</div>
                      <div className="text-sm text-gray-600 font-medium">Views</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {currentPoll.metadata.viewCount > 0 
                          ? Math.round((currentPoll.metadata.totalVotes / currentPoll.metadata.viewCount) * 100) 
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Conversion</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {currentPoll.options.length}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Options</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4">
                  {currentPoll.options.map((option: { id: string; text: string; voteCount: number; imageUrl?: string }, index: number) => {
                    const percentage = calculatePercentage(option.voteCount, currentPoll.metadata.totalVotes)
                    const isWinning = option.voteCount === Math.max(...currentPoll.options.map((opt: any) => opt.voteCount))
                    
                    return (
                      <div key={option.id} className={`rounded-xl p-5 transition-all duration-200 ${isWinning && option.voteCount > 0 ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 shadow-lg' : 'bg-gray-50 border-2 border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-2">
                              {/* Image thumbnail for image-based options */}
                              {option.imageUrl && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border-2 border-gray-200 flex-shrink-0 shadow-sm">
                                  <img
                                    src={option.imageUrl}
                                    alt={option.text || `Option ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-lg text-gray-900">
                                    {option.imageUrl && option.text ? option.text : (option.text || `Option ${index + 1}`)}
                                  </span>
                                  {isWinning && option.voteCount > 0 && (
                                    <span className="px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-full shadow-sm">
                                      🏆 Leading
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 font-medium">
                                  Option {index + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-3xl font-bold text-gray-900">{option.voteCount}</div>
                            <div className="text-sm font-semibold text-gray-600">{percentage}%</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <div
                            className={`h-4 rounded-full transition-all duration-700 ease-out ${
                              isWinning && option.voteCount > 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        {/* Vote Count Details */}
                        <div className="mt-3 text-sm text-gray-600 font-medium">
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
                </div>

                {/* Additional Insights */}
                {currentPoll.metadata.totalVotes > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Poll Insights
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-white rounded-lg p-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-700">Most popular choice: </span>
                          <span className="font-bold text-gray-900">
                            {currentPoll.options.find((opt: any) => 
                              opt.voteCount === Math.max(...currentPoll.options.map((o: any) => o.voteCount))
                            )?.text}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white rounded-lg p-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <span className="text-gray-700">Average votes per option: </span>
                          <span className="font-bold text-gray-900">
                            {(currentPoll.metadata.totalVotes / currentPoll.options.length).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      {currentPoll.metadata.viewCount > 0 && (
                        <div className="flex items-start gap-3 bg-white rounded-lg p-4">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <span className="text-gray-700">Engagement rate: </span>
                            <span className="font-bold text-gray-900">
                              {Math.round((currentPoll.metadata.totalVotes / currentPoll.metadata.viewCount) * 100)}% 
                            </span>
                            <span className="text-gray-700"> of viewers voted</span>
                          </div>
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
                  <span>Poll Type: <span className="font-medium capitalize">{currentPoll.type.replace(/_/g, ' ')}</span></span>
                  <span>Status: <span className="font-medium">{currentPoll.status}</span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Share Dialog */}
        <PollShareDialog
          pollId={pollId}
          pollTitle={currentPoll.title || 'Untitled Poll'}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />

        {/* Clear Votes Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showClearVotesConfirm}
          onClose={() => setShowClearVotesConfirm(false)}
          onConfirm={handleClearVotes}
          title="Clear All Votes"
          message={`Are you sure you want to clear all votes for "${currentPoll.title || 'this poll'}"? This action cannot be undone and all voting data will be permanently lost.`}
          confirmText="Clear Votes"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
  )
}