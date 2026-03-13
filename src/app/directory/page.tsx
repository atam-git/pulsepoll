'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Poll {
  _id: string
  id?: string  // Add optional id field for compatibility
  title: string
  description?: string
  type: string
  isPublic: boolean
  createdAt: string
  totalVotes: number
  creator: {
    name?: string
    email: string
  }
}

export default function DirectoryPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchPolls()
  }, [sortBy])

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/polls/public?sort=${sortBy}&search=${encodeURIComponent(searchTerm)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls')
      }

      const data = await response.json()
      setPolls(data.polls || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load polls')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    fetchPolls()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Poll Directory</h1>
          <p className="text-gray-600 text-sm sm:text-base">Discover and participate in public polls</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900 placeholder-gray-500"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
            >
              <option key="newest" value="newest">Newest</option>
              <option key="oldest" value="oldest">Oldest</option>
              <option key="popular" value="popular">Most Popular</option>
              <option key="title" value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading polls...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 sm:mb-8">
            <p className="text-red-700 text-sm sm:text-base">{error}</p>
            <button
              onClick={fetchPolls}
              className="mt-2 text-red-600 hover:text-red-700 font-medium text-sm sm:text-base"
            >
              Try again
            </button>
          </div>
        )}

        {/* Polls Grid */}
        {!loading && !error && (
          <>
            {polls.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No polls found</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Be the first to create a public poll!'}
                </p>
                <Link
                  href="/poll/create"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Create Poll
                </Link>
              </div>
            ) : (
              <>
                {/* Mobile-first responsive grid */}
                <div className="space-y-4 sm:hidden">
                  {polls.map((poll) => {
                    const pollId = poll._id || poll.id || `poll-${Math.random()}`
                    return (
                      <div key={pollId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
                              {poll.title || 'Untitled Poll'}
                            </h3>
                            {poll.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {poll.description}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/poll/${pollId}`}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <div className="flex items-center space-x-3">
                            <span className="bg-gray-100 px-2 py-1 rounded-full capitalize">
                              {poll.type}
                            </span>
                            <span className="font-medium">{poll.totalVotes} votes</span>
                          </div>
                          <span>{formatDate(poll.createdAt)}</span>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="truncate">By {poll.creator.name || poll.creator.email}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop/Tablet grid */}
                <div className="hidden sm:grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {polls.map((poll) => {
                    const pollId = poll._id || poll.id || `poll-${Math.random()}`
                    return (
                      <div key={pollId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                            {poll.title || 'Untitled Poll'}
                          </h3>
                          {poll.description && (
                            <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3">
                              {poll.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                            <span className="capitalize bg-gray-100 px-2 py-1 rounded-full text-xs">
                              {poll.type}
                            </span>
                            <span className="font-medium">{poll.totalVotes} votes</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-600 flex-1 min-w-0">
                            <p className="truncate">By {poll.creator.name || poll.creator.email}</p>
                            <p className="text-xs">{formatDate(poll.createdAt)}</p>
                          </div>
                          <Link
                            href={`/poll/${pollId}`}
                            className="ml-3 px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}