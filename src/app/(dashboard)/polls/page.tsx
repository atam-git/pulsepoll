'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon, ShareIcon } from '@heroicons/react/24/outline'
import { PollShareDialog } from '@/components/PollShareDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Poll {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
  metadata: {
    totalVotes: number
    viewCount: number
  }
  settings: {
    expiresAt?: string
    isPublic: boolean
  }
}

export default function PollsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [polls, setPolls] = useState<Poll[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [shareDialogPoll, setShareDialogPoll] = useState<{ id: string; title: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    setLoading(false)
    fetchPolls()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null)
    }
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/user/polls?sort=newest')
      if (response.ok) {
        const data = await response.json()
        setPolls(data.polls)
      }
    } catch {
      // silently fail
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove poll from local state
        setPolls(polls.filter(p => p.id !== pollId))
      } else {
        console.error('Failed to delete poll')
      }
    } catch (error) {
      console.error('Error deleting poll:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading polls...</p>
        </div>
      </div>
    )
  }

  const isExpired = (poll: Poll) =>
    poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= new Date()

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase())
    const pollStatus = isExpired(poll) ? 'expired' : poll.status
    const matchesFilter = filterStatus === 'all' || pollStatus === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Polls</h1>
              <p className="text-gray-700 mt-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Manage and share all your polls
              </p>
            </div>
            <Link
              href="/poll/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Poll
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2 border-2 border-gray-200">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-900 font-medium cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Polls Grid */}
        {filteredPolls.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-16 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No polls found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                : 'Get started by creating your first poll and start gathering insights.'}
            </p>
            <Link
              href="/poll/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Poll
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map((poll) => {
              const pollStatus = isExpired(poll) ? 'inactive' : (poll.status || 'inactive')
              const statusColors: Record<string, string> = {
                active: 'bg-green-100 text-green-800 border-green-200',
                inactive: 'bg-gray-100 text-gray-800 border-gray-200',
              }

              return (
                <div
                  key={poll.id}
                  className="group bg-white rounded-xl border-2 border-gray-200 hover:border-green-500 transition-all duration-200 overflow-hidden hover:shadow-lg"
                >
                  {/* Status Bar */}
                  <div className={`h-1 ${pollStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  
                  <div className="p-5">
                    {/* Header with Title and Actions */}
                    <div className="flex items-start justify-between mb-4">
                      <Link
                        href={`/polls/${poll.id}`}
                        className="flex-1 mr-3"
                      >
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors mb-2">
                          {poll.title || 'Untitled Poll'}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${statusColors[pollStatus] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${pollStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {pollStatus.charAt(0).toUpperCase() + pollStatus.slice(1)}
                        </span>
                      </Link>
                      
                      {/* 3-dot dropdown */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setOpenDropdown(openDropdown === poll.id ? null : poll.id)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        
                        {openDropdown === poll.id && (
                          <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                            <Link
                              href={`/polls/${poll.id}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setOpenDropdown(null)}
                            >
                              View Details
                            </Link>
                            <Link
                              href={`/poll/${poll.id}/edit`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setOpenDropdown(null)}
                            >
                              Edit Poll
                            </Link>
                            <Link
                              href={`/vote/${poll.id}`}
                              target="_blank"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setOpenDropdown(null)}
                            >
                              Voting Page
                            </Link>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                navigator.clipboard.writeText(`${window.location.origin}/vote/${poll.id}`)
                                setOpenDropdown(null)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Copy Link
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                setDeleteConfirm({ id: poll.id, title: poll.title })
                                setOpenDropdown(null)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete Poll
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <Link href={`/polls/${poll.id}`}>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Votes */}
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-xl font-bold text-purple-900">{poll.metadata.totalVotes}</div>
                          <div className="text-xs text-purple-600 font-medium">Votes</div>
                        </div>
                        
                        {/* Views */}
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <div className="text-xl font-bold text-blue-900">{poll.metadata.viewCount}</div>
                          <div className="text-xs text-blue-600 font-medium">Views</div>
                        </div>
                        
                        {/* Engagement Rate */}
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="text-xl font-bold text-green-900">
                            {poll.metadata.viewCount > 0 ? Math.round((poll.metadata.totalVotes / poll.metadata.viewCount) * 100) : 0}%
                          </div>
                          <div className="text-xs text-green-600 font-medium">Rate</div>
                        </div>
                      </div>
                    </Link>

                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setShareDialogPoll({ id: poll.id, title: poll.title })
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium mb-4"
                    >
                      <ShareIcon className="h-5 w-5" />
                      Share Poll
                    </button>

                    <Link href={`/polls/${poll.id}`}>
                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="capitalize">{poll.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(poll.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Share Dialog */}
        {shareDialogPoll && (
          <PollShareDialog
            pollId={shareDialogPoll.id}
            pollTitle={shareDialogPoll.title}
            isOpen={true}
            onClose={() => setShareDialogPoll(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <ConfirmDialog
            isOpen={true}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => handleDeletePoll(deleteConfirm.id)}
            title="Delete Poll"
            message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone and all votes will be permanently lost.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
          />
        )}
      </div>
  )
}
