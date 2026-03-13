'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  const pollId = params.id as string

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!pollId) return

    const fetchPoll = async () => {
      try {
        console.log('Fetching poll:', pollId)
        const response = await fetch(`/api/polls/${pollId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        
        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const text = await response.text()
          console.error('Error response:', text)
          throw new Error(`Failed to fetch poll (${response.status})`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text.substring(0, 200))
          throw new Error('Server returned invalid response')
        }
        
        const data = await response.json()
        console.log('Poll data:', data)
        setPoll(data.poll)
        setLoading(false)
      } catch (err) {
        console.error('Poll fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load poll')
        setLoading(false)
      }
    }

    fetchPoll()
  }, [pollId])

  const handleVoteSuccess = () => setHasVoted(true)

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
          <details style={{ marginTop: '20px', textAlign: 'left', fontSize: '12px', color: '#666' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Technical Details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              Poll ID: {pollId}
              {'\n'}Error: {error}
              {'\n'}URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </pre>
          </details>
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
        />
      </main>
    </div>
  )
}
