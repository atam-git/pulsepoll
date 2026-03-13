'use client'

import { useState } from 'react'
import styles from './PollVotingInterface.module.css'

interface PollOption {
  id: string
  text?: string
  voteCount: number
  imageUrl?: string
}

interface PollVotingInterfaceProps {
  pollId: string
  pollType: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  options: PollOption[]
  onVoteSuccess: () => void
  onViewResults?: () => void
}

function RadioIcon({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip-selected)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4ZM12 8C13.0609 8 14.0783 8.42143 14.8284 9.17157C15.5786 9.92172 16 10.9391 16 12C16 13.0609 15.5786 14.0783 14.8284 14.8284C14.0783 15.5786 13.0609 16 12 16C10.9391 16 9.92172 15.5786 9.17157 14.8284C8.42143 14.0783 8 13.0609 8 12C8 10.9391 8.42143 9.92172 9.17157 9.17157C9.92172 8.42143 10.9391 8 12 8ZM12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10Z"
            fill="#09244B"
          />
        </g>
        <defs>
          <clipPath id="clip-selected">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    )
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip-unselected)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4Z"
          fill="#09244B"
        />
      </g>
      <defs>
        <clipPath id="clip-unselected">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export function PollVotingInterface({
  pollId,
  pollType,
  options,
  onVoteSuccess,
  onViewResults,
}: PollVotingInterfaceProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const handleOptionClick = (optionId: string) => {
    if (pollType === 'single' || pollType === 'yesno') {
      setSelectedOptions([optionId])
    } else if (pollType === 'multiple') {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0) {
      setError('Please select at least one option')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: selectedOptions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit vote')
      }

      onVoteSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote'
      setError(errorMessage)
      setShowErrorModal(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.votingInterface}>
      {showErrorModal && (
        <div className={styles.modalOverlay} onClick={() => setShowErrorModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.errorIcon}>
              <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2>Oops!</h2>
            <p>{error}</p>
            <button onClick={() => setShowErrorModal(false)} className={styles.modalButton}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className={styles.optionsGrid}>
        {options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.id)
          return (
            <div
              key={option.id}
              className={`${styles.optionCard} ${isSelected ? styles.optionSelected : ''} ${submitting ? styles.optionDisabled : ''}`}
              onClick={() => !submitting && handleOptionClick(option.id)}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !submitting && handleOptionClick(option.id)}
            >
              <div className={styles.optionImageWrapper}>
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt={option.text || `Option ${index + 1}`}
                    className={styles.optionImage}
                  />
                ) : (
                  <div className={styles.optionTextFallback}>
                    <span>{option.text || `Option ${index + 1}`}</span>
                  </div>
                )}
              </div>

              <div className={styles.optionLabel}>
                <RadioIcon selected={isSelected} />
                <span className={styles.optionLabelText}>{option.text || `Option ${index + 1}`}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.actionButtons}>
        <button
          onClick={handleSubmitVote}
          disabled={submitting || selectedOptions.length === 0}
          className={styles.voteBtn}
        >
          {submitting ? 'Submitting...' : 'Vote'}
        </button>
        {onViewResults && (
          <button
            onClick={onViewResults}
            className={styles.resultBtn}
          >
            Results
          </button>
        )}
      </div>
    </div>
  )
}
