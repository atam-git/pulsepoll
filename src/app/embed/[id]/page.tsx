'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

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

interface VoteData {
  optionId?: string
  optionIds?: string[]
  rankings?: { optionId: string; rank: number }[]
  answer?: boolean
  responses?: { [key: string]: string }
}

export default function EmbedPollPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const pollId = params.id as string
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteData, setVoteData] = useState<VoteData>({})
  
  // Embed configuration from URL parameters
  const showTitle = searchParams.get('title') !== 'false'
  const showDescription = searchParams.get('description') !== 'false'
  const showResults = searchParams.get('results') !== 'false'
  const theme = searchParams.get('theme') || 'light'
  const compact = searchParams.get('compact') === 'true'

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

  const handleVote = async () => {
    if (!poll || voting) return

    try {
      setVoting(true)
      
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voteData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit vote')
      }

      const result = await response.json()
      
      // Update poll with new results
      setPoll(result.poll)
      setHasVoted(true)
      
    } catch (err) {
      console.error('Vote submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setVoting(false)
    }
  }

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (poll?.type === 'single') {
      setVoteData({ optionId })
    } else if (poll?.type === 'multiple') {
      const currentIds = voteData.optionIds || []
      if (checked) {
        setVoteData({ optionIds: [...currentIds, optionId] })
      } else {
        setVoteData({ optionIds: currentIds.filter(id => id !== optionId) })
      }
    }
  }

  const calculatePercentage = (voteCount: number, totalVotes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((voteCount / totalVotes) * 100)
  }

  const canVote = () => {
    if (!poll || hasVoted || voting) return false
    
    switch (poll.type) {
      case 'single':
        return !!voteData.optionId
      case 'multiple':
        return (voteData.optionIds?.length || 0) > 0
      case 'yesno':
        return voteData.answer !== undefined
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="text-center p-4">
          <h1 className="text-lg font-bold text-red-600 mb-2">Error</h1>
          <p className="text-sm">{error || 'Poll not found'}</p>
        </div>
      </div>
    )
  }

  const containerClass = `
    ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
    ${compact ? 'p-3' : 'p-6'}
    min-h-screen
  `

  return (
    <div className={containerClass}>
      <div className="max-w-2xl mx-auto">
        {/* Poll Header */}
        {showTitle && (
          <h1 className={`font-bold mb-2 ${compact ? 'text-lg' : 'text-2xl'}`}>
            {poll.title || 'Untitled Poll'}
          </h1>
        )}
        
        {showDescription && poll.description && (
          <p className={`text-gray-700 mb-4 ${compact ? 'text-sm' : 'text-base'} ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {poll.description}
          </p>
        )}

        {/* Voting Interface */}
        {!hasVoted && poll.metadata.status === 'active' && (
          <div className="mb-6">
            <div className="space-y-3">
              {poll.type === 'yesno' ? (
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="yesno"
                      checked={voteData.answer === true}
                      onChange={() => setVoteData({ answer: true })}
                      className="text-blue-500"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="yesno"
                      checked={voteData.answer === false}
                      onChange={() => setVoteData({ answer: false })}
                      className="text-blue-500"
                    />
                    <span>No</span>
                  </label>
                </div>
              ) : (
                poll.options.map((option) => (
                  <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type={poll.type === 'single' ? 'radio' : 'checkbox'}
                      name={poll.type === 'single' ? 'poll-option' : undefined}
                      checked={
                        poll.type === 'single' 
                          ? voteData.optionId === option.id
                          : (voteData.optionIds || []).includes(option.id)
                      }
                      onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                      className="text-blue-500"
                    />
                    <span className={compact ? 'text-sm' : 'text-base'}>{option.text}</span>
                  </label>
                ))
              )}
            </div>
            
            <button
              onClick={handleVote}
              disabled={!canVote()}
              className={`
                mt-4 px-4 py-2 rounded-lg font-medium transition-colors
                ${compact ? 'text-sm' : 'text-base'}
                ${canVote()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }
              `}
            >
              {voting ? 'Submitting...' : 'Vote'}
            </button>
          </div>
        )}

        {/* Results */}
        {showResults && (hasVoted || poll.metadata.status !== 'active') && (
          <div>
            <h2 className={`font-semibold mb-3 ${compact ? 'text-base' : 'text-lg'}`}>
              Results
            </h2>
            
            {poll.metadata.totalVotes === 0 ? (
              <p className={`text-gray-600 text-center py-4 ${compact ? 'text-sm' : 'text-base'}`}>
                No votes yet
              </p>
            ) : (
              <div className="space-y-3">
                {poll.type === 'yesno' ? (
                  <div className="space-y-2">
                    {[
                      { text: 'Yes', voteCount: poll.options.find(o => o.text === 'Yes')?.voteCount || 0 },
                      { text: 'No', voteCount: poll.options.find(o => o.text === 'No')?.voteCount || 0 }
                    ].map((option) => {
                      const percentage = calculatePercentage(option.voteCount, poll.metadata.totalVotes)
                      return (
                        <div key={option.text} className={`border rounded p-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>
                              {option.text}
                            </span>
                            <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                              {option.voteCount} ({percentage}%)
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-1.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  poll.options.map((option) => {
                    const percentage = calculatePercentage(option.voteCount, poll.metadata.totalVotes)
                    return (
                      <div key={option.id} className={`border rounded p-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>
                            {option.text}
                          </span>
                          <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                            {option.voteCount} ({percentage}%)
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-1.5 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
            
            <div className={`mt-3 text-center text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {poll.metadata.totalVotes} total votes
            </div>
          </div>
        )}

        {/* Powered by link */}
        <div className={`mt-6 text-center ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
          <a 
            href={`${window.location.origin}/poll/${pollId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-colors"
          >
            Powered by PulsePoll
          </a>
        </div>
      </div>
    </div>
  )
}