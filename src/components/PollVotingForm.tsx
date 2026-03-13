'use client'

import { useState } from 'react'
import { PollChart } from './PollChart'

interface PollOption {
  id: string
  text: string
  voteCount: number
}

interface Poll {
  id: string
  title: string
  description?: string
  type: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  options: PollOption[]
  metadata: {
    totalVotes: number
    status: string
  }
}

interface PollVotingFormProps {
  poll: Poll
  onVoteSubmitted?: () => void
}

export function PollVotingForm({ poll, onVoteSubmitted }: PollVotingFormProps) {
  const [selectedSingle, setSelectedSingle] = useState<string>('')
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set())
  const [rankings, setRankings] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    let voteData: Record<string, unknown> = {}

    if (poll.type === 'single' || poll.type === 'yesno') {
      if (!selectedSingle) {
        setError('Please select an option')
        return
      }
      voteData = { optionId: selectedSingle }
    } else if (poll.type === 'multiple') {
      if (selectedMultiple.size === 0) {
        setError('Please select at least one option')
        return
      }
      voteData = { optionIds: Array.from(selectedMultiple) }
    } else if (poll.type === 'ranking') {
      const ranked = Object.entries(rankings)
      if (ranked.length !== poll.options.length) {
        setError('Please rank all options')
        return
      }
      voteData = { rankings: ranked.map(([optionId, rank]) => ({ optionId, rank })) }
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit vote')
      }

      setSubmitted(true)
      onVoteSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Vote Submitted!</h3>
          <p className="text-gray-600">Thank you for participating.</p>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
          <PollChart pollId={poll.id} height={300} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Single Choice */}
      {poll.type === 'single' && (
        <div className="space-y-3">
          {poll.options.map(option => (
            <label
              key={option.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedSingle === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="poll-option"
                value={option.id}
                checked={selectedSingle === option.id}
                onChange={() => setSelectedSingle(option.id)}
                className="h-4 w-4 text-blue-600 border-gray-300"
              />
              <span className="ml-3 text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {/* Multiple Choice */}
      {poll.type === 'multiple' && (
        <div className="space-y-3">
          {poll.options.map(option => (
            <label
              key={option.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedMultiple.has(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedMultiple.has(option.id)}
                onChange={() => {
                  setSelectedMultiple(prev => {
                    const next = new Set(prev)
                    if (next.has(option.id)) next.delete(option.id)
                    else next.add(option.id)
                    return next
                  })
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {/* Yes/No */}
      {poll.type === 'yesno' && (
        <div className="grid grid-cols-2 gap-4">
          {poll.options.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedSingle(option.id)}
              className={`py-8 text-xl font-semibold rounded-lg border-2 transition-colors ${
                selectedSingle === option.id
                  ? option.text.toLowerCase() === 'yes'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {/* Ranking */}
      {poll.type === 'ranking' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Assign a rank to each option (1 = best).</p>
          {poll.options.map(option => (
            <div key={option.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <select
                value={rankings[option.id] ?? ''}
                onChange={e => {
                  const val = parseInt(e.target.value)
                  setRankings(prev => (e.target.value ? { ...prev, [option.id]: val } : (() => { const { [option.id]: _, ...rest } = prev; return rest })()))
                }}
                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">—</option>
                {poll.options.map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <span className="text-gray-900">{option.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Survey */}
      {poll.type === 'survey' && (
        <div className="space-y-4">
          {poll.options.map(option => (
            <div key={option.id} className="p-4 border border-gray-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">{option.text}</label>
              <textarea
                rows={2}
                placeholder="Your answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Vote'}
      </button>
    </div>
  )
}
