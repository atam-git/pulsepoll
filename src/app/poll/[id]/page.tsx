'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PollRealTimeUpdates, usePollWithRealTime } from '@/components/PollRealTimeUpdates'
import { PollAnalyticsDashboard } from '@/components/PollAnalyticsDashboard'
import { PollShareDialog } from '@/components/PollShareDialog'

interface Poll {
  id: string
  title: string
  description: string
  type: string
  options: Array<{
    id: string
    text: string
    voteCount: number
  }>
  metadata: {
    totalVotes: number
    uniqueVoters: number
    status: string
  }
}

export default function PollPage() {
  const params = useParams()
  const pollId = params.id as string
  
  const [initialPoll, setInitialPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'results' | 'analytics'>('results')
  const [showShareDialog, setShowShareDialog] = useState(false)

  const {
    poll,
    lastUpdate,
    handlePollUpdate,
    handleVoteReceived
  } = usePollWithRealTime(initialPoll)

  // Fetch initial poll data
  useEffect(() => {
    if (!pollId) return

    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch poll')
        }
        const data = await response.json()
        setInitialPoll(data.poll)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load poll')
        setLoading(false)
      }
    }

    fetchPoll()
  }, [pollId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading poll...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error || 'Poll not found'}</p>
        </div>
      </div>
    )
  }

  const calculatePercentage = (voteCount: number, totalVotes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((voteCount / totalVotes) * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Real-time updates component */}
        <PollRealTimeUpdates
          pollId={pollId}
          onPollUpdate={handlePollUpdate}
          onVoteReceived={handleVoteReceived}
          showConnectionStatus={true}
        />

        {/* Poll header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600 mb-4">{poll.description}</p>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Type: {poll.type}</span>
              <span>Status: {poll.metadata.status}</span>
              <span>{poll.metadata.totalVotes} votes</span>
              <span>{poll.metadata.uniqueVoters} voters</span>
              {lastUpdate && (
                <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={() => setShowShareDialog(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Voting Page</span>
              </a>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('results')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Results
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            
            {poll.metadata.totalVotes === 0 ? (
              <p className="text-gray-500 text-center py-8">No votes yet</p>
            ) : (
              <div className="space-y-4">
                {poll.options.map((option: { id: string; text: string; voteCount: number }) => {
                  const percentage = calculatePercentage(option.voteCount, poll.metadata.totalVotes)
                  return (
                    <div key={option.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{option.text}</span>
                        <span className="text-sm text-gray-500">
                          {option.voteCount} votes ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <PollAnalyticsDashboard 
            pollId={pollId}
            showRealTimeUpdates={true}
          />
        )}

        {/* Debug info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Poll ID: {pollId}</p>
            <p>Total Votes: {poll.metadata.totalVotes}</p>
            <p>Unique Voters: {poll.metadata.uniqueVoters}</p>
            <p>Last Update: {lastUpdate?.toISOString() || 'Never'}</p>
          </div>
        </div>

        {/* Share Dialog */}
        <PollShareDialog
          pollId={pollId}
          pollTitle={poll.title}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      </div>
    </div>
  )
}