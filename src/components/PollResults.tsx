'use client'

import { useState, useCallback } from 'react'
import { PollChart } from './PollChart'
import { usePollSSE } from '@/hooks/useSSE'

interface PollOption {
  id: string
  text: string
  voteCount: number
  averageRank?: number
}

interface PollData {
  id: string
  title: string
  type: 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'
  options: PollOption[]
  metadata: {
    totalVotes: number
    uniqueVoters?: number
    status: string
  }
}

interface PollResultsProps {
  poll: PollData
  showChart?: boolean
}

export function PollResults({ poll: initialPoll, showChart = true }: PollResultsProps) {
  const [poll, setPoll] = useState<PollData>(initialPoll)

  const handleVoteUpdate = useCallback((_voteData: unknown, results: Partial<PollData>) => {
    setPoll(prev => ({
      ...prev,
      options: results.options ?? prev.options,
      metadata: { ...prev.metadata, totalVotes: (results.metadata?.totalVotes ?? prev.metadata.totalVotes) },
    }))
  }, [])

  const handleResultUpdate = useCallback((results: Partial<PollData>) => {
    setPoll(prev => ({
      ...prev,
      options: results.options ?? prev.options,
      metadata: { ...prev.metadata, ...results.metadata },
    }))
  }, [])

  const { isConnected } = usePollSSE(poll.id, {
    onVoteUpdate: handleVoteUpdate,
    onResultUpdate: handleResultUpdate,
  })

  const totalVotes = poll.metadata.totalVotes
  const percentage = (count: number) => (totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100))

  if (poll.type === 'ranking') {
    const sorted = [...poll.options].sort((a, b) => (a.averageRank ?? Infinity) - (b.averageRank ?? Infinity))

    return (
      <div className="space-y-6">
        <Header totalVotes={totalVotes} isConnected={isConnected} />

        <div className="space-y-3">
          {sorted.map((option, i) => (
            <div key={option.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.text}</div>
                <div className="text-sm text-gray-700">
                  Avg. rank: {option.averageRank?.toFixed(1) ?? '—'} · {option.voteCount} votes
                </div>
              </div>
            </div>
          ))}
        </div>

        {showChart && <PollChart pollId={poll.id} height={280} />}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header totalVotes={totalVotes} isConnected={isConnected} />

      <div className="space-y-3">
        {poll.options.map(option => {
          const pct = percentage(option.voteCount)
          return (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">{option.text}</span>
                <span className="text-sm text-gray-700">{option.voteCount} votes ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {showChart && <PollChart pollId={poll.id} height={280} />}
    </div>
  )
}

function Header({ totalVotes, isConnected }: { totalVotes: number; isConnected: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Total votes: <span className="font-semibold text-gray-800">{totalVotes}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-700">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
        {isConnected ? 'Live' : 'Offline'}
      </div>
    </div>
  )
}
