'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PollVotingInterface } from '@/components/PollVotingInterface'

interface Poll {
  id: string
  title: string
  description: string
  type: string
  options: Array<{
    id: string
    text?: string
    imageUrl?: string
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
  const router = useRouter()
  const pollId = params.id as string

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!pollId) return

    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)
        if (!response.ok) throw new Error('Failed to fetch poll')
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

  const handleVoteSuccess = () => setHasVoted(true)
  const handleViewResults = () => router.push(`/poll/${pollId}`)

  if (loading) {
    return (
      <div className="vote-loading-state">
        <div className="vote-spinner" />
        <p className="vote-loading-text">Loading poll...</p>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="vote-error-state">
        <h1 className="vote-error-title">Poll Not Found</h1>
        <p className="vote-error-message">
          {error || 'This poll does not exist or is no longer available.'}
        </p>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="vote-success-state">
        <div className="vote-success-card">
          <div className="vote-success-icon-wrapper">
            <svg className="vote-success-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="vote-success-heading">Thank You!</h2>
          <p className="vote-success-body">Your vote has been recorded successfully.</p>
          <p className="vote-success-poll-name">{poll.title}</p>
          <button onClick={handleViewResults} className="vote-results-link-btn">
            View Results
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vote-page-wrapper">
      <div className="vote-page-inner">
        <h1 className="vote-poll-question">{poll.title}</h1>
        {poll.description && (
          <p className="vote-poll-description">{poll.description}</p>
        )}
        <PollVotingInterface
          pollId={pollId}
          pollType={poll.type as any}
          options={poll.options}
          onVoteSuccess={handleVoteSuccess}
          onViewResults={handleViewResults}
        />
      </div>
    </div>
  )
}
