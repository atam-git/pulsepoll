'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import styles from './results.module.css'

interface PollOption {
  id: string
  text: string
  voteCount: number
  imageUrl?: string
}

interface Poll {
  id: string
  title: string
  description: string
  type: string
  options: PollOption[]
  metadata: {
    totalVotes: number
    uniqueVoters: number
    status: string
  }
}

export default function ResultsPage() {
  const params = useParams()
  const pollId = params.id as string

  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopied, setShowCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vote/${pollId}`
    const shareData = {
      title: poll?.title || 'Vote on this poll',
      text: poll?.description || 'Check out this poll',
      url: shareUrl
    }

    // Check if mobile (has native share API)
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled or failed:', err)
      }
    } else {
      // Desktop: copy link
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShowCopied(true)
        setTimeout(() => setShowCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

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
        setError(err instanceof Error ? err.message : 'Failed to load results')
        setLoading(false)
      }
    }

    fetchPoll()
  }, [pollId])

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading results...</p>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorCard}>
          <h1>Results Not Available</h1>
          <p>{error || 'Unable to load poll results.'}</p>
        </div>
      </div>
    )
  }

  const totalVotes = poll.metadata.totalVotes || 0

  return (
    <div className={styles.resultsPage}>
      <header className={styles.resultsHeader}>
        <img
          src="/Connect Nigeria (1).png"
          alt="Connect Nigeria"
          className={styles.headerLogo}
        />
        <button onClick={handleShare} className={styles.shareBtn}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
        {showCopied && <span className={styles.copiedTooltip}>Copied!</span>}
      </header>

      <main className={styles.resultsMain}>
        <div className={styles.topSection}>
          <h2 className={styles.resultsHeading}>Results</h2>
          <button onClick={() => window.location.href = `/vote/${pollId}`} className={styles.voteBtn}>
            Vote
          </button>
        </div>

        <h1 className={styles.pollTitle}>{poll.title}</h1>
        {poll.description && (
          <p className={styles.pollDescription}>{poll.description}</p>
        )}

        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalVotes}</span>
            <span className={styles.statLabel}>Total Votes</span>
          </div>
        </div>

        <div className={styles.resultsGrid}>
          {poll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0
            const isLeading = option.voteCount === Math.max(...poll.options.map(o => o.voteCount)) && option.voteCount > 0

            return (
              <div key={option.id} className={`${styles.resultCard} ${isLeading ? styles.leadingCard : ''}`}>
                <div className={styles.resultImageWrapper}>
                  {option.imageUrl ? (
                    <img
                      src={option.imageUrl}
                      alt={option.text || `Option ${index + 1}`}
                      className={styles.resultImage}
                    />
                  ) : (
                    <div className={styles.resultTextFallback}>
                      <span>{option.text || `Option ${index + 1}`}</span>
                    </div>
                  )}
                  {isLeading && (
                    <div className={styles.leadingBadge}>
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Leading
                    </div>
                  )}
                </div>

                <div className={styles.resultInfo}>
                  <div className={styles.resultHeader}>
                    <span className={styles.optionText}>{option.text || `Option ${index + 1}`}</span>
                    <span className={styles.voteCount}>{option.voteCount} votes</span>
                  </div>
                  
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className={styles.percentage}>{percentage.toFixed(1)}%</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.bottomActions}>
          <button onClick={handleShare} className={styles.bottomShareBtn}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>
      </main>
    </div>
  )
}
