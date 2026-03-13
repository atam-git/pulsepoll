'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PollVotingInterface } from '@/components/PollVotingInterface'
import styles from './vote.module.css'

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
    uniqueVoters: number
    status: string
    viewCount?: number
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
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading poll...</p>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <h1>Poll Not Found</h1>
          <p>{error || 'This poll does not exist or is no longer available.'}</p>
        </div>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2>Thank You!</h2>
          <p>Your vote has been recorded successfully.</p>
          <button onClick={handleViewResults} className={styles.viewResultsBtn}>
            View Results
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.votePage}>
      <header className={styles.voteHeader}>
        <img
          src="/Connect Nigeria (1).png"
          alt="Connect Nigeria"
          className={styles.headerLogo}
        />
      </header>

      <main className={styles.voteMain}>
        <h1 className={styles.pollQuestion}>{poll.title || 'Untitled Poll'}</h1>
        {poll.description && (
          <p className={styles.pollDescription}>{poll.description}</p>
        )}

        <PollVotingInterface
          pollId={pollId}
          pollType={poll.type as 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'}
          options={poll.options}
          onVoteSuccess={handleVoteSuccess}
          onViewResults={handleViewResults}
        />
      </main>
    </div>
  )
}
