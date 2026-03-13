'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, CheckCircle2, PieChart, Eye, Search as SearchIcon, Edit2, Copy, Trash2 } from 'lucide-react'

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
    uniqueVoters: number
    viewCount: number
  }
  settings: {
    expiresAt?: string
    isPublic: boolean
  }
}

interface UserPollDashboardProps {
  userId: string
}

type SortOption = 'newest' | 'oldest' | 'most_votes' | 'least_votes' | 'title_asc' | 'title_desc'
type FilterOption = 'all' | 'active' | 'inactive' | 'expired' | 'draft'

export function UserPollDashboard({ userId }: UserPollDashboardProps) {
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
      fetchPolls()
      alert(`Poll duplicated successfully! New poll ID: ${data.poll.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate poll')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
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
        return { bg: 'rgba(40, 167, 69, 0.1)', color: '#28A745' }
      case 'inactive':
        return { bg: 'rgba(108, 117, 125, 0.1)', color: '#6C757D' }
      case 'expired':
        return { bg: 'rgba(220, 53, 69, 0.1)', color: '#DC3545' }
      case 'draft':
        return { bg: 'rgba(255, 193, 7, 0.1)', color: '#FFC107' }
      default:
        return { bg: 'rgba(108, 117, 125, 0.1)', color: '#6C757D' }
    }
  }

  const isExpired = (poll: Poll) => {
    return poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= new Date()
  }

  if (loading && polls.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--color-light-gray)',
            borderTop: '3px solid var(--color-primary)',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--color-mid-gray)' }}>Loading your polls...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Overview */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {[
          { icon: BarChart3, label: 'Total Polls', value: totalPolls, color: 'var(--color-primary)' },
          { icon: CheckCircle2, label: 'Active Polls', value: polls.filter(p => p.status === 'active' && !isExpired(p)).length, color: 'var(--color-success)' },
          { icon: PieChart, label: 'Total Votes', value: polls.reduce((sum, poll) => sum + poll.metadata.totalVotes, 0), color: 'var(--color-accent)' },
          { icon: Eye, label: 'Total Views', value: polls.reduce((sum, poll) => sum + poll.metadata.viewCount, 0), color: '#17A2B8' }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div 
              key={idx}
              className="card"
              style={{ padding: '24px', background: '#FFFFFF' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    background: stat.color,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  <Icon size={28} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--color-mid-gray)', marginBottom: '4px' }}>
                    {stat.label}
                  </p>
                  <p 
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: 'var(--color-black)',
                      lineHeight: '1'
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div 
        className="card"
        style={{ padding: '24px', background: '#FFFFFF' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search polls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
                <SearchIcon 
                  size={18} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-mid-gray)'
                  }}
                />
              </div>
            </div>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="input-field"
              style={{ padding: '12px 20px', minWidth: '150px' }}
            >
              <option value="all">All Polls</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input-field"
              style={{ padding: '12px 20px', minWidth: '150px' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_votes">Most Votes</option>
              <option value="least_votes">Least Votes</option>
              <option value="title_asc">Title A-Z</option>
              <option value="title_desc">Title Z-A</option>
            </select>

            <Link href="/poll/create" className="btn btn-primary">
              Create Poll
            </Link>
          </div>
        </div>
      </div>

      {/* Polls List */}
      {error && (
        <div 
          style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid #DC3545',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            color: '#DC3545'
          }}
        >
          <p style={{ marginBottom: '12px' }}>{error}</p>
          <button
            onClick={fetchPolls}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Retry
          </button>
        </div>
      )}

      {polls.length === 0 && !loading ? (
        <div 
          className="card"
          style={{ 
            padding: '48px 32px',
            textAlign: 'center',
            background: '#FFFFFF'
          }}
        >
          <BarChart3 
            size={64} 
            style={{
              color: 'var(--color-light-gray)',
              margin: '0 auto 16px'
            }}
          />
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-black)',
              marginBottom: '8px'
            }}
          >
            No polls found
          </h3>
          <p 
            style={{
              fontSize: '14px',
              color: 'var(--color-mid-gray)',
              marginBottom: '24px'
            }}
          >
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first poll.'
            }
          </p>
          <Link href="/poll/create" className="btn btn-primary">
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {polls.map((poll) => {
            const statusInfo = getStatusColor(isExpired(poll) ? 'expired' : poll.status)
            return (
              <div 
                key={poll.id}
                className="card"
                style={{ padding: '24px', background: '#FFFFFF' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <h3 
                        style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: 'var(--color-black)'
                        }}
                      >
                        <Link 
                          href={`/poll/${poll.id}`}
                          style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'none'
                          }}
                        >
                          {poll.title}
                        </Link>
                      </h3>
                      <span 
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'capitalize'
                        }}
                      >
                        {isExpired(poll) ? 'Expired' : poll.status}
                      </span>
                      <span 
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(108, 117, 125, 0.1)',
                          color: '#6C757D',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'capitalize'
                        }}
                      >
                        {poll.type}
                      </span>
                    </div>
                    
                    {poll.description && (
                      <p 
                        style={{
                          fontSize: '14px',
                          color: 'var(--color-mid-gray)',
                          marginBottom: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {poll.description}
                      </p>
                    )}
                    
                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        fontSize: '13px',
                        color: 'var(--color-mid-gray)',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span>📊 {poll.metadata.totalVotes} votes</span>
                      <span>👥 {poll.metadata.uniqueVoters} voters</span>
                      <span>👁️ {poll.metadata.viewCount} views</span>
                      <span>📅 {formatDate(poll.createdAt)}</span>
                      {poll.settings.expiresAt && (
                        <span>⏰ Expires {formatDate(poll.settings.expiresAt)}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Link
                      href={`/poll/${poll.id}`}
                      className="btn btn-primary"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      View
                    </Link>
                    <Link
                      href={`/polls/${poll.id}/edit`}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <Edit2 size={14} style={{ marginRight: '4px' }} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicatePoll(poll.id)}
                      className="btn btn-ghost"
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => handleDeletePoll(poll.id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '13px',
                        background: 'rgba(220, 53, 69, 0.1)',
                        color: '#DC3545',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div 
          className="card"
          style={{ padding: '16px', background: '#FFFFFF' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-mid-gray)' }}>
              Showing {((currentPage - 1) * pollsPerPage) + 1} to {Math.min(currentPage * pollsPerPage, totalPolls)} of {totalPolls} polls
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--color-light-gray)',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFFFF',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  color: 'var(--color-dark-gray)'
                }}
              >
                ← Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: currentPage === page ? 'none' : '1px solid var(--color-light-gray)',
                      borderRadius: 'var(--radius-md)',
                      background: currentPage === page ? 'var(--color-primary)' : '#FFFFFF',
                      color: currentPage === page ? '#FFFFFF' : 'var(--color-dark-gray)',
                      cursor: 'pointer',
                      fontWeight: currentPage === page ? 600 : 400
                    }}
                  >
                    {page}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--color-light-gray)',
                  borderRadius: 'var(--radius-md)',
                  background: '#FFFFFF',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  color: 'var(--color-dark-gray)'
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
