'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Poll {
  id: string
  title: string
  type: string
  status: string
  privacy: string
  creatorEmail: string
  totalVotes: number
  createdAt: string
  moderation: {
    isFlagged: boolean
    flagCount: number
    flags: Array<{
      reason: string
      description?: string
      flaggedAt: string
    }>
    reviewedAt?: string
  }
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [flaggedFilter, setFlaggedFilter] = useState('')
  const [selectedPolls, setSelectedPolls] = useState<Set<string>>(new Set())
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagDescription, setFlagDescription] = useState('')
  const [bulkAction, setBulkAction] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    fetchPolls()
  }, [page, statusFilter, flaggedFilter])

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (statusFilter) {
        params.append('status', statusFilter)
      }

      if (flaggedFilter) {
        params.append('flagged', flaggedFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/admin/polls?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls')
      }

      const data = await response.json()
      setPolls(data.polls)
      setTotalPages(data.pagination.pages)
      setSelectedPolls(new Set()) // Clear selection on refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPolls()
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/polls?pollId=${pollId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete poll')
      }

      // Refresh the list
      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete poll')
    }
  }

  const handleUpdateStatus = async (pollId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update poll status')
      }

      // Refresh the list
      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update poll')
    }
  }

  const togglePollSelection = (pollId: string) => {
    const newSelection = new Set(selectedPolls)
    if (newSelection.has(pollId)) {
      newSelection.delete(pollId)
    } else {
      newSelection.add(pollId)
    }
    setSelectedPolls(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedPolls.size === polls.length) {
      setSelectedPolls(new Set())
    } else {
      setSelectedPolls(new Set(polls.map(p => p.id)))
    }
  }

  const handleFlagPoll = async (pollId: string) => {
    if (!flagReason) {
      alert('Please select a flag reason')
      return
    }

    try {
      const response = await fetch('/api/admin/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pollId, 
          action: 'flag',
          flagReason,
          flagDescription
        })
      })

      if (!response.ok) {
        throw new Error('Failed to flag poll')
      }

      setShowFlagDialog(false)
      setFlagReason('')
      setFlagDescription('')
      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to flag poll')
    }
  }

  const handleApprovePoll = async (pollId: string) => {
    try {
      const response = await fetch('/api/admin/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pollId, 
          action: 'approve',
          reviewNotes: 'Approved by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve poll')
      }

      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve poll')
    }
  }

  const handleRejectPoll = async (pollId: string) => {
    const notes = prompt('Enter rejection reason (optional):')
    
    try {
      const response = await fetch('/api/admin/polls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pollId, 
          action: 'reject',
          reviewNotes: notes || 'Rejected by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject poll')
      }

      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject poll')
    }
  }

  const handleBulkAction = async () => {
    if (selectedPolls.size === 0) {
      alert('Please select at least one poll')
      return
    }

    const pollIds = Array.from(selectedPolls)

    try {
      if (bulkAction === 'delete') {
        if (!confirm(`Are you sure you want to delete ${pollIds.length} polls? This action cannot be undone.`)) {
          return
        }

        const response = await fetch('/api/admin/polls', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pollIds,
            action: 'bulkDelete'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to delete polls')
        }
      } else if (bulkAction === 'flag') {
        if (!flagReason) {
          alert('Please select a flag reason')
          return
        }

        const response = await fetch('/api/admin/polls', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pollIds,
            action: 'bulkFlag',
            flagReason,
            flagDescription
          })
        })

        if (!response.ok) {
          throw new Error('Failed to flag polls')
        }
      } else if (bulkAction === 'unflag') {
        const response = await fetch('/api/admin/polls', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pollIds,
            action: 'bulkUnflag',
            reviewNotes: reviewNotes || 'Bulk unflagged by admin'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to unflag polls')
        }
      } else if (['active', 'closed', 'draft'].includes(bulkAction)) {
        const response = await fetch('/api/admin/polls', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pollIds,
            action: 'bulkStatusChange',
            status: bulkAction
          })
        })

        if (!response.ok) {
          throw new Error('Failed to update poll status')
        }
      }

      setShowBulkDialog(false)
      setBulkAction('')
      setFlagReason('')
      setFlagDescription('')
      setReviewNotes('')
      fetchPolls()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to perform bulk action')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Poll Management</h1>
        <p className="text-gray-600 mt-2">
          Moderate and manage all polls on the platform
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search polls by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <select
                value={flaggedFilter}
                onChange={(e) => {
                  setFlaggedFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Polls</option>
                <option value="true">Flagged Only</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedPolls.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 font-medium">
              {selectedPolls.size} poll{selectedPolls.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setShowBulkDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Bulk Actions
            </button>
          </div>
        </div>
      )}

      {/* Polls Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading polls...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPolls.size === polls.length && polls.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {polls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No polls found
                    </td>
                  </tr>
                ) : (
                  polls.map((poll) => (
                    <tr key={poll.id} className={`hover:bg-gray-50 ${poll.moderation.isFlagged ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPolls.has(poll.id)}
                          onChange={() => togglePollSelection(poll.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/poll/${poll.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {poll.title || 'Untitled Poll'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {poll.creatorEmail}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {poll.type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            poll.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : poll.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : poll.status === 'expired'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {poll.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {poll.moderation.isFlagged ? (
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {poll.moderation.flagCount} flag{poll.moderation.flagCount !== 1 ? 's' : ''}
                            </span>
                            {poll.moderation.flags.length > 0 && (
                              <span className="text-xs text-gray-600" title={poll.moderation.flags[0].description}>
                                ({poll.moderation.flags[0].reason})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {poll.totalVotes}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(poll.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {poll.moderation.isFlagged ? (
                            <>
                              <button
                                onClick={() => handleApprovePoll(poll.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve poll"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectPoll(poll.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject poll"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              {poll.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateStatus(poll.id, 'closed')}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Close
                                </button>
                              )}
                              {poll.status === 'closed' && (
                                <button
                                  onClick={() => handleUpdateStatus(poll.id, 'active')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedPolls(new Set([poll.id]))
                                  setShowFlagDialog(true)
                                }}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                Flag
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeletePoll(poll.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Flag Dialog */}
      {showFlagDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Flag Poll</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="spam">Spam</option>
                  <option value="offensive">Offensive</option>
                  <option value="misleading">Misleading</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowFlagDialog(false)
                  setFlagReason('')
                  setFlagDescription('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const pollId = Array.from(selectedPolls)[0]
                  if (pollId) handleFlagPoll(pollId)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Flag Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Bulk Actions</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedPolls.size} poll{selectedPolls.size !== 1 ? 's' : ''} selected
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an action</option>
                  <option value="active">Set Status: Active</option>
                  <option value="closed">Set Status: Closed</option>
                  <option value="draft">Set Status: Draft</option>
                  <option value="flag">Flag Polls</option>
                  <option value="unflag">Unflag Polls</option>
                  <option value="delete">Delete Polls</option>
                </select>
              </div>

              {bulkAction === 'flag' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flag Reason
                    </label>
                    <select
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a reason</option>
                      <option value="inappropriate">Inappropriate Content</option>
                      <option value="spam">Spam</option>
                      <option value="offensive">Offensive</option>
                      <option value="misleading">Misleading</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={flagDescription}
                      onChange={(e) => setFlagDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional details..."
                    />
                  </div>
                </>
              )}

              {bulkAction === 'unflag' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reason for unflagging..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkDialog(false)
                  setBulkAction('')
                  setFlagReason('')
                  setFlagDescription('')
                  setReviewNotes('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAction}
                className={`px-4 py-2 rounded-md text-white ${
                  bulkAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
