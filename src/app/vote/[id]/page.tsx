'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PollVotingInterface } from '@/components/PollVotingInterface'

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

export default function VotePage() {
  const params = useParams()
  const pollId = params.id as string
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  // Fetch poll data
  useEffect(() => {
    if (!pollId) return

    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch poll')
        }
        const data = await response.json()
        setPoll(data.poll)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load poll')
        setLoading(false)
      }
    }

    fetchPoll()
  }, [pollId])

  const handleVoteSuccess = () => {
    setHasVoted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Poll Not Found</h1>
          <p className="text-gray-600">{error || 'This poll does not exist or is no longer available.'}</p>
        </div>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md mx-auto text-center w-full">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">Your vote has been recorded successfully.</p>
            <div className="text-sm text-gray-600">
              <p className="break-words">Poll: {poll.title || 'Untitled Poll'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Poll Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 break-words">{poll.title || 'Untitled Poll'}</h1>
          {poll.description && (
            <p className="text-gray-600 mb-4 text-sm sm:text-base break-words">{poll.description}</p>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 space-y-2 sm:space-y-0 sm:space-x-4">
            <span>Type: {poll.type}</span>
            <span>{poll.metadata.totalVotes} votes</span>
          </div>
        </div>

        {/* Voting Interface */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Cast Your Vote</h2>
          <PollVotingInterface
            pollId={pollId}
            pollType={poll.type as any}
            options={poll.options}
            onVoteSuccess={handleVoteSuccess}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Powered by PulsePoll
          </p>
        </div>
      </div>
    </div>
  )
}