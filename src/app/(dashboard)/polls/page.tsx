'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MagnifyingGlassIcon, FunnelIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Polls</h1>
            <p className="text-gray-600 mt-1">Manage and view all your polls</p>
          </div>
          <Button
            href="/poll/create"
            variant="primary"
            size="md"
          >
            Create Poll
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Polls Grid */}
        {filteredPolls.length === 0 ? (
          <Card padding="lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'Get started by creating your first poll.'}
            </p>
            <Link
              href="/poll/create"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Poll
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map((poll) => {
              const pollStatus = isExpired(poll) ? 'expired' : poll.status
              const statusColors: Record<string, string> = {
                active: 'bg-green-100 text-green-800',
                inactive: 'bg-gray-100 text-gray-800',
                expired: 'bg-red-100 text-red-800',
                draft: 'bg-yellow-100 text-yellow-800',
              }

              return (
                <Card
                  key={poll.id}
                  hover
                  className="relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      href={`/polls/${poll.id}`}
                      className="flex-1 mr-2"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
                        {poll.title || 'Untitled Poll'}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[pollStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {pollStatus}
                      </span>
                      
                      {/* 3-dot dropdown */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setOpenDropdown(openDropdown === poll.id ? null : poll.id)
                          }}
                          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        
                        {openDropdown === poll.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
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
                                // You could add a toast notification here
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Copy Link
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                if (confirm('Are you sure you want to delete this poll?')) {
                                  // Add delete functionality here
                                  console.log('Delete poll:', poll.id)
                                }
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
                  </div>

                  <Link href={`/polls/${poll.id}`}>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Type:</span>
                        <span className="font-medium capitalize">{poll.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Votes:</span>
                        <span className="font-medium">{poll.metadata.totalVotes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Views:</span>
                        <span className="font-medium">{poll.metadata.viewCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span className="font-medium">
                          {new Date(poll.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>
  )
}
