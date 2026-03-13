'use client'

import { useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface PollOption {
  id: string
  text: string
  voteCount: number
}

interface PollVotingInterfaceProps {
  pollId: string
  pollType: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  options: PollOption[]
  onVoteSuccess: () => void
}

export function PollVotingInterface({
  pollId,
  pollType,
  options,
  onVoteSuccess
}: PollVotingInterfaceProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({
          optionIds: selectedOptions
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit vote')
      }

      onVoteSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={submitting}
              className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option.text}</span>
                {isSelected && (
                  <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-500">
          {pollType === 'single' || pollType === 'yesno'
            ? 'Select one option'
            : 'Select one or more options'}
        </p>
        <button
          onClick={handleSubmitVote}
          disabled={submitting || selectedOptions.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </div>
    </div>
  )
}
