'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Poll {
  id: string
  title: string
  description: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
  metadata: {
    totalVotes: number
    viewCount: number
  }
  settings: {
    expiresAt?: string
    isPublic: boolean
  }
}

interface UserPollDashboardProps {
  userId: string
  onPollSelect?: (pollId: string) => void
}

type SortOption = 'newest' | 'oldest' | 'most_votes' | 'least_votes' | 'title_asc' | 'title_desc'
type FilterOption = 'all' | 'active' | 'inactive' | 'expired' | 'draft'

export function UserPollDashboard({ userId, onPollSelect }: UserPollDashboardProps) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPolls, setTotalPolls] = useState(0)

  const pollsPerPage = 10

  useEffect(() => {
    fetchPolls()
  }, [userId, sortBy, filterBy, searchQuery, currentPage])

  const fetchPolls = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        sort: sortBy,
        filter: filterBy,
        page: currentPage.toString(),
        limit: pollsPerPage.toString()
      })
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const response = await fetch(`/api/user/polls?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls')
      }
      
      const data = await response.json()
      setPolls(data.polls)
      setTotalPages(data.pagination.totalPages)
      setTotalPolls(data.pagination.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load polls')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete poll')
      }

      // Refresh the polls list
      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete poll')
    }
  }

  const handleDuplicatePoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate poll')
      }

      const data = await response.json()
      
      // Refresh the polls list
      fetchPolls()
      
      // Optionally redirect to the new poll
      alert(`Poll duplicated successfully! New poll ID: ${data.poll.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate poll')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpired = (poll: Poll) => {
    return poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= new Date()
  }

  if (loading && polls.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900">{totalPolls}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Active Polls</p>
              <p className="text-2xl font-bold text-gray-900">
                {polls.filter(p => p.status === 'active' && !isExpired(p)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">
                {polls.reduce((sum, poll) => sum + poll.metadata.totalVotes, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👁️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-700">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">
                {polls.reduce((sum, poll) => sum + poll.metadata.viewCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="flex space-x-4">
            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Polls</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_votes">Most Votes</option>
              <option value="least_votes">Least Votes</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
            </select>

            {/* Create New Poll Button */}
            <Link
              href="/poll/create"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Poll
            </Link>
          </div>
        </div>
      </div>

      {/* Polls List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPolls}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {polls.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first poll.'
            }
          </p>
          <Link
            href="/poll/create"
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {onPollSelect ? (
                          <button
                            onClick={() => onPollSelect(poll.id)}
                            className="hover:text-green-600 transition-colors text-left"
                          >
                            {poll.title || 'Untitled Poll'}
                          </button>
                        ) : (
                          <Link 
                            href={`/poll/${poll.id}`}
                            className="hover:text-green-600 transition-colors"
                          >
                            {poll.title || 'Untitled Poll'}
                          </Link>
                        )}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(isExpired(poll) ? 'expired' : poll.status)}`}>
                        {isExpired(poll) ? 'Expired' : poll.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                        {poll.type}
                      </span>
                    </div>
                    
                    {poll.description && (
                      <p className="text-gray-600 mb-3 line-clamp-2">{poll.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span>📊 {poll.metadata.totalVotes} votes</span>
                      <span>👁️ {poll.metadata.viewCount} views</span>
                      <span>📅 {formatDate(poll.createdAt)}</span>
                      {poll.settings.expiresAt && (
                        <span>⏰ Expires {formatDate(poll.settings.expiresAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onPollSelect ? (
                      <button
                        onClick={() => onPollSelect(poll.id)}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        View
                      </button>
                    ) : (
                      <Link
                        href={`/poll/${poll.id}`}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        View
                      </Link>
                    )}
                    <a
                      href={`/vote/${poll.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Vote
                    </a>
                    <button
                      onClick={() => handleDuplicatePoll(poll.id)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDeletePoll(poll.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pollsPerPage) + 1} to {Math.min(currentPage * pollsPerPage, totalPolls)} of {totalPolls} polls
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === page
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}